import * as THREE from 'three';

class ResourceGatheringSystem {
    constructor(map, resourceManager, spatialIndex) {
        this.map = map;
        this.resourceManager = resourceManager;
        this.spatialIndex = spatialIndex;
        this.grid = map.getGrid();

        this.gatherers = [];
        this.resourceNodes = [];

        // 收集效率
        this.gatherRates = {
            wood: 0.5,
            food: 0.5,
            gold: 0.4,
            stone: 0.4
        };

        // 携带容量
        this.carryCapacity = 10;

        // 收集范围
        this.gatherRange = 1.5;

        // 最近的资源点
        this.dropOffPoints = [];
    }

    registerGatherer(entity) {
        if (!this.gatherers.includes(entity)) {
            this.gatherers.push(entity);
            entity.carryAmount = 0;
            entity.carryType = null;
            entity.currentResource = null;
            entity.lastResourcePosition = null; // 记录上次采集的资源点位置
            entity.dropOffPoint = null;
        }
    }

    unregisterGatherer(entity) {
        const index = this.gatherers.indexOf(entity);
        if (index > -1) {
            this.gatherers.splice(index, 1);
        }
    }

    registerResourceNode(node) {
        if (!this.resourceNodes.includes(node)) {
            this.resourceNodes.push(node);
        }
    }

    unregisterResourceNode(node) {
        const index = this.resourceNodes.indexOf(node);
        if (index > -1) {
            this.resourceNodes.splice(index, 1);
        }
    }

    addDropOffPoint(building, resourceTypes) {
        this.removeDropOffPoint(building);
        this.dropOffPoints.push({
            building: building,
            resourceTypes: resourceTypes,
            position: building.getPosition()
        });
    }

    removeDropOffPoint(building) {
        this.dropOffPoints = this.dropOffPoints.filter(
            point => point.building !== building
        );
    }

    update(deltaTime) {
        this.updateGatherers(deltaTime);
        this.cleanupDepletedResources();
    }

    updateGatherers(deltaTime) {
        for (const gatherer of this.gatherers) {
            if (!gatherer.isAlive) continue;

            if (gatherer.carryAmount >= this.getCarryCapacity(gatherer)) {
                // 满载：保存资源点引用后返回投放
                if (!gatherer.lastResourcePosition && gatherer.currentResource) {
                    gatherer.lastResourcePosition = {
                        node: gatherer.currentResource,
                        position: gatherer.currentResource.position.clone()
                    };
                }
                this.returnToDropOff(gatherer);
            } else if (gatherer.isReturning && gatherer.carryAmount > 0 && gatherer.carryType) {
                // 正在返回投放点（手动点击城镇中心或自然耗尽），继续投放流程
                this.returnToDropOff(gatherer);
            } else if (gatherer.currentResource) {
                // 有目标资源：继续采集
                this.continueGathering(gatherer, deltaTime);
            } else if (gatherer.shouldAutoDrop && gatherer.carryAmount > 0 && gatherer.carryType) {
                // 资源自然耗尽后自动投放（非玩家手动中断）
                gatherer.shouldAutoDrop = false;
                this.returnToDropOff(gatherer);
            }
        }
    }

    startGathering(gatherer, resourceNode) {
        if (!resourceNode || !resourceNode.userData) return;
        if (resourceNode.isHuntableBoar?.()) return false;

        const resourceType = resourceNode.userData.resourceType;

        if (resourceNode.userData.resourceAmount <= 0) {
            return false;
        }

        gatherer.currentResource = resourceNode;
        gatherer.carryType = resourceType;

        // 记录资源点位置（用于返回城镇中心后再回来）
        gatherer.lastResourcePosition = {
            node: resourceNode,
            position: resourceNode.position.clone()
        };

        // 移动到资源旁离村民最近的可行走格子
        const target = this.getGatherTarget(resourceNode.position, gatherer.position);
        gatherer.moveTo(target, { preserveGathering: true });

        return true;
    }

    /**
     * 找到资源格子旁边、离村民最近的可行走格子（世界坐标）
     */
    getGatherTarget(resourcePosition, gathererPosition) {
        const grid = this.grid;
        const halfW = grid.width * grid.cellSize / 2;
        const halfH = grid.height * grid.cellSize / 2;
        const cx = Math.floor(resourcePosition.x / grid.cellSize + grid.width / 2);
        const cy = Math.floor(resourcePosition.z / grid.cellSize + grid.height / 2);

        let bestCell = null;
        let bestDist = Infinity;

        for (let dist = 1; dist <= 3; dist++) {
            for (let dx = -dist; dx <= dist; dx++) {
                for (let dy = -dist; dy <= dist; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) !== dist) continue;
                    const cell = grid.getCell(cx + dx, cy + dy);
                    if (cell && cell.walkable && !cell.occupied) {
                        const wx = cell.x * grid.cellSize + grid.cellSize / 2 - halfW;
                        const wz = cell.y * grid.cellSize + grid.cellSize / 2 - halfH;
                        const d = (gathererPosition.x - wx) ** 2 + (gathererPosition.z - wz) ** 2;
                        if (d < bestDist) {
                            bestDist = d;
                            bestCell = { x: wx, z: wz };
                        }
                    }
                }
            }
        }
        return bestCell ? new THREE.Vector3(bestCell.x, 0, bestCell.z) : resourcePosition;
    }

    continueGathering(gatherer, deltaTime) {
        const resourceNode = gatherer.currentResource;

        if (!resourceNode || !resourceNode.userData) {
            gatherer.currentResource = null;
            gatherer.carryType = null;
            return;
        }

        if (resourceNode.isHuntableBoar?.()) {
            gatherer.currentResource = null;
            gatherer.carryType = null;
            return;
        }

        // 未到达目标格子时继续移动（不重复调用 moveTo）
        if (gatherer.isMoving) return;

        // 到达目标格子后开始采集
        let gatherRate = resourceNode.gatherSpeed || this.gatherRates[resourceNode.userData.resourceType] || 0.5;
        if (resourceNode.userData.resourceType === 'food' && resourceNode.resourceType === 'food' &&
            !resourceNode.isSheep && !resourceNode.isBoar && gatherer.game?.player) {
            gatherRate *= gatherer.game.player.getBonus('berryGatherRate', 1.0);
        }
        if (resourceNode.userData.resourceType === 'food' && resourceNode.isBoar && gatherer.game?.player) {
            gatherRate *= gatherer.game.player.getBonus('huntGatherRate', 1.0);
        }
        const gatherAmount = gatherRate * deltaTime;

        const availableAmount = Math.min(
            gatherAmount,
            resourceNode.amount,
            this.getCarryCapacity(gatherer, resourceNode) - gatherer.carryAmount
        );

        if (availableAmount > 0) {
            gatherer.carryAmount += availableAmount;
            gatherer.carryType = resourceNode.userData.resourceType;

            // 通过资源节点的 gather 方法采集（更新视觉效果、粒子、耗尽检测）
            resourceNode.gather(availableAmount);

            // 同步回 userData
            resourceNode.userData.resourceAmount = resourceNode.amount;

            // 资源耗尽
            if (resourceNode.amount <= 0) {
                this.depleteResource(resourceNode);
                gatherer.currentResource = null;
                gatherer.lastResourcePosition = null;
                // 标记需要自动投放（区分于玩家手动中断）
                if (gatherer.carryAmount > 0) {
                    gatherer.shouldAutoDrop = true;
                }
            }
        }
    }

    returnToDropOff(gatherer) {
        if (!gatherer.carryType || gatherer.carryAmount <= 0) return;

        const dropOffPoint = gatherer.dropOffPoint &&
            gatherer.dropOffPoint.isAlive &&
            this.canDropOffResource(gatherer.dropOffPoint, gatherer.carryType)
                ? {
                    building: gatherer.dropOffPoint,
                    resourceTypes: this.getDropOffResourceTypes(gatherer.dropOffPoint),
                    position: gatherer.dropOffPoint.getPosition()
                }
                : this.findNearestDropOff(gatherer, gatherer.carryType);

        if (!dropOffPoint) return;

        const isAtDropOffPoint = this.isAtDropOffPoint(gatherer, dropOffPoint);

        if (isAtDropOffPoint) {
            // 投放资源
            this.resourceManager.addResource(gatherer.carryType, gatherer.carryAmount);
            const deliveredType = gatherer.carryType;
            gatherer.carryAmount = 0;
            gatherer.carryType = null;
            gatherer.isReturning = false;

            // 手动投放：投放后停止，不自动寻路
            if (gatherer.manualDropOff) {
                gatherer.manualDropOff = false;
                gatherer.currentResource = null;
                gatherer.lastResourcePosition = null;
                gatherer.dropOffPoint = null;
                return;
            }

            // 自然投放：优先返回上次采集的资源点
            if (gatherer.lastResourcePosition) {
                const lastResource = gatherer.lastResourcePosition.node;
                const lastPosition = gatherer.lastResourcePosition.position;

                if (lastResource &&
                    lastResource.isAlive &&
                    lastResource.userData &&
                    lastResource.userData.resourceAmount > 0) {
                    gatherer.carryType = deliveredType;
                    gatherer.moveTo(lastPosition, { preserveGathering: true });
                    return;
                }
                // 资源点已耗尽，清除记录
                gatherer.lastResourcePosition = null;
            }

            if (gatherer.currentResource && gatherer.currentResource.isAlive &&
                gatherer.currentResource.userData && gatherer.currentResource.userData.resourceAmount > 0) {
                gatherer.carryType = deliveredType;
                gatherer.moveTo(gatherer.currentResource.position, { preserveGathering: true });
            } else {
                // 寻找最近的同类型资源
                const nearestResource = this.findNearestResource(gatherer, deliveredType, 50);
                if (nearestResource) {
                    this.startGathering(gatherer, nearestResource);
                } else {
                    gatherer.currentResource = null;
                    gatherer.lastResourcePosition = null;
                }
            }
        } else {
            // 正在前往投放点的路上，避免每帧重复寻路
            if (!gatherer.isReturning) {
                gatherer.isReturning = true;
                gatherer.moveTo(dropOffPoint.position, { preserveGathering: true });
            }
        }
    }

    findNearestDropOff(gatherer, resourceType) {
        let nearestPoint = null;
        let nearestDistance = Infinity;
        
        for (const point of this.dropOffPoints) {
            if (!point.resourceTypes.includes(resourceType)) continue;
            
            const distance = gatherer.position.distanceTo(point.position);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = point;
            }
        }
        
        return nearestPoint;
    }

    getDropOffResourceTypes(building) {
        if (!building?.buildingFeatures?.isDropOff) return [];
        if (building.buildingFeatures.dropOffResources?.length) {
            return building.buildingFeatures.dropOffResources;
        }
        return ['wood', 'food', 'gold', 'stone'];
    }

    canDropOffResource(building, resourceType) {
        return this.getDropOffResourceTypes(building).includes(resourceType);
    }

    isAtDropOffPoint(gatherer, dropOffPoint) {
        const building = dropOffPoint.building;
        const halfX = Math.max(1, (building?.gridSizeX || building?.width || 2) / 2);
        const halfZ = Math.max(1, (building?.gridSizeZ || building?.depth || 2) / 2);
        const dx = Math.max(0, Math.abs(gatherer.position.x - dropOffPoint.position.x) - halfX);
        const dz = Math.max(0, Math.abs(gatherer.position.z - dropOffPoint.position.z) - halfZ);
        return Math.sqrt(dx * dx + dz * dz) <= 1.5;
    }

    findNearestResource(gatherer, resourceType, maxDistance = 50) {
        let nearestResource = null;
        let nearestDistance = maxDistance;
        
        for (const node of this.resourceNodes) {
            if (!node.userData || node.userData.resourceType !== resourceType) continue;
            if (node.userData.resourceAmount <= 0) continue;
            
            const distance = gatherer.position.distanceTo(node.position);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestResource = node;
            }
        }
        
        return nearestResource;
    }

    depleteResource(resourceNode) {
        // 标记资源节点为已耗尽
        resourceNode.isDepleted = true;
        resourceNode.isAlive = false;

        // 从资源收集系统中移除
        this.unregisterResourceNode(resourceNode);

        // 通过 EntityManager 正确移除实体（会更新网格占用和路径缓存）
        if (resourceNode._game && resourceNode._game.entityManager) {
            resourceNode._game.entityManager.removeEntity(resourceNode);
        }

        // 销毁3D模型
        if (resourceNode.mesh) {
            resourceNode.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });

            // 从场景中移除
            if (resourceNode.mesh.parent) {
                resourceNode.mesh.parent.remove(resourceNode.mesh);
            }
        }
    }

    cleanupDepletedResources() {
        for (let i = this.resourceNodes.length - 1; i >= 0; i--) {
            const node = this.resourceNodes[i];
            
            if (!node.userData || node.userData.resourceAmount <= 0) {
                this.depleteResource(node);
            }
        }
    }

    setGatherRate(resourceType, rate) {
        this.gatherRates[resourceType] = rate;
    }

    setCarryCapacity(capacity) {
        this.carryCapacity = capacity;
    }

    getCarryCapacity(gatherer, resourceNode = gatherer?.currentResource) {
        if (resourceNode?.isBoar && resourceNode.boarState === 'deadResource') {
            return 35;
        }

        return this.carryCapacity;
    }

    setGatherRange(range) {
        this.gatherRange = range;
    }

    getGathererCount() {
        return this.gatherers.length;
    }

    getResourceNodeCount() {
        return this.resourceNodes.length;
    }

    getTotalResourceAmount(resourceType) {
        let total = 0;
        
        for (const node of this.resourceNodes) {
            if (node.userData && node.userData.resourceType === resourceType) {
                total += node.userData.resourceAmount;
            }
        }
        
        return total;
    }

    reset() {
        this.gatherers = [];
        this.resourceNodes = [];
        this.dropOffPoints = [];
    }
}

export default ResourceGatheringSystem;

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

            if (gatherer.carryAmount >= this.carryCapacity) {
                // 如果正在前往投放点的路上，确保保存了资源点引用
                if (!gatherer.lastResourcePosition && gatherer.currentResource) {
                    gatherer.lastResourcePosition = {
                        node: gatherer.currentResource,
                        position: gatherer.currentResource.position.clone()
                    };
                }
                // 返回投放点
                this.returnToDropOff(gatherer);
            } else if (gatherer.currentResource) {
                // 继续收集
                this.continueGathering(gatherer, deltaTime);
            }
        }
    }

    startGathering(gatherer, resourceNode) {
        if (!resourceNode || !resourceNode.userData) return;

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

        // 移动到资源附近的可行走格子，而非资源中心（避免穿过被占用的资源格子）
        const targetPosition = this.findNearestWalkableToResource(gatherer, resourceNode.position, 2.5);
        gatherer.moveTo(targetPosition, { preserveGathering: true });

        return true;
    }

    /**
     * 查找资源附近最近的可行走格子
     * @param {Unit} gatherer - 采集单位
     * @param {Vector3} resourceCenter - 资源中心位置
     * @param {number} maxDistance - 最大搜索距离（格子数）
     * @returns {Vector3} 最近的可行走格子位置
     */
    findNearestWalkableToResource(gatherer, resourceCenter, maxDistance = 5) {
        if (!gatherer.game || !gatherer.game.pathfindingSystem) {
            return resourceCenter;
        }

        const pathfinding = gatherer.game.pathfindingSystem;
        const grid = pathfinding.grid;

        // 从资源中心向外扩展搜索最近的可行走格子
        for (let distance = 1; distance <= maxDistance; distance++) {
            const cells = pathfinding.getCellsAtDistance(resourceCenter.x, resourceCenter.z, distance);

            for (const cell of cells) {
                if (cell.walkable && !cell.occupied) {
                    // 找到可行走的格子，转换回世界坐标
                    const worldX = cell.x * grid.cellSize + grid.cellSize / 2 - grid.width * grid.cellSize / 2;
                    const worldZ = cell.y * grid.cellSize + grid.cellSize / 2 - grid.height * grid.cellSize / 2;

                    return new THREE.Vector3(worldX, 0, worldZ);
                }
            }
        }

        // 如果附近没有可行走格子，返回资源中心（允许穿过，避免卡死）
        return resourceCenter;
    }

    continueGathering(gatherer, deltaTime) {
        const resourceNode = gatherer.currentResource;
        
        if (!resourceNode || !resourceNode.userData) {
            gatherer.currentResource = null;
            gatherer.carryType = null;
            return;
        }
        
        const distance = gatherer.position.distanceTo(resourceNode.position);
        
        if (distance <= this.gatherRange) {
            // 收集资源
            const gatherRate = this.gatherRates[resourceNode.userData.resourceType] || 0.5;
            const gatherAmount = gatherRate * deltaTime;
            
            // 检查资源是否足够
            const availableAmount = Math.min(
                gatherAmount,
                resourceNode.userData.resourceAmount,
                this.carryCapacity - gatherer.carryAmount
            );
            
            if (availableAmount > 0) {
                gatherer.carryAmount += availableAmount;
                resourceNode.userData.resourceAmount -= availableAmount;

                // 同步到资源节点的 amount 属性
                if (resourceNode.amount !== undefined) {
                    resourceNode.amount = resourceNode.userData.resourceAmount;
                }

                // 资源耗尽
                if (resourceNode.userData.resourceAmount <= 0) {
                    this.depleteResource(resourceNode);
                    gatherer.currentResource = null;
                    // 清除记录的资源点位置
                    gatherer.lastResourcePosition = null;
                }
            }
        } else {
            // 移动到资源点（保留采集状态，不触发 stopGathering）
            gatherer.moveTo(resourceNode.position, { preserveGathering: true });
        }
    }

    returnToDropOff(gatherer) {
        if (!gatherer.carryType || gatherer.carryAmount <= 0) return;

        // 找到最近的投放点
        const dropOffPoint = this.findNearestDropOff(gatherer, gatherer.carryType);

        if (dropOffPoint) {
            // 使用 rbush 查询村民位置附近的建筑
            const gathererBox = gatherer.getCollisionBox ? gatherer.getCollisionBox() : null;
            if (!gathererBox) return;

            // 计算村民中心位置
            const gathererCenterX = (gathererBox.minX + gathererBox.maxX) / 2;
            const gathererCenterZ = (gathererBox.minZ + gathererBox.maxZ) / 2;

            // 查询村民附近的建筑（使用较大的容差）
            const tolerance = 5; // 5格容差，确保能查询到附近的建筑
            const nearbyBuildings = this.spatialIndex.queryPoint(
                gathererCenterX,
                gathererCenterZ,
                tolerance
            );

            // 检查是否有城镇中心在附近
            const isAtDropOffPoint = nearbyBuildings.some(building => {
                // 检查是否是同一个建筑
                if (building === dropOffPoint.building) {
                    // 检查村民是否在城镇中心的1格范围内
                    const buildingBox = building.getCollisionBox ? building.getCollisionBox() : null;
                    if (!buildingBox) return false;

                    // 检查村民位置是否在建筑碰撞盒的1格扩展范围内
                    const expandRange = 1; // 1格范围
                    const expandedMinX = buildingBox.minX - expandRange;
                    const expandedMaxX = buildingBox.maxX + expandRange;
                    const expandedMinZ = buildingBox.minZ - expandRange;
                    const expandedMaxZ = buildingBox.maxZ + expandRange;

                    return gathererCenterX >= expandedMinX && 
                           gathererCenterX <= expandedMaxX &&
                           gathererCenterZ >= expandedMinZ && 
                           gathererCenterZ <= expandedMaxZ;
                }
                return false;
            });

            if (isAtDropOffPoint) {
                // 投放资源
                this.resourceManager.addResource(gatherer.carryType, gatherer.carryAmount);
                gatherer.carryAmount = 0;
                gatherer.carryType = null;

                // 优先返回上次采集的资源点
                if (gatherer.lastResourcePosition) {
                    const lastResource = gatherer.lastResourcePosition.node;
                    const lastPosition = gatherer.lastResourcePosition.position;

                    // 检查资源点是否仍然有效且有资源
                    if (lastResource && 
                        lastResource.isAlive && 
                        lastResource.userData && 
                        lastResource.userData.resourceAmount > 0) {
                        // 返回资源点
                        gatherer.moveTo(lastPosition, { preserveGathering: true });
                    } else {
                        // 资源点已耗尽或无效，清除记录并寻找新资源
                        gatherer.lastResourcePosition = null;
                        gatherer.currentResource = null;
                        
                        // 尝试寻找最近的同类型资源
                        const nearestResource = this.findNearestResource(
                            gatherer, 
                            gatherer.carryType || 'wood',
                            50
                        );
                        if (nearestResource) {
                            this.startGathering(gatherer, nearestResource);
                        }
                    }
                } else if (gatherer.currentResource && gatherer.currentResource.userData.resourceAmount > 0) {
                    // 如果没有lastResourcePosition但有currentResource，使用currentResource
                    gatherer.moveTo(gatherer.currentResource.position, { preserveGathering: true });
                } else {
                    // 没有任何资源记录，清除状态
                    gatherer.currentResource = null;
                    gatherer.lastResourcePosition = null;
                }
            } else {
                // 移动到投放点
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
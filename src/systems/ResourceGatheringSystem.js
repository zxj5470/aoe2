class ResourceGatheringSystem {
    constructor(map, resourceManager) {
        this.map = map;
        this.resourceManager = resourceManager;
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
        gatherer.moveTo(resourceNode.position);
        
        return true;
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
                
                // 资源耗尽
                if (resourceNode.userData.resourceAmount <= 0) {
                    this.depleteResource(resourceNode);
                    gatherer.currentResource = null;
                }
            }
        } else {
            // 移动到资源点
            gatherer.moveTo(resourceNode.position);
        }
    }

    returnToDropOff(gatherer) {
        if (!gatherer.carryType || gatherer.carryAmount <= 0) return;
        
        // 找到最近的投放点
        const dropOffPoint = this.findNearestDropOff(gatherer, gatherer.carryType);
        
        if (dropOffPoint) {
            const distance = gatherer.position.distanceTo(dropOffPoint.position);
            
            if (distance <= 2) {
                // 投放资源
                this.resourceManager.addResource(gatherer.carryType, gatherer.carryAmount);
                gatherer.carryAmount = 0;
                gatherer.carryType = null;
                
                // 如果还有当前资源，继续收集
                if (gatherer.currentResource && gatherer.currentResource.userData.resourceAmount > 0) {
                    gatherer.moveTo(gatherer.currentResource.position);
                }
            } else {
                // 移动到投放点
                gatherer.moveTo(dropOffPoint.position);
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
        // 移除资源节点
        this.unregisterResourceNode(resourceNode);
        
        // 从地图中移除
        this.map.removeDecoration(resourceNode);
        
        // 销毁网格
        if (resourceNode.geometry) {
            resourceNode.geometry.dispose();
        }
        if (resourceNode.material) {
            resourceNode.material.dispose();
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
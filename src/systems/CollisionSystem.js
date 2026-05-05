/**
 * 碰撞系统 - 管理所有实体的碰撞检测和体积
 */
class CollisionSystem {
    constructor(map) {
        this.map = map;
        this.grid = map.getGrid();
        this.entities = [];
        this.buildings = [];
        this.resourceNodes = [];
        this.units = [];
    }

    /**
     * 注册实体
     */
    registerEntity(entity) {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);

            // 根据类型分类
            if (entity.type === 'building') {
                this.buildings.push(entity);
            } else if (entity.type === 'resource') {
                this.resourceNodes.push(entity);
            } else if (entity.type === 'unit') {
                this.units.push(entity);
            }

            // 创建碰撞体积
            if (entity.createCollisionBox) {
                entity.createCollisionBox();
            }
        }
    }

    /**
     * 注销实体
     */
    unregisterEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }

        const buildingIndex = this.buildings.indexOf(entity);
        if (buildingIndex > -1) {
            this.buildings.splice(buildingIndex, 1);
        }

        const resourceIndex = this.resourceNodes.indexOf(entity);
        if (resourceIndex > -1) {
            this.resourceNodes.splice(resourceIndex, 1);
        }

        const unitIndex = this.units.indexOf(entity);
        if (unitIndex > -1) {
            this.units.splice(unitIndex, 1);
        }
    }

    /**
     * 更新所有实体的碰撞体积
     */
    updateCollisionBoxes() {
        for (const entity of this.entities) {
            if (entity.updateCollisionBox) {
                entity.updateCollisionBox();
            }
        }
    }

    /**
     * 检测两个实体是否碰撞
     */
    checkCollision(entity1, entity2) {
        if (!entity1.getCollisionBox || !entity2.getCollisionBox) {
            return false;
        }

        const box1 = entity1.getCollisionBox();
        const box2 = entity2.getCollisionBox();

        return entity1.intersectsBox(box2);
    }

    /**
     * 检测实体与位置的碰撞
     */
    checkCollisionAtPosition(entity, position) {
        if (!entity.getCollisionBox) {
            return false;
        }

        const box = entity.getCollisionBox();
        const testBox = {
            minX: position.x - 0.5,
            maxX: position.x + 0.5,
            minZ: position.z - 0.5,
            maxZ: position.z + 0.5
        };

        return (
            box.minX < testBox.maxX &&
            box.maxX > testBox.minX &&
            box.minZ < testBox.maxZ &&
            box.maxZ > testBox.minZ
        );
    }

    /**
     * 检测位置是否可以放置建筑
     */
    canPlaceAtPosition(position, gridSizeX, gridSizeZ, excludeEntity = null) {
        const testBox = {
            minX: position.x - (gridSizeX * 2) / 2,
            maxX: position.x + (gridSizeX * 2) / 2,
            minZ: position.z - (gridSizeZ * 2) / 2,
            maxZ: position.z + (gridSizeZ * 2) / 2
        };

        // 检测与所有建筑的碰撞
        for (const building of this.buildings) {
            if (building === excludeEntity) continue;
            
            const buildingBox = building.getCollisionBox();
            if (this.boxesIntersect(testBox, buildingBox)) {
                return false;
            }
        }

        // 检测与所有资源节点的碰撞
        for (const resource of this.resourceNodes) {
            if (resource === excludeEntity) continue;
            
            const resourceBox = resource.getCollisionBox();
            if (this.boxesIntersect(testBox, resourceBox)) {
                return false;
            }
        }

        // 检测与所有单位的碰撞
        for (const unit of this.units) {
            if (unit === excludeEntity) continue;
            
            const unitBox = unit.getCollisionBox ? unit.getCollisionBox() : null;
            if (unitBox && this.boxesIntersect(testBox, unitBox)) {
                return false;
            }
        }

        // 检测是否在地图范围内
        const mapWidth = this.grid.width * this.grid.cellSize;
        const mapHeight = this.grid.height * this.grid.cellSize;
        const halfWidth = mapWidth / 2;
        const halfHeight = mapHeight / 2;

        if (
            testBox.minX < -halfWidth ||
            testBox.maxX > halfWidth ||
            testBox.minZ < -halfHeight ||
            testBox.maxZ > halfHeight
        ) {
            return false;
        }

        return true;
    }

    /**
     * 检测两个包围盒是否相交
     */
    boxesIntersect(box1, box2) {
        return (
            box1.minX < box2.maxX &&
            box1.maxX > box2.minX &&
            box1.minZ < box2.maxZ &&
            box1.maxZ > box2.minZ
        );
    }

    /**
     * 获取指定位置的所有碰撞实体
     */
    getCollisionsAtPosition(position, radius = 1) {
        const collisions = [];
        const testBox = {
            minX: position.x - radius,
            maxX: position.x + radius,
            minZ: position.z - radius,
            maxZ: position.z + radius
        };

        for (const entity of this.entities) {
            if (!entity.getCollisionBox) continue;

            const entityBox = entity.getCollisionBox();
            if (this.boxesIntersect(testBox, entityBox)) {
                collisions.push(entity);
            }
        }

        return collisions;
    }

    /**
     * 检测单位移动时是否会碰撞
     */
    canUnitMoveTo(unit, targetPosition) {
        if (!unit.getCollisionBox) {
            return true;
        }

        const unitBox = unit.getCollisionBox();
        const targetBox = {
            minX: targetPosition.x - (unitBox.width / 2),
            maxX: targetPosition.x + (unitBox.width / 2),
            minZ: targetPosition.z - (unitBox.depth / 2),
            maxZ: targetPosition.z + (unitBox.depth / 2)
        };

        // 检测与建筑的碰撞
        for (const building of this.buildings) {
            if (building === unit) continue;
            
            const buildingBox = building.getCollisionBox();
            if (this.boxesIntersect(targetBox, buildingBox)) {
                return false;
            }
        }

        // 检测与资源节点的碰撞
        for (const resource of this.resourceNodes) {
            if (resource === unit) continue;
            
            const resourceBox = resource.getCollisionBox();
            if (this.boxesIntersect(targetBox, resourceBox)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 将建筑占用的网格标记为已占用
     */
    updateGridOccupancy() {
        // 清除所有占用
        for (let x = 0; x < this.grid.width; x++) {
            for (let z = 0; z < this.grid.height; z++) {
                const cell = this.grid.getCell(x, z);
                if (cell) {
                    cell.occupied = false;
                    cell.entity = null;
                }
            }
        }

        // 标记建筑占用的网格
        for (const building of this.buildings) {
            const cells = building.getOccupiedGridCells ?
                building.getOccupiedGridCells(this.grid.cellSize) : [];

            for (const cell of cells) {
                const gridCell = this.grid.getCell(cell.x, cell.z);
                if (gridCell) {
                    gridCell.occupied = true;
                    gridCell.entity = building;
                }
            }
        }

        // 标记资源节点占用的网格
        for (const resource of this.resourceNodes) {
            const cells = resource.getOccupiedGridCells ?
                resource.getOccupiedGridCells(this.grid.cellSize) : [];

            for (const cell of cells) {
                const gridCell = this.grid.getCell(cell.x, cell.z);
                if (gridCell) {
                    gridCell.occupied = true;
                    gridCell.entity = resource;
                }
            }
        }
    }

    /**
     * 获取所有建筑
     */
    getBuildings() {
        return this.buildings;
    }

    /**
     * 获取所有资源节点
     */
    getResourceNodes() {
        return this.resourceNodes;
    }

    /**
     * 获取所有单位
     */
    getUnits() {
        return this.units;
    }

    /**
     * 清空所有实体
     */
    clear() {
        this.entities = [];
        this.buildings = [];
        this.resourceNodes = [];
        this.units = [];
    }
}

export default CollisionSystem;

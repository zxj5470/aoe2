class UnitGathering {
    constructor(unit) {
        this.unit = unit;
    }

    sendToBuild(building) {
        if (this.unit.unitType !== 'villager') return;
        this.unit.stopGathering();
        this.unit.isAttacking = false;
        this.unit.targetEntity = null;
        this.unit.actionQueue = [];

        this.unit.clearBuildingState();

        const halfW = (building.gridSizeX || 2) / 2 + 1;
        const halfD = (building.gridSizeZ || 2) / 2 + 1;
        const bArrivalDist = Math.max(halfW, halfD, 2);

        this.unit.moveTo(building.position, { preserveBuilding: true });
        this.unit.isBuilding = true;
        this.unit.buildingTarget = building;
        this.unit.buildArrivalDistance = bArrivalDist;
        building.addBuilder(this.unit);
    }

    updateBuilding(deltaTime) {
        if (!this.unit.isBuilding || !this.unit.buildingTarget) return;

        if (!this.unit.buildingTarget.isAlive || !this.unit.buildingTarget.isUnderConstruction) {
            this.unit.buildingTarget.removeBuilder(this.unit);
            this.unit.isBuilding = false;
            this.unit.buildingTarget = null;
            this.unit.isMoving = false;
            this.unit.path = [];
            this.unit.targetPosition = null;
            this.unit.setAnimationState('idle');
            return;
        }

        const dx = this.unit.position.x - this.unit.buildingTarget.position.x;
        const dz = this.unit.position.z - this.unit.buildingTarget.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= this.unit.buildArrivalDistance) {
            this.unit.isMoving = false;
            this.unit.targetPosition = null;
            this.unit.path = [];
            this.unit.setAnimationState('gathering');
        }
    }

    updateResourceGathering(deltaTime) {
        // 资源采集由 ResourceGatheringSystem 统一管理
        // 此方法仅做资源节点有效性检查
        if (!this.unit.currentResource || this.unit.isReturning) {
            return;
        }

        if (!this.unit.currentResource.isAlive || this.unit.currentResource.amount <= 0) {
            // 资源耗尽：清除资源引用，但保留已携带的资源让 ResourceGatheringSystem 处理投放
            this.unit.currentResource = null;
        }
    }

    stopGathering() {
        this.unit.currentResource = null;
        this.unit.carryType = null;
        this.unit.carryAmount = 0;
        this.unit.gatherTimer = 0;
        this.unit.isReturning = false;
        this.unit.dropOffPoint = null;
        this.unit.currentAction = 'idle';
        this.unit.setAnimationState('idle');
    }

    /**
     * 清除活跃采集状态，保留已携带资源
     * 用于村民被玩家手动移动等中断场景
     */
    clearActiveGathering() {
        this.unit.currentResource = null;
        this.unit.gatherTimer = 0;
        this.unit.isReturning = false;
        this.unit.currentAction = 'idle';
        this.unit.setAnimationState('idle');
        // carryType、carryAmount、dropOffPoint 保留（shouldAutoDrop 防止自动投放）
    }

    deliverResources() {
        if (this.unit.carryAmount <= 0) return;

        const deliveredAmount = this.unit.carryAmount;
        const resourceType = this.unit.carryType;

        if (this.unit.game && this.unit.game.resourceManager) {
            this.unit.game.resourceManager.addResource(resourceType, deliveredAmount);
            if (this.unit.game.hud) {
                this.unit.game.hud.updateResourceDisplay();
            }
        }

        this.unit.carryAmount = 0;
        this.unit.carryType = null;
        this.unit.isReturning = false;
    }

    gatherResource(resourceEntity, dropOffPoint = null) {
        if (!resourceEntity || !resourceEntity.userData) return;
        if (resourceEntity.isHuntableBoar?.()) return;

        if (resourceEntity.userData.resourceAmount <= 0) {
            return;
        }

        const newType = resourceEntity.userData.resourceType;

        // 切换资源类型时，先丢弃旧资源
        if (this.unit.carryAmount > 0 && this.unit.carryType && this.unit.carryType !== newType) {
            this.unit.carryAmount = 0;
            this.unit.carryType = null;
        }

        this.unit.currentResource = resourceEntity;
        this.unit.carryType = newType;
        if (this.unit.carryAmount === undefined) this.unit.carryAmount = 0;
        
        if (dropOffPoint) {
            this.unit.dropOffPoint = dropOffPoint;
        } else {
            this.unit.dropOffPoint = null;
        }
        
        console.log(`[村民采集] 开始采集 ${this.unit.carryType}，投放点: ${this.unit.dropOffPoint ? '已设置' : '未设置'}`);

        // 移动到资源旁离村民最近的可行走格子（与普通移动相同的寻路逻辑）
        if (this.unit.game && this.unit.game.resourceGatheringSystem) {
            const target = this.unit.game.resourceGatheringSystem.getGatherTarget(resourceEntity.position, this.unit.position);
            this.unit.moveTo(target, { preserveGathering: true });
        } else {
            this.unit.moveTo(resourceEntity.position, { preserveGathering: true });
        }

        this.unit.setAnimationState('gathering');
    }

    clearBuildingState() {
        if (this.unit.isBuilding && this.unit.buildingTarget) {
            this.unit.buildingTarget.removeBuilder(this.unit);
        }
        this.unit.isBuilding = false;
        this.unit.buildingTarget = null;
    }
}

export default UnitGathering;

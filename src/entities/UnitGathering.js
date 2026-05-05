import * as THREE from 'three';

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
        if (!this.unit.currentResource || this.unit.isReturning) {
            return;
        }

        if (!this.unit.currentResource.isAlive || this.unit.currentResource.amount <= 0) {
            this.unit.stopGathering();
            return;
        }

        const dx = this.unit.position.x - this.unit.currentResource.position.x;
        const dz = this.unit.position.z - this.unit.currentResource.position.z;
        const distanceToResource = Math.sqrt(dx * dx + dz * dz);
        if (distanceToResource > 1.5) {
            return;
        }

        this.unit.gatherTimer += deltaTime;
        this.unit.returnTimer += deltaTime;

        if (this.unit.gatherTimer >= this.unit.gatherInterval) {
            this.unit.gatherTimer = 0;
            this.unit.carryAmount += 1;
            
            console.log(`[村民采集] 携带资源: ${this.unit.carryAmount}, 类型: ${this.unit.carryType}`);
        }

        if (this.unit.returnTimer >= this.unit.returnTime) {
            console.log('[村民采集] 20秒已到，开始返回城镇中心');
            this.unit.returnToTownCenter();
        }
    }

    returnToTownCenter() {
        if (!this.unit.dropOffPoint) {
            console.warn('[村民采集] 没有投放点，无法返回');
            this.unit.stopGathering();
            return;
        }

        this.unit.isReturning = true;
        this.unit.currentAction = 'returning';
        
        const townCenterPos = this.unit.dropOffPoint.position;
        this.unit.moveTo(new THREE.Vector3(townCenterPos.x, 0, townCenterPos.z));
    }

    stopGathering() {
        this.unit.currentResource = null;
        this.unit.carryType = null;
        this.unit.carryAmount = 0;
        this.unit.gatherTimer = 0;
        this.unit.returnTimer = 0;
        this.unit.isReturning = false;
        this.unit.dropOffPoint = null;
        this.unit.currentAction = 'idle';
        this.unit.setAnimationState('idle');
    }

    deliverResources() {
        console.log(`[村民采集] 尝试交付资源 - 携带量: ${this.unit.carryAmount}, 类型: ${this.unit.carryType}`);
        
        if (this.unit.carryAmount <= 0) {
            console.log('[村民采集] 没有携带资源，无需交付');
            this.unit.stopGathering();
            return;
        }

        const deliveredAmount = this.unit.carryAmount;
        const resourceType = this.unit.carryType;

        console.log(`[村民采集] 交付资源: ${deliveredAmount} ${resourceType}`);

        if (this.unit.game && this.unit.game.resourceManager) {
            this.unit.game.resourceManager.addResource(resourceType, deliveredAmount);
            console.log(`[村民采集] 总资源增加: ${deliveredAmount} ${resourceType}`);
            
            if (this.unit.game.hud) {
                this.unit.game.hud.updateResourceDisplay();
            }
        } else {
            console.error('[村民采集] 无法访问ResourceManager', {
                hasGame: !!this.unit.game,
                hasResourceManager: this.unit.game ? !!this.unit.game.resourceManager : false
            });
        }

        this.unit.stopGathering();
    }

    gatherResource(resourceEntity, dropOffPoint = null) {
        if (!resourceEntity || !resourceEntity.userData) return;

        if (resourceEntity.userData.resourceAmount <= 0) {
            return;
        }

        this.unit.currentResource = resourceEntity;
        this.unit.carryType = resourceEntity.userData.resourceType;
        if (this.unit.carryAmount === undefined) this.unit.carryAmount = 0;
        
        if (dropOffPoint) {
            this.unit.dropOffPoint = dropOffPoint;
        }
        
        console.log(`[村民采集] 开始采集 ${this.unit.carryType}，投放点: ${this.unit.dropOffPoint ? '已设置' : '未设置'}`);

        this.unit.moveTo(resourceEntity.position);

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

import { BUILDING_TYPES, BUILDING_CONFIG } from '../config.js';

class BuildingConstruction {
    constructor(building) {
        this.building = building;
    }

    updateConstruction(deltaTime) {
        if (!this.building.isUnderConstruction || this.building.constructionProgress >= 100) return;

        this.building.builderVillagers = this.building.builderVillagers.filter(v => v && v.isAlive && !v._markedForRemoval);
        const activeBuilders = this.building.builderVillagers.length;

        if (activeBuilders > 0) {
            const config = BUILDING_CONFIG[this.building.buildingType];
            const buildTime = config?.buildTime || 10; // 秒，1 村民基准建造时间
            // 公式：实际时间 = 3T/(2+V)，则每秒进度 = 100×(2+V)/(3T)
            let progressPerSecond = (100 * (2 + activeBuilders)) / (3 * buildTime);
            // 文明加成：建造效率
            const player = this.building._game?.player;
            if (player) {
                progressPerSecond *= player.getBonus('builderEfficiency', 1.0);
            }
            this.building.constructionProgress += deltaTime * progressPerSecond;
        }

        // 更新生命值（根据建造进度）
        this.building.health = Math.floor(this.building.maxHealth * this.building.constructionProgress / 100);

        if (this.building.constructionProgress >= 100) {
            console.log(`[建造] ${this.building.name} 进度达到 100%, isUnderConstruction: ${this.building.isUnderConstruction} -> false`);
            this.building.constructionProgress = 100;
            this.building.health = this.building.maxHealth;
            this.building.isUnderConstruction = false;
            this.onConstructionComplete();
        }

        if (this.building.mesh) {
            const progress = this.building.constructionProgress / 100;
            this.building.mesh.scale.y = progress;

            if (this.building.symbolPlane) {
                this.building.symbolPlane.material.opacity = progress;
            }

            // 刷新血条填充宽度与颜色（可见性由 updateHealthBarAnimation 统一仲裁）
            this.building.updateHealthBar();
        }
    }

    onConstructionComplete() {
        this.building.health = this.building.maxHealth;
        this.building.isUnderConstruction = false;

        for (const villager of this.building.builderVillagers) {
            if (villager && villager.isAlive) {
                villager.buildingTarget = null;
                villager.isBuilding = false;
            }
        }
        this.building.builderVillagers = [];

        if (this.building.mesh) {
            this.building.mesh.scale.y = 1;
        }
        if (this.building.symbolPlane) {
            this.building.symbolPlane.material.opacity = 1;
        }
        // 建造完成，刷新血条（可见性由 updateHealthBarAnimation 统一仲裁）
        this.building.updateHealthBar();
        console.log(`[建造] ${this.building.name} (${this.building.buildingType}) 建造完成, isUnderConstruction: ${this.building.isUnderConstruction}`);

        // 建筑完成时更新人口（通过 onBuildingChange 统一处理）
        if (this.building._game && this.building._game.player) {
            console.log(`[建造] 触发 onBuildingChange, 当前人口: ${this.building._game.player.population.current}/${this.building._game.player.population.max}`);
            this.building._game.player.onBuildingChange(this.building._game.entityManager);
            console.log(`[建造] onBuildingChange 完成, 新人口: ${this.building._game.player.population.current}/${this.building._game.player.population.max}`);
        }

        if (this.building.buildingType === BUILDING_TYPES.TOWN_CENTER && this.building._game && this.building._game.resourceGatheringSystem) {
            this.building._game.resourceGatheringSystem.addDropOffPoint(this.building, ['wood', 'food', 'gold', 'stone']);
        }
    }

    addBuilder(villager) {
        if (!this.building.builderVillagers.includes(villager)) {
            this.building.builderVillagers.push(villager);
        }
    }

    removeBuilder(villager) {
        const index = this.building.builderVillagers.indexOf(villager);
        if (index > -1) {
            this.building.builderVillagers.splice(index, 1);
        }
    }

    needsBuilder() {
        return this.building.isUnderConstruction && this.building.constructionProgress < 100
            && this.building.builderVillagers.length < this.building.requiredBuilders;
    }

    getConstructionProgress() {
        return this.building.constructionProgress;
    }

    /**
     * 取消建造，退还资源
     * @returns {Object|null} 退还的资源，如果无法取消则返回 null
     */
    cancelConstruction() {
        if (!this.building.isUnderConstruction) {
            console.warn('[建造] 无法取消：建筑不在建造中');
            return null;
        }

        // 计算退还的资源（根据建造进度）
        const config = BUILDING_CONFIG[this.building.buildingType];
        if (!config || !config.cost) {
            console.warn('[建造] 无法取消：找不到建筑配置');
            return null;
        }

        const progress = this.building.constructionProgress / 100;
        const refund = {};

        // 退还资源 = 原始成本 * (1 - 建造进度) * 0.5（50%退还率）
        for (const [resource, amount] of Object.entries(config.cost)) {
            if (amount > 0) {
                refund[resource] = Math.floor(amount * (1 - progress) * 0.5);
            }
        }

        // 释放建造者
        for (const villager of this.building.builderVillagers) {
            if (villager && villager.isAlive) {
                villager.buildingTarget = null;
                villager.isBuilding = false;
                villager.isMoving = false;
                villager.currentAction = 'idle';
            }
        }
        this.building.builderVillagers = [];

        // 标记建筑为已销毁
        this.building.isAlive = false;

        console.log(`[建造] ${this.building.name} (${this.building.buildingType}) 已取消建造，退还资源:`, refund);

        return refund;
    }

    /**
     * 获取建造信息（用于UI显示）
     */
    getConstructionInfo() {
        const builderCount = this.building.builderVillagers.length;
        const config = BUILDING_CONFIG[this.building.buildingType];
        const buildTime = config?.buildTime || 10;
        const remainingProgress = 100 - this.building.constructionProgress;
        // 公式：实际时间 = 3T/(2+V)，则每秒进度 = 100×(2+V)/(3T)
        let progressPerSecond = builderCount > 0 ? (100 * (2 + builderCount)) / (3 * buildTime) : 0;
        // 文明加成：建造效率
        const player = this.building._game?.player;
        if (player) {
            progressPerSecond *= player.getBonus('builderEfficiency', 1.0);
        }
        const remainingTimeSec = progressPerSecond > 0 ? Math.ceil(remainingProgress / progressPerSecond) : 0;
        return {
            isUnderConstruction: this.building.isUnderConstruction,
            progress: this.building.constructionProgress,
            builderCount,
            requiredBuilders: this.building.requiredBuilders || 1,
            buildingType: this.building.buildingType,
            buildTime,
            remainingTimeSec
        };
    }
}

export default BuildingConstruction;

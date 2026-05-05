class BuildingConstruction {
    constructor(building) {
        this.building = building;
    }

    updateConstruction(deltaTime) {
        if (!this.building.isUnderConstruction || this.building.constructionProgress >= 100) return;

        this.building.builderVillagers = this.building.builderVillagers.filter(v => v && v.isAlive && !v._markedForRemoval);
        const activeBuilders = this.building.builderVillagers.length;

        if (activeBuilders > 0) {
            this.building.constructionProgress += deltaTime * 10 * activeBuilders;
        }

        if (this.building.constructionProgress >= 100) {
            this.building.constructionProgress = 100;
            this.building.isUnderConstruction = false;
            this.onConstructionComplete();
        }

        if (this.building.mesh) {
            const progress = this.building.constructionProgress / 100;
            this.building.mesh.scale.y = progress;

            if (this.building.symbolPlane) {
                this.building.symbolPlane.material.opacity = progress;
            }

            if (this.building.healthBar) {
                this.building.healthBarGroup.visible = true;
                this.building.healthBar.scale.x = progress;
                this.building.healthBar.material.color.setHex(0x00FF00);
            }
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
        if (this.building.healthBarGroup) {
            this.building.healthBarGroup.visible = false;
        }

        if (this.building.buildingType === 'house' && this.building._game && this.building._game.player) {
            this.building._game.player.setMaxPopulation(this.building._game.player.population.max + 5);
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
}

export default BuildingConstruction;

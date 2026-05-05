class BuildingProduction {
    constructor(building) {
        this.building = building;
    }

    updateProduction(deltaTime) {
        if (this.building.currentProduction) {
            this.building.productionProgress += deltaTime * (100 / this.building.currentProduction.time);
            
            if (this.building.productionProgress >= 100) {
                this.building.productionProgress = 0;
                this.onProductionComplete(this.building.currentProduction);
                this.building.currentProduction = null;
                
                if (this.building.productionQueue.length > 0) {
                    this.building.currentProduction = this.building.productionQueue.shift();
                }
            }
        }
    }

    onProductionComplete(productionItem) {
        if (productionItem.type === 'unit' && this.building._game) {
            this.building._game.spawnUnitFromBuilding(this.building, productionItem.unitType);
        } else if (productionItem.type === 'research' && this.building._game) {
            this.building._game.applyResearch(this.building, productionItem.techType);
        }
        
        if (productionItem.onComplete) {
            productionItem.onComplete();
        }
    }

    addToProductionQueue(item) {
        this.building.productionQueue.push(item);
        
        if (!this.building.currentProduction) {
            this.building.currentProduction = this.building.productionQueue.shift();
        }
    }

    cancelProduction() {
        if (this.building.currentProduction) {
            this.building.currentProduction = null;
            this.building.productionProgress = 0;
        }
    }

    getProductionProgress() {
        return this.building.productionProgress;
    }

    getProductionQueue() {
        return this.building.productionQueue;
    }
}

export default BuildingProduction;

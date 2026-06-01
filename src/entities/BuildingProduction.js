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
            const canceled = this.building.currentProduction;
            this.building.currentProduction = null;
            this.building.productionProgress = 0;

            if (this.building.productionQueue.length > 0) {
                this.building.currentProduction = this.building.productionQueue.shift();
            }

            return canceled;
        }

        return null;
    }

    cancelQueuedProduction(match = null) {
        if (this.building.productionQueue.length > 0) {
            const index = this.findQueuedProductionIndex(match);
            if (index !== -1) {
                return this.building.productionQueue.splice(index, 1)[0];
            }
        }

        if (!match || this.matchesProductionItem(this.building.currentProduction, match)) {
            return this.cancelProduction();
        }

        return null;
    }

    cancelProductionAt(slot, index = -1) {
        if (slot === 'current') {
            return this.cancelProduction();
        }

        if (slot === 'queue') {
            const queueIndex = Number(index);
            if (!Number.isInteger(queueIndex) || queueIndex < 0 || queueIndex >= this.building.productionQueue.length) {
                return null;
            }

            return this.building.productionQueue.splice(queueIndex, 1)[0];
        }

        return null;
    }

    findQueuedProductionIndex(match) {
        if (!match) return this.building.productionQueue.length - 1;

        for (let i = this.building.productionQueue.length - 1; i >= 0; i--) {
            if (this.matchesProductionItem(this.building.productionQueue[i], match)) {
                return i;
            }
        }

        return -1;
    }

    matchesProductionItem(item, match) {
        if (!item || !match) return false;
        if (match.type && item.type !== match.type) return false;
        if (match.unitType && item.unitType !== match.unitType) return false;
        if (match.techType && item.techType !== match.techType) return false;
        return true;
    }

    getProductionProgress() {
        return this.building.productionProgress;
    }

    getProductionQueue() {
        return this.building.productionQueue;
    }
}

export default BuildingProduction;

class ResourceManager {
    constructor() {
        this.resources = {
            wood: 0,
            food: 0,
            gold: 0,
            stone: 0
        };
        
        this.maxResources = {
            wood: 99999,
            food: 99999,
            gold: 99999,
            stone: 99999
        };
        
        this.resourceCapacities = {
            wood: 0,
            food: 0,
            gold: 0,
            stone: 0
        };
        
        this.listeners = [];
    }

    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] = Math.min(
                this.resources[type] + amount,
                this.maxResources[type] + this.resourceCapacities[type]
            );
            this.notifyListeners(type, this.resources[type]);
        }
    }

    addResources(resources) {
        for (const [type, amount] of Object.entries(resources)) {
            if (amount > 0) {
                this.addResource(type, amount);
            }
        }
    }

    removeResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] = Math.max(0, this.resources[type] - amount);
            this.notifyListeners(type, this.resources[type]);
        }
    }

    getResource(type) {
        return this.resources[type] || 0;
    }

    getAllResources() {
        return { ...this.resources };
    }

    hasEnoughResources(cost) {
        for (const type in cost) {
            if (this.resources[type] < cost[type]) {
                return false;
            }
        }
        return true;
    }

    spendResources(cost) {
        if (!this.hasEnoughResources(cost)) {
            return false;
        }
        
        for (const type in cost) {
            this.removeResource(type, cost[type]);
        }
        
        return true;
    }

    setResourceCapacity(type, capacity) {
        if (this.resourceCapacities.hasOwnProperty(type)) {
            this.resourceCapacities[type] = capacity;
        }
    }

    getResourceCapacity(type) {
        return this.resourceCapacities[type] || 0;
    }

    getMaxResource(type) {
        return this.maxResources[type] + this.resourceCapacities[type];
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(type, amount) {
        for (const listener of this.listeners) {
            listener(type, amount);
        }
    }

    reset() {
        this.resources = {
            wood: 0,
            food: 0,
            gold: 0,
            stone: 0
        };
        this.resourceCapacities = {
            wood: 0,
            food: 0,
            gold: 0,
            stone: 0
        };
    }
}

export default ResourceManager;
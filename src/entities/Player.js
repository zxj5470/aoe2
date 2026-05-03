class Player {
    constructor(config = {}) {
        this.id = config.id || 'player';
        this.name = config.name || 'Player';
        
        this.ageLevel = config.ageLevel || 1;
        
        this.resources = {
            gold: config.gold || 100,
            wood: config.wood || 100,
            food: config.food || 100,
            stone: config.stone || 50
        };
        
        this.units = [];
        
        this.population = {
            current: 0,
            max: config.maxPopulation || 20
        };
    }
    
    setAgeLevel(level) {
        this.ageLevel = Math.min(Math.max(level, 1), 4);
    }
    
    getAgeLevel() {
        return this.ageLevel;
    }
    
    getAgeName() {
        const ageNames = ['黑暗时代', '封建时代', '城堡时代', '帝王时代'];
        return ageNames[this.ageLevel - 1] || '黑暗时代';
    }
    
    getAgeRomanNumeral() {
        const romanNumerals = ['I', 'II', 'III', 'IV'];
        return romanNumerals[this.ageLevel - 1] || 'I';
    }
    
    setResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] = Math.max(0, amount);
        }
    }
    
    getResource(type) {
        return this.resources[type] || 0;
    }
    
    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] += amount;
        }
    }
    
    consumeResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            return true;
        }
        return false;
    }
    
    addUnit(unit) {
        if (!this.units.includes(unit)) {
            this.units.push(unit);
            this.population.current++;
        }
    }
    
    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index !== -1) {
            this.units.splice(index, 1);
            this.population.current--;
        }
    }
    
    getUnits() {
        return this.units;
    }
    
    getUnitsByType(unitType) {
        return this.units.filter(unit => unit.unitType === unitType);
    }
    
    setMaxPopulation(max) {
        this.population.max = Math.max(1, max);
    }
    
    canTrainUnit(populationCost = 1) {
        return this.population.current + populationCost <= this.population.max;
    }
}

export default Player;
import ResourceManager from './ResourceManager.js';
import { HUMAN_OWNER } from '../config.js';

class Player {
    constructor(config = {}) {
        this.id = config.id || HUMAN_OWNER;
        this.name = config.name || 'Player';
        
        this.ageLevel = config.ageLevel || 1;
        
        this.resourceManager = new ResourceManager();
        if (config.gold) this.resourceManager.addResource('gold', config.gold);
        if (config.wood) this.resourceManager.addResource('wood', config.wood);
        if (config.food) this.resourceManager.addResource('food', config.food);
        if (config.stone) this.resourceManager.addResource('stone', config.stone);
        
        this.units = [];
        
        this.population = {
            current: 0,
            max: config.maxPopulation || 20
        };
        
        this.researchedTechs = new Set();
        
        this.listeners = {
            ageChange: [],
            populationChange: [],
            unitAdd: [],
            unitRemove: []
        };
    }

    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        }
    }

    off(eventType, callback) {
        if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(callback);
            if (index !== -1) {
                this.listeners[eventType].splice(index, 1);
            }
        }
    }

    emit(eventType, data) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} listener:`, error);
                }
            });
        }
    }

    setAgeLevel(level) {
        const oldLevel = this.ageLevel;
        this.ageLevel = Math.min(Math.max(level, 1), 4);
        if (oldLevel !== this.ageLevel) {
            this.emit('ageChange', {
                oldLevel,
                newLevel: this.ageLevel,
                ageName: this.getAgeName(),
                romanNumeral: this.getAgeRomanNumeral()
            });
        }
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

    addUnit(unit) {
        if (!this.units.includes(unit)) {
            this.units.push(unit);
            const oldPopulation = this.population.current;
            this.population.current++;
            this.emit('unitAdd', { unit });
            this.emit('populationChange', {
                oldCurrent: oldPopulation,
                newCurrent: this.population.current,
                max: this.population.max
            });
        }
    }

    removeUnit(unit) {
        const index = this.units.indexOf(unit);
        if (index !== -1) {
            this.units.splice(index, 1);
            const oldPopulation = this.population.current;
            this.population.current--;
            this.emit('unitRemove', { unit });
            this.emit('populationChange', {
                oldCurrent: oldPopulation,
                newCurrent: this.population.current,
                max: this.population.max
            });
        }
    }

    getUnits() {
        return this.units;
    }

    getUnitsByType(unitType) {
        return this.units.filter(unit => unit.unitType === unitType);
    }

    setMaxPopulation(max) {
        const oldMax = this.population.max;
        this.population.max = Math.max(1, max);
        if (oldMax !== this.population.max) {
            this.emit('populationChange', {
                oldCurrent: this.population.current,
                newCurrent: this.population.current,
                oldMax,
                newMax: this.population.max
            });
        }
    }

    canTrainUnit(populationCost = 1) {
        return this.population.current + populationCost <= this.population.max;
    }

    hasResearched(techType) {
        return this.researchedTechs.has(techType);
    }

    completeResearch(techType) {
        if (this.researchedTechs.has(techType)) return;
        this.researchedTechs.add(techType);
        this.applyTechEffects(techType);
    }

    applyTechEffects(techType) {
        switch (techType) {
            case 'loom':
                for (const unit of this.units) {
                    if (unit.unitType === 'villager') {
                        unit.maxHealth += 15;
                        unit.health = Math.min(unit.health + 15, unit.maxHealth);
                        unit.armor += 1;
                    }
                }
                break;
            case 'town_watch':
                break;
            default:
                console.log(`[Player] 科技 ${techType} 效果已应用`);
                break;
        }
    }
}

export default Player;

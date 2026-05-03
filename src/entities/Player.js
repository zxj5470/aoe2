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
        
        // 事件监听器
        this.listeners = {
            ageChange: [],
            resourceChange: [],
            populationChange: [],
            unitAdd: [],
            unitRemove: []
        };
    }
    
    /**
     * 添加事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    on(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].push(callback);
        }
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    off(eventType, callback) {
        if (this.listeners[eventType]) {
            const index = this.listeners[eventType].indexOf(callback);
            if (index !== -1) {
                this.listeners[eventType].splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {*} data - 事件数据
     */
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
    
    setResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            const oldAmount = this.resources[type];
            this.resources[type] = Math.max(0, amount);
            if (oldAmount !== this.resources[type]) {
                this.emit('resourceChange', {
                    type,
                    oldAmount,
                    newAmount: this.resources[type]
                });
            }
        }
    }
    
    getResource(type) {
        return this.resources[type] || 0;
    }
    
    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            const oldAmount = this.resources[type];
            this.resources[type] += amount;
            this.emit('resourceChange', {
                type,
                oldAmount,
                newAmount: this.resources[type]
            });
        }
    }
    
    consumeResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && this.resources[type] >= amount) {
            const oldAmount = this.resources[type];
            this.resources[type] -= amount;
            this.emit('resourceChange', {
                type,
                oldAmount,
                newAmount: this.resources[type]
            });
            return true;
        }
        return false;
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
}

export default Player;
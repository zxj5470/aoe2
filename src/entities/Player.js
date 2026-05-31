import ResourceManager from './ResourceManager.js';
import { HUMAN_OWNER, BUILDING_TYPES, CIV_BONUSES } from '../config.js';

// 人口配置
const POPULATION_CONFIG = {
    houseCapacity: 5,           // 每个房屋提供5人口
    townCenterCapacity: 10,     // 每个城镇中心提供10人口
    basePopulation: 0           // 基础人口（无建筑时）
};

class Player {
    constructor(config = {}) {
        this.id = config.id || HUMAN_OWNER;
        this.name = config.name || 'Player';
        this.ageLevel = config.ageLevel || 1;
        this.activeCivs = config.civs && config.civs.length > 0
            ? [...config.civs]
            : (config.civilization ? [config.civilization] : ['franks']);

        this.resourceManager = new ResourceManager();
        if (config.gold) this.resourceManager.addResource('gold', config.gold);
        if (config.wood) this.resourceManager.addResource('wood', config.wood);
        if (config.food) this.resourceManager.addResource('food', config.food);
        if (config.stone) this.resourceManager.addResource('stone', config.stone);

        this.units = [];

        this.population = {
            current: 0,
            max: config.maxPopulation !== undefined ? config.maxPopulation : 20
        };

        // 蒙古银冠科技：锁定最大人口（拆除房屋不影响）
        this.populationLocked = false;
        this.lockedMaxPopulation = 0;

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

    /**
     * 向后兼容：返回第一个文明名称
     */
    get civilization() {
        return this.activeCivs[0] || 'franks';
    }

    /**
     * 检查玩家是否拥有指定文明
     * @param {string} civName
     * @returns {boolean}
     */
    hasCiv(civName) {
        return this.activeCivs.includes(civName);
    }

    /**
     * 查询文明加成值（遍历所有活跃文明叠加）
     * @param {string} bonusType - 加成类型，如 'builderEfficiency'
     * @param {number} base - 基础值（无加成时返回此值）
     * @returns {number}
     */
    getBonus(bonusType, base = 1.0) {
        let result = base;
        for (const civ of this.activeCivs) {
            const bonus = CIV_BONUSES[civ]?.[bonusType];
            if (!bonus) continue;
            switch (bonus.op) {
                case 'multiply': result *= bonus.value; break;
                case 'add':      result += bonus.value; break;
                case 'set':      result  = bonus.value; break;
            }
        }
        return result;
    }

    addUnit(unit) {
        if (!this.units.includes(unit)) {
            this.units.push(unit);
            const oldPopulation = this.population.current;
            this.population.current++;
            console.log(`[Player] addUnit: ${unit.unitType} ${unit.name}, 人口: ${oldPopulation} -> ${this.population.current}`);
            this.emit('unitAdd', { unit });
            this.emit('populationChange', {
                oldCurrent: oldPopulation,
                newCurrent: this.population.current,
                oldMax: this.population.max,
                newMax: this.population.max
            });
        } else {
            console.log(`[Player] addUnit: ${unit.name} 已在列表中，跳过`);
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
                oldMax: this.population.max,
                newMax: this.population.max
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
            console.log(`[Player] 最大人口变化: ${oldMax} -> ${this.population.max}`);
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

    // 根据建筑计算最大人口
    calculateMaxPopulation(entityManager) {
        if (!entityManager) return;

        console.log(`[Player] 计算人口开始: 当前人口 = ${this.population.current}/${this.population.max}, 文明 = [${this.activeCivs.join(',')}]`);

        // 匈奴：固定最大人口，不需要房屋
        if (this.hasCiv('huns')) {
            console.log(`[Player] 匈奴文明，跳过人口计算`);
            this.setMaxPopulation(200);
            return;
        }

        // 蒙古银冠科技后：锁定最大人口
        if (this.populationLocked && this.lockedMaxPopulation > 0) {
            console.log(`[Player] 蒙古银冠科技已锁定人口: ${this.lockedMaxPopulation}`);
            this.setMaxPopulation(this.lockedMaxPopulation);
            return;
        }

        // 只统计玩家的建筑
        const houseCount = entityManager.getPlayerBuildingCountByType(BUILDING_TYPES.HOUSE);
        const townCenterCount = entityManager.getPlayerBuildingCountByType(BUILDING_TYPES.TOWN_CENTER);

        const maxPopulation = POPULATION_CONFIG.basePopulation +
            (houseCount * POPULATION_CONFIG.houseCapacity) +
            (townCenterCount * POPULATION_CONFIG.townCenterCapacity);

        console.log(`[Player] 计算人口: ${houseCount} 房屋 × ${POPULATION_CONFIG.houseCapacity} + ${townCenterCount} 城镇中心 × ${POPULATION_CONFIG.townCenterCapacity} = ${maxPopulation}`);

        this.setMaxPopulation(maxPopulation);
    }

    // 建筑变更时更新人口
    onBuildingChange(entityManager) {
        this.calculateMaxPopulation(entityManager);
    }

    // 蒙古银冠科技效果：锁定当前最大人口
    lockPopulation() {
        this.populationLocked = true;
        this.lockedMaxPopulation = this.population.max;
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
            case 'mongol_unique_tech': // 蒙古银冠科技：锁定最大人口
                if (this.hasCiv('mongols')) {
                    this.lockPopulation();
                    console.log(`[Player] 蒙古银冠科技：最大人口锁定为 ${this.population.max}`);
                }
                break;
            default:
                console.log(`[Player] 科技 ${techType} 效果已应用`);
                break;
        }
    }
}

export default Player;

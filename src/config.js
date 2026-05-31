/**
 * 全局游戏配置
 * 
 * 集中管理所有全局常量和配置参数
 */

// 玩家颜色配置（AOE2经典8色）
export const PLAYER_COLORS = {
    1: { hex: '#0000FF', rgb: [0, 0, 255], name: '蓝色' },
    2: { hex: '#FF0000', rgb: [255, 0, 0], name: '红色' },
    3: { hex: '#008000', rgb: [0, 128, 0], name: '绿色' },
    4: { hex: '#FFFF00', rgb: [255, 255, 0], name: '黄色' },
    5: { hex: '#FF8000', rgb: [255, 128, 0], name: '橙色' },
    6: { hex: '#800080', rgb: [128, 0, 128], name: '紫色' },
    7: { hex: '#00FFFF', rgb: [0, 255, 255], name: '青色' },
    8: { hex: '#FF80FF', rgb: [255, 128, 255], name: '粉色' }
};

// 人类玩家ID（owner字符串通过 OWNER_TO_PLAYER_ID 映射到此ID即为人类玩家）
export const HUMAN_PLAYER_ID = 1;

// 玩家ID映射（owner字符串 -> 玩家ID）
export const OWNER_TO_PLAYER_ID = {
    player: 1,
    enemy: 2,
    red: 2,
    blue: 1,
    green: 3,
    yellow: 4,
    orange: 5,
    purple: 6,
    cyan: 7,
    pink: 8,
    neutral: 0
};

// 人类玩家的owner字符串（从映射反查得到，作为默认owner值）
export const HUMAN_OWNER = Object.entries(OWNER_TO_PLAYER_ID).find(([, pid]) => pid === HUMAN_PLAYER_ID)?.[0] || 'player';

// 敌方玩家的owner字符串（映射中第一个非人类非中立的玩家）
const NEUTRAL_PLAYER_ID = 0;
export const ENEMY_OWNER = Object.entries(OWNER_TO_PLAYER_ID).find(([key, pid]) => pid !== HUMAN_PLAYER_ID && pid !== NEUTRAL_PLAYER_ID && key !== 'player')?.[0] || 'enemy';

export const BUILDING_TYPES = Object.freeze({
    HOUSE:          'house',
    FARM:           'farm',
    LUMBER_CAMP:    'lumber_camp',
    MINING_CAMP:    'mining_camp',
    BARRACKS:       'barracks',
    ARCHERY_RANGE:  'archery_range',
    STABLE:         'stable',
    BLACKSMITH:     'blacksmith',
    MARKET:         'market',
    CHURCH:         'church',
    WATCH_TOWER:    'watch_tower',
    CASTLE:         'castle',
    TOWN_CENTER:    'town_center',
    WALL:           'wall',
    GATE:           'gate',
    DOCK:           'dock',
    DOOR:           'door',
});

// 城镇中心生产/研发按钮 ID 常量
export const TOWN_CENTER_ACTIONS = Object.freeze({
    PRODUCE_VILLAGER:  'produce-villager',
    RESEARCH_LOOM:     'research-loom',
    RESEARCH_TOWN_WATCH: 'research-town-watch',
});

export const TECH_CONFIG = Object.freeze({
    loom: {
        name: '织布机',
        icon: '织',
        building: BUILDING_TYPES.TOWN_CENTER,
        line: 'town_center_survival',
        lineName: '村民生存',
        tier: 1,
        maxTier: 1,
        cost: { gold: 50 },
        time: 30,
        description: '村民生命值 +15，护甲 +1'
    },
    town_watch: {
        name: '城镇瞭望',
        icon: '望',
        building: BUILDING_TYPES.TOWN_CENTER,
        line: 'town_watch',
        lineName: '城镇瞭望',
        tier: 1,
        maxTier: 1,
        cost: { gold: 100 },
        time: 45,
        description: '建筑视野提升'
    },
    forging: {
        name: '锻造',
        icon: '锻',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'melee_attack',
        lineName: '近战攻击',
        tier: 1,
        maxTier: 3,
        cost: { food: 150, gold: 100 },
        time: 40,
        description: '步兵和骑兵攻击 +1'
    },
    iron_casting: {
        name: '铁铸',
        icon: '铸',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'melee_attack',
        lineName: '近战攻击',
        tier: 2,
        maxTier: 3,
        cost: { food: 220, gold: 120 },
        time: 50,
        description: '步兵和骑兵攻击再 +1'
    },
    blast_furnace: {
        name: '鼓风炉',
        icon: '炉',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'melee_attack',
        lineName: '近战攻击',
        tier: 3,
        maxTier: 3,
        cost: { food: 275, gold: 225 },
        time: 60,
        description: '步兵和骑兵攻击再 +1'
    },
    scale_mail_armor: {
        name: '鳞甲',
        icon: '甲',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'infantry_armor',
        lineName: '步兵护甲',
        tier: 1,
        maxTier: 3,
        cost: { food: 100, gold: 50 },
        time: 40,
        description: '步兵护甲 +1'
    },
    chain_mail_armor: {
        name: '锁子甲',
        icon: '锁',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'infantry_armor',
        lineName: '步兵护甲',
        tier: 2,
        maxTier: 3,
        cost: { food: 200, gold: 100 },
        time: 50,
        description: '步兵护甲再 +1'
    },
    plate_mail_armor: {
        name: '板甲',
        icon: '板',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'infantry_armor',
        lineName: '步兵护甲',
        tier: 3,
        maxTier: 3,
        cost: { food: 300, gold: 150 },
        time: 60,
        description: '步兵护甲再 +1'
    },
    scale_barding_armor: {
        name: '骑兵鳞甲',
        icon: '骑',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'cavalry_armor',
        lineName: '骑兵护甲',
        tier: 1,
        maxTier: 3,
        cost: { food: 150, gold: 100 },
        time: 45,
        description: '骑兵护甲 +1'
    },
    chain_barding_armor: {
        name: '骑兵锁甲',
        icon: '锁',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'cavalry_armor',
        lineName: '骑兵护甲',
        tier: 2,
        maxTier: 3,
        cost: { food: 250, gold: 150 },
        time: 55,
        description: '骑兵护甲再 +1'
    },
    plate_barding_armor: {
        name: '骑兵板甲',
        icon: '板',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'cavalry_armor',
        lineName: '骑兵护甲',
        tier: 3,
        maxTier: 3,
        cost: { food: 350, gold: 200 },
        time: 65,
        description: '骑兵护甲再 +1'
    },
    fletching: {
        name: '箭羽',
        icon: '羽',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'ranged_attack',
        lineName: '远程攻击',
        tier: 1,
        maxTier: 3,
        cost: { food: 100, gold: 50 },
        time: 35,
        description: '弓箭手攻击和射程 +1'
    },
    bodkin_arrow: {
        name: '锥子箭',
        icon: '锥',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'ranged_attack',
        lineName: '远程攻击',
        tier: 2,
        maxTier: 3,
        cost: { food: 200, gold: 100 },
        time: 45,
        description: '弓箭手攻击和射程再 +1'
    },
    bracer: {
        name: '护腕',
        icon: '腕',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'ranged_attack',
        lineName: '远程攻击',
        tier: 3,
        maxTier: 3,
        cost: { food: 300, gold: 200 },
        time: 55,
        description: '弓箭手攻击和射程再 +1'
    },
    padded_archer_armor: {
        name: '弓兵软甲',
        icon: '软',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'archer_armor',
        lineName: '弓兵护甲',
        tier: 1,
        maxTier: 3,
        cost: { food: 100, gold: 50 },
        time: 40,
        description: '弓箭手护甲 +1'
    },
    leather_archer_armor: {
        name: '弓兵皮甲',
        icon: '皮',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'archer_armor',
        lineName: '弓兵护甲',
        tier: 2,
        maxTier: 3,
        cost: { food: 150, gold: 150 },
        time: 50,
        description: '弓箭手护甲再 +1'
    },
    ring_archer_armor: {
        name: '弓兵环甲',
        icon: '环',
        building: BUILDING_TYPES.BLACKSMITH,
        line: 'archer_armor',
        lineName: '弓兵护甲',
        tier: 3,
        maxTier: 3,
        cost: { food: 250, gold: 250 },
        time: 60,
        description: '弓箭手护甲再 +1'
    },
    militia_upgrade: {
        name: '民兵升级',
        icon: '民',
        building: BUILDING_TYPES.BARRACKS,
        line: 'infantry_unit_upgrade',
        lineName: '步兵升级',
        tier: 1,
        maxTier: 3,
        cost: { food: 100, gold: 40 },
        time: 40,
        description: '提升基础步兵战斗能力'
    },
    man_at_arms_upgrade: {
        name: '剑士升级',
        icon: '剑',
        building: BUILDING_TYPES.BARRACKS,
        line: 'infantry_unit_upgrade',
        lineName: '步兵升级',
        tier: 2,
        maxTier: 3,
        cost: { food: 200, gold: 65 },
        time: 50,
        description: '进一步提升步兵战斗能力'
    },
    longsword_upgrade: {
        name: '长剑士升级',
        icon: '长',
        building: BUILDING_TYPES.BARRACKS,
        line: 'infantry_unit_upgrade',
        lineName: '步兵升级',
        tier: 3,
        maxTier: 3,
        cost: { food: 300, gold: 100 },
        time: 60,
        description: '解锁更高阶步兵战斗能力'
    },
    supplies: {
        name: '补给',
        icon: '补',
        building: BUILDING_TYPES.BARRACKS,
        line: 'infantry_economy',
        lineName: '步兵经济',
        tier: 1,
        maxTier: 1,
        cost: { food: 75, gold: 75 },
        time: 35,
        description: '降低步兵训练消耗'
    },
    arson: {
        name: '纵火',
        icon: '火',
        building: BUILDING_TYPES.BARRACKS,
        line: 'infantry_siege',
        lineName: '反建筑',
        tier: 1,
        maxTier: 1,
        cost: { food: 150, gold: 50 },
        time: 40,
        description: '步兵对建筑伤害提高'
    },
    light_cavalry_upgrade: {
        name: '轻骑兵升级',
        icon: '轻',
        building: BUILDING_TYPES.STABLE,
        line: 'scout_cavalry_upgrade',
        lineName: '侦察骑兵升级',
        tier: 1,
        maxTier: 2,
        cost: { food: 150, gold: 50 },
        time: 45,
        description: '提升侦察骑兵战斗能力'
    },
    hussar_upgrade: {
        name: '翼骑兵升级',
        icon: '翼',
        building: BUILDING_TYPES.STABLE,
        line: 'scout_cavalry_upgrade',
        lineName: '侦察骑兵升级',
        tier: 2,
        maxTier: 2,
        cost: { food: 500, gold: 600 },
        time: 60,
        description: '解锁更高阶侦察骑兵'
    },
    bloodlines: {
        name: '血统',
        icon: '血',
        building: BUILDING_TYPES.STABLE,
        line: 'cavalry_health',
        lineName: '骑兵生命',
        tier: 1,
        maxTier: 1,
        cost: { food: 150, gold: 100 },
        time: 40,
        description: '骑兵生命值提高'
    },
    husbandry: {
        name: '畜牧',
        icon: '牧',
        building: BUILDING_TYPES.STABLE,
        line: 'cavalry_speed',
        lineName: '骑兵速度',
        tier: 1,
        maxTier: 1,
        cost: { food: 250 },
        time: 40,
        description: '骑兵移动速度提高'
    }
});

// 建筑统一配置（单一数据源）
// width - 占地宽度（X轴格子数）
// depth - 占地纵深（Z轴格子数）
// height - 离地高度（Y轴，视觉高度）
export const BUILDING_CONFIG = Object.freeze({
    [BUILDING_TYPES.HOUSE]: {
        name: 'House', width: 2, depth: 2, height: 2,
        cost: { wood: 50 }, health: 500, buildTime: 25,
        description: 'Provides population space'
    },
    [BUILDING_TYPES.FARM]: {
        name: 'Farm', width: 3, depth: 3, height: 0.5,
        cost: { wood: 60 }, health: 200, buildTime: 15,
        description: 'Produces food'
    },
    [BUILDING_TYPES.LUMBER_CAMP]: {
        name: 'Lumber Camp', width: 2, depth: 2, height: 1.5,
        cost: { wood: 100 }, health: 300, buildTime: 35,
        description: 'Stores wood'
    },
    [BUILDING_TYPES.MINING_CAMP]: {
        name: 'Mining Camp', width: 2, depth: 2, height: 1.5,
        cost: { wood: 100 }, health: 300, buildTime: 35,
        description: 'Stores stone and gold'
    },
    [BUILDING_TYPES.BARRACKS]: {
        name: 'Barracks', width: 3, depth: 3, height: 3,
        cost: { wood: 150 }, health: 800, buildTime: 50,
        description: 'Trains military units'
    },
    [BUILDING_TYPES.ARCHERY_RANGE]: {
        name: 'Archery Range', width: 3, depth: 3, height: 2.5,
        cost: { wood: 175 }, health: 700, buildTime: 50,
        description: 'Trains archers'
    },
    [BUILDING_TYPES.STABLE]: {
        name: 'Stable', width: 3, depth: 3, height: 2.5,
        cost: { wood: 175 }, health: 700, buildTime: 50,
        description: 'Trains cavalry'
    },
    [BUILDING_TYPES.BLACKSMITH]: {
        name: 'Blacksmith', width: 3, depth: 3, height: 2.5,
        cost: { wood: 175 }, health: 600, buildTime: 40,
        description: 'Upgrades unit equipment'
    },
    [BUILDING_TYPES.MARKET]: {
        name: 'Market', width: 3, depth: 3, height: 2.5,
        cost: { wood: 175 }, health: 600, buildTime: 40,
        description: 'Trade and resource exchange'
    },
    [BUILDING_TYPES.WATCH_TOWER]: {
        name: 'Watch Tower', width: 1, depth: 1, height: 4,
        cost: { stone: 100 }, health: 1000, buildTime: 80,
        description: 'Defensive structure'
    },
    [BUILDING_TYPES.CASTLE]: {
        name: 'Castle', width: 5, depth: 5, height: 6,
        cost: { stone: 600, gold: 300 }, health: 3000, buildTime: 200,
        description: 'Powerful defensive structure'
    },
    [BUILDING_TYPES.CHURCH]: {
        name: 'Church', width: 3, depth: 3, height: 4,
        cost: { wood: 175, gold: 100 }, health: 600, buildTime: 50,
        description: 'Heals and converts units'
    },
    [BUILDING_TYPES.TOWN_CENTER]: {
        name: 'Town Center', width: 4, depth: 4, height: 4,
        cost: {}, health: 2400, buildTime: 150,
        description: 'Main building, creates villagers'
    },
    // 城墙（特殊：1x1 拖拽建造）
    [BUILDING_TYPES.WALL]: {
        name: 'Wall', width: 1, depth: 1, height: 1.5,
        cost: { stone: 5 }, health: 300, buildTime: 8,
        description: 'Defensive wall segment'
    },
    // 城门（特殊：1x2 可旋转）
    [BUILDING_TYPES.GATE]: {
        name: 'Gate', width: 1, depth: 2, height: 2.5,
        cost: { wood: 30 }, health: 400, buildTime: 30,
        description: 'Allows friendly units to pass',
        rotatable: true
    }
});

// ========== 文明加成配置 ==========
// 加成类型 op：'multiply'（乘算）、'add'（加算）、'set'（覆写）
// 多个文明加成按 activeCivs 数组顺序叠加
export const CIV_BONUSES = Object.freeze({
    franks: {
        castleCostMultiplier: { op: 'multiply', value: 0.75 },      // 城堡便宜 25%
        cavalryHealthMultiplierFromFeudal: { op: 'multiply', value: 1.2 }, // 封建时代起骑兵生命值 +20%
        berryGatherRate: { op: 'multiply', value: 1.25 },           // 浆果采集效率 +25%
        stableTrainingSpeed: { op: 'multiply', value: 1.4 },        // 骑士精神：马厩训练快 40%
        knightSightBonus: { op: 'add', value: 2 },                  // 骑士视野 +2
        farmUpgradesFree: { op: 'set', value: 1.0 },                // 农田升级免费（需要磨坊，待科技系统接入）
        throwingAxemanRangeBonus: { op: 'add', value: 1 },          // 芒刺斧：掷斧兵攻击距离 +1（待掷斧兵接入）
    },
    spanish: {
        builderEfficiency: { op: 'multiply', value: 1.25 },  // 村民建造速度 ×1.25
    },
    celts: {
        woodGatherRate:   { op: 'multiply', value: 1.15 },   // 伐木速度 ×1.15
        infantrySpeed:    { op: 'add',      value: 0.15 },    // 步兵移速 +15%
    },
    huns: {
        noHouseRequired:  { op: 'set',      value: 1.0 },     // 不需要房屋
    },
    mongols: {
        huntGatherRate: { op: 'multiply', value: 1.5 },      // 狩猎速度 ×1.5
    },
    khmer: {
        villagerGarrisonHouse: { op: 'set', value: 1.0 },     // 村民可驻扎进房屋
    },
});

// 建筑名称多语言配置
export const BUILDING_I18N = {
    zh: {
        [BUILDING_TYPES.HOUSE]: '房屋',
        [BUILDING_TYPES.FARM]: '农田',
        [BUILDING_TYPES.LUMBER_CAMP]: '伐木场',
        [BUILDING_TYPES.MINING_CAMP]: '采矿场',
        [BUILDING_TYPES.BARRACKS]: '兵营',
        [BUILDING_TYPES.ARCHERY_RANGE]: '射箭场',
        [BUILDING_TYPES.STABLE]: '马厩',
        [BUILDING_TYPES.BLACKSMITH]: '铁匠铺',
        [BUILDING_TYPES.MARKET]: '市场',
        [BUILDING_TYPES.CHURCH]: '教堂',
        [BUILDING_TYPES.WATCH_TOWER]: '瞭望塔',
        [BUILDING_TYPES.CASTLE]: '城堡',
        [BUILDING_TYPES.TOWN_CENTER]: '城镇中心',
        [BUILDING_TYPES.WALL]: '城墙',
        [BUILDING_TYPES.GATE]: '城门',
        [BUILDING_TYPES.DOCK]: '码头',
        [TOWN_CENTER_ACTIONS.PRODUCE_VILLAGER]: '村民',
        [TOWN_CENTER_ACTIONS.RESEARCH_LOOM]: '织布机',
        [TOWN_CENTER_ACTIONS.RESEARCH_TOWN_WATCH]: '城镇瞭望'
    },
    en: {
        [BUILDING_TYPES.HOUSE]: 'House',
        [BUILDING_TYPES.FARM]: 'Farm',
        [BUILDING_TYPES.LUMBER_CAMP]: 'Lumber Camp',
        [BUILDING_TYPES.MINING_CAMP]: 'Mining Camp',
        [BUILDING_TYPES.BARRACKS]: 'Barracks',
        [BUILDING_TYPES.ARCHERY_RANGE]: 'Archery Range',
        [BUILDING_TYPES.STABLE]: 'Stable',
        [BUILDING_TYPES.BLACKSMITH]: 'Blacksmith',
        [BUILDING_TYPES.MARKET]: 'Market',
        [BUILDING_TYPES.CHURCH]: 'Church',
        [BUILDING_TYPES.WATCH_TOWER]: 'Watch Tower',
        [BUILDING_TYPES.CASTLE]: 'Castle',
        [BUILDING_TYPES.TOWN_CENTER]: 'Town Center',
        [BUILDING_TYPES.WALL]: 'Wall',
        [BUILDING_TYPES.GATE]: 'Gate',
        [BUILDING_TYPES.DOCK]: 'Dock',
        [TOWN_CENTER_ACTIONS.PRODUCE_VILLAGER]: 'Villager',
        [TOWN_CENTER_ACTIONS.RESEARCH_LOOM]: 'Loom',
        [TOWN_CENTER_ACTIONS.RESEARCH_TOWN_WATCH]: 'Town Watch'
    }
};

// 当前语言（默认中文）
export let CURRENT_LANG = 'zh';

export function setLanguage(lang) {
    if (BUILDING_I18N[lang]) {
        CURRENT_LANG = lang;
    }
}

export function getBuildingName(buildingId) {
    return BUILDING_I18N[CURRENT_LANG]?.[buildingId] || BUILDING_I18N['en']?.[buildingId] || buildingId;
}

// 建筑描述多语言配置
export const BUILDING_DESC_I18N = {
    zh: {
        [BUILDING_TYPES.HOUSE]: '提供人口空间',
        [BUILDING_TYPES.FARM]: '生产食物',
        [BUILDING_TYPES.LUMBER_CAMP]: '存储木材',
        [BUILDING_TYPES.MINING_CAMP]: '存储石料和金币',
        [BUILDING_TYPES.BARRACKS]: '训练步兵单位',
        [BUILDING_TYPES.ARCHERY_RANGE]: '训练弓箭手',
        [BUILDING_TYPES.STABLE]: '训练骑兵',
        [BUILDING_TYPES.BLACKSMITH]: '升级单位装备',
        [BUILDING_TYPES.MARKET]: '贸易与资源交换',
        [BUILDING_TYPES.WATCH_TOWER]: '防御建筑',
        [BUILDING_TYPES.CASTLE]: '强大的防御建筑',
        [BUILDING_TYPES.CHURCH]: '治疗和转化单位',
        [BUILDING_TYPES.TOWN_CENTER]: '主建筑，可创建村民',
        [BUILDING_TYPES.WALL]: '防御城墙段',
        [BUILDING_TYPES.GATE]: '允许己方单位通过'
    },
    en: {
        [BUILDING_TYPES.HOUSE]: 'Provides population space',
        [BUILDING_TYPES.FARM]: 'Produces food',
        [BUILDING_TYPES.LUMBER_CAMP]: 'Stores wood',
        [BUILDING_TYPES.MINING_CAMP]: 'Stores stone and gold',
        [BUILDING_TYPES.BARRACKS]: 'Trains military units',
        [BUILDING_TYPES.ARCHERY_RANGE]: 'Trains archers',
        [BUILDING_TYPES.STABLE]: 'Trains cavalry',
        [BUILDING_TYPES.BLACKSMITH]: 'Upgrades unit equipment',
        [BUILDING_TYPES.MARKET]: 'Trade and resource exchange',
        [BUILDING_TYPES.WATCH_TOWER]: 'Defensive structure',
        [BUILDING_TYPES.CASTLE]: 'Powerful defensive structure',
        [BUILDING_TYPES.CHURCH]: 'Heals and converts units',
        [BUILDING_TYPES.TOWN_CENTER]: 'Main building, creates villagers',
        [BUILDING_TYPES.WALL]: 'Defensive wall segment',
        [BUILDING_TYPES.GATE]: 'Allows friendly units to pass'
    }
};

export function getBuildingDesc(buildingId) {
    return BUILDING_DESC_I18N[CURRENT_LANG]?.[buildingId] || BUILDING_DESC_I18N['en']?.[buildingId] || '';
}

// 时代名称多语言
export const AGE_I18N = {
    zh: { 1: '封建时代', 2: '城堡时代', 3: '帝王时代' },
    en: { 1: 'Feudal Age', 2: 'Castle Age', 3: 'Imperial Age' }
};

export function getAgeName(age) {
    return AGE_I18N[CURRENT_LANG]?.[age] || AGE_I18N['en']?.[age] || `Age ${age}`;
}

// 建筑类型别名映射（向后兼容层）
// 所有代码已统一使用 BUILDING_TYPES 枚举，此映射保留用于处理从 HTML data 属性、旧存档等来源的连字符格式输入
export const BUILDING_TYPE_ALIASES = {
    house: 'house',
    farm: 'farm',
    barracks: 'barracks',
    archery: 'archery_range',
    'archery-range': 'archery_range',
    archery_range: 'archery_range',
    stable: 'stable',
    blacksmith: 'blacksmith',
    market: 'market',
    church: 'church',
    tower: 'watch_tower',
    'watch-tower': 'watch_tower',
    watch_tower: 'watch_tower',
    lumber: 'lumber_camp',
    'lumber-camp': 'lumber_camp',
    lumber_camp: 'lumber_camp',
    mine: 'mining_camp',
    'mining-camp': 'mining_camp',
    mining_camp: 'mining_camp',
    castle: 'castle',
    gate: 'gate',
    'town-center': 'town_center',
    town_center: 'town_center'
};

export function normalizeBuildingType(buildingType) {
    if (!buildingType) return buildingType;

    return BUILDING_TYPE_ALIASES[buildingType] || BUILDING_TYPE_ALIASES[buildingType.replace(/-/g, '_')] || buildingType.replace(/-/g, '_');
}

// 判断 owner 是否为人类玩家
export function isHumanPlayer(owner) {
    if (!owner) return false;
    return OWNER_TO_PLAYER_ID[owner] === HUMAN_PLAYER_ID;
}

// 判断 owner 是否为敌方
export function isEnemyPlayer(owner) {
    if (!owner || owner === 'neutral') return false;
    const pid = OWNER_TO_PLAYER_ID[owner];
    return pid !== undefined && pid !== HUMAN_PLAYER_ID && pid !== 0;
}

// 获取玩家颜色的工具函数
export function getPlayerColor(owner) {
    if (!owner || owner === 'neutral') return '#888888';
    
    const playerId = OWNER_TO_PLAYER_ID[owner];
    if (playerId && PLAYER_COLORS[playerId]) {
        return PLAYER_COLORS[playerId].hex;
    }
    
    // 如果owner是 'player1', 'player2' 等格式
    const match = owner.match(/player(\d+)/i);
    if (match) {
        const id = parseInt(match[1]);
        if (PLAYER_COLORS[id]) {
            return PLAYER_COLORS[id].hex;
        }
    }
    
    return '#888888';
}

// 获取玩家显示名称
export function getPlayerName(owner) {
    if (!owner || owner === 'neutral') return '中立';
    
    const playerId = OWNER_TO_PLAYER_ID[owner];
    if (playerId && PLAYER_COLORS[playerId]) {
        return `Player${playerId} (${PLAYER_COLORS[playerId].name})`;
    }
    
    const match = owner.match(/player(\d+)/i);
    if (match) {
        const id = parseInt(match[1]);
        if (PLAYER_COLORS[id]) {
            return `Player${id} (${PLAYER_COLORS[id].name})`;
        }
    }
    
    return owner;
}

// 地图配置
export const MAP_CONFIG = {
    width: 200,              // 地图宽度（网格数）
    height: 200,             // 地图高度（网格数）
    cellSize: 1,             // 每个网格单元格的世界单位大小
};

// 游戏配置
export const GAME_CONFIG = {
    defaultResources: {
        gold: 200,
        wood: 0,
        food: 0,
        stone: 0
    }
};

// 渲染配置
export const RENDER_CONFIG = {
    antialias: true,
    pixelRatio: 2,           // 最大像素比
    shadowMap: true
};

// 相机配置
export const CAMERA_CONFIG = {
    moveSpeed: 10,
    zoomSpeed: 0.1,
    minZoom: 5,
    maxZoom: 50
};

// UI配置
export const UI_CONFIG = {
    debugPanelKey: 'F12',    // Debug面板切换键
    buildingPanelPresets: {
        default: 'default',
        military: 'military'
    }
};

// 单位配置
export const UNIT_CONFIG = {
    // 资源采集配置
    gatherInterval: 2,           // 采集间隔（秒）
    returnTime: 20,              // 返回城镇中心时间（秒）
    carryCapacity: 10,           // 携带资源容量
    
    // 战斗配置
    attackCooldown: 1,           // 攻击冷却时间（秒）
    
    // 移动配置
    defaultSpeed: 5,             // 默认移动速度
    arrivalDistance: 0.5,         // 到达目标距离阈值
    
    // 动画配置
    animationSpeed: 5,           // 动画播放速度
    deathDuration: 1.5,          // 死亡动画持续时间
    
    // 外观配置
    appearance: {
        villager: {
            bodyColor: 0x4169E1,
            bodyHeight: 1.2,
            bodyWidth: 0.4,
            headSize: 0.25,
            weaponType: 'none',
            scale: 1.0
        },
        soldier: {
            bodyColor: 0x1E90FF,
            bodyHeight: 1.4,
            bodyWidth: 0.4,
            headSize: 0.25,
            weaponType: 'sword',
            scale: 1.0
        },
        knight: {
            bodyColor: 0x00008B,
            bodyHeight: 1.6,
            bodyWidth: 0.8,
            headSize: 0.3,
            weaponType: 'lance',
            scale: 1.1
        },
        archer: {
            bodyColor: 0x228B22,
            bodyHeight: 1.3,
            bodyWidth: 0.4,
            headSize: 0.25,
            weaponType: 'bow',
            scale: 0.95
        },
        scout: {
            bodyColor: 0x8B4513,
            bodyHeight: 1.1,
            bodyWidth: 0.4,
            headSize: 0.22,
            weaponType: 'none',
            scale: 0.9
        }
    }
};

// 建筑建造/生产配置
export const BUILDING_CONSTRUCTION_CONFIG = {
    // 建造配置
    constructionSpeed: 10,       // 建造速度（每秒进度）
    requiredBuilders: 1,         // 需要建造者数量

    // 生产配置
    productionSpeed: 100,        // 生产速度（每秒进度百分比）

    // 人口配置
    housePopulationBonus: 5,     // 房屋人口加成
};

// 资源节点配置
export const RESOURCE_CONFIG = {
    // 资源量配置
    defaultWoodAmount: 150,      // 默认木材量
    defaultStoneAmount: 200,     // 默认石材量
    defaultGoldAmount: 300,      // 默认黄金量
    defaultFoodAmount: 100,      // 默认食物量
    
    // 重生配置
    respawnTime: 60,             // 重生时间（秒）
    canRespawn: true,            // 是否可以重生
};

// 导出常用配置的快捷访问
export const CELL_SIZE = MAP_CONFIG.cellSize;

export const MAP_TYPES = {
    arabia: {
        name: '阿拉伯',
        description: '开放式地图，资源分布均衡，适合各种战术',
        icon: '🏜️',
        size: { width: 200, height: 200 },
        resourceDensity: 'normal',
        terrain: 'desert'
    },
    arena: {
        name: '竞技场',
        description: '中心封闭区域，需要突破围墙展开战斗',
        icon: '🏟️',
        size: { width: 200, height: 200 },
        resourceDensity: 'high',
        terrain: 'grassland'
    },
    blackforest: {
        name: '黑森林',
        description: '茂密森林覆盖，资源隐藏其中，适合伏击战术',
        icon: '🌲',
        size: { width: 200, height: 200 },
        resourceDensity: 'high',
        terrain: 'forest'
    },
    grassland: {
        name: '草原',
        description: '开阔草原，资源分布均匀，适合骑兵战术',
        icon: '🌿',
        size: { width: 200, height: 200 },
        resourceDensity: 'normal',
        terrain: 'grassland'
    },
    islands: {
        name: '岛屿',
        description: '多岛屿地图，需要发展海军',
        icon: '🏝️',
        size: { width: 200, height: 200 },
        resourceDensity: 'low',
        terrain: 'water'
    },
    river: {
        name: '河流',
        description: '河流分割战场，战略要地争夺',
        icon: '🌊',
        size: { width: 200, height: 200 },
        resourceDensity: 'normal',
        terrain: 'river'
    },
    highland: {
        name: '高地',
        description: '地形起伏，高地具有战略优势',
        icon: '⛰️',
        size: { width: 200, height: 200 },
        resourceDensity: 'normal',
        terrain: 'highland'
    },
    goldrush: {
        name: '淘金潮',
        description: '大量金矿分布，经济战为主',
        icon: '💰',
        size: { width: 200, height: 200 },
        resourceDensity: 'gold',
        terrain: 'grassland'
    }
};

export const RESOURCE_COLORS = {
    wood: 0x228B22,
    stone: 0x808080,
    gold: 0xFFD700,
    food: 0x32CD32
};

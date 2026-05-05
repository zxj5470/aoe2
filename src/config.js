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
        gold: 0,
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

// 建筑配置
export const BUILDING_CONFIG = {
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

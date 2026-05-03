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

// 导出常用配置的快捷访问
export const CELL_SIZE = MAP_CONFIG.cellSize;

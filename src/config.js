/**
 * 全局游戏配置
 * 
 * 集中管理所有全局常量和配置参数
 */

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

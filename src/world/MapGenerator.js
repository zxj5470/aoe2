import * as THREE from 'three';

/**
 * 地图生成器 - 支持多种经典帝国时代2地图类型
 */
class MapGenerator {
    constructor() {
        this.mapTypes = {
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

        this.resourceColors = {
            wood: 0x228B22,
            stone: 0x808080,
            gold: 0xFFD700,
            food: 0x32CD32
        };
    }

    /**
     * 获取所有可用地图类型
     */
    getMapTypes() {
        return Object.keys(this.mapTypes).map(key => ({
            id: key,
            ...this.mapTypes[key]
        }));
    }

    /**
     * 获取地图类型信息
     */
    getMapTypeInfo(mapTypeId) {
        return this.mapTypes[mapTypeId] || null;
    }

    /**
     * 生成指定类型的地图数据
     * @param {string} mapTypeId - 地图类型ID
     * @param {number} width - 地图宽度（可选）
     * @param {number} height - 地图高度（可选）
     * @returns {MapData} 地图数据
     */
    generateMap(mapTypeId, width = 200, height = 200) {
        const mapType = this.mapTypes[mapTypeId];
        if (!mapType) {
            console.warn(`Unknown map type: ${mapTypeId}, using default (arabia)`);
            return this.generateArabia(width, height);
        }

        const actualWidth = mapType.size.width || width;
        const actualHeight = mapType.size.height || height;

        switch (mapTypeId) {
            case 'arabia':
                return this.generateArabia(actualWidth, actualHeight);
            case 'arena':
                return this.generateArena(actualWidth, actualHeight);
            case 'blackforest':
                return this.generateBlackForest(actualWidth, actualHeight);
            case 'grassland':
                return this.generateGrassland(actualWidth, actualHeight);
            case 'islands':
                return this.generateIslands(actualWidth, actualHeight);
            case 'river':
                return this.generateRiver(actualWidth, actualHeight);
            case 'highland':
                return this.generateHighland(actualWidth, actualHeight);
            case 'goldrush':
                return this.generateGoldRush(actualWidth, actualHeight);
            default:
                return this.generateArabia(actualWidth, actualHeight);
        }
    }

    /**
     * 生成阿拉伯地图
     * 开放式沙漠地图，资源分布均衡
     */
    generateArabia(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为沙漠
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (Math.random() < 0.3) {
                    data.terrain[x][y] = 'sand_dunes';
                } else {
                    data.terrain[x][y] = 'desert';
                }
            }
        }

        // 添加绿洲区域
        const oasisCount = 4;
        for (let i = 0; i < oasisCount; i++) {
            const cx = Math.floor(width * (0.2 + i * 0.2));
            const cy = Math.floor(height * (0.3 + (i % 2) * 0.4));
            this.addOasis(data, cx, cy, 15);
        }

        // 生成资源
        this.generateStandardResources(data, width, height, 'normal');

        // 添加玩家起始位置（4个角落）
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成竞技场地图
     * 中心封闭区域，外围资源丰富
     */
    generateArena(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为草地
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                data.terrain[x][y] = 'grassland';
            }
        }

        // 创建中心封闭区域（竞技场）
        const centerX = width / 2;
        const centerY = height / 2;
        const arenaRadius = Math.min(width, height) * 0.15;
        
        // 中心区域
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (dist < arenaRadius) {
                    data.terrain[x][y] = 'arena_center';
                } else if (dist < arenaRadius + 5) {
                    // 围墙区域
                    data.terrain[x][y] = 'wall';
                    data.walkable[x][y] = false;
                }
            }
        }

        // 在外围生成丰富资源
        this.generateStandardResources(data, width, height, 'high');

        // 添加玩家起始位置（外围）
        this.addPlayerStartingPositions(data, width, height, 4, true);

        return data;
    }

    /**
     * 生成黑森林地图
     * 茂密森林覆盖
     */
    generateBlackForest(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为森林
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (Math.random() < 0.7) {
                    data.terrain[x][y] = 'forest';
                } else {
                    data.terrain[x][y] = 'grassland';
                }
            }
        }

        // 清理一些区域作为空地
        const clearAreas = [
            { x: width * 0.2, y: height * 0.2, size: 15 },
            { x: width * 0.8, y: height * 0.2, size: 15 },
            { x: width * 0.2, y: height * 0.8, size: 15 },
            { x: width * 0.8, y: height * 0.8, size: 15 },
            { x: width * 0.5, y: height * 0.5, size: 20 }
        ];

        for (const area of clearAreas) {
            this.clearArea(data, Math.floor(area.x), Math.floor(area.y), area.size);
        }

        // 在空地中放置资源
        this.generateStandardResources(data, width, height, 'high');

        // 添加玩家起始位置
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成草原地图
     * 开阔草原，资源分布均匀
     */
    generateGrassland(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为草地
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (Math.random() < 0.1) {
                    data.terrain[x][y] = 'flower_field';
                } else {
                    data.terrain[x][y] = 'grassland';
                }
            }
        }

        // 生成均匀分布的资源
        this.generateStandardResources(data, width, height, 'normal');

        // 添加玩家起始位置
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成岛屿地图
     */
    generateIslands(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为水域
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                data.terrain[x][y] = 'water';
                data.walkable[x][y] = false;
            }
        }

        // 创建岛屿
        const islands = [
            { x: width * 0.2, y: height * 0.2, size: 25 },
            { x: width * 0.8, y: height * 0.2, size: 25 },
            { x: width * 0.2, y: height * 0.8, size: 25 },
            { x: width * 0.8, y: height * 0.8, size: 25 },
            { x: width * 0.5, y: height * 0.5, size: 30 }
        ];

        for (const island of islands) {
            this.createIsland(data, Math.floor(island.x), Math.floor(island.y), island.size);
        }

        // 在岛屿上生成资源
        this.generateStandardResources(data, width, height, 'low');

        // 添加玩家起始位置（每个岛屿一个）
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成河流地图
     */
    generateRiver(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为草地
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                data.terrain[x][y] = 'grassland';
            }
        }

        // 创建河流（蜿蜒穿过地图）
        this.createRiver(data, width, height);

        // 生成资源（河流两侧）
        this.generateStandardResources(data, width, height, 'normal');

        // 添加玩家起始位置
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成高地地图
     */
    generateHighland(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 使用Perlin噪声生成起伏地形
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const noise = this.noise2D(x * 0.05, y * 0.05);
                if (noise > 0.5) {
                    data.terrain[x][y] = 'hill';
                    data.heightData[x][y] = noise * 2;
                } else if (noise > 0.3) {
                    data.terrain[x][y] = 'upland';
                    data.heightData[x][y] = noise;
                } else {
                    data.terrain[x][y] = 'grassland';
                    data.heightData[x][y] = 0;
                }
            }
        }

        // 生成资源
        this.generateStandardResources(data, width, height, 'normal');

        // 添加玩家起始位置
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 生成淘金潮地图
     * 大量金矿分布
     */
    generateGoldRush(width, height) {
        const data = this.createEmptyMap(width, height);
        
        // 设置地形为草地
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                data.terrain[x][y] = 'grassland';
            }
        }

        // 生成大量金矿资源
        this.generateGoldRushResources(data, width, height);

        // 添加玩家起始位置
        this.addPlayerStartingPositions(data, width, height, 4);

        return data;
    }

    /**
     * 创建空地图数据
     */
    createEmptyMap(width, height) {
        const data = {
            width,
            height,
            terrain: [],
            heightData: [],
            walkable: [],
            resources: [],
            startingPositions: []
        };

        for (let x = 0; x < width; x++) {
            data.terrain[x] = [];
            data.heightData[x] = [];
            data.walkable[x] = [];
            for (let y = 0; y < height; y++) {
                data.terrain[x][y] = 'grassland';
                data.heightData[x][y] = 0;
                data.walkable[x][y] = true;
            }
        }

        return data;
    }

    /**
     * 添加绿洲区域
     */
    addOasis(data, cx, cy, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < data.width && y >= 0 && y < data.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < radius) {
                        if (dist < radius * 0.3) {
                            data.terrain[x][y] = 'water';
                            data.walkable[x][y] = false;
                        } else {
                            data.terrain[x][y] = 'oasis';
                        }
                    }
                }
            }
        }
    }

    /**
     * 清理区域
     */
    clearArea(data, cx, cy, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < data.width && y >= 0 && y < data.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < radius) {
                        data.terrain[x][y] = 'grassland';
                        data.walkable[x][y] = true;
                    }
                }
            }
        }
    }

    /**
     * 创建岛屿
     */
    createIsland(data, cx, cy, radius) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                if (x >= 0 && x < data.width && y >= 0 && y < data.height) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < radius) {
                        if (dist < radius * 0.8) {
                            data.terrain[x][y] = 'grassland';
                            data.walkable[x][y] = true;
                        } else {
                            data.terrain[x][y] = 'beach';
                            data.walkable[x][y] = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * 创建河流
     */
    createRiver(data, width, height) {
        // 河流从西北流向东南
        const startX = Math.floor(width * 0.1);
        const endX = Math.floor(width * 0.9);
        const startY = Math.floor(height * 0.1);
        const endY = Math.floor(height * 0.9);

        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const x = Math.floor(startX + (endX - startX) * t + Math.sin(t * Math.PI * 3) * 15);
            const y = Math.floor(startY + (endY - startY) * t + Math.cos(t * Math.PI * 2) * 10);

            // 绘制河流宽度
            for (let dx = -3; dx <= 3; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < data.width && ny >= 0 && ny < data.height) {
                        data.terrain[nx][ny] = 'river';
                        data.walkable[nx][ny] = false;
                    }
                }
            }
        }

        // 添加浅滩（可通过）
        for (let i = 0; i < 3; i++) {
            const t = 0.3 + i * 0.2;
            const x = Math.floor(startX + (endX - startX) * t);
            const y = Math.floor(startY + (endY - startY) * t);

            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                if (nx >= 0 && nx < data.width) {
                    data.terrain[nx][y] = 'shallow_water';
                    data.walkable[nx][y] = true;
                }
            }
        }
    }

    /**
     * 生成标准资源分布
     */
    generateStandardResources(data, width, height, density) {
        const counts = {
            low: { wood: 15, stone: 8, gold: 5, food: 10 },
            normal: { wood: 30, stone: 15, gold: 10, food: 20 },
            high: { wood: 50, stone: 25, gold: 15, food: 30 },
            gold: { wood: 20, stone: 10, gold: 30, food: 15 }
        };

        const count = counts[density] || counts.normal;

        // 生成木材（树木）
        this.generateResourceClusters(data, 'wood', count.wood, width, height);

        // 生成石材（岩石）
        this.generateResourceClusters(data, 'stone', count.stone, width, height);

        // 生成黄金（金矿）
        this.generateResourceClusters(data, 'gold', count.gold, width, height);

        // 生成食物（浆果丛）
        this.generateResourceClusters(data, 'food', count.food, width, height);
    }

    /**
     * 生成淘金潮资源分布
     */
    generateGoldRushResources(data, width, height) {
        // 大量金矿
        this.generateResourceClusters(data, 'gold', 40, width, height);
        
        // 少量其他资源
        this.generateResourceClusters(data, 'wood', 15, width, height);
        this.generateResourceClusters(data, 'stone', 10, width, height);
        this.generateResourceClusters(data, 'food', 15, width, height);
    }

    /**
     * 生成资源簇
     */
    generateResourceClusters(data, type, count, width, height) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (width - 10)) + 5;
            const y = Math.floor(Math.random() * (height - 10)) + 5;
            
            if (data.walkable[x][y]) {
                data.resources.push({
                    type,
                    x,
                    y,
                    amount: this.getResourceAmount(type)
                });
            }
        }
    }

    /**
     * 获取资源数量
     */
    getResourceAmount(type) {
        const amounts = {
            wood: 100 + Math.floor(Math.random() * 100),
            stone: 150 + Math.floor(Math.random() * 100),
            gold: 200 + Math.floor(Math.random() * 150),
            food: 80 + Math.floor(Math.random() * 60)
        };
        return amounts[type] || 100;
    }

    /**
     * 添加玩家起始位置
     */
    addPlayerStartingPositions(data, width, height, count, offset = false) {
        const positions = [];
        const margin = offset ? 30 : 20;

        for (let i = 0; i < count; i++) {
            let x, y;
            switch (i) {
                case 0: // 左上角
                    x = margin;
                    y = margin;
                    break;
                case 1: // 右上角
                    x = width - margin;
                    y = margin;
                    break;
                case 2: // 左下角
                    x = margin;
                    y = height - margin;
                    break;
                case 3: // 右下角
                    x = width - margin;
                    y = height - margin;
                    break;
                default:
                    x = Math.floor(width / 2);
                    y = Math.floor(height / 2);
            }

            // 确保起始位置可通行
            if (data.walkable[x] && data.walkable[x][y]) {
                positions.push({ x, y, playerId: i });
            }
        }

        data.startingPositions = positions;
    }

    /**
     * 简单的2D噪声函数
     */
    noise2D(x, y) {
        // 简单的伪随机噪声
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    /**
     * 将地图数据转换为Three.js场景对象
     */
    createMapMesh(mapData) {
        const group = new THREE.Group();
        
        // 创建地形平面
        const geometry = new THREE.PlaneGeometry(mapData.width, mapData.height, mapData.width - 1, mapData.height - 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a9c50,
            roughness: 0.8
        });
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        group.add(terrain);

        // 应用高度数据
        if (mapData.heightData) {
            const positions = geometry.attributes.position;
            for (let x = 0; x < mapData.width; x++) {
                for (let y = 0; y < mapData.height; y++) {
                    const index = y * mapData.width + x;
                    positions.setZ(index, mapData.heightData[x][y] || 0);
                }
            }
            positions.needsUpdate = true;
            geometry.computeVertexNormals();
        }

        return group;
    }

    /**
     * 获取地形颜色
     */
    getTerrainColor(terrainType) {
        const colors = {
            grassland: 0x4a9c50,
            desert: 0xd2691e,
            sand_dunes: 0xf4a460,
            forest: 0x228b22,
            water: 0x1e90ff,
            river: 0x4169e1,
            shallow_water: 0x87ceeb,
            beach: 0xf5deb3,
            hill: 0x6b8e23,
            upland: 0x8fbc8f,
            oasis: 0x32cd32,
            arena_center: 0x556b2f,
            wall: 0x8b7355,
            flower_field: 0x90ee90
        };
        return colors[terrainType] || 0x4a9c50;
    }
}

export default MapGenerator;

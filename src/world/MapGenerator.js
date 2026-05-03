import { MAP_TYPES, RESOURCE_COLORS } from './MapConfig.js';
import { TerrainMeshBuilder } from './TerrainMeshBuilder.js';
import { generateArabia } from './generators/ArabiaGenerator.js';
import { generateArena } from './generators/ArenaGenerator.js';
import { generateBlackForest } from './generators/BlackForestGenerator.js';
import { generateGrassland } from './generators/GrasslandGenerator.js';
import { generateIslands } from './generators/IslandsGenerator.js';
import { generateRiver } from './generators/RiverGenerator.js';
import { generateHighland } from './generators/HighlandGenerator.js';
import { generateGoldRush } from './generators/GoldRushGenerator.js';

class MapGenerator {
    constructor() {
        this.mapTypes = MAP_TYPES;
        this.resourceColors = RESOURCE_COLORS;
    }

    getMapTypes() {
        return Object.keys(this.mapTypes).map(key => ({
            id: key,
            ...this.mapTypes[key]
        }));
    }

    getMapTypeInfo(mapTypeId) {
        return this.mapTypes[mapTypeId] || null;
    }

    generateMap(mapTypeId, width = 200, height = 200) {
        const mapType = this.mapTypes[mapTypeId];
        if (!mapType) {
            console.warn(`Unknown map type: ${mapTypeId}, using default (arabia)`);
            return generateArabia(this, width, height);
        }

        const actualWidth = mapType.size.width || width;
        const actualHeight = mapType.size.height || height;

        const generators = {
            arabia: generateArabia,
            arena: generateArena,
            blackforest: generateBlackForest,
            grassland: generateGrassland,
            islands: generateIslands,
            river: generateRiver,
            highland: generateHighland,
            goldrush: generateGoldRush
        };

        const generator = generators[mapTypeId];
        return generator ? generator(this, actualWidth, actualHeight) : generateArabia(this, actualWidth, actualHeight);
    }

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

    createRiver(data, width, height) {
        const startX = Math.floor(width * 0.1);
        const endX = Math.floor(width * 0.9);
        const startY = Math.floor(height * 0.1);
        const endY = Math.floor(height * 0.9);

        for (let i = 0; i <= 100; i++) {
            const t = i / 100;
            const x = Math.floor(startX + (endX - startX) * t + Math.sin(t * Math.PI * 3) * 15);
            const y = Math.floor(startY + (endY - startY) * t + Math.cos(t * Math.PI * 2) * 10);

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

    generateStandardResources(data, width, height, density) {
        const counts = {
            low: { wood: 15, stone: 8, gold: 5, food: 10 },
            normal: { wood: 30, stone: 15, gold: 10, food: 20 },
            high: { wood: 50, stone: 25, gold: 15, food: 30 },
            gold: { wood: 20, stone: 10, gold: 30, food: 15 }
        };

        const count = counts[density] || counts.normal;

        this.generateResourceClusters(data, 'wood', count.wood, width, height);
        this.generateResourceClusters(data, 'stone', count.stone, width, height);
        this.generateResourceClusters(data, 'gold', count.gold, width, height);
        this.generateResourceClusters(data, 'food', count.food, width, height);
    }

    generateDefaultGoldClusters(data, centerX, centerY, maxDistance = 20, clusterCount = 8) {
        const clusters = [];
        const clusterSize = 3;

        for (let i = 0; i < clusterCount; i++) {
            let attempts = 0;
            let placed = false;

            while (attempts < 50 && !placed) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 5 + Math.random() * (maxDistance - 5);
                const gx = Math.floor(centerX + Math.cos(angle) * distance);
                const gy = Math.floor(centerY + Math.sin(angle) * distance);

                if (gx < clusterSize || gx >= data.width - clusterSize ||
                    gy < clusterSize || gy >= data.height - clusterSize) {
                    attempts++;
                    continue;
                }

                let canPlace = true;
                for (let dx = 0; dx < clusterSize; dx++) {
                    for (let dy = 0; dy < clusterSize; dy++) {
                        if (!data.walkable[gx + dx] || !data.walkable[gx + dx][gy + dy]) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }

                if (canPlace) {
                    for (let dx = 0; dx < clusterSize; dx++) {
                        for (let dy = 0; dy < clusterSize; dy++) {
                            data.resources.push({
                                type: 'gold',
                                x: gx + dx,
                                y: gy + dy,
                                amount: 200 + Math.floor(Math.random() * 100)
                            });
                        }
                    }
                    clusters.push({ x: gx, y: gy });
                    placed = true;
                }

                attempts++;
            }
        }

        return clusters;
    }

    getDefaultTownCenterPosition(data) {
        return {
            x: Math.floor(data.width / 2),
            y: Math.floor(data.height / 2)
        };
    }

    generateGoldRushResources(data, width, height) {
        this.generateResourceClusters(data, 'gold', 40, width, height);
        this.generateResourceClusters(data, 'wood', 15, width, height);
        this.generateResourceClusters(data, 'stone', 10, width, height);
        this.generateResourceClusters(data, 'food', 15, width, height);
    }

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

    getResourceAmount(type) {
        const amounts = {
            wood: 100 + Math.floor(Math.random() * 100),
            stone: 150 + Math.floor(Math.random() * 100),
            gold: 200 + Math.floor(Math.random() * 150),
            food: 80 + Math.floor(Math.random() * 60)
        };
        return amounts[type] || 100;
    }

    addPlayerStartingPositions(data, width, height, count, offset = false) {
        const positions = [];
        const margin = offset ? 30 : 20;

        for (let i = 0; i < count; i++) {
            let x, y;
            switch (i) {
                case 0:
                    x = margin;
                    y = margin;
                    break;
                case 1:
                    x = width - margin;
                    y = margin;
                    break;
                case 2:
                    x = margin;
                    y = height - margin;
                    break;
                case 3:
                    x = width - margin;
                    y = height - margin;
                    break;
                default:
                    x = Math.floor(width / 2);
                    y = Math.floor(height / 2);
            }

            if (data.walkable[x] && data.walkable[x][y]) {
                positions.push({ x, y, playerId: i });
            }
        }

        data.startingPositions = positions;
    }

    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }

    createMapMesh(mapData) {
        return TerrainMeshBuilder.createMapMesh(mapData);
    }

    getTerrainColor(terrainType) {
        return TerrainMeshBuilder.getTerrainColor(terrainType);
    }
}

export default MapGenerator;

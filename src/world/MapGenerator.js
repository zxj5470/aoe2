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

    generateRandomHeight(data, roughness = 0.8, maxHeight = 2.0) {
        const { width, height } = data;
        const size = Math.max(width, height);
        const gridSize = this.nextPowerOfTwo(size) + 1;

        const grid = new Array(gridSize);
        for (let i = 0; i < gridSize; i++) {
            grid[i] = new Array(gridSize).fill(0);
        }

        grid[0][0] = Math.random();
        grid[0][gridSize - 1] = Math.random();
        grid[gridSize - 1][0] = Math.random();
        grid[gridSize - 1][gridSize - 1] = Math.random();

        let step = gridSize - 1;
        let scale = 0.5;

        while (step > 1) {
            const half = Math.floor(step / 2);

            for (let x = 0; x < gridSize - 1; x += step) {
                for (let y = 0; y < gridSize - 1; y += step) {
                    const avg = (grid[x][y] + grid[x + step][y] + grid[x][y + step] + grid[x + step][y + step]) / 4;
                    grid[x + half][y + half] = avg + (Math.random() - 0.5) * scale;
                }
            }

            for (let x = 0; x < gridSize; x += half) {
                for (let y = (x + half) % step; y < gridSize; y += step) {
                    let sum = 0;
                    let count = 0;
                    if (x - half >= 0) { sum += grid[x - half][y]; count++; }
                    if (x + half < gridSize) { sum += grid[x + half][y]; count++; }
                    if (y - half >= 0) { sum += grid[x][y - half]; count++; }
                    if (y + half < gridSize) { sum += grid[x][y + half]; count++; }
                    grid[x][y] = sum / count + (Math.random() - 0.5) * scale;
                }
            }

            step = half;
            scale *= roughness;
        }

        let minVal = Infinity;
        let maxVal = -Infinity;
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                if (grid[x][y] < minVal) minVal = grid[x][y];
                if (grid[x][y] > maxVal) maxVal = grid[x][y];
            }
        }

        const range = maxVal - minVal || 1;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const normalized = (grid[x][y] - minVal) / range;
                data.heightData[x][y] = normalized * maxHeight;
            }
        }

        if (data.townCenters) {
            const flatRadius = 12;
            for (const tc of data.townCenters) {
                for (let dx = -flatRadius; dx <= flatRadius; dx++) {
                    for (let dy = -flatRadius; dy <= flatRadius; dy++) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= flatRadius) {
                            const gx = Math.floor(tc.x + dx);
                            const gy = Math.floor(tc.y + dy);
                            if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
                                data.heightData[gx][gy] = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    nextPowerOfTwo(n) {
        let v = 1;
        while (v < n) v <<= 1;
        return v;
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
            low: { wood: 25, stone: 8, gold: 5, food: 10 },
            normal: { wood: 180, stone: 15, gold: 10, food: 20 },
            high: { wood: 300, stone: 25, gold: 15, food: 30 },
            gold: { wood: 40, stone: 10, gold: 30, food: 15 }
        };

        const count = counts[density] || counts.normal;

        this.generateForestClusters(data, 'wood', count.wood, width, height);
        this.generateWildResourceClusters(data, 'gold', count.gold, width, height);
        this.generateWildResourceClusters(data, 'stone', count.stone, width, height);
        this.generateWildResourceClusters(data, 'food', count.food, width, height);
    }

    generateWildResourceClusters(data, type, count, width, height) {
        const clusterCount = count;
        for (let i = 0; i < clusterCount; i++) {
            const clusterSize = 2 + Math.floor(Math.random() * 3);
            this.generateWildCluster(data, type, clusterSize, width, height);
        }
    }

    generateWildCluster(data, type, size, width, height) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * (width - 10)) + 5;
            const y = Math.floor(Math.random() * (height - 10)) + 5;

            const shape = this.generateWildShape(size);
            const cells = this.tryPlaceWildCluster(data, x, y, shape);

            if (cells) {
                for (const { x: cx, y: cy } of cells) {
                    data.resources.push({
                        type,
                        x: cx,
                        y: cy,
                        amount: this.getResourceAmount(type)
                    });
                }
                return true;
            }
            attempts++;
        }
        return false;
    }

    generateWildShape(size) {
        if (size === 2) {
            return Math.random() < 0.5 ? [[0,0],[1,0]] : [[0,0],[0,1]];
        }
        if (size === 3) {
            const shapes = [
                [[0,0],[1,0],[2,0]],
                [[0,0],[0,1],[0,2]],
                [[0,0],[1,0],[0,1]],
                [[0,0],[1,0],[1,1]],
            ];
            return shapes[Math.floor(Math.random() * shapes.length)];
        }
        const shapes = [
            [[0,0],[1,0],[2,0],[3,0]],
            [[0,0],[1,0],[0,1],[1,1]],
            [[0,0],[1,0],[2,0],[0,1]],
            [[0,0],[1,0],[0,1],[1,1]],
        ];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }

    tryPlaceWildCluster(data, startX, startY, shape) {
        const margin = 2;
        const cells = [];
        for (const [dx, dy] of shape) {
            const x = startX + dx;
            const y = startY + dy;
            if (x < margin || x >= data.width - margin ||
                y < margin || y >= data.height - margin) {
                return null;
            }
            if (!data.walkable[x] || !data.walkable[x][y]) {
                return null;
            }
            if (data.resources && data.resources.some(r => r.x === x && r.y === y)) {
                return null;
            }
            cells.push({ x, y });
        }
        return cells;
    }

    generateForestClusters(data, type, count, width, height) {
        const townCenters = data.townCenters || [];
        const tcPositions = townCenters.length > 0
            ? townCenters.map(tc => ({ x: tc.x, y: tc.y }))
            : [{ x: Math.floor(width / 2), y: Math.floor(height / 2) }];

        const clusterSize = 24;
        const clusterCount = Math.max(10, Math.floor(count / clusterSize));

        for (let i = 0; i < clusterCount; i++) {
            const tc = tcPositions[Math.floor(Math.random() * tcPositions.length)];
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 30;
            const startX = Math.floor(tc.x + Math.cos(angle) * distance);
            const startY = Math.floor(tc.y + Math.sin(angle) * distance);

            const forestShape = this.generateForestShape(clusterSize);
            const cells = this.tryPlaceForest(data, startX, startY, forestShape);

            if (cells) {
                for (const { x, y } of cells) {
                    data.resources.push({
                        type,
                        x,
                        y,
                        amount: this.getResourceAmount(type)
                    });
                }
            }
        }
    }

    generateForestShape(size) {
        const cells = [];
        const radius = Math.ceil(Math.sqrt(size / Math.PI));
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx * dx + dy * dy <= radius * radius + 1) {
                    cells.push([dx, dy]);
                }
            }
        }
        return cells.slice(0, size);
    }

    tryPlaceForest(data, startX, startY, shape) {
        const margin = 2;
        const cells = [];
        for (const [dx, dy] of shape) {
            const x = startX + dx;
            const y = startY + dy;
            if (x < margin || x >= data.width - margin ||
                y < margin || y >= data.height - margin) {
                return null;
            }
            if (!data.walkable[x] || !data.walkable[x][y]) {
                return null;
            }
            if (data.resources && data.resources.some(r => r.x === x && r.y === y)) {
                return null;
            }
            cells.push({ x, y });
        }
        return cells;
    }

    generateDefaultGoldClusters(data, centerX, centerY, maxDistance = 20, clusterCount = 8) {
        this.generateDefaultResourcesAroundTC(data, centerX, centerY, maxDistance);
        return [];
    }

    generateDefaultResourcesAroundTC(data, centerX, centerY, maxDistance = 20) {
        const goldCluster1 = this.generateResourceCluster(data, centerX, centerY, maxDistance, 'gold', 8);
        const goldCluster2 = this.generateResourceCluster(data, centerX, centerY, maxDistance, 'gold', 6);
        const stoneCluster1 = this.generateResourceCluster(data, centerX, centerY, maxDistance, 'stone', 6);
        const stoneCluster2 = this.generateResourceCluster(data, centerX, centerY, maxDistance, 'stone', 3);
        const foodCluster = this.generateResourceCluster(data, centerX, centerY, maxDistance, 'food', 8);

        return {
            gold: [goldCluster1, goldCluster2],
            stone: [stoneCluster1, stoneCluster2],
            food: [foodCluster]
        };
    }

    generateResourceCluster(data, centerX, centerY, maxDistance, type, cellCount) {
        let attempts = 0;
        while (attempts < 100) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * (maxDistance - 5);
            const startX = Math.floor(centerX + Math.cos(angle) * distance);
            const startY = Math.floor(centerY + Math.sin(angle) * distance);

            const shape = this.generateClusterShape(cellCount);
            const cells = this.tryPlaceShape(data, startX, startY, shape);

            if (cells) {
                for (const { x, y } of cells) {
                    data.resources.push({
                        type,
                        x,
                        y,
                        amount: this.getResourceAmount(type)
                    });
                }
                return cells;
            }

            attempts++;
        }
        return [];
    }

    generateClusterShape(cellCount) {
        const shapes = {
            8: [
                [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],
                [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2]],
                [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]],
            ],
            6: [
                [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],
                [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]],
            ],
            3: [
                [[0,0],[1,0],[0,1]],
                [[0,0],[1,0],[1,1]],
                [[0,0],[0,1],[1,1]],
                [[1,0],[0,1],[1,1]],
            ]
        };

        const options = shapes[cellCount];
        if (!options) {
            return [[0, 0]];
        }
        return options[Math.floor(Math.random() * options.length)];
    }

    tryPlaceShape(data, startX, startY, shape) {
        const margin = 2;
        for (const [dx, dy] of shape) {
            const x = startX + dx;
            const y = startY + dy;
            if (x < margin || x >= data.width - margin ||
                y < margin || y >= data.height - margin) {
                return null;
            }
            if (!data.walkable[x] || !data.walkable[x][y]) {
                return null;
            }
            if (data.resources && data.resources.some(r => r.x === x && r.y === y)) {
                return null;
            }
        }

        return shape.map(([dx, dy]) => ({ x: startX + dx, y: startY + dy }));
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
            let attempts = 0;
            let placed = false;
            while (attempts < 20 && !placed) {
                const x = Math.floor(Math.random() * (width - 10)) + 5;
                const y = Math.floor(Math.random() * (height - 10)) + 5;

                if (data.walkable[x][y] && !data.resources.some(r => r.x === x && r.y === y)) {
                    data.resources.push({
                        type,
                        x,
                        y,
                        amount: this.getResourceAmount(type)
                    });
                    placed = true;
                }
                attempts++;
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

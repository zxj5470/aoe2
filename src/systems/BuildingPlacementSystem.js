import * as THREE from 'three';
import Building from '../entities/Building.js';
import { CELL_SIZE, HUMAN_OWNER, normalizeBuildingType } from '../config.js';

class BuildingPlacementSystem {
    constructor(map, scene) {
        this.map = map;
        this.scene = scene;
        this.grid = map.getGrid();
        
        this.isPlacing = false;
        this.currentBuildingType = null;
        this.previewMesh = null;
        this.isValidPosition = true;
        this.requiredResources = {};
        
        this.buildingTypes = {
            house: {
                name: 'House',
                width: 2,
                depth: 2,
                height: 2,
                cost: { wood: 50 },
                health: 500,
                description: 'Provides population space'
            },
            farm: {
                name: 'Farm',
                width: 3,
                depth: 3,
                height: 0.5,
                cost: { wood: 60 },
                health: 200,
                description: 'Produces food'
            },
            lumber_camp: {
                name: 'Lumber Camp',
                width: 2,
                depth: 2,
                height: 1.5,
                cost: { wood: 100 },
                health: 300,
                description: 'Stores wood'
            },
            mining_camp: {
                name: 'Mining Camp',
                width: 2,
                depth: 2,
                height: 1.5,
                cost: { wood: 100 },
                health: 300,
                description: 'Stores stone and gold'
            },
            barracks: {
                name: 'Barracks',
                width: 3,
                depth: 3,
                height: 3,
                cost: { wood: 150 },
                health: 800,
                description: 'Trains military units'
            },
            archery_range: {
                name: 'Archery Range',
                width: 3,
                depth: 3,
                height: 2.5,
                cost: { wood: 175 },
                health: 700,
                description: 'Trains archers'
            },
            stable: {
                name: 'Stable',
                width: 3,
                depth: 3,
                height: 2.5,
                cost: { wood: 175 },
                health: 700,
                description: 'Trains cavalry'
            },
            blacksmith: {
                name: 'Blacksmith',
                width: 3,
                depth: 3,
                height: 2.5,
                cost: { wood: 175 },
                health: 600,
                description: 'Upgrades unit equipment'
            },
            market: {
                name: 'Market',
                width: 3,
                depth: 3,
                height: 2.5,
                cost: { wood: 175 },
                health: 600,
                description: 'Trade and resource exchange'
            },
            watch_tower: {
                name: 'Watch Tower',
                width: 2,
                depth: 2,
                height: 4,
                cost: { stone: 100 },
                health: 1000,
                description: 'Defensive structure'
            },
            castle: {
                name: 'Castle',
                width: 5,
                depth: 5,
                height: 6,
                cost: { stone: 600, gold: 300 },
                health: 3000,
                description: 'Powerful defensive structure'
            }
        };
    }

    startPlacement(buildingType, resourceManager) {
        const normalizedType = normalizeBuildingType(buildingType);
        const buildingConfig = this.buildingTypes[normalizedType];
        
        if (!buildingConfig) {
            console.warn(`Unknown building type: ${buildingType}`);
            return false;
        }
        
        this.currentBuildingType = normalizedType;
        this.requiredResources = buildingConfig.cost;
        
        // 检查资源是否足够
        if (!resourceManager.hasEnoughResources(this.requiredResources)) {
            console.warn('Not enough resources to build this building');
            return false;
        }
        
        this.isPlacing = true;
        this.createPreviewMesh(buildingConfig);
        
        return true;
    }

    createPreviewMesh(config) {
        // 创建预览网格
        const group = new THREE.Group();
        
        // 基础
        const baseGeometry = new THREE.BoxGeometry(config.width, 0.2, config.depth);
        const baseMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        group.add(base);
        
        // 墙壁轮廓
        const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(
            config.width, config.height, config.depth
        ));
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.y = config.height / 2 + 0.2;
        group.add(edges);
        
        this.previewMesh = group;
        this.previewMesh.visible = false;
        
        this.scene.getScene().add(this.previewMesh);
    }

    updatePreview(mousePosition) {
        if (!this.isPlacing || !this.previewMesh) return;

        this.previewMesh.visible = true;

        // 对齐到网格（与 Grid.getCellAtPosition() 一致的偏移转换）
        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        const worldX = cellX * CELL_SIZE + CELL_SIZE / 2 - gridHalf;
        const worldZ = cellZ * CELL_SIZE + CELL_SIZE / 2 - gridHalf;
        
        this.previewMesh.position.set(worldX, 0, worldZ);
        
        // 检查位置是否有效
        this.isValidPosition = this.checkPlacementValidity(cellX, cellZ);
        
        // 更新预览颜色
        const color = this.isValidPosition ? 0x00FF00 : 0xFF0000;
        this.previewMesh.children.forEach(child => {
            if (child.material) {
                child.material.color.setHex(color);
            }
        });
    }

    checkPlacementValidity(cellX, cellZ) {
        const config = this.buildingTypes[this.currentBuildingType];
        
        // 检查所有需要的格子
        for (let dx = 0; dx < config.width; dx++) {
            for (let dz = 0; dz < config.depth; dz++) {
                const cell = this.grid.getCell(cellX + dx, cellZ + dz);
                
                if (!cell) {
                    return false; // 超出地图边界
                }
                
                if (!cell.walkable) {
                    return false; // 地形不可建造
                }
                
                if (cell.occupied) {
                    return false; // 已被占用
                }
            }
        }
        
        return true;
    }

    placeBuilding(mousePosition, resourceManager) {
        if (!this.isPlacing || !this.isValidPosition) {
            return null;
        }
        
        const config = this.buildingTypes[this.currentBuildingType];
        
        // 扣除资源
        resourceManager.spendResources(this.requiredResources);

        // 对齐到网格（与 Grid.getCellAtPosition() 一致的偏移转换）
        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        const worldX = cellX * CELL_SIZE + CELL_SIZE / 2 - gridHalf;
        const worldZ = cellZ * CELL_SIZE + CELL_SIZE / 2 - gridHalf;
        
        // 创建建筑
        const building = this.createBuilding(config, worldX, worldZ);
        
        // 占用格子
        for (let dx = 0; dx < config.width; dx++) {
            for (let dz = 0; dz < config.depth; dz++) {
                this.grid.setOccupied(cellX + dx, cellZ + dz, true, building);
            }
        }
        
        // 移除预览
        this.cancelPlacement();
        
        return building;
    }

    createBuilding(config, x, z) {
        const building = new Building({
            name: config.name,
            buildingType: this.currentBuildingType,
            x: x,
            y: 0,
            z: z,
            width: config.width,
            depth: config.depth,
            height: config.height,
            health: config.health,
            maxHealth: config.health,
            owner: HUMAN_OWNER,
            isUnderConstruction: true,
            constructionProgress: 0
        });

        building.createMesh();
        return building;
    }

    togglePlacement(buildingType) {
        const normalizedType = normalizeBuildingType(buildingType);

        if (this.isPlacing && this.currentBuildingType === normalizedType) {
            this.cancelPlacement();
            return;
        }

        this.cancelPlacement();

        if (this.buildingTypes[normalizedType]) {
            this.currentBuildingType = normalizedType;
            const config = this.buildingTypes[normalizedType];
            this.requiredResources = config.cost;
            this.isPlacing = true;
            this.createPreviewMesh(config);
        } else {
            console.warn(`Unknown building type: ${buildingType}`);
        }
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.currentBuildingType = null;
        this.requiredResources = {};
        
        if (this.previewMesh) {
            this.scene.getScene().remove(this.previewMesh);
            this.previewMesh = null;
        }
    }

    getBuildingTypes() {
        return Object.keys(this.buildingTypes);
    }

    getBuildingConfig(buildingType) {
        return this.buildingTypes[normalizeBuildingType(buildingType)] || null;
    }

    getBuildingCost(buildingType) {
        const config = this.getBuildingConfig(buildingType);
        return config ? config.cost : null;
    }

    canAfford(buildingType, resourceManager) {
        const cost = this.getBuildingCost(buildingType);
        return cost && resourceManager.hasEnoughResources(cost);
    }
}

export default BuildingPlacementSystem;

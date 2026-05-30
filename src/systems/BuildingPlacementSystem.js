import * as THREE from 'three';
import Building from '../entities/Building.js';
import { CELL_SIZE, HUMAN_OWNER, isHumanPlayer, normalizeBuildingType, BUILDING_TYPES, BUILDING_CONFIG } from '../config.js';

class BuildingPlacementSystem {
    constructor(map, scene, game = null) {
        this.map = map;
        this.scene = scene;
        this.game = game;
        this.grid = map.getGrid();

        this.isPlacing = false;
        this.currentBuildingType = null;
        this.previewMesh = null;
        this.isValidPosition = true;
        this.requiredResources = {};

        // 引用统一配置
        this.buildingTypes = BUILDING_CONFIG;

        // 墙壁拖拽建造状态
        this.isWallDragging = false;
        this.wallStartCell = null;
        this.wallPreviewMeshes = [];
        this.wallValidPositions = [];

        // 建筑旋转状态（用于城门等可旋转建筑，0=默认朝向, 90=旋转90度）
        this.currentRotation = 0;
    }

    // 获取建筑放置尺寸（考虑旋转）
    getPlacementDimensions(buildingType) {
        const config = this.buildingTypes[buildingType];
        if (!config) return null;

        const width = config.width;
        const depth = config.depth;

        // 可旋转建筑：根据当前旋转状态交换宽深
        if (config.rotatable && this.currentRotation === 90) {
            return { width: depth, depth: width, height: config.height };
        }

        return { width, depth, height: config.height };
    }

    // 旋转当前放置的建筑（仅可旋转建筑）
    rotatePlacement() {
        if (!this.isPlacing) return false;

        const config = this.buildingTypes[this.currentBuildingType];
        if (!config || !config.rotatable) return false;

        this.currentRotation = this.currentRotation === 0 ? 90 : 0;

        // 重建预览网格以反映新尺寸
        this.rebuildPreviewMesh(config);

        console.log(`[BuildingPlacement] ${this.currentBuildingType} 旋转至 ${this.currentRotation}°`);
        return true;
    }

    // 重建预览网格
    rebuildPreviewMesh(config) {
        if (this.previewMesh) {
            this.scene.getScene().remove(this.previewMesh);
            this.previewMesh = null;
        }
        if (this.currentBuildingType === 'wall') {
            this.createWallPreviewMesh();
            if (this.previewMesh) {
                this.previewMesh.visible = false;
            }
        } else {
            const dims = this.getPlacementDimensions(this.currentBuildingType);
            this.createPreviewMesh({ ...config, width: dims.width, depth: dims.depth, height: dims.height });
        }
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
        if (!this.isPlacing) return;

        // 墙壁使用专用预览逻辑
        if (this.currentBuildingType === 'wall') {
            this.updateWallPreview(mousePosition);
            return;
        }

        if (!this.previewMesh) return;

        this.previewMesh.visible = true;

        const dims = this.getPlacementDimensions(this.currentBuildingType);
        const config = this.buildingTypes[this.currentBuildingType];

        // 对齐到网格（与 Grid.getCellAtPosition() 一致的偏移转换）
        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        // 建筑中心位置 = 角落格子坐标 + 建筑尺寸的一半
        const worldX = cellX * CELL_SIZE + (dims.width * CELL_SIZE) / 2 - gridHalf;
        const worldZ = cellZ * CELL_SIZE + (dims.depth * CELL_SIZE) / 2 - gridHalf;

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
        const dims = this.getPlacementDimensions(this.currentBuildingType);

        // 检查所有需要的格子
        for (let dx = 0; dx < dims.width; dx++) {
            for (let dz = 0; dz < dims.depth; dz++) {
                const cell = this.grid.getCell(cellX + dx, cellZ + dz);

                if (!cell) {
                    return false; // 超出地图边界
                }

                if (!cell.walkable) {
                    return false; // 地形不可建造
                }

                if (cell.occupied) {
                    // 城门特殊规则：允许覆盖在己方城墙上
                    if (this.currentBuildingType === 'gate' &&
                        cell.entity &&
                        cell.entity.type === 'building' &&
                        cell.entity.buildingType === 'wall' &&
                        isHumanPlayer(cell.entity.owner)) {
                        continue; // 城墙可以被城门覆盖
                    }
                    return false; // 已被其他实体占用
                }
            }
        }

        return true;
    }

    placeBuilding(mousePosition, resourceManager) {
        if (!this.isPlacing) return null;

        // 墙壁使用拖拽建造
        if (this.currentBuildingType === 'wall') {
            if (!this.isWallDragging) {
                // 开始拖拽
                this.startWallDrag(mousePosition);
                return null;
            } else {
                // 完成拖拽
                return this.finishWallDrag(resourceManager);
            }
        }

        if (!this.isValidPosition) return null;

        const config = this.buildingTypes[this.currentBuildingType];
        const dims = this.getPlacementDimensions(this.currentBuildingType);

        // 扣除资源
        resourceManager.spendResources(this.requiredResources);

        // 对齐到网格（与 Grid.getCellAtPosition() 一致的偏移转换）
        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        // 建筑中心位置 = 角落格子坐标 + 建筑尺寸的一半
        const worldX = cellX * CELL_SIZE + (dims.width * CELL_SIZE) / 2 - gridHalf;
        const worldZ = cellZ * CELL_SIZE + (dims.depth * CELL_SIZE) / 2 - gridHalf;

        // 城门特殊处理：移除覆盖的城墙
        if (this.currentBuildingType === 'gate') {
            this.removeWallsInFootprint(cellX, cellZ, dims);
        }

        // 创建建筑
        const building = this.createBuilding({
            ...config,
            width: dims.width,
            depth: dims.depth,
            height: dims.height
        }, worldX, worldZ);

        // 占用格子
        for (let dx = 0; dx < dims.width; dx++) {
            for (let dz = 0; dz < dims.depth; dz++) {
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
            gridSizeX: config.width,
            gridSizeZ: config.depth,
            health: config.health,
            maxHealth: config.health,
            owner: HUMAN_OWNER,
            isUnderConstruction: true,
            constructionProgress: 0,
            placementRotation: this.currentRotation
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
            const config = this.buildingTypes[normalizedType];

            // 检查资源是否足够
            if (this.game.resourceManager && !this.game.resourceManager.hasEnoughResources(config.cost)) {
                console.warn(`[BuildingPlacement] 资源不足，无法建造 ${normalizedType}`);
                if (this.game.hud) {
                    this.game.hud.showNotification('资源不足', 2000);
                }
                return;
            }

            this.currentBuildingType = normalizedType;
            this.requiredResources = config.cost;
            this.isPlacing = true;

            // 墙壁使用拖拽模式
            if (normalizedType === 'wall') {
                this.createWallPreviewMesh();
            } else {
                this.createPreviewMesh(config);
            }
        } else {
            console.warn(`Unknown building type: ${buildingType}`);
        }
    }

    // 墙壁预览网格（带地基）
    createWallPreviewMesh() {
        const group = new THREE.Group();

        // 地基（底部平面）
        const baseGeometry = new THREE.BoxGeometry(CELL_SIZE, 0.15, CELL_SIZE);
        const baseMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.075;
        group.add(base);

        // 墙壁轮廓
        const wallGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.8, 1.2, CELL_SIZE * 0.8);
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.3
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = 0.75;
        group.add(wall);

        // 边框
        const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL_SIZE, 1.5, CELL_SIZE));
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.y = 0.75;
        group.add(edges);

        this.previewMesh = group;
        this.previewMesh.visible = false;
        this.scene.getScene().add(this.previewMesh);
    }

    // 更新墙壁预览（拖拽模式）
    updateWallPreview(mousePosition) {
        if (!this.isPlacing || this.currentBuildingType !== 'wall') return;

        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        if (this.isWallDragging && this.wallStartCell) {
            // 拖拽中：显示从起点到当前点的所有墙壁预览
            this.updateWallDragPreview(cellX, cellZ);
        } else {
            // 未拖拽：显示单个预览
            if (this.previewMesh) {
                this.previewMesh.visible = true;
                const worldX = (cellX + 0.5) * CELL_SIZE - gridHalf;
                const worldZ = (cellZ + 0.5) * CELL_SIZE - gridHalf;
                this.previewMesh.position.set(worldX, 0, worldZ);

                const isValid = this.checkCellValid(cellX, cellZ);
                const color = isValid ? 0x00FF00 : 0xFF0000;
                this.previewMesh.traverse(child => {
                    if (child.material) {
                        child.material.color.setHex(color);
                    }
                });
            }
        }
    }

    // 开始墙壁拖拽
    startWallDrag(mousePosition) {
        if (!this.isPlacing || this.currentBuildingType !== 'wall') return;

        const gridHalf = this.grid.width / 2;
        const cellX = Math.floor(mousePosition.x / CELL_SIZE + gridHalf);
        const cellZ = Math.floor(mousePosition.z / CELL_SIZE + gridHalf);

        this.isWallDragging = true;
        this.wallStartCell = { x: cellX, z: cellZ };
    }

    // 更新墙壁拖拽预览
    updateWallDragPreview(endCellX, endCellZ) {
        // 清除旧的预览
        this.clearWallPreviewMeshes();

        if (!this.wallStartCell) return;

        // 计算墙壁路径（Bresenham 直线算法）
        const cells = this.getLineCells(this.wallStartCell.x, this.wallStartCell.z, endCellX, endCellZ);

        const gridHalf = this.grid.width / 2;
        this.wallValidPositions = [];

        cells.forEach(cell => {
            const isValid = this.checkCellValid(cell.x, cell.z);
            this.wallValidPositions.push({ ...cell, valid: isValid });

            const color = isValid ? 0x00FF00 : 0xFF0000;
            const group = new THREE.Group();

            // 地基
            const baseGeometry = new THREE.BoxGeometry(CELL_SIZE, 0.15, CELL_SIZE);
            const baseMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4
            });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 0.075;
            group.add(base);

            // 墙壁轮廓
            const wallGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.8, 1.2, CELL_SIZE * 0.8);
            const wallMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.y = 0.75;
            group.add(wall);

            // 边框
            const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(CELL_SIZE, 1.5, CELL_SIZE));
            const edgesMaterial = new THREE.LineBasicMaterial({ color: color });
            const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
            edges.position.y = 0.75;
            group.add(edges);

            const worldX = (cell.x + 0.5) * CELL_SIZE - gridHalf;
            const worldZ = (cell.z + 0.5) * CELL_SIZE - gridHalf;
            group.position.set(worldX, 0, worldZ);
            this.scene.getScene().add(group);
            this.wallPreviewMeshes.push(group);
        });

        // 隐藏单个预览
        if (this.previewMesh) {
            this.previewMesh.visible = false;
        }
    }

    // Bresenham 直线算法
    getLineCells(x0, z0, x1, z1) {
        const cells = [];
        const dx = Math.abs(x1 - x0);
        const dz = Math.abs(z1 - z0);
        const sx = x0 < x1 ? 1 : -1;
        const sz = z0 < z1 ? 1 : -1;
        let err = dx - dz;

        let x = x0;
        let z = z0;

        while (true) {
            cells.push({ x, z });
            if (x === x1 && z === z1) break;

            const e2 = 2 * err;
            if (e2 > -dz) {
                err -= dz;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                z += sz;
            }
        }

        return cells;
    }

    // 检查单个格子是否可建造
    checkCellValid(cellX, cellZ) {
        const cell = this.grid.getCell(cellX, cellZ);
        if (!cell) return false;
        if (!cell.walkable) return false;
        if (cell.occupied) return false;
        return true;
    }

    // 移除城门覆盖范围内的城墙
    removeWallsInFootprint(cellX, cellZ, dims) {
        const wallsToRemove = new Set();

        // 收集所有在城门占地范围内的城墙
        for (let dx = 0; dx < dims.width; dx++) {
            for (let dz = 0; dz < dims.depth; dz++) {
                const cell = this.grid.getCell(cellX + dx, cellZ + dz);
                if (cell && cell.occupied && cell.entity) {
                    const entity = cell.entity;
                    if (entity.type === 'building' &&
                        entity.buildingType === 'wall' &&
                        isHumanPlayer(entity.owner)) {
                        wallsToRemove.add(entity);
                    }
                }
            }
        }

        // 移除收集到的城墙
        for (const wall of wallsToRemove) {
            // 清除城墙占用的所有格子
            const wallCells = wall.getOccupiedGridCells
                ? wall.getOccupiedGridCells(this.grid.cellSize)
                : [];
            for (const wc of wallCells) {
                const cell = this.grid.getCell(wc.x, wc.z);
                if (cell && cell.entity === wall) {
                    this.grid.setOccupied(wc.x, wc.z, false, null);
                }
            }

            // 标记城墙待移除（由 EntityManager 在 update 循环中清理）
            wall._markedForRemoval = true;
            console.log(`[BuildingPlacement] 城门覆盖城墙: ${wall.name}`);
        }

        return [...wallsToRemove];
    }

    // 完成墙壁拖拽建造
    finishWallDrag(resourceManager) {
        if (!this.isWallDragging || this.wallValidPositions.length === 0) {
            this.cancelWallDrag();
            return [];
        }

        const validCells = this.wallValidPositions.filter(p => p.valid);
        const wallConfig = this.buildingTypes['wall'];

        // 检查资源是否足够
        const totalCost = {};
        for (const [key, value] of Object.entries(wallConfig.cost)) {
            totalCost[key] = value * validCells.length;
        }

        if (!resourceManager.hasEnoughResources(totalCost)) {
            console.warn('Not enough resources for wall');
            this.cancelWallDrag();
            return [];
        }

        // 扣除资源
        resourceManager.spendResources(totalCost);

        // 创建墙壁
        const gridHalf = this.grid.width / 2;
        const buildings = [];

        validCells.forEach(cell => {
            const worldX = (cell.x + 0.5) * CELL_SIZE - gridHalf;
            const worldZ = (cell.z + 0.5) * CELL_SIZE - gridHalf;

            const building = this.createBuilding(wallConfig, worldX, worldZ);
            this.grid.setOccupied(cell.x, cell.z, true, building);
            buildings.push(building);
        });

        this.cancelWallDrag();
        return buildings;
    }

    // 取消墙壁拖拽
    cancelWallDrag() {
        this.isWallDragging = false;
        this.wallStartCell = null;
        this.wallValidPositions = [];
        this.clearWallPreviewMeshes();
    }

    // 清除墙壁预览网格
    clearWallPreviewMeshes() {
        this.wallPreviewMeshes.forEach(mesh => {
            this.scene.getScene().remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.wallPreviewMeshes = [];
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.currentBuildingType = null;
        this.requiredResources = {};
        this.currentRotation = 0;

        // 取消墙壁拖拽
        if (this.isWallDragging) {
            this.cancelWallDrag();
        }

        if (this.previewMesh) {
            this.scene.getScene().remove(this.previewMesh);
            if (this.previewMesh.geometry) this.previewMesh.geometry.dispose();
            if (this.previewMesh.material) this.previewMesh.material.dispose();
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

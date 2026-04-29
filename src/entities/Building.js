import * as THREE from 'three';
import Entity from './Entity.js';
import { CELL_SIZE, MAP_CONFIG } from '../config.js';

class Building extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Building',
            type: 'building',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 200,
            maxHealth: config.maxHealth || 200,
            owner: config.owner || 'player'
        });

        this.buildingType = config.buildingType || 'house';
        this.width = config.width || 2;
        this.depth = config.depth || 2;
        this.height = config.height || 2;
        this.isUnderConstruction = config.isUnderConstruction || false;
        this.constructionProgress = config.constructionProgress || 0;
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;

        this.selectionRing = null;
        this.healthBar = null;
        this.healthBarGroup = null;

        // 网格大小属性（以网格单位计）
        this.gridSizeX = config.gridSizeX || this.getDefaultGridSizeX();
        this.gridSizeZ = config.gridSizeZ || this.getDefaultGridSizeZ();

        // 碰撞体积
        this.collisionBox = null;

        // 根据建筑类型设置外观配置
        this.appearanceConfig = this.getAppearanceConfig();
        this.buildingFeatures = this.getBuildingFeatures();

        // 如果外观配置已定义，更新尺寸
        if (this.appearanceConfig) {
            this.width = this.appearanceConfig.width || this.width;
            this.depth = this.appearanceConfig.depth || this.depth;
            this.height = this.appearanceConfig.height || this.height;
        }
    }

    /**
     * 获取建筑类型的默认网格大小X
     */
    getDefaultGridSizeX() {
        const gridSizes = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 3,
            blacksmith: 3,
            watch_tower: 2,
            town_center: 4
        };
        return gridSizes[this.buildingType] || 2;
    }

    /**
     * 获取建筑类型的默认网格大小Z
     */
    getDefaultGridSizeZ() {
        const gridSizes = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 4,
            blacksmith: 3,
            watch_tower: 2,
            town_center: 4
        };
        return gridSizes[this.buildingType] || 2;
    }

    /**
     * 创建碰撞体积
     */
    createCollisionBox() {
        // 碰撞体积使用网格大小计算（网格现在是1x1）
        const width = this.gridSizeX * 1; // 每个网格单元是1x1
        const depth = this.gridSizeZ * 1;
        const height = this.height;

        this.collisionBox = {
            minX: this.position.x - width / 2,
            maxX: this.position.x + width / 2,
            minZ: this.position.z - depth / 2,
            maxZ: this.position.z + depth / 2,
            minY: 0,
            maxY: height,
            width: width,
            depth: depth,
            height: height,
            center: this.position.clone()
        };

        return this.collisionBox;
    }

    /**
     * 更新碰撞体积位置
     */
    updateCollisionBox() {
        if (this.collisionBox) {
            const width = this.collisionBox.width;
            const depth = this.collisionBox.depth;
            
            this.collisionBox.minX = this.position.x - width / 2;
            this.collisionBox.maxX = this.position.x + width / 2;
            this.collisionBox.minZ = this.position.z - depth / 2;
            this.collisionBox.maxZ = this.position.z + depth / 2;
            this.collisionBox.center.copy(this.position);
        }
    }

    /**
     * 获取碰撞体积
     */
    getCollisionBox() {
        if (!this.collisionBox) {
            this.createCollisionBox();
        }
        return this.collisionBox;
    }

    /**
     * 检测点是否在碰撞体积内
     */
    containsPoint(point) {
        const box = this.getCollisionBox();
        return (
            point.x >= box.minX &&
            point.x <= box.maxX &&
            point.z >= box.minZ &&
            point.z <= box.maxZ
        );
    }

    /**
     * 检测是否与另一个碰撞体积相交
     */
    intersectsBox(otherBox) {
        const box = this.getCollisionBox();
        return (
            box.minX < otherBox.maxX &&
            box.maxX > otherBox.minX &&
            box.minZ < otherBox.maxZ &&
            box.maxZ > otherBox.minZ
        );
    }

    /**
     * 获取建筑占用的网格坐标列表
     */
    getOccupiedGridCells(cellSize = CELL_SIZE) {
        const cells = [];

        // 建筑中心的世界坐标
        const worldX = this.position.x;
        const worldZ = this.position.z;

        // 计算网格偏移（地图中心在原点，网格从 -width/2 开始）
        const halfMapWidth = MAP_CONFIG.width / 2;
        const halfMapHeight = MAP_CONFIG.height / 2;

        // 计算建筑中心在网格中的索引
        const centerGridX = Math.floor((worldX + halfMapWidth) / cellSize);
        const centerGridZ = Math.floor((worldZ + halfMapHeight) / cellSize);

        // 计算建筑占用的网格范围
        const halfGridX = Math.ceil(this.gridSizeX / 2);
        const halfGridZ = Math.ceil(this.gridSizeZ / 2);

        for (let x = centerGridX - halfGridX; x < centerGridX + halfGridX; x++) {
            for (let z = centerGridZ - halfGridZ; z < centerGridZ + halfGridZ; z++) {
                // 确保网格坐标在有效范围内
                if (x >= 0 && x < MAP_CONFIG.width && z >= 0 && z < MAP_CONFIG.height) {
                    cells.push({ x, z });
                }
            }
        }

        return cells;
    }

    /**
     * 创建碰撞体积可视化（调试用）
     */
    createCollisionVisual(color = 0xFF0000) {
        if (!this.collisionBox) {
            this.createCollisionBox();
        }

        const box = this.collisionBox;
        const width = box.width;
        const depth = box.depth;
        const height = box.maxY - box.minY;

        // 创建线框盒子
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: 2,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(edges, material);
        
        wireframe.position.set(
            box.center.x,
            height / 2,
            box.center.z
        );
        
        wireframe.name = 'collisionVisual';
        this.collisionVisual = wireframe;
        
        return wireframe;
    }

    /**
     * 更新碰撞体积可视化位置
     */
    updateCollisionVisual() {
        if (this.collisionVisual) {
            this.updateCollisionBox();
            const box = this.collisionBox;
            const height = box.maxY - box.minY;
            
            this.collisionVisual.position.set(
                box.center.x,
                height / 2,
                box.center.z
            );
        }
    }

    /**
     * 显示/隐藏碰撞体积可视化
     */
    toggleCollisionVisual(visible) {
        if (this.collisionVisual) {
            this.collisionVisual.visible = visible;
            
            // 如果可视化不存在但需要显示，则创建
            if (visible && !this.collisionVisual.parent && this.mesh) {
                this.mesh.add(this.collisionVisual);
            }
        } else if (visible) {
            const visual = this.createCollisionVisual();
            if (this.mesh) {
                this.mesh.add(visual);
            }
        }
    }
    
    /**
     * 根据建筑类型获取外观配置
     */
    getAppearanceConfig() {
        const configs = {
            house: {
                width: 2,
                depth: 2,
                height: 2,
                wallColor: 0x4169E1,
                roofColor: 0x8B0000,
                roofType: 'pyramid',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'chimney'
            },
            barracks: {
                width: 3,
                depth: 2.5,
                height: 2.5,
                wallColor: 0x1E90FF,
                roofColor: 0x8B0000,
                roofType: 'gable',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'flag'
            },
            stable: {
                width: 3,
                depth: 3,
                height: 2.2,
                wallColor: 0x228B22,
                roofColor: 0x8B4513,
                roofType: 'flat',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'stall'
            },
            archery_range: {
                width: 2.5,
                depth: 2.5,
                height: 2,
                wallColor: 0x32CD32,
                roofColor: 0x8B4513,
                roofType: 'pyramid',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'target'
            },
            castle: {
                width: 5,
                depth: 5,
                height: 4,
                wallColor: 0x00008B,
                roofColor: 0x8B0000,
                roofType: 'multiple',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x696969,
                decoration: 'towers'
            },
            market: {
                width: 3,
                depth: 2.5,
                height: 2,
                wallColor: 0xDAA520,
                roofColor: 0x8B4513,
                roofType: 'dome',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'stall'
            },
            church: {
                width: 3,
                depth: 4,
                height: 3.5,
                wallColor: 0xFFFAF0,
                roofColor: 0x4B0082,
                roofType: 'spire',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'cross'
            },
            blacksmith: {
                width: 2.5,
                depth: 2.5,
                height: 2,
                wallColor: 0x708090,
                roofColor: 0x8B0000,
                roofType: 'gable',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'anvil'
            },
            watch_tower: {
                width: 1.5,
                depth: 1.5,
                height: 3,
                wallColor: 0x4682B4,
                roofColor: 0x8B0000,
                roofType: 'pyramid',
                hasDoor: false,
                hasWindows: true,
                baseColor: 0x696969,
                decoration: 'battlements'
            },
            town_center: {
                width: 4,
                depth: 4,
                height: 4,
                wallColor: 0xF5DEB3,
                roofColor: 0x8B4513,
                roofType: 'gable',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'flag'
            }
        };

        return configs[this.buildingType] || configs.house;
    }
    
    /**
     * 获取建筑特性
     */
    getBuildingFeatures() {
        const features = {
            house: { populationBonus: 5, isResidential: true },
            barracks: { canTrainUnits: ['soldier', 'knight'], isMilitary: true },
            stable: { canTrainUnits: ['scout'], isMilitary: true },
            archery_range: { canTrainUnits: ['archer'], isMilitary: true },
            castle: { canTrainUnits: ['elite'], isMilitary: true, isDefensive: true },
            market: { canTrade: true, isEconomic: true },
            church: { canHeal: true, isSpecial: true },
            blacksmith: { canUpgrade: true, isEconomic: true },
            watch_tower: { canAttack: true, isDefensive: true, attackRange: 6 },
            town_center: { canCreateVillagers: true, isEconomic: true, isDropOff: true }
        };

        return features[this.buildingType] || {};
    }

    createMesh() {
        const config = this.appearanceConfig;
        const group = new THREE.Group();
        
        // 根据配置调整尺寸
        this.width = config.width;
        this.depth = config.depth;
        this.height = config.height;
        
        // 创建地基
        this.createBase(group, config);
        
        // 创建墙壁
        this.createWalls(group, config);
        
        // 创建屋顶
        this.createRoof(group, config);
        
        // 创建门窗
        if (config.hasDoor) {
            this.createDoor(group, config);
        }
        if (config.hasWindows) {
            this.createWindows(group, config);
        }
        
        // 创建装饰
        this.createDecorations(group, config);
        
        // 应用建造进度缩放
        if (this.isUnderConstruction) {
            group.scale.y = this.constructionProgress / 100;
        }
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        
        // 设置userData，让选择系统能够识别实体
        this.mesh.userData = {
            type: 'building',
            buildingType: this.buildingType,
            entity: this,
            owner: this.owner
        };
        
        // 创建选择环
        this.createSelectionRing();
        
        // 创建生命值条
        this.createHealthBar();
        
        return this.mesh;
    }
    
    /**
     * 创建建筑地基
     */
    createBase(group, config) {
        const baseGeometry = new THREE.BoxGeometry(this.width + 0.2, 0.2, this.depth + 0.2);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: config.baseColor,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = 'base';
        group.add(base);
    }
    
    /**
     * 创建墙壁
     */
    createWalls(group, config) {
        const playerColor = this.owner === 'player' ? config.wallColor : 0xDC143C;
        
        const wallGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: playerColor,
            roughness: 0.7,
            metalness: 0.1
        });
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = this.height / 2 + 0.2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        walls.name = 'walls';
        group.add(walls);
    }
    
    /**
     * 创建屋顶（根据类型）
     */
    createRoof(group, config) {
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: config.roofColor,
            roughness: 0.8
        });
        
        switch (config.roofType) {
            case 'pyramid':
                // 金字塔屋顶
                const pyramidGeometry = new THREE.ConeGeometry(
                    Math.max(this.width, this.depth) * 0.7,
                    this.height * 0.5,
                    4
                );
                const pyramid = new THREE.Mesh(pyramidGeometry, roofMaterial);
                pyramid.position.y = this.height + 0.2;
                pyramid.rotation.y = Math.PI / 4;
                pyramid.castShadow = true;
                pyramid.name = 'roof';
                group.add(pyramid);
                break;
                
            case 'gable':
                // 双坡屋顶
                const gableGeometry = new THREE.CylinderGeometry(
                    0.1,
                    Math.max(this.width, this.depth) * 0.6,
                    this.height * 0.6,
                    4
                );
                const gable = new THREE.Mesh(gableGeometry, roofMaterial);
                gable.position.y = this.height + 0.3;
                gable.rotation.x = Math.PI / 2;
                gable.rotation.z = Math.PI / 4;
                gable.castShadow = true;
                gable.name = 'roof';
                group.add(gable);
                break;
                
            case 'flat':
                // 平顶
                const flatGeometry = new THREE.BoxGeometry(
                    this.width + 0.3,
                    0.15,
                    this.depth + 0.3
                );
                const flat = new THREE.Mesh(flatGeometry, roofMaterial);
                flat.position.y = this.height + 0.3;
                flat.castShadow = true;
                flat.name = 'roof';
                group.add(flat);
                break;
                
            case 'dome':
                // 圆顶
                const domeGeometry = new THREE.SphereGeometry(
                    Math.max(this.width, this.depth) * 0.4,
                    16,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2
                );
                const dome = new THREE.Mesh(domeGeometry, roofMaterial);
                dome.position.y = this.height + 0.2;
                dome.castShadow = true;
                dome.name = 'roof';
                group.add(dome);
                break;
                
            case 'spire':
                // 尖塔屋顶
                const spireGeometry = new THREE.ConeGeometry(
                    Math.max(this.width, this.depth) * 0.5,
                    this.height * 0.8,
                    8
                );
                const spire = new THREE.Mesh(spireGeometry, roofMaterial);
                spire.position.y = this.height + 0.4;
                spire.castShadow = true;
                spire.name = 'roof';
                group.add(spire);
                break;
                
            case 'multiple':
                // 多塔屋顶（城堡）
                const mainRoofGeometry = new THREE.BoxGeometry(
                    this.width - 0.5,
                    0.2,
                    this.depth - 0.5
                );
                const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
                mainRoof.position.y = this.height + 0.3;
                mainRoof.castShadow = true;
                mainRoof.name = 'mainRoof';
                group.add(mainRoof);
                
                // 四个角落的塔
                const towerPositions = [
                    { x: -(this.width - 0.5) / 2, z: -(this.depth - 0.5) / 2 },
                    { x: (this.width - 0.5) / 2, z: -(this.depth - 0.5) / 2 },
                    { x: -(this.width - 0.5) / 2, z: (this.depth - 0.5) / 2 },
                    { x: (this.width - 0.5) / 2, z: (this.depth - 0.5) / 2 }
                ];
                
                towerPositions.forEach(pos => {
                    const towerGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
                    const tower = new THREE.Mesh(towerGeometry, roofMaterial);
                    tower.position.set(pos.x, this.height + 0.7, pos.z);
                    tower.rotation.y = Math.PI / 4;
                    tower.castShadow = true;
                    tower.name = 'towerRoof';
                    group.add(tower);
                });
                break;
        }
    }
    
    /**
     * 创建门
     */
    createDoor(group, config) {
        const doorGeometry = new THREE.BoxGeometry(0.6, this.height * 0.5, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, this.height * 0.25 + 0.2, this.depth / 2 + 0.05);
        door.name = 'door';
        group.add(door);
        
        // 门框
        const frameGeometry = new THREE.BoxGeometry(0.8, this.height * 0.55, 0.12);
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, this.height * 0.25 + 0.2, this.depth / 2 + 0.06);
        frame.name = 'doorFrame';
        group.add(frame);
    }
    
    /**
     * 创建窗户
     */
    createWindows(group, config) {
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        
        // 前面窗户
        const frontWindowGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.05);
        const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
        frontWindow.position.set(0, this.height * 0.6, this.depth / 2 + 0.05);
        frontWindow.name = 'frontWindow';
        group.add(frontWindow);
        
        // 侧面窗户
        if (this.width > 2) {
            const sideWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
            sideWindow.position.set(this.width / 2 + 0.05, this.height * 0.6, 0);
            sideWindow.name = 'sideWindow';
            group.add(sideWindow);
        }
    }
    
    /**
     * 创建装饰
     */
    createDecorations(group, config) {
        switch (config.decoration) {
            case 'chimney':
                // 烟囱
                const chimneyGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
                const chimneyMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
                chimney.position.set(this.width * 0.2, this.height + 0.6, this.depth * 0.2);
                chimney.name = 'chimney';
                group.add(chimney);
                break;
                
            case 'flag':
                // 旗帜
                const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
                const poleMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.set(this.width * 0.4, this.height + 1.2, this.depth * 0.4);
                pole.name = 'flagPole';
                group.add(pole);
                
                const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
                const flagMaterial = new THREE.MeshStandardMaterial({ 
                    color: this.owner === 'player' ? 0x4169E1 : 0xDC143C,
                    side: THREE.DoubleSide
                });
                const flag = new THREE.Mesh(flagGeometry, flagMaterial);
                flag.position.set(this.width * 0.4, this.height + 1.8, this.depth * 0.4);
                flag.name = 'flag';
                group.add(flag);
                break;
                
            case 'stall':
                // 货摊支架
                const stallGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
                const stallMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                for (let i = -1; i <= 1; i += 2) {
                    const stall = new THREE.Mesh(stallGeometry, stallMaterial);
                    stall.position.set(i * this.width * 0.3, this.height * 0.5, this.depth / 2 + 0.3);
                    stall.name = 'stall';
                    group.add(stall);
                }
                break;
                
            case 'battlements':
                // 垛口（防御建筑）
                const battlementHeight = 0.2;
                const battlementGeometry = new THREE.BoxGeometry(0.2, battlementHeight, 0.2);
                const battlementMaterial = new THREE.MeshStandardMaterial({ 
                    color: config.wallColor,
                    roughness: 0.7
                });
                
                const positions = [
                    { x: -this.width / 2 + 0.2, z: -this.depth / 2 + 0.2 },
                    { x: 0, z: -this.depth / 2 + 0.2 },
                    { x: this.width / 2 - 0.2, z: -this.depth / 2 + 0.2 },
                    { x: -this.width / 2 + 0.2, z: this.depth / 2 - 0.2 },
                    { x: 0, z: this.depth / 2 - 0.2 },
                    { x: this.width / 2 - 0.2, z: this.depth / 2 - 0.2 }
                ];
                
                positions.forEach(pos => {
                    const battlement = new THREE.Mesh(battlementGeometry, battlementMaterial);
                    battlement.position.set(pos.x, this.height + 0.2, pos.z);
                    battlement.name = 'battlement';
                    group.add(battlement);
                });
                break;
        }
    }

    createSelectionRing() {
        // 创建对齐网格的白色边框
        const gridSize = CELL_SIZE;

        // 计算建筑物的实际占用范围（对齐到网格）
        const buildingCenterX = this.position.x;
        const buildingCenterZ = this.position.z;

        // 将建筑物位置对齐到网格中心
        const gridX = Math.floor(buildingCenterX / gridSize) * gridSize + gridSize / 2;
        const gridZ = Math.floor(buildingCenterZ / gridSize) * gridSize + gridSize / 2;

        // 计算占用的网格数量
        const gridWidth = Math.ceil(this.width / gridSize) * gridSize;
        const gridDepth = Math.ceil(this.depth / gridSize) * gridSize;
        
        // 计算边框的实际范围
        const halfWidth = gridWidth / 2;
        const halfDepth = gridDepth / 2;
        
        // 创建白色边框（使用BoxGeometry作为线框）
        const boxGeometry = new THREE.BoxGeometry(gridWidth, 0.1, gridDepth);
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        this.selectionRing = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.selectionRing.position.set(0, 0.05, 0);
        this.selectionRing.visible = false;
        this.selectionRing.name = 'selectionRing';
        this.mesh.add(this.selectionRing);
        
        // 删除旧的selectionGlow（不再需要）
        if (this.selectionGlow) {
            this.selectionGlow.geometry.dispose();
            this.selectionGlow.material.dispose();
            this.mesh.remove(this.selectionGlow);
            this.selectionGlow = null;
        }
    }
    
    /**
     * 创建生命值条
     */
    createHealthBar() {
        const config = this.appearanceConfig;
        
        // 创建生命值条容器
        const healthBarGroup = new THREE.Group();
        healthBarGroup.position.y = this.height + 1.2;
        healthBarGroup.name = 'healthBarGroup';
        
        // 背景
        const bgGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.5, 0.25);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        background.position.z = 0.01;
        background.name = 'healthBarBackground';
        healthBarGroup.add(background);
        
        // 生命值填充
        const healthGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.5, 0.2);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.02;
        this.healthBar.name = 'healthBar';
        healthBarGroup.add(this.healthBar);
        
        // 边框
        const borderGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.55, 0.27);
        const borderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.z = 0.005;
        border.name = 'healthBarBorder';
        healthBarGroup.add(border);
        
        this.mesh.add(healthBarGroup);
        this.healthBarGroup = healthBarGroup;
        
        // 初始更新生命值条
        this.updateHealthBar();
    }
    
    /**
     * 更新生命值条显示
     */
    updateHealthBar() {
        if (!this.healthBar) return;
        
        const healthPercentage = this.getHealthPercentage();
        
        // 更新生命值条宽度
        this.healthBar.scale.x = healthPercentage;
        
        // 根据生命值改变颜色
        if (healthPercentage > 0.6) {
            this.healthBar.material.color.setHex(0x00FF00); // 绿色
        } else if (healthPercentage > 0.3) {
            this.healthBar.material.color.setHex(0xFFFF00); // 黄色
        } else {
            this.healthBar.material.color.setHex(0xFF0000); // 红色
        }
        
        // 调整生命值条位置使其左对齐
        const originalWidth = this.healthBar.geometry.parameters.width;
        const newWidth = originalWidth * healthPercentage;
        this.healthBar.position.x = -(originalWidth - newWidth) / 2;
        
        // 默认隐藏生命值条，只有受伤时显示
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = healthPercentage < 1.0;
        }
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateConstruction(deltaTime);
        this.updateProduction(deltaTime);
        
        // 更新选择环动画
        if (this.isSelected) {
            this.updateSelectionVisual(deltaTime);
        }
    }

    updateConstruction(deltaTime) {
        if (this.isUnderConstruction && this.constructionProgress < 100) {
            this.constructionProgress += deltaTime * 10; // 建造速度
            
            if (this.constructionProgress >= 100) {
                this.constructionProgress = 100;
                this.isUnderConstruction = false;
                this.onConstructionComplete();
            }
            
            // 建造动画：建筑从地面升起
            if (this.mesh) {
                const progress = this.constructionProgress / 100;
                
                // 垂直升起动画
                const baseY = progress * 0.5;
                const base = this.mesh.getObjectByName('base');
                if (base) {
                    base.position.y = 0.1 + (1 - progress) * 0.5;
                }
                
                // 墙壁逐渐显现
                const walls = this.mesh.getObjectByName('walls');
                if (walls) {
                    walls.position.y = (this.height / 2 + 0.2) * progress;
                    walls.scale.y = progress;
                }
                
                // 屋顶逐渐出现
                const roof = this.mesh.getObjectByName('roof');
                if (roof) {
                    roof.position.y = (this.height + 0.2) * progress;
                    roof.scale.setScalar(progress);
                }
                
                // 添加建造进度颜色变化
                this.mesh.children.forEach(child => {
                    if (child.material) {
                        const originalColor = new THREE.Color(this.appearanceConfig.wallColor);
                        const progressColor = originalColor.clone().lerp(
                            new THREE.Color(0x8B4513),
                            1 - progress
                        );
                        if (child.name === 'walls' || child.name === 'base') {
                            child.material.color = progressColor;
                        }
                    }
                });
                
                // 更新生命值条显示建造进度
                if (this.healthBar) {
                    this.healthBarGroup.visible = true;
                    this.healthBar.scale.x = progress;
                    this.healthBar.material.color.setHex(0x00FF00);
                }
            }
        }
    }

    updateProduction(deltaTime) {
        if (this.currentProduction) {
            this.productionProgress += deltaTime * (100 / this.currentProduction.time);
            
            if (this.productionProgress >= 100) {
                this.productionProgress = 0;
                this.onProductionComplete(this.currentProduction);
                this.currentProduction = null;
                
                // 开始下一个生产任务
                if (this.productionQueue.length > 0) {
                    this.currentProduction = this.productionQueue.shift();
                }
            }
        }
    }

    onConstructionComplete() {
        // 建造完成时的回调
        this.health = this.maxHealth;
    }

    onProductionComplete(productionItem) {
        // 生产完成时的回调
        if (productionItem.onComplete) {
            productionItem.onComplete();
        }
    }

    addToProductionQueue(item) {
        this.productionQueue.push(item);
        
        if (!this.currentProduction) {
            this.currentProduction = this.productionQueue.shift();
        }
    }

    cancelProduction() {
        if (this.currentProduction) {
            this.currentProduction = null;
            this.productionProgress = 0;
        }
    }

    getConstructionProgress() {
        return this.constructionProgress;
    }

    getProductionProgress() {
        return this.productionProgress;
    }

    getProductionQueue() {
        return this.productionQueue;
    }

    getBuildingType() {
        return this.buildingType;
    }

    getSize() {
        return {
            width: this.width,
            depth: this.depth,
            height: this.height
        };
    }

    updateSelectionVisual(deltaTime = 0) {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
    }
    
    /**
     * 重写takeDamage方法，添加生命值条显示
     */
    takeDamage(amount) {
        this.health -= amount;
        
        // 显示生命值条
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = true;
        }
        
        // 更新生命值条
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    /**
     * 重写heal方法，添加生命值条隐藏
     */
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        // 更新生命值条
        this.updateHealthBar();
        
        // 如果生命值满了，隐藏生命值条
        if (this.health >= this.maxHealth && this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
    }
    
    /**
     * 重写die方法，添加死亡效果
     */
    die() {
        this.isAlive = false;
        
        // 隐藏选择环和生命值条
        if (this.selectionRing) {
            this.selectionRing.visible = false;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = false;
        }
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
        
        // 建筑倒塌动画
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    // 添加倒塌效果
                    child.position.y -= 0.5;
                }
            });
        }
        
        console.log(`建筑 ${this.name} 已摧毁`);
    }

    getOccupiedCells() {
        const cells = [];
        const gridX = Math.floor(this.position.x / CELL_SIZE);
        const gridZ = Math.floor(this.position.z / CELL_SIZE);

        for (let dx = 0; dx < this.width; dx++) {
            for (let dz = 0; dz < this.depth; dz++) {
                cells.push({
                    x: gridX + dx,
                    z: gridZ + dz
                });
            }
        }

        return cells;
    }
}

export default Building;
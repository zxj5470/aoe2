import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import GameMap from '../world/Map.js';
import MapGenerator from '../world/MapGenerator.js';
import MapSelectionPanel from '../ui/MapSelectionPanel.js';
import InputHandler from '../input/InputHandler.js';
import SelectionManager from '../input/SelectionManager.js';
import ResourceManager from '../entities/ResourceManager.js';
import Player from '../entities/Player.js';
import Unit from '../entities/Unit.js';
import Building from '../entities/Building.js';
import ResourceNode from '../entities/ResourceNode.js';
import MovementSystem from '../systems/MovementSystem.js';
import Pathfinding from '../systems/Pathfinding.js';
import FormationSystem from '../systems/FormationSystem.js';
import BuildingPlacementSystem from '../systems/BuildingPlacementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ResourceGatheringSystem from '../systems/ResourceGatheringSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import SpatialIndex from './SpatialIndex.js';
import HUD from '../ui/HUD.js';
import { CELL_SIZE, MAP_CONFIG } from '../config.js';

class Game {
    constructor() {
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.isRunning = false;
        this.loadingProgress = 0;
        this.entities = [];
        this.resources = {
            gold: 0,
            wood: 0,
            food: 0,
            stone: 0
        };
        this.map = null;

        // 系统组件
        this.inputHandler = null;
        this.selectionManager = null;
        this.resourceManager = null;
        this.player = null;
        this.movementSystem = null;
        this.pathfinding = null;
        this.formationSystem = null;
        this.buildingPlacementSystem = null;
        this.combatSystem = null;
        this.resourceGatheringSystem = null;
        this.collisionSystem = null;
        this.hud = null;

        // 地图系统
        this.mapGenerator = null;
        this.mapSelectionPanel = null;
        this.selectedMapType = 'arabia';

        // 空间索引
        this.spatialIndex = null;

        // UI更新计时器
        this.uiUpdateTimer = 0;
        this.uiUpdateInterval = 1; // 每秒更新一次UI

        // 碰撞可视化显示状态
        this.showCollisionVisuals = false;
    }

    async init() {
        // 获取canvas
        this.canvas = document.getElementById('canvas');
        
        // 初始化Three.js渲染器
        this.initRenderer();
        
        // 创建场景
        this.scene = new Scene();
        this.scene.init();
        
        // 创建摄像机
        this.camera = new Camera(this.canvas);
        this.camera.init();
        
        // 设置时钟
        this.clock = new THREE.Clock();
        
        // 初始化地图生成器和选择面板
        this.initMapSystem();
        
        // 显示地图选择面板，等待玩家选择地图
        await this.showMapSelection();
        
        // 加载资源
        await this.loadResources();
        
        // 初始化不依赖地图的系统
        this.initIndependentSystems();
        
        // 根据选择的地图类型初始化地图
        this.initMapWithType(this.selectedMapType);

        // 设置相机的地图引用（用于边界限制）
        if (this.camera) {
            this.camera.setMap(this.map);
        }

        // 初始化依赖地图的系统（包括碰撞系统）
        this.initMapDependentSystems();
        
        // 初始化所有实体（现在碰撞系统已经准备好了）
        this.initEntities();
        
        // 设置事件监听
        this.setupEventListeners();
        
        // 隐藏加载界面
        this.hideLoadingScreen();
        
        // 开始游戏循环
        this.start();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    async loadResources() {
        // 模拟资源加载
        const loadSteps = [
            '加载纹理...',
            '初始化音频...',
            '准备模型...',
            '设置场景...',
            '初始化游戏系统...'
        ];
        
        for (let i = 0; i < loadSteps.length; i++) {
            await this.simulateLoad(0.2);
            this.updateLoadingProgress((i + 1) / loadSteps.length * 100, loadSteps[i]);
        }
    }

    simulateLoad(duration) {
        return new Promise(resolve => setTimeout(resolve, duration * 1000));
    }

    updateLoadingProgress(percent, text) {
        this.loadingProgress = percent;
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.style.width = `${percent}%`;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    initMapSystem() {
        // 创建地图生成器
        this.mapGenerator = new MapGenerator();
        
        // 创建地图选择面板
        this.mapSelectionPanel = new MapSelectionPanel(this);
        
        // 设置地图选择回调
        this.mapSelectionPanel.setOnMapSelected((mapType) => {
            this.selectedMapType = mapType;
            console.log(`地图选择完成: ${mapType}`);
        });
    }

    async showMapSelection() {
        return new Promise((resolve) => {
            // 显示地图选择面板
            this.mapSelectionPanel.show();
            
            // 设置回调，当玩家选择地图后继续游戏初始化
            this.mapSelectionPanel.setOnMapSelected((mapType) => {
                this.selectedMapType = mapType;
                console.log(`已选择地图: ${mapType}`);
                resolve();
            });
        });
    }

    initMapWithType(mapType) {
        // 使用地图生成器生成地图数据
        const mapData = this.mapGenerator.generateMap(mapType);
        
        // 使用生成的地图数据初始化地图
        this.map = new GameMap(mapData.width, mapData.height, 1);
        
        // 将地图生成器传递给地图对象，以便渲染地形和资源
        this.map.setMapGenerator(this.mapGenerator);
        this.map.setMapData(mapData);
        
        const mapMesh = this.map.init();
        this.scene.addEntity({ getMesh: () => mapMesh });

        // 添加地图装饰物到场景
        const decorations = this.map.getDecorations();
        for (const decoration of decorations) {
            this.scene.addEntity({ getMesh: () => decoration });
        }

        // 根据地图数据添加资源节点
        this.spawnResourcesFromMapData(mapData);

        console.log(`已生成地图: ${mapType} (${mapData.width}x${mapData.height})`);
    }

    spawnResourcesFromMapData(mapData) {
        if (!mapData.resources || mapData.resources.length === 0) return;

        for (const resource of mapData.resources) {
            const resourceNode = new ResourceNode({
                resourceType: resource.type,
                name: resource.type + '_' + Math.random().toString(36).substr(2, 9),
                x: resource.x - mapData.width / 2 + 0.5, // 转换为世界坐标
                z: resource.y - mapData.height / 2 + 0.5,
                amount: resource.amount,
                health: 100,
                maxHealth: 100,
                gatherSpeed: 1,
                canRespawn: true,
                respawnTime: 60
            });

            const resourceMesh = resourceNode.createMesh();
            if (resourceMesh) {
                this.addEntity(resourceNode);
            }
        }

        console.log(`已生成 ${mapData.resources.length} 个资源节点`);
    }

    initMapOnly() {
        // 初始化地图（网格大小改为1x1）
        this.map = new GameMap(200, 200, 1);
        const mapMesh = this.map.init();
        this.scene.addEntity({ getMesh: () => mapMesh });

        // 添加地图装饰物到场景
        const decorations = this.map.getDecorations();
        for (const decoration of decorations) {
            this.scene.addEntity({ getMesh: () => decoration });
        }
    }

    initEntities() {
        // 初始化测试单位（验证单位渲染系统）
        this.initTestUnits();

        // 初始化测试建筑（验证建筑渲染系统）
        this.initTestBuildings();

        // 初始化测试资源节点（验证资源节点系统）
        this.initTestResources();

        // 初始化城镇中心（作为资源存储点）
        this.initTownCenter();

        // 注册单位到资源收集系统
        this.registerUnitsToGatheringSystem();

        // 注册资源节点到资源收集系统
        this.registerResourceNodesToGatheringSystem();

        // 初始化单位
        this.updateResourceDisplay();
    }
    
    /**
     * 初始化测试单位，用于验证单位渲染系统
     */
    initTestUnits() {
        // 辅助函数：将坐标对齐到网格中心（1x1=0.5偏移, 2x2=0偏移, 3x3=0.5偏移, 4x4=0偏移）
        const alignToGrid = (coord, size = 1) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        // 创建不同类型的测试单位
        const unitConfigs = [
            // 村民（3个）
            { unitType: 'villager', name: '村民1', x: alignToGrid(-5), z: alignToGrid(0) },
            { unitType: 'villager', name: '村民2', x: alignToGrid(-5), z: alignToGrid(3) },
            { unitType: 'villager', name: '村民3', x: alignToGrid(-5), z: alignToGrid(-3) },
            
            // 士兵（2个）
            { unitType: 'soldier', name: '士兵1', x: alignToGrid(0), z: alignToGrid(5) },
            { unitType: 'soldier', name: '士兵2', x: alignToGrid(3), z: alignToGrid(5) },
            
            // 骑士（2个）
            { unitType: 'knight', name: '骑士1', x: alignToGrid(5), z: alignToGrid(0) },
            { unitType: 'knight', name: '骑士2', x: alignToGrid(5), z: alignToGrid(-3) },
            
            // 弓箭手（2个）
            { unitType: 'archer', name: '弓箭手1', x: alignToGrid(0), z: alignToGrid(-5) },
            { unitType: 'archer', name: '弓箭手2', x: alignToGrid(-3), z: alignToGrid(-5) },
            
            // 侦察兵（1个）
            { unitType: 'scout', name: '侦察兵1', x: alignToGrid(10), z: alignToGrid(10) }
        ];
        
        // 创建并添加所有单位
        for (const config of unitConfigs) {
            const unit = new Unit({
                ...config,
                owner: 'player',
                health: 50,
                maxHealth: 50,
                speed: 5,
                attackDamage: config.unitType === 'knight' ? 15 :
                             config.unitType === 'soldier' ? 10 :
                             config.unitType === 'archer' ? 8 : 5,
                attackRange: config.unitType === 'archer' ? 5 : 1,
                attackSpeed: 1,
                armor: config.unitType === 'knight' ? 3 :
                       config.unitType === 'soldier' ? 2 : 1,
                sightRange: 6,
                pathfindingSystem: this.pathfinding,
                formationSystem: this.formationSystem,
                game: this // 传递游戏实例引用
            });

            // 创建单位的3D模型
            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.addEntity(unit);
            }
        }

        // 创建一些敌方单位
        const enemyConfigs = [
            { unitType: 'soldier', name: '敌人士兵1', x: alignToGrid(-10), z: alignToGrid(10), owner: 'enemy' },
            { unitType: 'knight', name: '敌方骑士1', x: alignToGrid(-10), z: alignToGrid(15), owner: 'enemy' },
            { unitType: 'archer', name: '敌方弓箭手1', x: alignToGrid(-15), z: alignToGrid(10), owner: 'enemy' }
        ];

        for (const config of enemyConfigs) {
            const unit = new Unit({
                ...config,
                health: 50,
                maxHealth: 50,
                speed: 5,
                attackDamage: config.unitType === 'knight' ? 15 :
                             config.unitType === 'soldier' ? 10 :
                             config.unitType === 'archer' ? 8 : 5,
                attackRange: config.unitType === 'archer' ? 5 : 1,
                attackSpeed: 1,
                armor: config.unitType === 'knight' ? 3 :
                       config.unitType === 'soldier' ? 2 : 1,
                sightRange: 6,
                pathfindingSystem: this.pathfinding,
                formationSystem: this.formationSystem,
                game: this // 传递游戏实例引用
            });

            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.addEntity(unit);
            }
        }

        console.log(`已创建 ${unitConfigs.length + enemyConfigs.length} 个测试单位`);
    }
    
    /**
     * 初始化测试建筑，用于验证建筑渲染系统
     */
    initTestBuildings() {
        // 辅助函数：根据建筑尺寸对齐到网格中心
        const alignToGrid = (coord, size = 2) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        // 获取建筑尺寸的辅助函数
        const getSize = (type) => this.getBuildingWidth(type) || 2;

        // 创建不同类型的测试建筑
        const buildingConfigs = [
            // 住宅（3个，2x2）
            { buildingType: 'house', name: '房屋1', x: alignToGrid(8, getSize('house')), z: alignToGrid(0, getSize('house')) },
            { buildingType: 'house', name: '房屋2', x: alignToGrid(8, getSize('house')), z: alignToGrid(4, getSize('house')) },
            { buildingType: 'house', name: '房屋3', x: alignToGrid(8, getSize('house')), z: alignToGrid(-4, getSize('house')) },
            
            // 军事建筑
            { buildingType: 'barracks', name: '兵营', x: alignToGrid(12, getSize('barracks')), z: alignToGrid(8, getSize('barracks')) },
            { buildingType: 'stable', name: '马厩', x: alignToGrid(15, getSize('stable')), z: alignToGrid(12, getSize('stable')) },
            { buildingType: 'archery_range', name: '射箭场', x: alignToGrid(18, getSize('archery_range')), z: alignToGrid(8, getSize('archery_range')) },
            { buildingType: 'watch_tower', name: '瞭望塔', x: alignToGrid(20, getSize('watch_tower')), z: alignToGrid(5, getSize('watch_tower')) },
            
            // 经济建筑
            { buildingType: 'market', name: '市场', x: alignToGrid(12, getSize('market')), z: alignToGrid(-8, getSize('market')) },
            { buildingType: 'blacksmith', name: '铁匠铺', x: alignToGrid(15, getSize('blacksmith')), z: alignToGrid(-12, getSize('blacksmith')) },
            
            // 特殊建筑
            { buildingType: 'church', name: '教堂', x: alignToGrid(20, getSize('church')), z: alignToGrid(0, getSize('church')) },
            { buildingType: 'castle', name: '城堡', x: alignToGrid(25, getSize('castle')), z: alignToGrid(0, getSize('castle')) }
        ];
        
        // 创建并添加所有建筑
        for (const config of buildingConfigs) {
            const building = new Building({
                ...config,
                owner: 'player',
                health: 200,
                maxHealth: 200,
                width: this.getBuildingWidth(config.buildingType),
                depth: this.getBuildingDepth(config.buildingType),
                height: this.getBuildingHeight(config.buildingType)
            });

            // 创建建筑的3D模型
            const buildingMesh = building.createMesh();
            if (buildingMesh) {
                this.addEntity(building);
            }
        }

        // 创建一些敌方建筑
        const enemyBuildingConfigs = [
            { buildingType: 'barracks', name: '敌军兵营', x: alignToGrid(-15, getSize('barracks')), z: alignToGrid(8, getSize('barracks')), owner: 'enemy' },
            { buildingType: 'watch_tower', name: '敌军瞭望塔', x: alignToGrid(-18, getSize('watch_tower')), z: alignToGrid(12, getSize('watch_tower')), owner: 'enemy' },
            { buildingType: 'house', name: '敌军房屋', x: alignToGrid(-12, getSize('house')), z: alignToGrid(15, getSize('house')), owner: 'enemy' }
        ];

        for (const config of enemyBuildingConfigs) {
            const building = new Building({
                ...config,
                health: 200,
                maxHealth: 200,
                width: this.getBuildingWidth(config.buildingType),
                depth: this.getBuildingDepth(config.buildingType),
                height: this.getBuildingHeight(config.buildingType)
            });

            const buildingMesh = building.createMesh();
            if (buildingMesh) {
                this.addEntity(building);
            }
        }

        console.log(`已创建 ${buildingConfigs.length + enemyBuildingConfigs.length} 个测试建筑`);
    }
    
    /**
     * 初始化测试资源节点，用于验证资源节点系统
     */
    initTestResources() {
        // 辅助函数：将坐标对齐到网格中心（资源节点默认1x1=0.5偏移）
        const alignToGrid = (coord, size = 1) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        // 创建不同类型的测试资源节点
        const resourceConfigs = [
            // 树木（木材资源）- 对齐到网格中心
            { resourceType: 'wood', name: '树木1', x: alignToGrid(-15), z: alignToGrid(0), amount: 150 },
            { resourceType: 'wood', name: '树木2', x: alignToGrid(-18), z: alignToGrid(3), amount: 150 },
            { resourceType: 'wood', name: '树木3', x: alignToGrid(-18), z: alignToGrid(-3), amount: 150 },
            { resourceType: 'wood', name: '树木4', x: alignToGrid(-20), z: alignToGrid(6), amount: 150 },
            { resourceType: 'wood', name: '树木5', x: alignToGrid(-20), z: alignToGrid(-6), amount: 150 },
            { resourceType: 'wood', name: '树木6', x: alignToGrid(-22), z: alignToGrid(0), amount: 150 },
            
            // 岩石（石材资源）
            { resourceType: 'stone', name: '岩石1', x: alignToGrid(-10), z: alignToGrid(-10), amount: 200 },
            { resourceType: 'stone', name: '岩石2', x: alignToGrid(-13), z: alignToGrid(-12), amount: 200 },
            { resourceType: 'stone', name: '岩石3', x: alignToGrid(-7), z: alignToGrid(-13), amount: 200 },
            
            // 金矿（黄金资源）
            { resourceType: 'gold', name: '金矿1', x: alignToGrid(0), z: alignToGrid(-15), amount: 300 },
            { resourceType: 'gold', name: '金矿2', x: alignToGrid(3), z: alignToGrid(-18), amount: 300 },
            { resourceType: 'gold', name: '金矿3', x: alignToGrid(-3), z: alignToGrid(-18), amount: 300 },
            
            // 浆果丛（食物资源）
            { resourceType: 'food', name: '浆果丛1', x: alignToGrid(10), z: alignToGrid(15), amount: 100 },
            { resourceType: 'food', name: '浆果丛2', x: alignToGrid(13), z: alignToGrid(18), amount: 100 },
            { resourceType: 'food', name: '浆果丛3', x: alignToGrid(7), z: alignToGrid(18), amount: 100 },
            { resourceType: 'food', name: '浆果丛4', x: alignToGrid(15), z: alignToGrid(15), amount: 100 }
        ];
        
        // 创建并添加所有资源节点
        for (const config of resourceConfigs) {
            const resourceNode = new ResourceNode({
                ...config,
                health: 100,
                maxHealth: 100,
                gatherSpeed: 1,
                canRespawn: true,
                respawnTime: 60
            });
            
            // 创建资源节点的3D模型
            const resourceMesh = resourceNode.createMesh();
            if (resourceMesh) {
                this.addEntity(resourceNode);
            }
        }

        console.log(`已创建 ${resourceConfigs.length} 个测试资源节点（已对齐到网格中心）`);
    }

    /**
     * 初始化城镇中心（作为资源存储点）
     */
    initTownCenter() {
        // 辅助函数：根据建筑尺寸对齐到网格中心（4x4=整数点偏移）
        const alignToGrid = (coord, size = 4) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        // 创建城镇中心建筑（4x4网格）
        const townCenter = new Building({
            buildingType: 'town_center',
            name: '城镇中心',
            x: alignToGrid(0, 4),
            z: alignToGrid(0, 4),
            owner: 'player',
            health: 1000,
            maxHealth: 1000,
            width: 4,
            depth: 4,
            height: 4,
            gridSizeX: 4,
            gridSizeZ: 4
        });

        const townCenterMesh = townCenter.createMesh();
        if (townCenterMesh) {
            // 设置城镇中心的时代等级
            townCenter.setAgeLevel(this.player.getAgeLevel());
            this.addEntity(townCenter);
        }

        // 将城镇中心添加为资源存储点
        if (this.resourceGatheringSystem) {
            this.resourceGatheringSystem.addDropOffPoint(townCenter, ['wood', 'food', 'gold', 'stone']);
            console.log('已创建城镇中心并添加为资源存储点');
        }
    }

    /**
     * 注册单位到资源收集系统
     */
    registerUnitsToGatheringSystem() {
        if (!this.resourceGatheringSystem) return;

        // 注册所有村民单位
        for (const entity of this.entities) {
            if (entity.unitType === 'villager' && entity.owner === 'player') {
                this.resourceGatheringSystem.registerGatherer(entity);
            }
        }

        console.log(`已注册 ${this.resourceGatheringSystem.getGathererCount()} 个村民到资源收集系统`);
    }

    /**
     * 注册资源节点到资源收集系统
     */
    registerResourceNodesToGatheringSystem() {
        if (!this.resourceGatheringSystem) return;

        // 注册所有资源节点
        for (const entity of this.entities) {
            if (entity.type === 'resource' && entity.userData) {
                this.resourceGatheringSystem.registerResourceNode(entity);
            }
        }

        console.log(`已注册 ${this.resourceGatheringSystem.getResourceNodeCount()} 个资源节点到资源收集系统`);
    }

    /**
     * 切换所有实体的碰撞体积可视化
     */
    toggleCollisionVisuals() {
        if (!this.collisionSystem) return;

        // 切换显示状态
        this.showCollisionVisuals = !this.showCollisionVisuals;

        console.log(`碰撞体积可视化: ${this.showCollisionVisuals ? '显示' : '隐藏'}`);

        // 更新所有建筑的碰撞可视化
        for (const building of this.collisionSystem.buildings) {
            if (building.toggleCollisionVisual) {
                building.toggleCollisionVisual(this.showCollisionVisuals);
            }
        }

        // 更新所有资源节点的碰撞可视化
        for (const resource of this.collisionSystem.resourceNodes) {
            if (resource.toggleCollisionVisual) {
                resource.toggleCollisionVisual(this.showCollisionVisuals);
            }
        }

        // 更新所有单位的碰撞可视化
        for (const unit of this.collisionSystem.units) {
            if (unit.toggleCollisionVisual) {
                unit.toggleCollisionVisual(this.showCollisionVisuals);
            }
        }
    }

    /**
     * 选择/切换城镇中心
     */
    selectTownCenter() {
        if (!this.selectionManager) return;

        // 查找所有城镇中心建筑
        const townCenters = this.entities.filter(entity => 
            entity.type === 'building' && 
            entity.buildingType === 'town_center' &&
            entity.isAlive
        );

        if (townCenters.length === 0) {
            console.log('没有找到城镇中心');
            return;
        }

        // 获取当前选中的城镇中心索引
        const currentlySelected = this.selectionManager.getSelectedEntities();
        let currentIndex = -1;

        if (currentlySelected.length === 1 && currentlySelected[0].buildingType === 'town_center') {
            currentIndex = townCenters.indexOf(currentlySelected[0]);
        }

        // 计算下一个索引（循环切换）
        const nextIndex = (currentIndex + 1) % townCenters.length;
        const targetTownCenter = townCenters[nextIndex];

        // 选择目标城镇中心
        this.selectionManager.deselectAll();
        this.selectionManager.selectEntity(targetTownCenter);

        // 移动相机到城镇中心
        if (this.camera) {
            this.camera.target.x = targetTownCenter.position.x;
            this.camera.target.z = targetTownCenter.position.z;
            this.camera.target.y = 0;
            this.camera.updateCameraPosition();
        }

        console.log(`已选择城镇中心 ${nextIndex + 1}/${townCenters.length}`);
    }

    /**
     * 获取建筑宽度
     */
    getBuildingWidth(buildingType) {
        const widths = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 3,
            blacksmith: 3,
            watch_tower: 2
        };
        return widths[buildingType] || 2;
    }
    
    /**
     * 获取建筑深度
     */
    getBuildingDepth(buildingType) {
        const depths = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 4,
            blacksmith: 3,
            watch_tower: 2
        };
        return depths[buildingType] || 2;
    }
    
    /**
     * 获取建筑高度
     */
    getBuildingHeight(buildingType) {
        const heights = {
            house: 2,
            barracks: 2.5,
            stable: 2.2,
            archery_range: 2,
            castle: 4,
            market: 2,
            church: 3.5,
            blacksmith: 2,
            watch_tower: 3
        };
        return heights[buildingType] || 2;
    }

    initIndependentSystems() {
        // 空间索引
        this.spatialIndex = new SpatialIndex();

        // 编队系统（需要在选择系统之前创建）
        this.formationSystem = new FormationSystem();
        
        // 选择系统（需要编队系统支持）
        this.selectionManager = new SelectionManager(this.formationSystem);
        
        // 资源管理系统
        this.resourceManager = new ResourceManager();
        this.resourceManager.addListener((type, amount) => {
            this.resources[type] = amount;
            this.updateResourceDisplay();
        });
        
        // 玩家系统
        this.player = new Player({
            id: 'player',
            name: '玩家',
            ageLevel: 1,
            gold: 100,
            wood: 100,
            food: 100,
            stone: 50,
            maxPopulation: 20
        });
        
        // 绑定玩家事件监听器
        this.bindPlayerEvents();
        
        // 战斗系统
        this.combatSystem = new CombatSystem();
    }
    
    initMapDependentSystems() {
        // 输入系统（需要 map）
        this.inputHandler = new InputHandler(
            this.camera,
            this.canvas,
            this.map,
            (startX, startY, currentX, currentY) => {
                this.updateDragSelectionVisual(startX, startY, currentX, currentY);
            }
        );
        
        // 移动系统（需要 map）
        this.movementSystem = new MovementSystem(this.map);
        
        // 路径规划系统（需要 map）
        this.pathfinding = new Pathfinding(this.map.getGrid());
        
        // 建筑放置系统（需要 map）
        this.buildingPlacementSystem = new BuildingPlacementSystem(this.map, this.scene);
        
        // 资源收集系统（需要 map 和 spatialIndex）
        this.resourceGatheringSystem = new ResourceGatheringSystem(
            this.map, 
            this.resourceManager,
            this.spatialIndex
        );

        // 碰撞系统（需要 map）
        this.collisionSystem = new CollisionSystem(this.map);

        // UI系统
        this.hud = new HUD(this);
    }

    setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 键盘事件
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // 更新摄像机
        this.camera.update(deltaTime);
        
        // 更新场景
        this.scene.update(deltaTime);
        
        // 更新输入系统
        if (this.inputHandler) {
            this.inputHandler.updateWorldPosition();
            
            // 更新建筑放置预览
            if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
                const worldPos = this.inputHandler.getWorldPosition();
                this.buildingPlacementSystem.updatePreview(worldPos);
            }
        }
        
        // 更新选择系统
        if (this.selectionManager) {
            this.selectionManager.update();
        }
        
        // 更新战斗系统
        if (this.combatSystem) {
            this.combatSystem.update(deltaTime);
        }
        
        // 更新资源收集系统
        if (this.resourceGatheringSystem) {
            this.resourceGatheringSystem.update(deltaTime);
        }

        // 更新标题栏相机控制
        if (this.hud) {
            this.hud.updateAgeDisplayCameraControl(deltaTime);
        }

        // 每秒更新一次单位信息面板（显示携带资源量）
        this.uiUpdateTimer += deltaTime;
        if (this.uiUpdateTimer >= this.uiUpdateInterval) {
            this.uiUpdateTimer = 0;
            if (this.hud) {
                this.hud.updateUnitInfoPanel();
            }
        }

        // 更新实体
        this.updateEntities(deltaTime);
        
        // 渲染
        this.renderer.render(this.scene.getScene(), this.camera.getCamera());
    }

    updateEntities(deltaTime) {
        // 更新所有实体
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
        this.scene.addEntity(entity);

        // 如果碰撞系统存在，注册实体并更新网格占用
        if (this.collisionSystem) {
            if (entity.type === 'building' || entity.type === 'resource' || entity.type === 'unit') {
                this.collisionSystem.registerEntity(entity);
                this.collisionSystem.updateGridOccupancy();
            }
        }

        // 将资源节点和建筑添加到空间索引
        if (this.spatialIndex) {
            if (entity.type === 'resource' || entity.type === 'building') {
                this.spatialIndex.insert(entity);
            }
        }
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.scene.removeEntity(entity);

            // 从空间索引中移除
            if (this.spatialIndex && (entity.type === 'resource' || entity.type === 'building')) {
                this.spatialIndex.remove(entity);
            }
        }
    }

    updateResourceDisplay() {
        const goldElement = document.getElementById('resource-gold');
        const woodElement = document.getElementById('resource-wood');
        const foodElement = document.getElementById('resource-food');
        const stoneElement = document.getElementById('resource-stone');
        
        if (goldElement) goldElement.textContent = this.resources.gold;
        if (woodElement) woodElement.textContent = this.resources.wood;
        if (foodElement) foodElement.textContent = this.resources.food;
        if (stoneElement) stoneElement.textContent = this.resources.stone;
    }

    /**
     * 绑定玩家事件监听器
     */
    bindPlayerEvents() {
        // 时代变化事件
        this.player.on('ageChange', (data) => {
            console.log(`[Player Event] 时代变化: ${data.oldLevel} -> ${data.newLevel} (${data.ageName})`);
            
            // 更新城镇中心的罗马数字显示
            const townCenter = this.entities.find(e => e.buildingType === 'town_center');
            if (townCenter) {
                townCenter.setAgeLevel(data.newLevel);
            }
            
            // 更新界面显示
            const ageElement = document.getElementById('age-display');
            if (ageElement) {
                ageElement.textContent = data.ageName;
            }
            
            const ageIconElement = document.getElementById('age-icon');
            if (ageIconElement) {
                ageIconElement.textContent = data.romanNumeral;
            }
        });
        
        // 资源变化事件
        this.player.on('resourceChange', (data) => {
            console.log(`[Player Event] 资源变化: ${data.type} ${data.oldAmount} -> ${data.newAmount}`);
            
            // 更新资源显示
            this.resources[data.type] = data.newAmount;
            this.updateResourceDisplay();
        });
        
        // 人口变化事件
        this.player.on('populationChange', (data) => {
            console.log(`[Player Event] 人口变化: ${data.oldCurrent}/${data.max} -> ${data.newCurrent}/${data.max}`);
            
            // 更新人口显示
            const populationElement = document.getElementById('population-display');
            if (populationElement) {
                populationElement.textContent = `${data.newCurrent}/${data.max}`;
            }
        });
        
        // 单位添加事件
        this.player.on('unitAdd', (data) => {
            console.log(`[Player Event] 单位添加: ${data.unit.unitType}`);
            // 可以在这里添加单位创建后的界面更新逻辑
        });
        
        // 单位移除事件
        this.player.on('unitRemove', (data) => {
            console.log(`[Player Event] 单位移除: ${data.unit.unitType}`);
            // 可以在这里添加单位移除后的界面更新逻辑
        });
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.resize(width, height);
        this.renderer.setSize(width, height);
    }

    onKeyDown(event) {
        this.camera.handleKeyDown(event);
        
        // F12切换debug面板
        if (event.key === 'F12' || event.keyCode === 123) {
            event.preventDefault();
            event.stopPropagation();
            if (this.hud) {
                this.hud.toggleDebugPanel();
                console.log('F12键触发，debug面板切换');
            } else {
                console.error('HUD不存在，无法切换debug面板');
            }
        }
        
        // 数字键1-3切换建筑面板布局
        if (event.key === '1') {
            // 3行5列（默认）
            if (this.hud) {
                this.hud.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
                console.log('建筑面板布局：3行5列（默认）');
            }
        }
        if (event.key === '2') {
            // 4行3列
            if (this.hud) {
                this.hud.updateBuildingPanelConfig({ rows: 4, cols: 3, totalButtons: 12 });
                console.log('建筑面板布局：4行3列');
            }
        }
        if (event.key === '3') {
            // 4行4列
            if (this.hud) {
                this.hud.updateBuildingPanelConfig({ rows: 4, cols: 4, totalButtons: 16 });
                console.log('建筑面板布局：4行4列');
            }
        }
        
        // Q键：设置兵营为空白
        if (event.key === 'q' || event.key === 'Q') {
            if (this.hud) {
                this.hud.setButtonEmpty(1, true);
                console.log('兵营已设置为空白占位（type: empty）');
            }
        }
        
        // E键：启用兵营
        if (event.key === 'e' || event.key === 'E') {
            if (this.hud) {
                this.hud.enableButton(1, {
                    icon: '⚔️',
                    name: '兵营',
                    id: 'barracks',
                    type: 'military'
                });
                console.log('兵营已启用');
            }
        }
        
        // R键：重置所有按钮
        if (event.key === 'r' || event.key === 'R') {
            if (this.hud) {
                const allIndices = Array.from({ length: 15 }, (_, i) => i);
                allIndices.forEach(i => this.hud.enableButton(i));
                console.log('所有按钮已重置');
            }
        }
        
        // V键：切换建筑面板预设
        if (event.key === 'v' || event.key === 'V') {
            if (this.hud) {
                this.hud.nextPreset();
            }
        }
        
        // Ctrl+1-5切换编队类型
        if (event.ctrlKey || event.metaKey) {
            if (this.selectionManager) {
                const formationTypes = ['line', 'column', 'square', 'wedge', 'circle'];
                const formationNames = ['线形编队', '列形编队', '方形编队', '楔形编队', '圆形编队'];

                for (let i = 1; i <= 5; i++) {
                    if (event.key === i.toString()) {
                        this.selectionManager.setFormationType(formationTypes[i - 1]);
                        console.log(`编队类型已切换为：${formationNames[i - 1]}`);
                        event.preventDefault();
                        break;
                    }
                }
            }
        }

        // C键：切换碰撞体积可视化
        if (event.key === 'c' || event.key === 'C') {
            this.toggleCollisionVisuals();
        }

        // H键：选择/切换城镇中心
        if (event.key === 'h' || event.key === 'H') {
            this.selectTownCenter();
        }
    }

    onKeyUp(event) {
        this.camera.handleKeyUp(event);
    }

    onMouseDown(event) {
        this.camera.handleMouseDown(event);
        
        // 处理左键点击
        if (event.button === 0) {
            this.handleLeftClick(event);
        }
    }
    
    onMouseUp(event) {
        this.camera.handleMouseUp(event);
        
        // 处理右键点击
        if (event.button === 2) {
            this.handleRightClick(event);
        }
        
        // 处理拖拽选择
        if (event.button === 0) {
            this.handleDragSelection(event);
            // 隐藏拖拽框的可视化
            this.hideDragSelectionVisual();
        }
    }    
    onMouseMove(event) {
        this.camera.handleMouseMove(event);
        
        // 更新 InputHandler 的鼠标位置
        if (this.inputHandler) {
            this.inputHandler.onMouseMove(event);
        }
    }
    
    onWheel(event) {
        this.camera.handleWheel(event);
    }
    
    onContextMenu(event) {
        event.preventDefault();
        this.camera.handleContextMenu(event);
        this.handleRightClick(event);
    }
    
    handleLeftClick(event) {
        if (!this.inputHandler || !this.selectionManager) return;
        
        // 使用统一的拾取方法获取实体
        const pickedEntity = this.pickAtMouse(event);
        
        if (pickedEntity) {
            // 找到实体，执行选择逻辑
            this.handleEntitySelection(pickedEntity, event.shiftKey);
            return;
        }
        
        // 没有点击到实体，取消选择
        this.selectionManager.deselectAll();
    }

    /**
     * 统一的拾取方法：从鼠标位置拾取实体
     * @param {MouseEvent} event - 鼠标事件对象，用于获取点击坐标
     * @returns {Entity|null} 拾取到的实体，没有则返回 null
     */
    pickAtMouse(event = null) {
        if (!this.inputHandler || !this.scene) return null;
        
        const raycaster = this.inputHandler.getRaycaster();
        
        // 如果有 event，直接使用 event 的坐标；否则使用 InputHandler 的坐标
        let mousePos;
        if (event && event.clientX !== undefined) {
            mousePos = { x: event.clientX, y: event.clientY };
        } else {
            mousePos = this.inputHandler.getMousePosition();
        }
        
        // 将屏幕坐标转换为归一化设备坐标 (NDC)
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        const ndcX = ((mousePos.x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((mousePos.y - rect.top) / rect.height) * 2 + 1;
        
        // 设置射线
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.getCamera());
        
        // 执行射线检测
        const intersects = raycaster.intersectObjects(this.scene.getScene().children, true);
        
        // 遍历相交结果，找到绑定了 entity 的 mesh
        for (const intersect of intersects) {
            let currentObj = intersect.object;
            
            // 向上遍历父对象，查找有 entity userData 的对象
            while (currentObj) {
                if (currentObj.userData && currentObj.userData.entity) {
                    return currentObj.userData.entity;
                }
                currentObj = currentObj.parent;
            }
        }
        
        return null;
    }
    
    handleRightClick(event) {
        if (!this.selectionManager || !this.inputHandler || !this.spatialIndex) {
            console.log('[handleRightClick] early return: selectionManager=', !!this.selectionManager, 'inputHandler=', !!this.inputHandler, 'spatialIndex=', !!this.spatialIndex);
            return;
        }

        // 使用事件中的鼠标坐标强制更新世界坐标
        this.inputHandler.updateWorldPosition(event.clientX, event.clientY);
        const worldPos = this.inputHandler.getWorldPosition();

        if (!this.selectionManager.hasSelection()) {
            console.log('[handleRightClick] no selection, returning. selectedEntities count:', this.selectionManager.selectedEntities.length);
            return;
        }

        console.log('[handleRightClick] worldPos:', worldPos, 'selectedEntities:', this.selectionManager.selectedEntities.length, 'type:', this.selectionManager.selectionType);

        // 使用空间索引查询点击位置的非移动要素
        // tolerance 设为 0.05 覆盖浮点误差，同时确保精确匹配网格
        const nearbyEntities = this.spatialIndex.queryPoint(worldPos.x, worldPos.z, 0.05);

        // 查找最近的资源节点
        for (const entity of nearbyEntities) {
            if (entity.type === 'resource' && entity.isAlive) {
                console.log('[handleRightClick] 找到资源节点:', entity.resourceType, '中心:', entity.position);
                
                if (entity.showGatherIndicator) {
                    entity.showGatherIndicator();
                }
                
                const townCenter = this.entities.find(e => 
                    e.type === 'building' && 
                    e.buildingType === 'town_center' &&
                    e.isAlive
                );
                
                this.selectionManager.issueCommand('gather', entity, townCenter);
                return;
            }
        }

        console.log('[handleRightClick] 未点击到资源节点，执行移动命令');
        this.selectionManager.issueMoveCommand(new THREE.Vector3(worldPos.x, 0, worldPos.z));
    }
    
    handleDragSelection(event) {
        if (!this.inputHandler || !this.selectionManager) return;
        
        const dragSelection = this.inputHandler.getDragSelection();
        
        if (dragSelection && this.inputHandler.isDragging) {
            // 执行框选
            this.performBoxSelection(dragSelection);
            this.inputHandler.clearDragSelection();
        }
    }
    
    performBoxSelection(dragSelection) {
        const { start, end } = dragSelection;
        
        // 计算选择框的边界（屏幕坐标）
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        // 检查选择框是否太小（避免误操作）
        if (maxX - minX < 10 && maxY - minY < 10) {
            return;
        }
        
        const selectedEntities = [];
        
        for (const entity of this.entities) {
            if (!entity.isAlive) continue;
            if (!entity.mesh) continue;
            
            // 将实体位置投影到屏幕空间
            const entityPosition = entity.getPosition();
            const screenPosition = entityPosition.clone().project(this.camera.getCamera());
            
            // 转换为屏幕坐标
            const screenX = (screenPosition.x + 1) / 2 * window.innerWidth;
            const screenY = (-screenPosition.y + 1) / 2 * window.innerHeight;
            
            // 检查实体是否在选择框内
            if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
                // 只选择玩家的单位
                if (entity.owner === 'player') {
                    selectedEntities.push(entity);
                }
            }
        }
        
        if (selectedEntities.length > 0) {
            this.selectionManager.selectEntities(selectedEntities, false);
            console.log(`框选了 ${selectedEntities.length} 个单位`);
        }
    }
    
    createClickEffect(clientX, clientY) {
        const clickEffect = document.getElementById('click-effect');
        if (!clickEffect) return;
        
        // 创建一个圆形波纹效果
        clickEffect.style.left = `${clientX - 20}px`;
        clickEffect.style.top = `${clientY - 20}px`;
        clickEffect.style.width = '40px';
        clickEffect.style.height = '40px';
        clickEffect.style.borderRadius = '50%';
        clickEffect.style.border = '3px solid rgba(255, 255, 255, 0.8)';
        clickEffect.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        clickEffect.style.opacity = '1';
        
        // 动画效果
        let scale = 1;
        let opacity = 1;
        const animate = () => {
            scale += 0.1;
            opacity -= 0.05;
            
            if (opacity <= 0) {
                clickEffect.style.opacity = '0';
                return;
            }
            
            clickEffect.style.transform = `scale(${scale})`;
            clickEffect.style.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createClickEffect(clientX, clientY) {
        const clickEffect = document.getElementById('click-effect');
        if (!clickEffect) return;
        
        // 创建一个圆形波纹效果
        clickEffect.style.left = `${clientX - 20}px`;
        clickEffect.style.top = `${clientY - 20}px`;
        clickEffect.style.width = '40px';
        clickEffect.style.height = '40px';
        clickEffect.style.borderRadius = '50%';
        clickEffect.style.border = '3px solid rgba(255, 255, 255, 0.8)';
        clickEffect.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        clickEffect.style.opacity = '1';
        
        // 动画效果
        let scale = 1;
        let opacity = 1;
        const animate = () => {
            scale += 0.1;
            opacity -= 0.05;
            
            if (opacity <= 0) {
                clickEffect.style.opacity = '0';
                return;
            }
            
            clickEffect.style.transform = `scale(${scale})`;
            clickEffect.style.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateDragSelectionVisual(startX, startY, currentX, currentY) {
        const selectionBox = document.getElementById('selection-box');
        if (!selectionBox) return;
        
        // 计算选择框的位置和大小
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        // 更新选择框样式
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
        selectionBox.style.display = 'block';
    }
    
    hideDragSelectionVisual() {
        const selectionBox = document.getElementById('selection-box');
        if (selectionBox) {
            selectionBox.style.display = 'none';
        }
    }
    
    handleEntitySelection(entity, addToSelection) {
        console.log('[handleEntitySelection] entity:', entity, 'isAlive:', entity?.isAlive, 'userData:', entity?.userData);
        if (!this.selectionManager) return;

        let actualEntity = entity;

        if (entity.userData && entity.userData.entity) {
            actualEntity = entity.userData.entity;
        } else if (entity.isAlive === undefined) {
            actualEntity = this.entities.find(e => e.mesh === entity || e.mesh === entity.parent);
        }

        console.log('[handleEntitySelection] actualEntity:', actualEntity, 'isAlive:', actualEntity?.isAlive);

        if (!actualEntity || !actualEntity.isAlive) return;

        this.selectionManager.selectEntity(actualEntity, addToSelection);
    }
}

export default Game;
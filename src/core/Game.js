import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import GameMap from '../world/Map.js';
import InputHandler from '../input/InputHandler.js';
import SelectionManager from '../input/SelectionManager.js';
import ResourceManager from '../entities/ResourceManager.js';
import Unit from '../entities/Unit.js';
import Building from '../entities/Building.js';
import ResourceNode from '../entities/ResourceNode.js';
import MovementSystem from '../systems/MovementSystem.js';
import Pathfinding from '../systems/Pathfinding.js';
import FormationSystem from '../systems/FormationSystem.js';
import BuildingPlacementSystem from '../systems/BuildingPlacementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ResourceGatheringSystem from '../systems/ResourceGatheringSystem.js';
import HUD from '../ui/HUD.js';

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
        this.movementSystem = null;
        this.pathfinding = null;
        this.formationSystem = null;
        this.buildingPlacementSystem = null;
        this.combatSystem = null;
        this.resourceGatheringSystem = null;
        this.hud = null;
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
        
        // 加载资源
        await this.loadResources();
        
        // 初始化不依赖地图的系统
        this.initIndependentSystems();
        
        // 初始化游戏世界
        this.initWorld();
        
        // 初始化依赖地图的系统
        this.initMapDependentSystems();
        
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

    initWorld() {
        // 初始化地图
        this.map = new GameMap(100, 100, 2);
        const mapMesh = this.map.init();
        this.scene.addEntity({ getMesh: () => mapMesh });
        
        // 添加地图装饰物到场景
        const decorations = this.map.getDecorations();
        for (const decoration of decorations) {
            this.scene.addEntity({ getMesh: () => decoration });
        }
        
        // 初始化测试单位（验证单位渲染系统）
        this.initTestUnits();
        
        // 初始化测试建筑（验证建筑渲染系统）
        this.initTestBuildings();
        
        // 初始化测试资源节点（验证资源节点系统）
        this.initTestResources();
        
        // 初始化单位
        this.updateResourceDisplay();
    }
    
    /**
     * 初始化测试单位，用于验证单位渲染系统
     */
    initTestUnits() {
        // 辅助函数：将坐标对齐到网格中心
        const alignToGrid = (coord) => {
            return Math.floor(coord / 2) * 2 + 1;
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
                formationSystem: this.formationSystem
            });
            
            // 创建单位的3D模型
            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.scene.addEntity(unit);
                this.entities.push(unit);
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
                formationSystem: this.formationSystem
            });
            
            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.scene.addEntity(unit);
                this.entities.push(unit);
            }
        }
        
        console.log(`已创建 ${unitConfigs.length + enemyConfigs.length} 个测试单位`);
    }
    
    /**
     * 初始化测试建筑，用于验证建筑渲染系统
     */
    initTestBuildings() {
        // 辅助函数：将坐标对齐到网格中心
        const alignToGrid = (coord) => {
            return Math.round(coord / 2) * 2 + 1;
        };
        
        // 创建不同类型的测试建筑
        const buildingConfigs = [
            // 住宅（3个）
            { buildingType: 'house', name: '房屋1', x: alignToGrid(8), z: alignToGrid(0) },
            { buildingType: 'house', name: '房屋2', x: alignToGrid(8), z: alignToGrid(4) },
            { buildingType: 'house', name: '房屋3', x: alignToGrid(8), z: alignToGrid(-4) },
            
            // 军事建筑
            { buildingType: 'barracks', name: '兵营', x: alignToGrid(12), z: alignToGrid(8) },
            { buildingType: 'stable', name: '马厩', x: alignToGrid(15), z: alignToGrid(12) },
            { buildingType: 'archery_range', name: '射箭场', x: alignToGrid(18), z: alignToGrid(8) },
            { buildingType: 'watch_tower', name: '瞭望塔', x: alignToGrid(20), z: alignToGrid(5) },
            
            // 经济建筑
            { buildingType: 'market', name: '市场', x: alignToGrid(12), z: alignToGrid(-8) },
            { buildingType: 'blacksmith', name: '铁匠铺', x: alignToGrid(15), z: alignToGrid(-12) },
            
            // 特殊建筑
            { buildingType: 'church', name: '教堂', x: alignToGrid(20), z: alignToGrid(0) },
            { buildingType: 'castle', name: '城堡', x: alignToGrid(25), z: alignToGrid(0) }
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
                this.scene.addEntity(building);
                this.entities.push(building);
            }
        }
        
        // 创建一些敌方建筑
        const enemyBuildingConfigs = [
            { buildingType: 'barracks', name: '敌军兵营', x: alignToGrid(-15), z: alignToGrid(8), owner: 'enemy' },
            { buildingType: 'watch_tower', name: '敌军瞭望塔', x: alignToGrid(-18), z: alignToGrid(12), owner: 'enemy' },
            { buildingType: 'house', name: '敌军房屋', x: alignToGrid(-12), z: alignToGrid(15), owner: 'enemy' }
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
                this.scene.addEntity(building);
                this.entities.push(building);
            }
        }
        
        console.log(`已创建 ${buildingConfigs.length + enemyBuildingConfigs.length} 个测试建筑`);
    }
    
    /**
     * 初始化测试资源节点，用于验证资源节点系统
     */
    initTestResources() {
        // 辅助函数：将坐标对齐到网格中心
        const alignToGrid = (coord) => {
            return Math.round(coord / 2) * 2 + 1;
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
                this.scene.addEntity(resourceNode);
                this.entities.push(resourceNode);
            }
        }
        
        console.log(`已创建 ${resourceConfigs.length} 个测试资源节点（已对齐到网格中心）`);
    }
    
    /**
     * 获取建筑宽度
     */
    getBuildingWidth(buildingType) {
        const widths = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 2.5,
            castle: 5,
            market: 3,
            church: 3,
            blacksmith: 2.5,
            watch_tower: 1.5
        };
        return widths[buildingType] || 2;
    }
    
    /**
     * 获取建筑深度
     */
    getBuildingDepth(buildingType) {
        const depths = {
            house: 2,
            barracks: 2.5,
            stable: 3,
            archery_range: 2.5,
            castle: 5,
            market: 2.5,
            church: 4,
            blacksmith: 2.5,
            watch_tower: 1.5
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
        
        // 资源收集系统（需要 map）
        this.resourceGatheringSystem = new ResourceGatheringSystem(this.map, this.resourceManager);
        
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
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.scene.removeEntity(entity);
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
        
        const raycaster = this.inputHandler.getRaycaster();
        const mousePos = this.inputHandler.getMousePosition();
        
        // 检查是否点击了实体
        const intersects = raycaster.intersectObjects(this.scene.getScene().children, true);
        
        for (const intersect of intersects) {
            let entity = intersect.object;
            
            // 向上查找实体对象
            while (entity && !entity.userData) {
                entity = entity.parent;
            }
            
            if (entity && entity.userData) {
                // 找到实体，执行选择逻辑
                this.handleEntitySelection(entity, event.shiftKey);
                return;
            }
        }
        
        // 没有点击到实体，取消选择
        this.selectionManager.deselectAll();
    }
    
    handleRightClick(event) {
        if (!this.selectionManager || !this.inputHandler) return;
        
        const worldPos = this.inputHandler.getWorldPosition();
        
        // 创建右键点击特效
        this.createClickEffect(event.clientX, event.clientY);
        
        if (!this.selectionManager.hasSelection()) return;
        
        // 检查是否右键点击了实体
        const raycaster = this.inputHandler.getRaycaster();
        const intersects = raycaster.intersectObjects(this.scene.getScene().children, true);
        
        for (const intersect of intersects) {
            let entity = intersect.object;
            
            while (entity && !entity.userData) {
                entity = entity.parent;
            }
            
            if (entity && entity.userData) {
                // 攻击或收集资源
                if (entity.userData.type === 'unit' || entity.userData.type === 'building') {
                    this.selectionManager.issueAttackCommand(entity);
                    return;
                } else if (entity.userData.resourceType) {
                    this.selectionManager.issueCommand('gather', entity);
                    return;
                }
            }
        }
        
        // 移动命令
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
        if (!this.selectionManager) return;
        
        // 获取实际的实体对象
        let actualEntity = entity;
        
        // 从userData中获取实体引用
        if (entity.userData && entity.userData.entity) {
            actualEntity = entity.userData.entity;
        } else {
            // 尝试从entities列表中找到对应的实体
            actualEntity = this.entities.find(e => e.mesh === entity || e.mesh === entity.parent);
        }
        
        if (!actualEntity || !actualEntity.isAlive) return;
        
        // 所有类型的实体都可以被选择
        this.selectionManager.selectEntity(actualEntity, addToSelection);
    }
}

export default Game;
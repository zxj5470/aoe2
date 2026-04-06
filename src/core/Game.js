import * as THREE from 'three';
import Scene from './Scene.js';
import Camera from './Camera.js';
import GameMap from '../world/Map.js';
import InputHandler from '../input/InputHandler.js';
import SelectionManager from '../input/SelectionManager.js';
import ResourceManager from '../entities/ResourceManager.js';
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
        
        // 初始化游戏世界
        this.initWorld();
        
        // 初始化系统
        this.initSystems();
        
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
        
        // 初始化单位
        // 初始化建筑
        this.updateResourceDisplay();
    }

    initSystems() {
        // 输入系统
        this.inputHandler = new InputHandler(this.camera, this.canvas, this.map);
        
        // 选择系统
        this.selectionManager = new SelectionManager();
        
        // 资源管理系统
        this.resourceManager = new ResourceManager();
        this.resourceManager.addListener((type, amount) => {
            this.resources[type] = amount;
            this.updateResourceDisplay();
        });
        
        // 移动系统
        this.movementSystem = new MovementSystem(this.map);
        
        // 路径规划系统
        this.pathfinding = new Pathfinding(this.map.getGrid());
        
        // 编队系统
        this.formationSystem = new FormationSystem();
        
        // 建筑放置系统
        this.buildingPlacementSystem = new BuildingPlacementSystem(this.map, this.scene);
        
        // 战斗系统
        this.combatSystem = new CombatSystem();
        
        // 资源收集系统
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
        
        if (!this.selectionManager.hasSelection()) return;
        
        const worldPos = this.inputHandler.getWorldPosition();
        
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
        // 将屏幕坐标转换为世界坐标
        const raycaster = this.inputHandler.getRaycaster();
        
        // 简化的框选逻辑（实际实现需要更复杂的计算）
        const selectedEntities = [];
        
        for (const entity of this.entities) {
            if (!entity.isAlive) continue;
            if (entity.type !== 'unit') continue;
            
            // 检查单位是否在选择框内
            // 这里简化处理，实际需要将单位位置投影到屏幕空间
            selectedEntities.push(entity);
        }
        
        if (selectedEntities.length > 0) {
            this.selectionManager.selectEntities(selectedEntities, false);
        }
    }
    
    handleEntitySelection(entity, addToSelection) {
        if (!this.selectionManager) return;
        
        // 根据实体类型执行不同的选择逻辑
        if (entity.userData.type === 'unit') {
            this.selectionManager.selectEntity(entity, addToSelection);
        } else if (entity.userData.type === 'building') {
            this.selectionManager.selectEntity(entity, addToSelection);
        }
    }}

export default Game;
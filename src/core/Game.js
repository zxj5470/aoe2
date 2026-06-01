import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import Scene from './Scene.js';
import Camera from './Camera.js';
import GameMap from '../world/Map.js';
import MapGenerator from '../world/MapGenerator.js';
import MapSelectionPanel from '../ui/MapSelectionPanel.js';
import InputHandler from '../input/InputHandler.js';
import SelectionManager from '../input/SelectionManager.js';
import Player from '../entities/Player.js';
import Unit from '../entities/Unit.js';
import Building from '../entities/Building.js';
import ResourceNode from '../entities/ResourceNode.js';
import Pathfinding from '../systems/Pathfinding.js';
import FormationSystem from '../systems/FormationSystem.js';
import BuildingPlacementSystem from '../systems/BuildingPlacementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ResourceGatheringSystem from '../systems/ResourceGatheringSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import AISystem from '../systems/AISystem.js';
import { HUMAN_OWNER, normalizeBuildingType, BUILDING_TYPES, BUILDING_CONFIG } from '../config.js';
import SpatialIndex from './SpatialIndex.js';
import HUD from '../ui/HUD.js';
import { CELL_SIZE, MAP_CONFIG } from '../config.js';
import EntityManager from './EntityManager.js';
import SystemManager from './SystemManager.js';
import EventManager from './EventManager.js';
import UIManager from './UIManager.js';

class Game {
    constructor() {
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.elapsedGameTime = 0;
        this.loadingProgress = 0;
        this.resources = {
            gold: 0,
            wood: 0,
            food: 0,
            stone: 0
        };
        this.map = null;

        this.entityManager = new EntityManager(this);
        this.systemManager = new SystemManager(this);
        this.eventManager = new EventManager(this);
        this.uiManager = new UIManager(this);

        this.inputHandler = null;
        this.selectionManager = null;
        this.player = null;
        this.pathfinding = null;
        this.formationSystem = null;
        this.buildingPlacementSystem = null;
        this.combatSystem = null;
        this.resourceGatheringSystem = null;
        this.collisionSystem = null;
        this.fogOfWarSystem = null;
        this.aiSystem = null;
        this.hud = null;

        this.mapGenerator = null;
        this.mapSelectionPanel = null;
        this.selectedMapType = 'arabia';
        this.selectedCivilization = 'franks';
        this.selectedPlayers = [];

        this.spatialIndex = null;

        this.uiUpdateTimer = 0;
        this.uiUpdateInterval = 1;

        // 双击检测
        this.lastClickTime = 0;
        this.lastClickedEntityId = null;
        this.doubleClickThreshold = 300; // ms
        this.showCollisionVisuals = false;
    }

    async init() {
        this.canvas = document.getElementById('canvas');
        this.canvas.style.visibility = 'hidden';
        
        this.initRenderer();
        
        this.scene = new Scene();
        this.scene.init();
        
        this.camera = new Camera(this.canvas);
        this.camera.init();
        
        this.clock = new THREE.Clock();
        
        this.initMapSystem();
        
        await this.showMapSelection();
        
        await this.loadResources();
        
        this.systemManager.initIndependentSystems();
        this.spatialIndex = this.systemManager.getSpatialIndex();
        this.formationSystem = this.systemManager.getFormationSystem();
        this.combatSystem = this.systemManager.getCombatSystem();
        this.aiSystem = this.systemManager.getAISystem();
        
        this.initMapWithType(this.selectedMapType);

        if (this.camera) {
            this.camera.setMap(this.map);
        }

        this.systemManager.initMapDependentSystems();
        this.inputHandler = this.systemManager.getInputHandler();
        this.pathfinding = this.systemManager.getPathfinding();
        this.buildingPlacementSystem = this.systemManager.getBuildingPlacementSystem();
        this.resourceGatheringSystem = this.systemManager.getResourceGatheringSystem();
        this.collisionSystem = this.systemManager.getCollisionSystem();
        this.fogOfWarSystem = this.systemManager.getFogOfWarSystem();

        // 【重要修复】在 CollisionSystem 初始化之后生成实体
        // 这样可以确保所有资源节点都能正确注册到碰撞系统
        if (this.mapDataForEntitySpawn) {
            const resourceCount = this.mapDataForEntitySpawn.resources?.length || 0;
            console.log(`[Game] CollisionSystem 初始化完成，开始生成 ${resourceCount} 个资源节点`);

            this.entityManager.spawnResourcesFromMapData(this.mapDataForEntitySpawn);

            if (this.selectedMapType === 'arabia' && this.mapDataForEntitySpawn.townCenters) {
                this.entityManager.spawnTownCenters(this.mapDataForEntitySpawn);
            }

            console.log(`[Game] 实体生成完成，CollisionSystem 中的资源节点数量: ${this.collisionSystem.getResourceNodes().length}`);

            this.mapDataForEntitySpawn = null;
        }

        this.selectionManager = new SelectionManager(this.formationSystem);

        this.initEntities();

        // 相机默认定位到我方城镇中心
        this.centerCameraOnTownCenter();
        if (this.fogOfWarSystem) {
            this.fogOfWarSystem.refreshVisibility();
            this.fogOfWarSystem.redrawFogTexture();
            this.fogOfWarSystem.updateEntityVisibility();
            this.fogOfWarSystem.initialized = true;
        }
        // 初始化资源管理器引用（player 在 initEntities 中创建，ResourceGatheringSystem 在此之前）
        if (this.resourceGatheringSystem) {
            this.resourceGatheringSystem.resourceManager = this.resourceManager;
        }

        this.uiManager.init();

        this.updateResourceDisplay();

        this.eventManager.setupEventListeners();

        // 绑定玩家事件监听器（人口变化、资源变化、时代变化等）
        this.bindPlayerEvents();

        // 初始化人口显示（在事件监听器设置之后）
        this.updatePopulationDisplay();

        this.render();
        this.canvas.style.visibility = 'visible';
        this.start();
        this.hideLoadingScreen();
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

        // 初始化 CSS2DRenderer（用于血条等 UI 元素）
        this.css2DRenderer = new CSS2DRenderer();
        this.css2DRenderer.setSize(window.innerWidth, window.innerHeight);
        this.css2DRenderer.domElement.style.position = 'absolute';
        this.css2DRenderer.domElement.style.top = '0';
        this.css2DRenderer.domElement.style.left = '0';
        this.css2DRenderer.domElement.style.pointerEvents = 'none';
        this.css2DRenderer.domElement.style.zIndex = '10';
        document.getElementById('game-container').appendChild(this.css2DRenderer.domElement);
    }

    async loadResources() {
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
        this.mapGenerator = new MapGenerator();
        this.mapSelectionPanel = new MapSelectionPanel(this);
        
        this.mapSelectionPanel.setOnMapSelected((mapType, civilization, players = []) => {
            this.selectedMapType = mapType;
            this.selectedCivilization = civilization || this.selectedCivilization;
            this.selectedPlayers = players;
            console.log(`地图选择完成: ${mapType}, 文明: ${this.selectedCivilization}, 玩家数: ${players.length || 1}`);
        });
    }

    async showMapSelection() {
        return new Promise((resolve) => {
            this.mapSelectionPanel.show();
            
            this.mapSelectionPanel.setOnMapSelected((mapType, civilization, players = []) => {
                this.selectedMapType = mapType;
                this.selectedCivilization = civilization || this.selectedCivilization;
                this.selectedPlayers = players;
                console.log(`已选择地图: ${mapType}, 文明: ${this.selectedCivilization}, 玩家数: ${players.length || 1}`);
                resolve();
            });
        });
    }

    initMapWithType(mapType) {
        const mapData = this.mapGenerator.generateMap(mapType);

        if (mapType === 'arabia' && mapData.townCenters) {
            for (const tc of mapData.townCenters) {
                this.mapGenerator.generateDefaultGoldClusters(mapData, tc.x, tc.y, 20);
            }
        } else {
            const tcPos = this.mapGenerator.getDefaultTownCenterPosition(mapData);
            this.mapGenerator.generateDefaultGoldClusters(mapData, tcPos.x, tcPos.y, 20);
        }

        this.map = new GameMap(mapData.width, mapData.height, 1);
        this.map.setMapGenerator(this.mapGenerator);
        this.map.setMapData(mapData);

        const mapMesh = this.map.init();
        this.scene.addEntity({ getMesh: () => mapMesh });

        const decorations = this.map.getDecorations();
        for (const decoration of decorations) {
            this.scene.addEntity({ getMesh: () => decoration });
        }

        // 【重要修改】将实体生成移到方法外部，在 CollisionSystem 初始化之后调用
        // 这样可以确保所有资源节点都能正确注册到碰撞系统
        this.mapDataForEntitySpawn = mapData;

        console.log(`已生成地图: ${mapType} (${mapData.width}x${mapData.height})`);
    }

    initMapOnly() {
        this.map = new GameMap(200, 200, 1);
        const mapMesh = this.map.init();
        this.scene.addEntity({ getMesh: () => mapMesh });

        const decorations = this.map.getDecorations();
        for (const decoration of decorations) {
            this.scene.addEntity({ getMesh: () => decoration });
        }
    }

    initEntities() {
        console.log('[Game] initEntities 开始');

        // 初始化玩家
        const humanPlayerConfig = this.selectedPlayers[0] || { civilization: this.selectedCivilization };
        this.player = new Player({
            id: HUMAN_OWNER,
            name: '玩家',
            gold: 200,
            wood: 200,    // 初始给一些资源用于测试
            food: 200,
            stone: 100,
            civilization: humanPlayerConfig.civilization || this.selectedCivilization,
            maxPopulation: 0  // 由建筑数量计算得出
        });

        console.log(`[Game] 玩家已创建, 初始人口: ${this.player.population.current}/${this.player.population.max}`);

        if (this.selectedMapType === 'arabia') {
            console.log('[Game] 初始化阿拉伯地图实体');
            this.entityManager.initArabiaEntities();
        } else {
            console.log('[Game] 初始化测试地图实体');
            this.entityManager.initTestUnits();
            this.entityManager.initTestBuildings();
            this.entityManager.initTestResources();
            this.entityManager.initTownCenter();
        }

        // 根据建筑计算初始人口上限
        console.log('[Game] 开始计算最大人口');
        this.player.calculateMaxPopulation(this.entityManager);

        console.log(`[Game] initEntities 完成, 人口: ${this.player.population.current}/${this.player.population.max}`);

        this.entityManager.registerUnitsToGatheringSystem();
        this.entityManager.registerResourceNodesToGatheringSystem();
    }

    normalizeBuildingType(buildingType) {
        return normalizeBuildingType(buildingType);
    }

    // 占地宽度（X轴方向格子数）
    getBuildingWidth(buildingType) {
        const normalizedType = normalizeBuildingType(buildingType);
        return BUILDING_CONFIG[normalizedType]?.width || 2;
    }

    // 占地纵深（Z轴方向格子数，即矩形的"高"）
    getBuildingDepth(buildingType) {
        const normalizedType = normalizeBuildingType(buildingType);
        return BUILDING_CONFIG[normalizedType]?.depth || 2;
    }

    // 离地高度（Y轴，建筑物的视觉高度）
    getBuildingHeight(buildingType) {
        const normalizedType = normalizeBuildingType(buildingType);
        return BUILDING_CONFIG[normalizedType]?.height || 2;
    }

    initIndependentSystems() {
        this.systemManager.initIndependentSystems();
        this.spatialIndex = this.systemManager.getSpatialIndex();
        this.formationSystem = this.systemManager.getFormationSystem();
        this.combatSystem = this.systemManager.getCombatSystem();
        this.aiSystem = this.systemManager.getAISystem();
    }
    
    initMapDependentSystems() {
        this.systemManager.initMapDependentSystems();
        this.inputHandler = this.systemManager.getInputHandler();
        this.pathfinding = this.systemManager.getPathfinding();
        this.buildingPlacementSystem = this.systemManager.getBuildingPlacementSystem();
        this.resourceGatheringSystem = this.systemManager.getResourceGatheringSystem();
        this.collisionSystem = this.systemManager.getCollisionSystem();
        this.fogOfWarSystem = this.systemManager.getFogOfWarSystem();
    }

    setupEventListeners() {
        this.eventManager.setupEventListeners();
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1); // cap to avoid spiral
        this.elapsedGameTime += deltaTime;
        this.updateCore(deltaTime);
        this.updateSystems(deltaTime);
        this.updateUI(deltaTime);
        this.updateEntities(deltaTime);
        this.render();
    }

    updateCore(deltaTime) {
        this.camera.update(deltaTime);
        this.scene.update(deltaTime);
    }

    updateSystems(deltaTime) {
        this.systemManager.update(deltaTime);
    }

    updateUI(deltaTime) {
        this.uiManager.update(deltaTime);
    }

    updateEntities(deltaTime) {
        this.entityManager.updateEntities(deltaTime);
    }

    render() {
        this.renderer.render(this.scene.getScene(), this.camera.getCamera());
        // 渲染 CSS2D 元素（血条等）
        if (this.css2DRenderer) {
            this.css2DRenderer.render(this.scene.getScene(), this.camera.getCamera());
        }
    }

    get entities() {
        return this.entityManager.getEntities();
    }

    get resourceManager() {
        return this.player?.resourceManager;
    }

    addEntity(entity) {
        this.entityManager.addEntity(entity);
    }

    removeEntity(entity) {
        this.entityManager.removeEntity(entity);
    }

    updateResourceDisplay() {
        this.uiManager.updateResourceDisplay();
    }

    updatePopulationDisplay() {
        if (!this.player) {
            console.log('[Game] updatePopulationDisplay: player 不存在');
            return;
        }

        console.log(`[Game] updatePopulationDisplay: ${this.player.population.current}/${this.player.population.max}`);

        const currentElement = document.getElementById('population-current');
        const maxElement = document.getElementById('population-max');

        if (currentElement) {
            currentElement.textContent = this.player.population.current;
        }
        if (maxElement) {
            maxElement.textContent = this.player.population.max;
        }
    }

    bindPlayerEvents() {
        this.eventManager.bindPlayerEvents();
    }

    onWindowResize() {
        this.eventManager.onWindowResize();
    }

    onKeyDown(event) {
        this.eventManager.onKeyDown(event);
    }

    onKeyUp(event) {
        this.eventManager.onKeyUp(event);
    }

    onMouseDown(event) {
        this.eventManager.onMouseDown(event);
    }
    
    onMouseUp(event) {
        this.eventManager.onMouseUp(event);
    }    

    onMouseMove(event) {
        this.eventManager.onMouseMove(event);
    }
    
    onWheel(event) {
        this.eventManager.onWheel(event);
    }
    
    onContextMenu(event) {
        this.eventManager.onContextMenu(event);
    }
    
    handleLeftClick(event) {
        if (!this.inputHandler || !this.selectionManager) return;

        if (this.hud?.actionPanel?.isSettingRallyPoint()) {
            const worldPos = this.inputHandler.getWorldPosition();
            this.hud.actionPanel.setRallyPoint(new THREE.Vector3(worldPos.x, 0, worldPos.z));
            return;
        }

        if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
            const worldPos = this.inputHandler.getWorldPosition();
            const result = this.buildingPlacementSystem.placeBuilding(
                worldPos,
                this.player.resourceManager
            );

            // 墙壁拖拽建造返回数组
            if (Array.isArray(result)) {
                result.forEach(building => {
                    this.addEntity(building);
                });
                if (result.length > 0) {
                    console.log(`[建造] 建造了 ${result.length} 段城墙`);
                }
                return;
            }

            // 普通建筑放置
            if (result) {
                this.addEntity(result);

                // 让选中的村民去建造（而不是自动分配）
                const selectedVillagers = this.selectionManager.selectedEntities.filter(
                    e => e.isAlive && e.type === 'unit' && e.unitType === 'villager' && e.isPlayerOwned()
                );

                if (selectedVillagers.length > 0) {
                    console.log(`[建造] ${selectedVillagers.length} 个村民将建造 ${result.buildingType}`);
                    for (const villager of selectedVillagers) {
                        villager.sendToBuild(result);
                    }
                } else {
                    console.warn('[建造] 没有选中的村民，建筑将停留在建造状态');
                }
            }
            return;
        }

        const pickedEntity = this.pickAtMouse(event);
        const now = Date.now();

        if (pickedEntity) {
            if (this.hud?.actionPanel?.isGarrisonCommandActive()) {
                if (this.hud.actionPanel.executeGarrisonCommand(pickedEntity)) {
                    return;
                }
            }

            // 双击同类可选实体 → 选择视角内所有同类实体
            if (this.canDoubleClickSelectSameType(pickedEntity)) {
                if (pickedEntity.id === this.lastClickedEntityId &&
                    now - this.lastClickTime < this.doubleClickThreshold) {
                    this.selectAllSameTypeInView(pickedEntity);
                    this.lastClickTime = 0;
                    this.lastClickedEntityId = null;
                    return;
                }
                this.lastClickTime = now;
                this.lastClickedEntityId = pickedEntity.id;
            } else {
                this.lastClickTime = 0;
                this.lastClickedEntityId = null;
            }

            // 绵羊选择：己方绵羊可被选中（独立选择，不与普通单位/建筑混选）
            if (pickedEntity.type === 'resource' && pickedEntity.isSheep && pickedEntity.isPlayerOwned()) {
                this.selectionManager.deselectAll();
                this.selectionManager.selectEntity(pickedEntity, false);
                return;
            }

            // Ctrl+点击同类型建筑 → 追加选择；普通点击 → 替换选择
            const addToSelection = event.ctrlKey && pickedEntity.type === 'building';

            this.handleEntitySelection(pickedEntity, addToSelection);
            return;
        }

        // 点击空地：取消所有选择
        this.selectionManager.deselectAll();
        this.lastClickTime = 0;
        this.lastClickedEntityId = null;
    }

    pickAtMouse(event = null) {
        if (!this.inputHandler || !this.scene) return null;
        
        const raycaster = this.inputHandler.getRaycaster();
        
        let mousePos;
        if (event && event.clientX !== undefined) {
            mousePos = { x: event.clientX, y: event.clientY };
        } else {
            mousePos = this.inputHandler.getMousePosition();
        }
        
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        const ndcX = ((mousePos.x - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((mousePos.y - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera.getCamera());
        
        const intersects = raycaster.intersectObjects(this.scene.getScene().children, true);
        
        for (const intersect of intersects) {
            let currentObj = intersect.object;
            
            while (currentObj) {
                if (currentObj.userData && currentObj.userData.entity) {
                    const entity = currentObj.userData.entity;
                    if (!this.fogOfWarSystem || this.fogOfWarSystem.isEntitySelectable(entity)) {
                        return entity;
                    }
                    break;
                }
                currentObj = currentObj.parent;
            }
        }
        
        return null;
    }
    
    handleRightClick(event) {
        // 建筑放置模式下右键取消放置
        if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
            this.buildingPlacementSystem.cancelPlacement();
            // 取消 ActionPanel 按钮的激活状态
            if (this.hud && this.hud.actionPanel) {
                this.hud.actionPanel.clearActiveBuildingButton();
            }
            return;
        }

        if (!this.selectionManager || !this.inputHandler || !this.spatialIndex) {
            console.log('[handleRightClick] early return: selectionManager=', !!this.selectionManager, 'inputHandler=', !!this.inputHandler, 'spatialIndex=', !!this.spatialIndex);
            return;
        }

        this.inputHandler.updateWorldPosition(event.clientX, event.clientY);
        const worldPos = this.inputHandler.getWorldPosition();

        if (!this.selectionManager.hasSelection()) {
            console.log('[handleRightClick] no selection, returning. selectedEntities count:', this.selectionManager.selectedEntities.length);
            return;
        }

        console.log('[handleRightClick] worldPos:', worldPos, 'selectedEntities:', this.selectionManager.selectedEntities.length, 'type:', this.selectionManager.selectionType);

        if (this.trySetSelectedBuildingRallyPoint(worldPos)) {
            return;
        }

        const nearbyEntities = this.spatialIndex
            .queryPoint(worldPos.x, worldPos.z, 1.5)
            .filter(entity => !this.fogOfWarSystem || this.fogOfWarSystem.isEntitySelectable(entity));

        // 如果选中的是己方绵羊，右键移动所有被选中的己方绵羊
        if (this.selectionManager.selectionType === 'resource') {
            const selectedSheep = this.selectionManager.selectedEntities.filter(entity =>
                entity.isAlive &&
                entity.type === 'resource' &&
                entity.isSheep &&
                entity.sheepState === 'owned' &&
                entity.isPlayerOwned()
            );

            if (selectedSheep.length > 0) {
                for (const sheep of selectedSheep) {
                    sheep.setSheepTarget(worldPos);
                }
                return;
            }
        }

        const selectedVillagers = this.selectionManager.selectedEntities.filter(
            e => e.isAlive && e.type === 'unit' && e.unitType === 'villager' && e.isPlayerOwned()
        );

        for (const entity of nearbyEntities) {
            if (!entity.isAlive) continue;

            // 携带资源的村民右键投放点建筑 → 投放资源（优先级最高）
            if (entity.type === 'building' && entity.isPlayerOwned() && selectedVillagers.length > 0) {
                const villagersWithResources = selectedVillagers.filter(v => v.carryAmount > 0 && v.carryType);
                if (villagersWithResources.length > 0) {
                    const dropOff = this.resourceGatheringSystem.dropOffPoints.find(
                        p => p.building === entity && p.resourceTypes.includes(villagersWithResources[0].carryType)
                    );
                    if (dropOff) {
                        for (const v of villagersWithResources) {
                            v.dropOffPoint = entity;
                            v.manualDropOff = true;
                            this.resourceGatheringSystem.returnToDropOff(v);
                        }
                        return;
                    }
                }
            }

            // 绵羊捕获+宰杀：村民右键绵羊 → 移动到附近（自动捕获）后宰杀采集
            if (entity.type === 'resource' && entity.isSheep && selectedVillagers.length > 0) {
                if (entity.sheepState === 'wild') {
                    // 野生绵羊：检查村民是否已在附近（2格内），是则立即捕获
                    const villager = selectedVillagers[0];
                    const dist = Math.sqrt(
                        (villager.position.x - entity.position.x) ** 2 +
                        (villager.position.z - entity.position.z) ** 2
                    );
                    if (dist <= 2) {
                        entity.capture(villager.owner);
                        // 捕获后立即宰杀+采集
                        if (entity.sheepState === 'owned' && entity.isPlayerOwned()) {
                            if (entity.showGatherIndicator) entity.showGatherIndicator();
                            entity.startSlaughter();
                            this.selectionManager.issueCommand('gather', entity);
                        }
                        return;
                    }
                    // 太远：发送村民移动到绵羊附近，由自动捕获机制处理
                    const targetPos = this.resourceGatheringSystem.getGatherTarget(entity.position, villager.position);
                    for (const v of selectedVillagers) {
                        v.moveTo(targetPos, { preserveGathering: true });
                    }
                    return;
                }
                if (entity.sheepState === 'owned' && entity.isPlayerOwned()) {
                    if (entity.showGatherIndicator) entity.showGatherIndicator();
                    entity.startSlaughter();
                    this.selectionManager.issueCommand('gather', entity);
                    return;
                }
                // 绵羊已在宰杀中：直接下达采集命令
                if (entity.sheepState === 'slaughtering') {
                    if (entity.showGatherIndicator) entity.showGatherIndicator();
                    this.selectionManager.issueCommand('gather', entity);
                    return;
                }
            }

            // 村民右键可驻扎建筑 → 驻扎
            if (entity.type === 'building' && selectedVillagers.some(v => entity.canGarrisonUnit?.(v))) {
                for (const v of selectedVillagers) {
                    v.garrisonTo(entity);
                }
                return;
            }

            // 资源采集（排除已捕获的绵羊 - 它们不是普通资源）
            if (entity.type === 'resource' && !entity.isSheep) {
                if (entity.showGatherIndicator) entity.showGatherIndicator();
                this.selectionManager.issueCommand('gather', entity);
                return;
            }
        }

        for (const entity of nearbyEntities) {
            if (entity.type === 'building' && entity.isUnderConstruction && entity.isAlive) {
                if (this.selectionManager.selectionType === 'unit') {
                    this.selectionManager.issueCommand('build', entity);
                    return;
                }
            }
        }

        this.selectionManager.issueMoveCommand(new THREE.Vector3(worldPos.x, 0, worldPos.z));
    }

    trySetSelectedBuildingRallyPoint(worldPos) {
        const selected = this.selectionManager?.selectedEntities || [];
        if (selected.length !== 1) return false;

        const building = selected[0];
        if (building.type !== 'building' || !building.isPlayerOwned?.() || !building.setRallyPoint) {
            return false;
        }

        const canSetRallyPoint = building.buildingType === BUILDING_TYPES.TOWN_CENTER ||
            Boolean(building.buildingFeatures?.isMilitary);
        if (!canSetRallyPoint) return false;

        building.setRallyPoint(new THREE.Vector3(worldPos.x, 0, worldPos.z));
        this.hud?.showNotification('集结点已设置', 1200);
        return true;
    }
    
    handleDragSelection(event) {
        if (!this.inputHandler || !this.selectionManager) return;
        
        const dragSelection = this.inputHandler.getDragSelection();
        
        if (dragSelection && this.inputHandler.isDragging) {
            this.performBoxSelection(dragSelection);
            this.inputHandler.clearDragSelection();
        }
    }
    
    performBoxSelection(dragSelection) {
        const { start, end } = dragSelection;
        
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        if (maxX - minX < 10 && maxY - minY < 10) {
            return;
        }
        
        const selectedEntities = [];
        
        for (const entity of this.entityManager.getEntities()) {
            if (!entity.isAlive) continue;
            if (!entity.mesh) continue;
            if (this.fogOfWarSystem && !this.fogOfWarSystem.isEntitySelectable(entity)) continue;
            
            const entityPosition = entity.getPosition();
            const screenPosition = entityPosition.clone().project(this.camera.getCamera());
            
            const screenX = (screenPosition.x + 1) / 2 * window.innerWidth;
            const screenY = (-screenPosition.y + 1) / 2 * window.innerHeight;
            
            if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
                if (entity.isPlayerOwned()) {
                    selectedEntities.push(entity);
                }
            }
        }

        if (selectedEntities.length > 0) {
            // 优先规则：如果同时含有人物和建筑，则排除建筑只选人物
            const hasUnit = selectedEntities.some(e => e.type === 'unit');
            const hasBuilding = selectedEntities.some(e => e.type === 'building');
            let finalSelection = selectedEntities;
            if (hasUnit && hasBuilding) {
                finalSelection = selectedEntities.filter(e => e.type !== 'building');
                console.log(`[框选] 混合选择 → 优先人物，排除 ${selectedEntities.length - finalSelection.length} 个建筑`);
            }

            this.selectionManager.selectEntities(finalSelection, false);
            console.log(`框选了 ${finalSelection.length} 个单位`);
        }
    }
    
    createClickEffect(clientX, clientY) {
        const clickEffect = document.getElementById('click-effect');
        if (!clickEffect) return;
        
        clickEffect.style.left = `${clientX - 20}px`;
        clickEffect.style.top = `${clientY - 20}px`;
        clickEffect.style.width = '40px';
        clickEffect.style.height = '40px';
        clickEffect.style.borderRadius = '50%';
        clickEffect.style.border = '3px solid rgba(255, 255, 255, 0.8)';
        clickEffect.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
        clickEffect.style.opacity = '1';
        
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
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
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

    canDoubleClickSelectSameType(entity) {
        if (!entity || !entity.isAlive || !entity.isPlayerOwned()) return false;
        if (entity.type === 'unit') return Boolean(entity.unitType);
        return entity.type === 'resource' && entity.isSheep;
    }

    /**
     * 双击单位/绵羊时选择当前视角范围内的所有己方同类实体
     */
    selectAllSameTypeInView(sourceEntity) {
        if (!this.camera || !this.entityManager || !this.selectionManager) return;

        const target = this.camera.target;
        const zoom = this.camera.zoomLevel;
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;

        // 正交相机可见范围（地面投影，45度倾斜补偿）
        const halfWidth = zoom * aspect / 2;
        const halfDepth = zoom / 2 * Math.SQRT2;  // 45° 倾斜拉伸

        const minX = target.x - halfWidth;
        const maxX = target.x + halfWidth;
        const minZ = target.z - halfDepth;
        const maxZ = target.z + halfDepth;

        const sameTypeEntities = this.entityManager.entities.filter(e =>
            e.isAlive &&
            this.isSameDoubleClickSelectionType(e, sourceEntity) &&
            e.isPlayerOwned() &&
            (!this.fogOfWarSystem || this.fogOfWarSystem.isEntitySelectable(e)) &&
            e.position.x >= minX && e.position.x <= maxX &&
            e.position.z >= minZ && e.position.z <= maxZ
        );

        if (sameTypeEntities.length === 0) return;

        this.selectionManager.deselectAll();
        this.selectionManager.selectEntities(sameTypeEntities, false);
        console.log(`[双击] 选择了视角内 ${sameTypeEntities.length} 个${this.getDoubleClickSelectionLabel(sourceEntity)}`);
    }

    isSameDoubleClickSelectionType(entity, sourceEntity) {
        if (!entity || !sourceEntity) return false;
        if (sourceEntity.type === 'unit') {
            return entity.type === 'unit' && entity.unitType === sourceEntity.unitType;
        }

        if (sourceEntity.type === 'resource' && sourceEntity.isSheep) {
            return entity.type === 'resource' && entity.isSheep;
        }

        return false;
    }

    getDoubleClickSelectionLabel(entity) {
        if (entity?.type === 'resource' && entity.isSheep) return '绵羊';
        return entity?.unitType || '单位';
    }

    /**
     * 将相机定位到我方城镇中心
     */
    centerCameraOnTownCenter() {
        if (!this.camera || !this.entityManager) return;

        const tc = this.entityManager.entities.find(e =>
            e.isAlive &&
            e.type === 'building' &&
            e.buildingType === BUILDING_TYPES.TOWN_CENTER &&
            e.isPlayerOwned()
        );

        if (tc) {
            this.camera.target.set(tc.position.x, 0, tc.position.z);
            this.camera.updateCameraPosition();
            console.log(`[相机] 已定位到我方城镇中心 (${tc.position.x.toFixed(1)}, ${tc.position.z.toFixed(1)})`);
        }
    }

    handleEntitySelection(entity, addToSelection) {
        console.log('[handleEntitySelection] entity:', entity, 'isAlive:', entity?.isAlive, 'userData:', entity?.userData);
        if (!this.selectionManager) return;

        let actualEntity = entity;

        if (entity.userData && entity.userData.entity) {
            actualEntity = entity.userData.entity;
        } else if (entity.isAlive === undefined) {
            actualEntity = this.entityManager.getEntities().find(e => e.mesh === entity || e.mesh === entity.parent);
        }

        console.log('[handleEntitySelection] actualEntity:', actualEntity, 'isAlive:', actualEntity?.isAlive);

        if (!actualEntity || !actualEntity.isAlive) return;
        if (this.fogOfWarSystem && !this.fogOfWarSystem.isEntitySelectable(actualEntity)) return;

        this.selectionManager.selectEntity(actualEntity, addToSelection);
    }

    getUnitConfig(unitType) {
        const configs = {
            villager:  { health: 25, speed: 5, attackDamage: 3,  attackRange: 1, attackSpeed: 1,   armor: 0, sightRange: 4 },
            soldier:   { health: 40, speed: 4, attackDamage: 6,  attackRange: 1, attackSpeed: 1,   armor: 1, sightRange: 4 },
            knight:    { health: 60, speed: 6, attackDamage: 10, attackRange: 1, attackSpeed: 0.8, armor: 2, sightRange: 4 },
            archer:    { health: 30, speed: 4, attackDamage: 5,  attackRange: 5, attackSpeed: 1.2, armor: 0, sightRange: 6 },
            scout:     { health: 35, speed: 8, attackDamage: 3,  attackRange: 1, attackSpeed: 1.5, armor: 0, sightRange: 6 }
        };
        const config = { ...(configs[unitType] || configs.soldier) };
        if (this.player && (unitType === 'knight' || unitType === 'scout') && this.player.getAgeLevel() >= 2) {
            config.health = Math.round(config.health * this.player.getBonus('cavalryHealthMultiplierFromFeudal', 1.0));
            if (unitType === 'knight') {
                config.sightRange += this.player.getBonus('knightSightBonus', 0);
            }
        }
        return config;
    }

    applyResearch(building, techType) {
        if (this.player) {
            this.player.completeResearch(techType);
        }
        if (this.hud?.actionPanel?.currentSelectedBuilding === building) {
            this.hud.actionPanel.switchToPreset(`${building.buildingType}_production`);
        }
        console.log(`[Game] 科技研究完成: ${techType}`);
    }

    spawnUnitFromBuilding(building, unitType) {
        return this.entityManager.spawnUnitFromBuilding(building, unitType);
    }

    assignBuilderToBuilding(building) {
        return this.entityManager.assignBuilderToBuilding(building);
    }

    selectTownCenter() {
        this.entityManager.selectTownCenter();
    }

    toggleCollisionVisuals() {
        this.entityManager.toggleCollisionVisuals();
    }

    /**
     * 调试接口：打印指定区域内的网格状态
     * @param {number} x - 中心世界坐标X
     * @param {number} z - 中心世界坐标Z
     * @param {number} radius - 半径（格子数）
     */
    debugPrintGridArea(x, z, radius = 10) {
        if (!this.map || !this.map.grid) {
            console.error('地图未初始化');
            return;
        }
        this.map.grid.debugPrintArea(x, z, radius);
    }

    /**
     * 调试接口：打印指定位置的格子状态
     * @param {number} x - 世界坐标X
     * @param {number} z - 世界坐标Z
     */
    debugPrintCell(x, z) {
        if (!this.map || !this.map.grid) {
            console.error('地图未初始化');
            return;
        }
        this.map.grid.debugPrintCell(x, z);
    }

    /**
     * 调试接口：打印所有资源节点的位置和占用信息
     */
    debugPrintResources() {
        if (!this.collisionSystem) {
            console.error('碰撞系统未初始化');
            return;
        }

        const resources = this.collisionSystem.getResourceNodes();
        console.log(`\n========== 资源节点调试信息 ==========`);
        console.log(`资源节点总数: ${resources.length}`);

        const byType = {};
        resources.forEach(r => {
            if (!byType[r.resourceType]) {
                byType[r.resourceType] = [];
            }
            byType[r.resourceType].push(r);
        });

        console.log(`\n按类型分组:`);
        for (const [type, list] of Object.entries(byType)) {
            console.log(`  ${type}: ${list.length} 个`);
        }

        console.log(`\n所有资源节点详细信息:`);
        resources.forEach(r => {
            const cells = r.getOccupiedGridCells ? r.getOccupiedGridCells(this.map.grid.cellSize) : [];
            console.log(`\n  名称: ${r.name}`);
            console.log(`    类型: ${r.resourceType}`);
            console.log(`    位置: (${r.position.x.toFixed(1)}, ${r.position.z.toFixed(1)})`);
            console.log(`    占用格子数: ${cells.length}`);
            console.log(`    占用格子: ${cells.map(c => `(${c.x}, ${c.z})`).join(', ')}`);
        });

        console.log(`=======================================\n`);
    }
}

// 全局调试函数
if (typeof window !== 'undefined') {
    window.gameDebug = {
        /**
         * 打印指定区域内的网格状态
         * @param {number} x - 中心世界坐标X
         * @param {number} z - 中心世界坐标Z
         * @param {number} radius - 半径（格子数）
         */
        printGridArea: (x, z, radius) => {
            if (window.game) {
                window.game.debugPrintGridArea(x, z, radius);
            }
        },

        /**
         * 打印指定位置的格子状态
         * @param {number} x - 世界坐标X
         * @param {number} z - 世界坐标Z
         */
        printCell: (x, z) => {
            if (window.game) {
                window.game.debugPrintCell(x, z);
            }
        },

        /**
         * 打印所有资源节点的信息
         */
        printResources: () => {
            if (window.game) {
                window.game.debugPrintResources();
            }
        },

        /**
         * 获取游戏实例
         */
        getGame: () => window.game,

        /**
         * 获取网格实例
         */
        getGrid: () => window.game?.map?.grid,

        /**
         * 获取碰撞系统实例
         */
        getCollisionSystem: () => window.game?.collisionSystem,

        /**
         * 获取寻路系统实例
         */
        getPathfinding: () => window.game?.pathfinding
    };
}

export default Game;

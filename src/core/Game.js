import * as THREE from 'three';
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
import { HUMAN_OWNER } from '../config.js';
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
        this.isRunning = false;
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
        this.aiSystem = null;
        this.hud = null;

        this.mapGenerator = null;
        this.mapSelectionPanel = null;
        this.selectedMapType = 'arabia';

        this.spatialIndex = null;

        this.uiUpdateTimer = 0;
        this.uiUpdateInterval = 1;

        this.showCollisionVisuals = false;
    }

    async init() {
        this.canvas = document.getElementById('canvas');
        
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

        this.uiManager.init();
        
        this.initEntities();
        
        this.eventManager.setupEventListeners();
        
        this.hideLoadingScreen();
        
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
        
        this.mapSelectionPanel.setOnMapSelected((mapType) => {
            this.selectedMapType = mapType;
            console.log(`地图选择完成: ${mapType}`);
        });
    }

    async showMapSelection() {
        return new Promise((resolve) => {
            this.mapSelectionPanel.show();
            
            this.mapSelectionPanel.setOnMapSelected((mapType) => {
                this.selectedMapType = mapType;
                console.log(`已选择地图: ${mapType}`);
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
        // 初始化玩家
        this.player = new Player({
            id: HUMAN_OWNER,
            name: '玩家',
            gold: 0,
            wood: 200,    // 初始给一些资源用于测试
            food: 200,
            stone: 100,
            maxPopulation: 20
        });

        if (this.selectedMapType === 'arabia') {
            this.entityManager.initArabiaEntities();
        } else {
            this.entityManager.initTestUnits();
            this.entityManager.initTestBuildings();
            this.entityManager.initTestResources();
            this.entityManager.initTownCenter();
        }

        this.entityManager.registerUnitsToGatheringSystem();
        this.entityManager.registerResourceNodesToGatheringSystem();

        this.updateResourceDisplay();
    }

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
        
        const deltaTime = this.clock.getDelta();
        
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

        if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
            const worldPos = this.inputHandler.getWorldPosition();
            const building = this.buildingPlacementSystem.placeBuilding(
                worldPos,
                this.player.resourceManager
            );
            if (building) {
                this.addEntity(building);

                // 让选中的村民去建造（而不是自动分配）
                const selectedVillagers = this.selectionManager.selectedEntities.filter(
                    e => e.isAlive && e.type === 'unit' && e.unitType === 'villager' && e.isPlayerOwned()
                );

                if (selectedVillagers.length > 0) {
                    console.log(`[建造] ${selectedVillagers.length} 个村民将建造 ${building.buildingType}`);
                    for (const villager of selectedVillagers) {
                        villager.sendToBuild(building);
                    }
                } else {
                    console.warn('[建造] 没有选中的村民，建筑将停留在建造状态');
                }
            }
            return;
        }

        const pickedEntity = this.pickAtMouse(event);

        if (pickedEntity) {
            this.handleEntitySelection(pickedEntity, event.shiftKey);
            return;
        }
        
        this.selectionManager.deselectAll();
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

        this.inputHandler.updateWorldPosition(event.clientX, event.clientY);
        const worldPos = this.inputHandler.getWorldPosition();

        if (!this.selectionManager.hasSelection()) {
            console.log('[handleRightClick] no selection, returning. selectedEntities count:', this.selectionManager.selectedEntities.length);
            return;
        }

        console.log('[handleRightClick] worldPos:', worldPos, 'selectedEntities:', this.selectionManager.selectedEntities.length, 'type:', this.selectionManager.selectionType);

        const nearbyEntities = this.spatialIndex.queryPoint(worldPos.x, worldPos.z, 0.05);

        for (const entity of nearbyEntities) {
            if (entity.type === 'resource' && entity.isAlive) {
                console.log('[handleRightClick] 找到资源节点:', entity.resourceType, '中心:', entity.position);
                
                if (entity.showGatherIndicator) {
                    entity.showGatherIndicator();
                }
                
                const townCenter = this.entityManager.getEntities().find(e => 
                    e.type === 'building' && 
                    e.buildingType === 'town_center' &&
                    e.isAlive
                );
                
                this.selectionManager.issueCommand('gather', entity, townCenter);
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

        console.log('[handleRightClick] 未点击到资源节点，执行移动命令');
        this.selectionManager.issueMoveCommand(new THREE.Vector3(worldPos.x, 0, worldPos.z));
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
            this.selectionManager.selectEntities(selectedEntities, false);
            console.log(`框选了 ${selectedEntities.length} 个单位`);
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
        return configs[unitType] || configs.soldier;
    }

    applyResearch(building, techType) {
        if (this.player) {
            this.player.completeResearch(techType);
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

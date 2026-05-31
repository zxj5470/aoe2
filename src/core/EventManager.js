import { BUILDING_TYPES } from '../config.js';

class EventManager {
    constructor(game) {
        this.game = game;
        this.listeners = new Map();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        this.game.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.game.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.game.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.game.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            for (const callback of callbacks) {
                callback(data);
            }
        }
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.game.camera.resize(width, height);
        this.game.renderer.setSize(width, height);
    }

    onKeyDown(event) {
        this.game.camera.handleKeyDown(event);

        // Tab 键旋转建筑（放置模式下）
        if (event.key === 'Tab') {
            if (this.game.buildingPlacementSystem && this.game.buildingPlacementSystem.isPlacing) {
                event.preventDefault();
                const rotated = this.game.buildingPlacementSystem.rotatePlacement();
                if (rotated) {
                    console.log('[EventManager] Tab: 旋转建筑');
                }
                return;
            }
        }

        // Escape 键取消建筑放置
        if (event.key === 'Escape') {
            if (this.game.buildingPlacementSystem && this.game.buildingPlacementSystem.isPlacing) {
                this.game.buildingPlacementSystem.cancelPlacement();
                if (this.game.hud && this.game.hud.actionPanel) {
                    this.game.hud.actionPanel.clearActiveBuildingButton();
                }
                return;
            }
        }
        
        if (event.key === 'F12' || event.keyCode === 123) {
            event.preventDefault();
            event.stopPropagation();
            if (this.game.hud) {
                this.game.hud.toggleDebugPanel();
                console.log('F12键触发，debug面板切换');
            } else {
                console.error('HUD不存在，无法切换debug面板');
            }
        }
        
        if (event.key === '1') {
            if (this.game.hud) {
                this.game.hud.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
                console.log('建筑面板布局：3行5列（默认）');
            }
        }
        if (event.key === '2') {
            if (this.game.hud) {
                this.game.hud.updateBuildingPanelConfig({ rows: 4, cols: 3, totalButtons: 12 });
                console.log('建筑面板布局：4行3列');
            }
        }
        if (event.key === '3') {
            if (this.game.hud) {
                this.game.hud.updateBuildingPanelConfig({ rows: 4, cols: 4, totalButtons: 16 });
                console.log('建筑面板布局：4行4列');
            }
        }
        
        if (event.key === 'q' || event.key === 'Q') {
            if (this.game.hud) {
                this.game.hud.setButtonEmpty(1, true);
                console.log('兵营已设置为空白占位（type: empty）');
            }
        }
        
        if (event.key === 'e' || event.key === 'E') {
            if (this.game.hud) {
                this.game.hud.enableButton(1, {
                    icon: '⚔️',
                    name: '兵营',
                    id: BUILDING_TYPES.BARRACKS,
                    type: 'military'
                });
                console.log('兵营已启用');
            }
        }
        
        if (event.key === 'r' || event.key === 'R') {
            if (this.game.hud) {
                const allIndices = Array.from({ length: 15 }, (_, i) => i);
                allIndices.forEach(i => this.game.hud.enableButton(i));
                console.log('所有按钮已重置');
            }
        }
        
        if (event.key === 'v' || event.key === 'V') {
            if (this.game.hud) {
                this.game.hud.nextPreset();
            }
        }
        
        if (event.ctrlKey || event.metaKey) {
            if (this.game.selectionManager) {
                const formationTypes = ['line', 'column', 'square', 'wedge', 'circle'];
                const formationNames = ['线形编队', '列形编队', '方形编队', '楔形编队', '圆形编队'];

                for (let i = 1; i <= 5; i++) {
                    if (event.key === i.toString()) {
                        this.game.selectionManager.setFormationType(formationTypes[i - 1]);
                        console.log(`编队类型已切换为：${formationNames[i - 1]}`);
                        event.preventDefault();
                        break;
                    }
                }
            }
        }

        if (event.key === 'c' || event.key === 'C') {
            this.game.entityManager.toggleCollisionVisuals();
        }

        // 命令面板按钮上的大写字母 → 对应命令
        if (/^[a-zA-Z]$/.test(event.key)) {
            const hud = this.game.hud;
            if (hud && hud.actionPanel && hud.actionPanel.getCurrentPreset() !== 'empty') {
                const handled = hud.actionPanel.triggerHotButtonByKey(event.key);
                if (handled) {
                    event.preventDefault();
                    return;
                }
            }
        }

        if (event.key === 'h' || event.key === 'H') {
            this.game.centerCameraOnTownCenter();
            this.game.entityManager.selectTownCenter();
        }
    }

    onKeyUp(event) {
        this.game.camera.handleKeyUp(event);
    }

    onMouseDown(event) {
        this.game.camera.handleMouseDown(event);
        
        if (event.button === 0) {
            this.game.handleLeftClick(event);
        }
    }
    
    onMouseUp(event) {
        this.game.camera.handleMouseUp(event);
        
        if (event.button === 2) {
            this.game.handleRightClick(event);
        }
        
        if (event.button === 0) {
            this.game.handleDragSelection(event);
            this.game.hideDragSelectionVisual();
        }
    }    

    onMouseMove(event) {
        this.game.camera.handleMouseMove(event);

        if (this.game.inputHandler) {
            this.game.inputHandler.onMouseMove(event);
        }

        // 更新建筑放置预览
        if (this.game.buildingPlacementSystem && this.game.buildingPlacementSystem.isPlacing) {
            const worldPos = this.game.inputHandler.getWorldPosition();
            this.game.buildingPlacementSystem.updatePreview(worldPos);
        }

        // 检测鼠标悬停在单位或建筑上，触发血条显示/隐藏
        this.updateEntityHoverState(event);
    }

    updateEntityHoverState(event) {
        if (!this.game.entityManager) return;
        const entities = this.game.entityManager.getEntities();
        const hoveredEntity = this.game.pickAtMouse(event);
        // 重置所有实体（单位或建筑）的悬停状态
        for (const entity of entities) {
            if ((entity.type === 'building' || entity.type === 'unit' || entity.type === 'resource') && entity.onHoverOut) {
                if (entity === hoveredEntity) {
                    entity.onHover();
                } else {
                    entity.onHoverOut();
                }
            }
        }
        // 鼠标样式变化：选中村民时，hover到可采集资源显示手型
        this.updateCursorStyle(hoveredEntity);
    }
    /**
     * 更新鼠标样式
     */
    updateCursorStyle(hoveredEntity) {
        const canvas = this.game.canvas;
        if (!canvas) return;
        // 检查是否选中了村民
        const selectedVillagers = this.game.selectionManager ?
            this.game.selectionManager.selectedEntities.filter(
                e => e.isAlive && e.type === 'unit' && e.unitType === 'villager' && e.isPlayerOwned()
            ) : [];
        const hasSelectedVillager = selectedVillagers.length > 0;
        if (hasSelectedVillager && hoveredEntity) {
            // 可采集资源类型（包括绵羊）
            const isGatherable = hoveredEntity.type === 'resource' &&
                (hoveredEntity.resourceType === 'wood' ||
                 hoveredEntity.resourceType === 'food' ||
                 hoveredEntity.resourceType === 'gold' ||
                 hoveredEntity.resourceType === 'stone' ||
                 hoveredEntity.isSheep);
            // 正在建造的建筑
            const isBuildable = hoveredEntity.type === 'building' &&
                hoveredEntity.isUnderConstruction && hoveredEntity.isAlive;
            // 携带资源的村民悬停在投放点建筑上
            const isDropOff = hoveredEntity.type === 'building' && hoveredEntity.isPlayerOwned() &&
                selectedVillagers.some(v => v.carryAmount > 0 && v.carryType) &&
                this.game.resourceGatheringSystem &&
                this.game.resourceGatheringSystem.dropOffPoints.some(
                    p => p.building === hoveredEntity
                );
            if (isGatherable || isBuildable || isDropOff) {
                canvas.style.cursor = 'pointer';
                return;
            }
        }
        // 默认鼠标样式
        canvas.style.cursor = 'default';
    }
    
    onWheel(event) {
        // 放置模式下：鼠标滚轮旋转可旋转建筑
        if (this.game.buildingPlacementSystem && this.game.buildingPlacementSystem.isPlacing) {
            const rotated = this.game.buildingPlacementSystem.rotatePlacement();
            if (rotated) {
                event.preventDefault();
                return;
            }
        }
        this.game.camera.handleWheel(event);
    }
    
    onContextMenu(event) {
        event.preventDefault();
        this.game.camera.handleContextMenu(event);
    }

    bindPlayerEvents() {
        this.game.player.on('ageChange', (data) => {
            console.log(`[Player Event] 时代变化: ${data.oldLevel} -> ${data.newLevel} (${data.ageName})`);
            
            const townCenter = this.game.entityManager.getEntities().find(e => e.buildingType === BUILDING_TYPES.TOWN_CENTER);
            if (townCenter) {
                townCenter.setAgeLevel(data.newLevel);
            }
            
            const ageElement = document.getElementById('age-display');
            if (ageElement) {
                ageElement.textContent = data.ageName;
            }
            
            const ageIconElement = document.getElementById('age-icon');
            if (ageIconElement) {
                ageIconElement.textContent = data.romanNumeral;
            }
        });
        
        this.game.player.on('resourceChange', (data) => {
            console.log(`[Player Event] 资源变化: ${data.type} ${data.oldAmount} -> ${data.newAmount}`);
            
            this.game.resources[data.type] = data.newAmount;
            this.game.updateResourceDisplay();
        });
        
        this.game.player.on('populationChange', (data) => {
            console.log(`[Player Event] 人口变化: ${data.oldCurrent}/${data.oldMax} -> ${data.newCurrent}/${data.newMax}`);

            // 更新人口显示
            const currentElement = document.getElementById('population-current');
            const maxElement = document.getElementById('population-max');
            if (currentElement) {
                currentElement.textContent = data.newCurrent;
            }
            if (maxElement) {
                maxElement.textContent = data.newMax;
            }
        });
        
        this.game.player.on('unitAdd', (data) => {
            console.log(`[Player Event] 单位添加: ${data.unit.unitType}`);
        });
        
        this.game.player.on('unitRemove', (data) => {
            console.log(`[Player Event] 单位移除: ${data.unit.unitType}`);
        });
    }
}

export default EventManager;

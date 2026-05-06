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
                    id: 'barracks',
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

        if (event.key === 'h' || event.key === 'H') {
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
            if ((entity.type === 'building' || entity.type === 'unit') && entity.onHoverOut) {
                if (entity === hoveredEntity) {
                    entity.onHover();
                } else {
                    entity.onHoverOut();
                }
            }
        }
    }
    
    onWheel(event) {
        this.game.camera.handleWheel(event);
    }
    
    onContextMenu(event) {
        event.preventDefault();
        this.game.camera.handleContextMenu(event);
        this.game.handleRightClick(event);
    }

    bindPlayerEvents() {
        this.game.player.on('ageChange', (data) => {
            console.log(`[Player Event] 时代变化: ${data.oldLevel} -> ${data.newLevel} (${data.ageName})`);
            
            const townCenter = this.game.entityManager.getEntities().find(e => e.buildingType === 'town_center');
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
            console.log(`[Player Event] 人口变化: ${data.oldCurrent}/${data.max} -> ${data.newCurrent}/${data.max}`);
            
            const populationElement = document.getElementById('population-display');
            if (populationElement) {
                populationElement.textContent = `${data.newCurrent}/${data.max}`;
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

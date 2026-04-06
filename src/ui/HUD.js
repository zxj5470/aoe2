class HUD {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('hud');
        this.resourceElements = {
            gold: document.getElementById('resource-gold'),
            wood: document.getElementById('resource-wood'),
            food: document.getElementById('resource-food'),
            stone: document.getElementById('resource-stone')
        };
        
        this.populationElements = {
            current: document.getElementById('population-current'),
            max: document.getElementById('population-max')
        };
        
        this.ageElement = document.getElementById('current-age');
        
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapContext = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        
        this.unitInfoContent = document.getElementById('unit-info-content');
        this.buildingButtons = document.querySelectorAll('.building-btn');
        
        this.population = {
            current: 1,
            max: 20
        };
        
        this.age = '黑暗时代';
        
        // 建筑面板配置（可动态切换）
        this.buildingPanelConfig = {
            rows: 3,
            cols: 5,
            totalButtons: 15,
            buttons: [
                { id: 'house', icon: '🏠', name: '房屋', type: 'residential' },
                { id: '', icon: '', name: '', type: 'empty' }, // 兵营位置为空白占位
                { id: 'farm', icon: '🌾', name: '农田', type: 'economy' },
                { id: 'lumber-camp', icon: '🪓', name: '伐木场', type: 'economy' },
                { id: 'mining-camp', icon: '⛏️', name: '采矿场', type: 'economy' },
                { id: 'watch-tower', icon: '🗼', name: '瞭望塔', type: 'defense' },
                { id: 'stable', icon: '🐴', name: '马厩', type: 'military' },
                { id: 'archery-range', icon: '🏹', name: '射箭场', type: 'military' },
                { id: 'castle', icon: '🏰', name: '城堡', type: 'defense' },
                { id: 'wall', icon: '🧱', name: '城墙', type: 'defense' },
                { id: 'gate', icon: '🚪', name: '城门', type: 'defense' },
                { id: 'blacksmith', icon: '🔨', name: '铁匠铺', type: 'economy' },
                { id: 'market', icon: '🏪', name: '市场', type: 'economy' },
                { id: 'dock', icon: '⚓', name: '码头', type: 'economy' },
                { id: 'church', icon: '⛪', name: '教堂', type: 'special' }
            ]
        };
        
        // 按钮配置集（用于V键切换）
        this.buildingPanelPresets = {
            default: [
                { id: 'house', icon: '🏠', name: '房屋', type: 'residential' },
                { id: '', icon: '', name: '', type: 'empty' },
                { id: 'farm', icon: '🌾', name: '农田', type: 'economy' },
                { id: 'lumber-camp', icon: '🪓', name: '伐木场', type: 'economy' },
                { id: 'mining-camp', icon: '⛏️', name: '采矿场', type: 'economy' },
                { id: 'watch-tower', icon: '🗼', name: '瞭望塔', type: 'defense' },
                { id: 'stable', icon: '🐴', name: '马厩', type: 'military' },
                { id: 'archery-range', icon: '🏹', name: '射箭场', type: 'military' },
                { id: 'castle', icon: '🏰', name: '城堡', type: 'defense' },
                { id: 'wall', icon: '🧱', name: '城墙', type: 'defense' },
                { id: 'gate', icon: '🚪', name: '城门', type: 'defense' },
                { id: 'blacksmith', icon: '🔨', name: '铁匠铺', type: 'economy' },
                { id: 'market', icon: '🏪', name: '市场', type: 'economy' },
                { id: 'dock', icon: '⚓', name: '码头', type: 'economy' },
                { id: 'church', icon: '⛪', name: '教堂', type: 'special' }
            ],
            military: [
                { id: 'barracks', icon: '⚔️', name: '兵营', type: 'military' },
                { id: 'archery-range', icon: '🎯', name: '靶场', type: 'military' },
                { id: 'stable', icon: '🐴', name: '马厩', type: 'military' },
                { id: 'siege', icon: '🏹', name: '攻城武器', type: 'military' },
                { id: '', icon: '', name: '', type: 'empty' },
                { id: 'watch-tower', icon: '🗼', name: '瞭望塔', type: 'defense' },
                { id: 'wooden-wall', icon: '🪵', name: '木墙', type: 'defense' },
                { id: 'stone-wall', icon: '🧱', name: '石墙', type: 'defense' },
                { id: 'arrow-tower', icon: '🏹', name: '箭塔', type: 'defense' },
                { id: '', icon: '', name: '', type: 'empty' },
                { id: 'stone-gate', icon: '🚪', name: '石头门', type: 'defense' },
                { id: 'wooden-gate', icon: '🚧', name: '木城门', type: 'defense' },
                { id: 'castle', icon: '🏰', name: '城堡', type: 'defense' },
                { id: 'next', icon: '→', name: '下一页', type: 'nav' },
                { id: 'close', icon: '×', name: '关闭', type: 'nav' }
            ]
        };
        
        // 当前使用的预设
        this.currentPreset = 'default';
        
        // Debug面板元素
        this.debugPanel = document.getElementById('debug-panel');
        this.debugElements = {
            position: document.getElementById('debug-position'),
            target: document.getElementById('debug-target'),
            zoom: document.getElementById('debug-zoom'),
            nw: document.getElementById('debug-nw'),
            ne: document.getElementById('debug-ne'),
            se: document.getElementById('debug-se'),
            sw: document.getElementById('debug-sw'),
            mapWidth: document.getElementById('debug-map-width'),
            mapHeight: document.getElementById('debug-map-height'),
            panelRows: document.getElementById('debug-panel-rows'),
            panelCols: document.getElementById('debug-panel-cols'),
            panelButtons: document.getElementById('debug-panel-buttons')
        };
        
        this.init();
    }

    init() {
        this.setupMinimap();
        this.setupMinimapDrag();
        this.initBuildingButtons();
        this.setupEventListeners();
        
        // 初始化时设置默认布局
        this.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
    }

    setupMinimap() {
        if (!this.minimapCanvas) return;
        
        // 设置小地图尺寸
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 200;
        
        // 开始渲染小地图
        this.renderMinimap();
    }

    setupEventListeners() {
        // 监听选择变化
        if (this.game.selectionManager) {
            this.game.selectionManager.addListener((event, data) => {
                if (event === 'select' || event === 'selectMultiple' || event === 'deselectAll') {
                    this.updateUnitInfoPanel();
                }
            });
        }
        
        // 监听资源变化
        if (this.game.resourceManager) {
            this.game.resourceManager.addListener((type, amount) => {
                this.updateResourceDisplay();
            });
        }
        
        // 建筑按钮点击事件
        this.buildingButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buildingType = e.target.dataset.building;
                this.handleBuildingClick(buildingType, e.target);
            });
        });
        
        // 小地图拖动和点击事件由setupMinimapDrag统一处理
        
        // 不在这里监听F12键，由Game.js统一处理
    }

    toggleDebugPanel() {
        if (!this.debugPanel) {
            console.error('Debug面板不存在');
            // 尝试重新获取debug面板
            this.debugPanel = document.getElementById('debug-panel');
            if (!this.debugPanel) {
                console.error('无法找到debug-panel元素');
                return;
            }
        }
        
        const isVisible = this.debugPanel.classList.contains('visible');
        this.debugPanel.classList.toggle('visible');
        
        console.log(`Debug面板状态: ${isVisible ? '显示 → 隐藏' : '隐藏 → 显示'}`);
        
        // 确保样式正确
        if (this.debugPanel.classList.contains('visible')) {
            this.debugPanel.style.display = 'block';
        }
    }
    
    // 更新建筑面板布局配置
    updateBuildingPanelConfig(config) {
        this.buildingPanelConfig = {
            rows: config.rows || 4,
            cols: config.cols || 3,
            totalButtons: config.totalButtons || 12
        };
        
        // 更新CSS变量
        const root = document.documentElement;
        root.style.setProperty('--building-grid-rows', this.buildingPanelConfig.rows);
        root.style.setProperty('--building-grid-cols', this.buildingPanelConfig.cols);
        
        // 重新计算面板宽度
        const buttonSize = 52; // 按钮大小（包括间距）
        const panelWidth = this.buildingPanelConfig.cols * buttonSize + 20; // 20px padding
        
        const panelLeft = document.querySelector('.hud-panel-left');
        if (panelLeft) {
            panelLeft.style.flex = `0 0 ${panelWidth}px`;
            panelLeft.style.minWidth = `${panelWidth}px`;
        }
        
        // 更新网格布局
        const buttonsContainer = document.querySelector('.building-buttons');
        if (buttonsContainer) {
            buttonsContainer.style.gridTemplateColumns = `repeat(${this.buildingPanelConfig.cols}, 1fr)`;
            buttonsContainer.style.gridTemplateRows = `repeat(${this.buildingPanelConfig.rows}, 1fr)`;
        }
    }
    
    // 获取建筑面板配置
    getBuildingPanelConfig() {
        return { ...this.buildingPanelConfig };
    }

    handleBuildingClick(buildingType, button) {
        // 处理导航按钮
        if (buildingType === 'next') {
            this.nextPreset();
            return;
        }
        
        if (buildingType === 'close') {
            this.switchToPreset('default');
            return;
        }
        
        // 切换建筑放置模式
        if (this.game.buildingPlacementSystem) {
            this.game.buildingPlacementSystem.togglePlacement(buildingType);
            
            // 更新按钮状态
            this.buildingButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (this.game.buildingPlacementSystem.isPlacing) {
                button.classList.add('active');
            }
        }
    }

    updateResourceDisplay() {
        if (!this.game.resourceManager) return;
        
        const resources = this.game.resourceManager.getAllResources();
        
        if (this.resourceElements.gold) {
            this.resourceElements.gold.textContent = resources.gold;
        }
        if (this.resourceElements.wood) {
            this.resourceElements.wood.textContent = resources.wood;
        }
        if (this.resourceElements.food) {
            this.resourceElements.food.textContent = resources.food;
        }
        if (this.resourceElements.stone) {
            this.resourceElements.stone.textContent = resources.stone;
        }
    }

    updateUnitInfoPanel() {
        if (!this.game.selectionManager || !this.unitInfoContent) return;
        
        const selectedEntities = this.game.selectionManager.getSelectedEntities();
        
        if (selectedEntities.length === 0) {
            this.unitInfoContent.innerHTML = `
                <div style="color: #888; text-align: center; padding: 40px 0;">
                    未选择任何单位
                </div>
            `;
            return;
        }
        
        // 更新单位信息面板内容
        let html = '';
        
        if (selectedEntities.length === 1) {
            const entity = selectedEntities[0];
            const healthPercent = (entity.health / entity.maxHealth) * 100;
            
            html = `
                <div class="info-row">
                    <span>名称:</span>
                    <span>${entity.name}</span>
                </div>
                <div class="info-row">
                    <span>类型:</span>
                    <span>${entity.type}</span>
                </div>
                <div class="info-row" style="margin-top: 10px;">
                    <span>生命值:</span>
                    <span>${entity.health}/${entity.maxHealth}</span>
                </div>
                <div class="health-bar">
                    <div class="health-bar-fill" style="width: ${healthPercent}%"></div>
                </div>
            `;
            
            // 添加特定属性
            if (entity.type === 'unit') {
                html += `
                    <div class="info-row" style="margin-top: 8px;">
                        <span>攻击力:</span>
                        <span>${entity.attackDamage || 0}</span>
                    </div>
                    <div class="info-row">
                        <span>护甲:</span>
                        <span>${entity.armor || 0}</span>
                    </div>
                    <div class="info-row">
                        <span>速度:</span>
                        <span>${entity.speed || 0}</span>
                    </div>
                `;
            } else if (entity.type === 'building') {
                html += `
                    <div class="info-row" style="margin-top: 8px;">
                        <span>建筑类型:</span>
                        <span>${entity.buildingType || '未知'}</span>
                    </div>
                `;
            }
        } else {
            // 多选显示
            html = `<div class="info-row"><span>已选择:</span><span>${selectedEntities.length} 个单位</span></div>`;
            
            const types = {};
            for (const entity of selectedEntities) {
                const type = entity.unitType || entity.buildingType || entity.type;
                types[type] = (types[type] || 0) + 1;
            }
            
            html += '<div style="margin-top: 10px;">';
            for (const type in types) {
                html += `<div class="info-row"><span>${type}:</span><span>${types[type]}</span></div>`;
            }
            html += '</div>';
        }
        
        this.unitInfoContent.innerHTML = html;
    }

    renderMinimap() {
        if (!this.minimapContext || !this.game.map) return;
        
        const mapSize = this.game.map.getSize();
        const canvas = this.minimapCanvas;
        const ctx = this.minimapContext;
        
        // 清空画布
        ctx.fillStyle = '#3d8c40';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 计算地图的实际范围（考虑中心在原点）
        const minX = -mapSize.width / 2;
        const maxX = mapSize.width / 2;
        const minZ = -mapSize.height / 2;
        const maxZ = mapSize.height / 2;
        
        // 坐标变换函数：将世界坐标转换为菱形屏幕坐标
        const worldToScreen = (x, z) => {
            // 将世界坐标从[-100, 100]映射到[-0.5, 0.5]
            const normalizedX = (x - minX) / (maxX - minX) - 0.5;
            const normalizedZ = (z - minZ) / (maxZ - minZ) - 0.5;
            
            // 菱形变换
            const screenX = (normalizedX - normalizedZ) * canvas.width * 0.5 + canvas.width / 2;
            const screenY = (normalizedX + normalizedZ) * canvas.height * 0.5 + canvas.height / 2;
            
            return { x: screenX, y: screenY };
        };
        
        // 绘制菱形网格
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.5;
        
        const gridSize = 10;
        for (let i = 0; i <= gridSize; i++) {
            const t = i / gridSize;
            
            // 绘制 z 固定的线（x 从 minX 到 maxX，z 固定为 t）
            const zPos = minZ + (maxZ - minZ) * t;
            const start1 = worldToScreen(minX, zPos);
            const end1 = worldToScreen(maxX, zPos);
            ctx.beginPath();
            ctx.moveTo(start1.x, start1.y);
            ctx.lineTo(end1.x, end1.y);
            ctx.stroke();
            
            // 绘制 x 固定的线（x 固定为 t，z 从 minZ 到 maxZ）
            const xPos = minX + (maxX - minX) * t;
            const start2 = worldToScreen(xPos, minZ);
            const end2 = worldToScreen(xPos, maxZ);
            ctx.beginPath();
            ctx.moveTo(start2.x, start2.y);
            ctx.lineTo(end2.x, end2.y);
            ctx.stroke();
        }
        
        // 绘制实体
        for (const entity of this.game.entities) {
            if (!entity.isAlive) continue;
            
            const pos = worldToScreen(entity.position.x, entity.position.z);
            
            ctx.fillStyle = entity.owner === 'player' ? '#4169E1' : '#DC143C';
            
            if (entity.type === 'unit') {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (entity.type === 'building') {
                ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
            }
        }
        
        // 绘制摄像机视野（使用线性坐标映射，不旋转）
        if (this.game.camera) {
            const cameraTarget = this.game.camera.target;
            const camera = this.game.camera.getCamera();
            
            // 计算视野的实际尺寸（考虑宽高比）
            const frustumSize = this.game.camera.zoomLevel;
            const aspect = camera.right / camera.top;
            
            let viewWidth, viewHeight;
            if (aspect > 1) {
                viewWidth = frustumSize * aspect;
                viewHeight = frustumSize;
            } else {
                viewWidth = frustumSize;
                viewHeight = frustumSize / aspect;
            }
            
            const halfWidth = viewWidth / 2;
            const halfHeight = viewHeight / 2;
            
            // 使用线性坐标映射（不使用菱形变换）
            const left = ((cameraTarget.x - halfWidth) - minX) / (maxX - minX) * canvas.width;
            const right = ((cameraTarget.x + halfWidth) - minX) / (maxX - minX) * canvas.width;
            const top = ((cameraTarget.z - halfHeight) - minZ) / (maxZ - minZ) * canvas.height;
            const bottom = ((cameraTarget.z + halfHeight) - minZ) / (maxZ - minZ) * canvas.height;
            
            // 绘制矩形视野框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(left, top, right - left, bottom - top);
        }
        
        // 继续渲染
        requestAnimationFrame(() => this.renderMinimap());
        
        // 更新debug面板
        this.updateDebugPanel();
    }

    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #FFD700;
            padding: 10px 20px;
            border: 2px solid #8B4513;
            font-size: 14px;
            z-index: 1000;
        `;
        notification.textContent = message;
        
        this.element.appendChild(notification);
        
        setTimeout(() => {
            this.element.removeChild(notification);
        }, duration);
    }

    updatePopulation(current, max) {
        this.population.current = current;
        this.population.max = max;
        
        if (this.populationElements.current) {
            this.populationElements.current.textContent = current;
        }
        if (this.populationElements.max) {
            this.populationElements.max.textContent = max;
        }
    }

    updateAge(ageName) {
        this.age = ageName;
        
        if (this.ageElement) {
            this.ageElement.textContent = ageName;
        }
    }

    getPopulation() {
        return this.population;
    }

    getAge() {
        return this.age;
    }

    updateDebugPanel() {
        if (!this.debugPanel || !this.debugPanel.classList.contains('visible')) return;
        
        // 更新相机位置信息
        if (this.game.camera) {
            const pos = this.game.camera.position;
            const target = this.game.camera.target;
            
            if (this.debugElements.position) {
                this.debugElements.position.textContent = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
            }
            if (this.debugElements.target) {
                this.debugElements.target.textContent = `(${target.x.toFixed(1)}, ${target.y.toFixed(1)}, ${target.z.toFixed(1)})`;
            }
            if (this.debugElements.zoom) {
                this.debugElements.zoom.textContent = this.game.camera.zoomLevel.toFixed(1);
            }
        }
        
        // 更新小地图视野信息
        if (this.game.camera && this.game.map) {
            const cameraTarget = this.game.camera.target;
            const camera = this.game.camera.getCamera();
            
            // 计算视野的实际尺寸（考虑宽高比）
            const frustumSize = this.game.camera.zoomLevel;
            const aspect = camera.right / camera.top;
            
            let viewWidth, viewHeight;
            if (aspect > 1) {
                viewWidth = frustumSize * aspect;
                viewHeight = frustumSize;
            } else {
                viewWidth = frustumSize;
                viewHeight = frustumSize / aspect;
            }
            
            const halfWidth = viewWidth / 2;
            const halfHeight = viewHeight / 2;
            
            const nw = `(${(cameraTarget.x - halfWidth).toFixed(1)}, ${(cameraTarget.z - halfHeight).toFixed(1)})`;
            const ne = `(${(cameraTarget.x + halfWidth).toFixed(1)}, ${(cameraTarget.z - halfHeight).toFixed(1)})`;
            const se = `(${(cameraTarget.x + halfWidth).toFixed(1)}, ${(cameraTarget.z + halfHeight).toFixed(1)})`;
            const sw = `(${(cameraTarget.x - halfWidth).toFixed(1)}, ${(cameraTarget.z + halfHeight).toFixed(1)})`;
            
            if (this.debugElements.nw) this.debugElements.nw.textContent = nw;
            if (this.debugElements.ne) this.debugElements.ne.textContent = ne;
            if (this.debugElements.se) this.debugElements.se.textContent = se;
            if (this.debugElements.sw) this.debugElements.sw.textContent = sw;
        }
        
        // 更新地图信息
        if (this.game.map) {
            const mapSize = this.game.map.getSize();
            const minX = -mapSize.width / 2;
            const maxX = mapSize.width / 2;
            const minZ = -mapSize.height / 2;
            const maxZ = mapSize.height / 2;
            
            if (this.debugElements.mapWidth) {
                this.debugElements.mapWidth.textContent = `[${minX.toFixed(0)}, ${maxX.toFixed(0)}]`;
            }
            if (this.debugElements.mapHeight) {
                this.debugElements.mapHeight.textContent = `[${minZ.toFixed(0)}, ${maxZ.toFixed(0)}]`;
            }
        }
        
        // 更新建筑面板配置
        const config = this.getBuildingPanelConfig();
        if (this.debugElements.panelRows) {
            this.debugElements.panelRows.textContent = config.rows;
        }
        if (this.debugElements.panelCols) {
            this.debugElements.panelCols.textContent = config.cols;
        }
        if (this.debugElements.panelButtons) {
            this.debugElements.panelButtons.textContent = config.totalButtons;
        }
        
        // 显示当前预设
        let presetElement = document.getElementById('debug-current-preset');
        if (!presetElement && this.debugPanel) {
            const section = this.debugPanel.querySelector('.debug-section:last-of-type');
            if (section) {
                presetElement = document.createElement('div');
                presetElement.className = 'debug-row';
                presetElement.id = 'debug-current-preset';
                presetElement.innerHTML = `<span class="debug-label">当前预设:</span> <span class="debug-value">${this.currentPreset}</span>`;
                section.appendChild(presetElement);
            }
        } else if (presetElement) {
            presetElement.innerHTML = `<span class="debug-label">当前预设:</span> <span class="debug-value">${this.currentPreset}</span>`;
        }
        
        // 统计空白按钮数量
        const emptyCount = this.buildingPanelConfig.buttons.filter(b => b.type === 'empty').length;
        if (emptyCount > 0) {
            let emptyElement = document.getElementById('debug-empty-count');
            if (!emptyElement && this.debugPanel) {
                const section = this.debugPanel.querySelector('.debug-section:last-of-type');
                if (section) {
                    emptyElement = document.createElement('div');
                    emptyElement.className = 'debug-row';
                    emptyElement.id = 'debug-empty-count';
                    emptyElement.innerHTML = `<span class="debug-label">空白按钮:</span> <span class="debug-value">${emptyCount}个</span>`;
                    section.appendChild(emptyElement);
                }
            } else if (emptyElement) {
                emptyElement.innerHTML = `<span class="debug-label">空白按钮:</span> <span class="debug-value">${emptyCount}个</span>`;
            }
        }
    }

    handleMinimapClick(event) {
        if (!this.game.map || !this.game.camera) return;
        
        const mapSize = this.game.map.getSize();
        const canvas = this.minimapCanvas;
        
        // 计算地图的实际范围
        const minX = -mapSize.width / 2;
        const maxX = mapSize.width / 2;
        const minZ = -mapSize.height / 2;
        const maxZ = mapSize.height / 2;
        
        // 获取点击位置在canvas中的坐标
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // 使用线性坐标映射（与视野框一致）
        const worldX = minX + (clickX / canvas.width) * (maxX - minX);
        const worldZ = minZ + (clickY / canvas.height) * (maxZ - minZ);
        
        // 只修改target，然后调用updateCameraPosition重新计算position
        if (this.game.camera) {
            this.game.camera.target.x = worldX;
            this.game.camera.target.z = worldZ;
            this.game.camera.target.y = 0;
            this.game.camera.updateCameraPosition();
        }
    }
    
    // 小地图拖动处理
    setupMinimapDrag() {
        if (!this.minimapCanvas) return;
        
        let isDragging = false;
        let hasMoved = false;
        let lastX = 0;
        let lastY = 0;
        let startX = 0;
        let startY = 0;
        
        this.minimapCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            this.minimapCanvas.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            
            // 检测是否发生了实际移动
            if (Math.abs(e.clientX - startX) > 2 || Math.abs(e.clientY - startY) > 2) {
                hasMoved = true;
            }
            
            // 更新相机位置（反方向拖动）
            if (this.game.camera && hasMoved) {
                const mapSize = this.game.map.getSize();
                const minX = -mapSize.width / 2;
                const maxX = mapSize.width / 2;
                const minZ = -mapSize.height / 2;
                const maxZ = mapSize.height / 2;
                
                // 计算移动量（转换为世界坐标）
                const canvas = this.minimapCanvas;
                const worldDx = (dx / canvas.width) * (maxX - minX);
                const worldDz = (dy / canvas.height) * (maxZ - minZ);
                
                this.game.camera.target.x -= worldDx;
                this.game.camera.target.z -= worldDz;
                this.game.camera.target.y = 0;
                this.game.camera.updateCameraPosition();
            }
            
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        window.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                if (this.minimapCanvas) {
                    this.minimapCanvas.style.cursor = 'pointer';
                }
                
                // 如果没有发生移动，执行跳转功能
                if (!hasMoved && this.minimapCanvas) {
                    const rect = this.minimapCanvas.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    
                    // 检查点击是否在小地图范围内
                    if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
                        this.handleMinimapClick({ clientX: e.clientX, clientY: e.clientY });
                    }
                }
            }
        });
        
        this.minimapCanvas.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                hasMoved = false;
                if (this.minimapCanvas) {
                    this.minimapCanvas.style.cursor = 'pointer';
                }
            }
        });
    }
    
    // 初始化建筑按钮
    initBuildingButtons() {
        const container = document.querySelector('.building-buttons');
        if (!container) return;
        
        // 清空现有按钮
        container.innerHTML = '';
        
        // 根据配置渲染按钮
        this.buildingPanelConfig.buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'building-btn';
            btn.dataset.building = button.id || '';
            btn.dataset.index = this.buildingPanelConfig.buttons.indexOf(button);
            
            // 如果type为empty，添加特殊样式
            if (button.type === 'empty') {
                btn.classList.add('building-btn-empty');
                btn.disabled = true;
                btn.dataset.building = '';
            }
            
            // 如果type为nav，添加导航按钮样式
            if (button.type === 'nav') {
                btn.classList.add('building-btn-nav');
            }
            
            const icon = document.createElement('span');
            icon.className = 'building-btn-icon';
            icon.textContent = button.icon || '';
            
            const text = document.createElement('span');
            text.className = 'building-btn-text';
            text.textContent = button.name || '';
            
            btn.appendChild(icon);
            btn.appendChild(text);
            container.appendChild(btn);
        });
        
        // 重新获取按钮引用
        this.buildingButtons = document.querySelectorAll('.building-btn');
    }
    
    // 更新单个按钮的配置
    updateBuildingButton(index, config) {
        if (index < 0 || index >= this.buildingPanelConfig.buttons.length) {
            console.error(`Invalid button index: ${index}`);
            return;
        }
        
        // 更新配置
        this.buildingPanelConfig.buttons[index] = {
            ...this.buildingPanelConfig.buttons[index],
            ...config
        };
        
        // 更新DOM
        const buttons = document.querySelectorAll('.building-btn');
        const btn = buttons[index];
        if (btn) {
            const buttonConfig = this.buildingPanelConfig.buttons[index];
            
            btn.dataset.building = buttonConfig.id || '';
            btn.dataset.index = index;
            
            // 移除所有特殊样式
            btn.classList.remove('building-btn-empty', 'building-btn-nav');
            btn.disabled = false;
            
            // 处理空白状态（type为empty）
            if (buttonConfig.type === 'empty') {
                btn.classList.add('building-btn-empty');
                btn.disabled = true;
                btn.dataset.building = '';
            }
            
            // 处理导航按钮（type为nav）
            if (buttonConfig.type === 'nav') {
                btn.classList.add('building-btn-nav');
            }
            
            const icon = btn.querySelector('.building-btn-icon');
            const text = btn.querySelector('.building-btn-text');
            if (icon) icon.textContent = buttonConfig.icon || '';
            if (text) text.textContent = buttonConfig.name || '';
        }
    }
    
    // 获取按钮配置
    getBuildingButtonConfig(index) {
        if (index < 0 || index >= this.buildingPanelConfig.buttons.length) {
            return null;
        }
        return { ...this.buildingPanelConfig.buttons[index] };
    }
    
    // 批量更新按钮配置
    updateBuildingButtons(buttonConfigs) {
        buttonConfigs.forEach((config, index) => {
            if (config) {
                this.updateBuildingButton(index, config);
            }
        });
    }
    
    // 设置按钮为空白占位
    setButtonEmpty(index, isEmpty = true) {
        if (index < 0 || index >= this.buildingPanelConfig.buttons.length) {
            console.error(`Invalid button index: ${index}`);
            return;
        }
        
        this.updateBuildingButton(index, {
            type: isEmpty ? 'empty' : 'residential',
            icon: '',
            name: '',
            id: ''
        });
    }
    
    // 启用按钮（取消空白状态）
    enableButton(index, config = {}) {
        if (index < 0 || index >= this.buildingPanelConfig.buttons.length) {
            console.error(`Invalid button index: ${index}`);
            return;
        }
        
        const originalButton = this.buildingPanelConfig.buttons[index];
        this.updateBuildingButton(index, {
            type: 'residential',
            disabled: false,
            icon: config.icon || '',
            name: config.name || '',
            id: config.id || '',
            ...config
        });
    }
    
    // 批量设置空白按钮
    setButtonsEmpty(indices) {
        indices.forEach(index => {
            this.setButtonEmpty(index, true);
        });
    }
    
    // 切换到指定预设
    switchToPreset(presetName) {
        if (!this.buildingPanelPresets[presetName]) {
            console.error(`Preset "${presetName}" not found`);
            return;
        }
        
        const preset = this.buildingPanelPresets[presetName];
        this.currentPreset = presetName;
        
        // 更新按钮配置
        this.buildingPanelConfig.buttons = preset.map(button => ({ ...button }));
        
        // 重新渲染按钮
        this.initBuildingButtons();
        
        console.log(`切换到预设: ${presetName}`);
    }
    
    // 切换到下一个预设
    nextPreset() {
        const presetNames = Object.keys(this.buildingPanelPresets);
        const currentIndex = presetNames.indexOf(this.currentPreset);
        const nextIndex = (currentIndex + 1) % presetNames.length;
        this.switchToPreset(presetNames[nextIndex]);
    }
    
    // 获取当前预设名称
    getCurrentPreset() {
        return this.currentPreset;
    }
    
    // 添加自定义预设
    addPreset(name, buttons) {
        this.buildingPanelPresets[name] = buttons.map(button => ({ ...button }));
    }
}

export default HUD;
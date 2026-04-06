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
            mapHeight: document.getElementById('debug-map-height')
        };
        
        this.init();
    }

    init() {
        this.setupMinimap();
        this.setupEventListeners();
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
        
        // 小地图点击事件
        if (this.minimapCanvas) {
            this.minimapCanvas.addEventListener('click', (e) => {
                this.handleMinimapClick(e);
            });
        }
        
        // Debug面板切换（按F12键）
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    toggleDebugPanel() {
        if (this.debugPanel) {
            this.debugPanel.classList.toggle('visible');
        }
    }

    handleBuildingClick(buildingType, button) {
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
        
        // 坐标变换函数：将世界坐标转换为菱形屏幕坐标
        const worldToScreen = (x, z) => {
            // 标准化世界坐标到0-1范围
            const normalizedX = x / mapSize.width;
            const normalizedZ = z / mapSize.height;
            
            // 菱形变换
            const screenX = (normalizedX - normalizedZ) * canvas.width * 0.5 + canvas.width / 2;
            const screenY = (normalizedX + normalizedZ) * canvas.height * 0.5;
            
            return { x: screenX, y: screenY };
        };
        
        // 绘制菱形网格
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.5;
        
        const gridSize = 10;
        for (let i = 0; i <= gridSize; i++) {
            const t = i / gridSize;
            
            // 绘制对角线（从左下到右上）
            const start1 = worldToScreen(0, mapSize.height * t);
            const end1 = worldToScreen(mapSize.width * t, 0);
            ctx.beginPath();
            ctx.moveTo(start1.x, start1.y);
            ctx.lineTo(end1.x, end1.y);
            ctx.stroke();
            
            // 绘制对角线（从左上到右下）
            const start2 = worldToScreen(mapSize.width * t, mapSize.height);
            const end2 = worldToScreen(0, mapSize.height * t);
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
        
        // 绘制摄像机视野（菱形框）
        if (this.game.camera) {
            const cameraPos = this.game.camera.getPosition();
            const viewSize = this.game.camera.zoomLevel;
            const halfView = viewSize / 2;
            
            // 相机从东南方向看，视野的四个角点
            const corners = [
                worldToScreen(cameraPos.x - halfView, cameraPos.z - halfView), // 西北（上方）
                worldToScreen(cameraPos.x + halfView, cameraPos.z - halfView), // 东北（右方）
                worldToScreen(cameraPos.x + halfView, cameraPos.z + halfView), // 东南（下方）
                worldToScreen(cameraPos.x - halfView, cameraPos.z + halfView)  // 西南（左方）
            ];
            
            // 绘制菱形视野框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(corners[0].x, corners[0].y);
            ctx.lineTo(corners[1].x, corners[1].y);
            ctx.lineTo(corners[2].x, corners[2].y);
            ctx.lineTo(corners[3].x, corners[3].y);
            ctx.closePath();
            ctx.stroke();
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
            const cameraPos = this.game.camera.getPosition();
            const viewSize = this.game.camera.zoomLevel;
            const halfView = viewSize / 2;
            
            const nw = `(${(cameraPos.x - halfView).toFixed(1)}, ${(cameraPos.z - halfView).toFixed(1)})`;
            const ne = `(${(cameraPos.x + halfView).toFixed(1)}, ${(cameraPos.z - halfView).toFixed(1)})`;
            const se = `(${(cameraPos.x + halfView).toFixed(1)}, ${(cameraPos.z + halfView).toFixed(1)})`;
            const sw = `(${(cameraPos.x - halfView).toFixed(1)}, ${(cameraPos.z + halfView).toFixed(1)})`;
            
            if (this.debugElements.nw) this.debugElements.nw.textContent = nw;
            if (this.debugElements.ne) this.debugElements.ne.textContent = ne;
            if (this.debugElements.se) this.debugElements.se.textContent = se;
            if (this.debugElements.sw) this.debugElements.sw.textContent = sw;
        }
        
        // 更新地图信息
        if (this.game.map) {
            const mapSize = this.game.map.getSize();
            
            if (this.debugElements.mapWidth) {
                this.debugElements.mapWidth.textContent = mapSize.width.toFixed(0);
            }
            if (this.debugElements.mapHeight) {
                this.debugElements.mapHeight.textContent = mapSize.height.toFixed(0);
            }
        }
    }

    handleMinimapClick(event) {
        if (!this.game.map || !this.game.camera) return;
        
        const mapSize = this.game.map.getSize();
        const canvas = this.minimapCanvas;
        
        // 获取点击位置在canvas中的坐标
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // 将屏幕坐标转换为归一化坐标（0-1）
        const normalizedX = clickX / canvas.width;
        const normalizedY = clickY / canvas.height;
        
        // 反向菱形变换：将屏幕坐标转换为世界坐标
        // 菱形变换公式：
        // screenX = (normalizedX - normalizedZ) * width * 0.5 + width / 2
        // screenY = (normalizedX + normalizedZ) * height * 0.5
        
        // 反解：
        // normalizedX + normalizedZ = screenY * 2 / height
        // normalizedX - normalizedZ = (screenX - width / 2) * 2 / width
        
        const sum = normalizedY * 2;
        const diff = (normalizedX - 0.5) * 2;
        
        const worldNormalizedX = (sum + diff) / 2;
        const worldNormalizedZ = (sum - diff) / 2;
        
        // 转换为世界坐标
        const worldX = worldNormalizedX * mapSize.width;
        const worldZ = worldNormalizedZ * mapSize.height;
        
        // 只修改target，然后调用updateCameraPosition重新计算position
        if (this.game.camera) {
            this.game.camera.target.x = worldX;
            this.game.camera.target.z = worldZ;
            this.game.camera.target.y = 0;
            this.game.camera.updateCameraPosition();
        }
    }
}

export default HUD;
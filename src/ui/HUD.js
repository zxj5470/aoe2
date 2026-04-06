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
        
        this.minimapElement = document.getElementById('minimap');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapContext = this.minimapCanvas.getContext('2d');
        
        this.selectionPanel = null;
        this.actionPanel = null;
        
        this.init();
    }

    init() {
        this.setupMinimap();
        this.setupSelectionPanel();
        this.setupActionPanel();
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

    setupSelectionPanel() {
        // 创建选择面板
        const selectionPanel = document.createElement('div');
        selectionPanel.className = 'selection-panel';
        selectionPanel.style.cssText = `
            position: absolute;
            bottom: 160px;
            left: 10px;
            width: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #8B4513;
            color: #FFD700;
            padding: 10px;
            display: none;
        `;
        
        this.element.appendChild(selectionPanel);
        this.selectionPanel = selectionPanel;
    }

    setupActionPanel() {
        // 创建动作面板
        const actionPanel = document.createElement('div');
        actionPanel.className = 'action-panel';
        actionPanel.style.cssText = `
            position: absolute;
            bottom: 160px;
            left: 220px;
            width: 400px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #8B4513;
            color: #FFD700;
            padding: 10px;
            display: none;
        `;
        
        this.element.appendChild(actionPanel);
        this.actionPanel = actionPanel;
    }

    setupEventListeners() {
        // 监听选择变化
        if (this.game.selectionManager) {
            this.game.selectionManager.addListener((event, data) => {
                if (event === 'select' || event === 'selectMultiple' || event === 'deselectAll') {
                    this.updateSelectionPanel();
                }
            });
        }
        
        // 监听资源变化
        if (this.game.resourceManager) {
            this.game.resourceManager.addListener((type, amount) => {
                this.updateResourceDisplay();
            });
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

    updateSelectionPanel() {
        if (!this.game.selectionManager) return;
        
        const selectedEntities = this.game.selectionManager.getSelectedEntities();
        
        if (selectedEntities.length === 0) {
            this.selectionPanel.style.display = 'none';
            this.actionPanel.style.display = 'none';
            return;
        }
        
        this.selectionPanel.style.display = 'block';
        this.actionPanel.style.display = 'block';
        
        // 更新选择面板内容
        let html = `<div style="font-size: 14px; margin-bottom: 5px;">已选择: ${selectedEntities.length}</div>`;
        
        if (selectedEntities.length === 1) {
            const entity = selectedEntities[0];
            html += `
                <div style="font-size: 12px;">名称: ${entity.name}</div>
                <div style="font-size: 12px;">生命值: ${entity.health}/${entity.maxHealth}</div>
                <div style="font-size: 12px;">类型: ${entity.type}</div>
            `;
        } else {
            const types = {};
            for (const entity of selectedEntities) {
                const type = entity.unitType || entity.buildingType || entity.type;
                types[type] = (types[type] || 0) + 1;
            }
            
            html += '<div style="font-size: 12px;">';
            for (const type in types) {
                html += `${type}: ${types[type]}<br>`;
            }
            html += '</div>';
        }
        
        this.selectionPanel.innerHTML = html;
        
        // 更新动作面板内容
        this.updateActionPanel(selectedEntities);
    }

    updateActionPanel(entities) {
        let html = '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        
        // 添加通用动作按钮
        html += `
            <button onclick="game.actionStop()" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">停止</button>
        `;
        
        // 根据实体类型添加特定动作
        const firstEntity = entities[0];
        
        if (firstEntity.type === 'unit') {
            html += `
                <button onclick="game.actionMove()" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">移动</button>
                <button onclick="game.actionAttack()" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">攻击</button>
            `;
            
            if (firstEntity.unitType === 'villager') {
                html += `
                    <button onclick="game.actionBuild('house')" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">建造房屋</button>
                    <button onclick="game.actionBuild('barracks')" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">建造兵营</button>
                `;
            }
        } else if (firstEntity.type === 'building') {
            html += `
                <button onclick="game.actionRepair()" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">修理</button>
            `;
            
            if (firstEntity.buildingType === 'barracks') {
                html += `
                    <button onclick="game.actionTrain('swordsman')" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">训练剑士</button>
                    <button onclick="game.actionTrain('spearman')" style="padding: 5px 10px; background: #8B4513; color: #FFD700; border: 1px solid #FFD700; cursor: pointer;">训练枪兵</button>
                `;
            }
        }
        
        html += '</div>';
        
        this.actionPanel.innerHTML = html;
    }

    renderMinimap() {
        if (!this.minimapContext || !this.game.map) return;
        
        const mapSize = this.game.map.getSize();
        const canvas = this.minimapCanvas;
        const ctx = this.minimapContext;
        
        // 清空画布
        ctx.fillStyle = '#3d8c40';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制地形
        const grid = this.game.map.getGrid();
        const cellSize = grid.cellSize;
        
        // 简化：只绘制基本地形
        // 实际实现需要遍历网格并绘制每个格子
        
        // 绘制实体
        for (const entity of this.game.entities) {
            if (!entity.isAlive) continue;
            
            const x = (entity.position.x / mapSize.width) * canvas.width;
            const y = (entity.position.z / mapSize.height) * canvas.height;
            
            ctx.fillStyle = entity.owner === 'player' ? '#4169E1' : '#DC143C';
            
            if (entity.type === 'unit') {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (entity.type === 'building') {
                ctx.fillRect(x - 3, y - 3, 6, 6);
            }
        }
        
        // 绘制摄像机视野
        if (this.game.camera) {
            const cameraPos = this.game.camera.getPosition();
            const viewSize = this.game.camera.zoomLevel;
            
            const camX = (cameraPos.x / mapSize.width) * canvas.width;
            const camY = (cameraPos.z / mapSize.height) * canvas.height;
            const camWidth = (viewSize / mapSize.width) * canvas.width;
            const camHeight = (viewSize / mapSize.height) * canvas.height;
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(camX - camWidth / 2, camY - camHeight / 2, camWidth, camHeight);
        }
        
        // 继续渲染
        requestAnimationFrame(() => this.renderMinimap());
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
}

export default HUD;
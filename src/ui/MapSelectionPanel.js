/**
 * 地图选择面板组件
 */
class MapSelectionPanel {
    constructor(game) {
        this.game = game;
        this.panel = null;
        this.mapGenerator = null;
        this.selectedMapType = 'arabia';
        this.selectedCivilization = 'generic';
        this.onMapSelected = null;
        
        this.init();
    }

    init() {
        // 创建面板容器
        this.createPanel();
        
        // 添加地图列表
        this.addMapList();
        this.addCivilizationList();
        this.updateCivilizationDetails();
        
        // 添加确认按钮
        this.addConfirmButton();
        
        // 隐藏面板（默认不显示）
        this.hide();
    }

    createPanel() {
        // 检查是否已存在
        const existingPanel = document.getElementById('map-selection-panel');
        if (existingPanel) {
            this.panel = existingPanel;
            return;
        }

        // 创建面板
        this.panel = document.createElement('div');
        this.panel.id = 'map-selection-panel';
        this.panel.className = 'map-selection-panel';
        this.panel.innerHTML = `
            <div class="map-panel-header">
                <h2>开始游戏</h2>
                <button class="map-panel-close" onclick="game.mapSelectionPanel.hide()">×</button>
            </div>
            <div class="map-panel-content">
                <div class="start-option-section">
                    <h3>地图</h3>
                    <div class="map-list" id="map-list"></div>
                </div>
                <div class="start-option-section">
                    <h3>文明</h3>
                    <div class="civilization-list" id="civilization-list"></div>
                    <div class="civilization-tech-panel" id="civilization-tech-panel"></div>
                </div>
            </div>
            <div class="map-panel-footer">
                <button class="map-confirm-btn" id="map-confirm-btn">开始游戏</button>
            </div>
        `;

        // 添加样式
        this.panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 3px solid #8B4513;
            border-radius: 12px;
            padding: 20px;
            width: 860px;
            max-width: 94vw;
            max-height: 90vh;
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
        `;

        // 添加子元素样式
        const style = document.createElement('style');
        style.textContent = `
            .map-selection-panel .map-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #8B4513;
            }
            
            .map-selection-panel .map-panel-header h2 {
                color: #FFD700;
                margin: 0;
                font-size: 24px;
                font-family: 'Arial', sans-serif;
            }
            
            .map-selection-panel .map-panel-close {
                background: none;
                border: none;
                color: #FFD700;
                font-size: 32px;
                cursor: pointer;
                padding: 0 10px;
                transition: color 0.3s;
            }
            
            .map-selection-panel .map-panel-close:hover {
                color: #FF6347;
            }
            
            .map-selection-panel .map-panel-content {
                flex: 1;
                overflow: auto;
                display: grid;
                grid-template-columns: minmax(280px, 1fr) minmax(300px, 1fr);
                gap: 18px;
                min-height: 0;
            }

            .map-selection-panel .start-option-section {
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            .map-selection-panel .start-option-section h3 {
                color: #FFD700;
                margin: 0 0 10px;
                font-size: 16px;
                font-family: Arial, sans-serif;
            }
            
            .map-selection-panel .map-list,
            .map-selection-panel .civilization-list {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .map-selection-panel .map-item,
            .map-selection-panel .civilization-item {
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: left;
            }
            
            .map-selection-panel .map-item:hover,
            .map-selection-panel .civilization-item:hover {
                background: rgba(255, 215, 0, 0.1);
                border-color: #FFD700;
                transform: translateY(-2px);
            }
            
            .map-selection-panel .map-item.selected,
            .map-selection-panel .civilization-item.selected {
                border-color: #FFD700;
                background: rgba(255, 215, 0, 0.2);
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            }
            
            .map-selection-panel .map-item-icon {
                font-size: 28px;
                margin-bottom: 8px;
                display: block;
                text-align: center;
            }
            
            .map-selection-panel .map-item-name,
            .map-selection-panel .civilization-item-name {
                color: #FFD700;
                font-size: 15px;
                font-weight: bold;
                margin-bottom: 5px;
                display: block;
            }
            
            .map-selection-panel .map-item-desc,
            .map-selection-panel .civilization-item-desc {
                color: #aaa;
                font-size: 12px;
                line-height: 1.4;
                display: block;
            }

            .map-selection-panel .civilization-tech-panel {
                margin-top: 12px;
                background: rgba(0, 0, 0, 0.28);
                border: 1px solid rgba(255, 215, 0, 0.25);
                border-radius: 8px;
                padding: 12px;
                color: #ddd;
                line-height: 1.45;
            }

            .map-selection-panel .civilization-tech-title {
                color: #FFD700;
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 15px;
            }

            .map-selection-panel .civilization-tech-list {
                margin: 0;
                padding-left: 18px;
                font-size: 13px;
            }

            .map-selection-panel .civilization-tech-list li {
                margin-bottom: 6px;
            }
            
            .map-selection-panel .map-panel-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px solid #8B4513;
                text-align: center;
            }
            
            .map-selection-panel .map-confirm-btn {
                background: linear-gradient(135deg, #8B4513 0%, #DAA520 100%);
                color: #fff;
                border: none;
                padding: 12px 40px;
                font-size: 18px;
                font-weight: bold;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .map-selection-panel .map-confirm-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 0 20px rgba(218, 165, 32, 0.5);
            }
            
            .map-selection-panel .map-panel-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .map-selection-panel .map-panel-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }
            
            .map-selection-panel .map-panel-content::-webkit-scrollbar-thumb {
                background: #8B4513;
                border-radius: 3px;
            }

            @media (max-width: 760px) {
                .map-selection-panel .map-panel-content {
                    grid-template-columns: 1fr;
                }

                .map-selection-panel .map-list,
                .map-selection-panel .civilization-list {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.panel);
    }

    addMapList() {
        const mapList = document.getElementById('map-list');
        if (!mapList) return;

        // 获取地图类型列表
        const mapTypes = this.getMapTypes();

        // 清空列表
        mapList.innerHTML = '';

        // 添加每个地图选项
        mapTypes.forEach(mapType => {
            const item = document.createElement('div');
            item.className = `map-item ${mapType.id === this.selectedMapType ? 'selected' : ''}`;
            item.dataset.mapId = mapType.id;
            
            item.innerHTML = `
                <span class="map-item-icon">${mapType.icon}</span>
                <span class="map-item-name">${mapType.name}</span>
                <span class="map-item-desc">${mapType.description}</span>
            `;

            // 添加点击事件
            item.addEventListener('click', () => {
                this.selectMap(mapType.id);
            });

            mapList.appendChild(item);
        });
    }

    addCivilizationList() {
        const civList = document.getElementById('civilization-list');
        if (!civList) return;

        civList.innerHTML = '';

        this.getCivilizationTypes().forEach(civ => {
            const item = document.createElement('div');
            item.className = `civilization-item ${civ.id === this.selectedCivilization ? 'selected' : ''}`;
            item.dataset.civId = civ.id;

            item.innerHTML = `
                <span class="civilization-item-name">${civ.name}</span>
                <span class="civilization-item-desc">${civ.description}</span>
            `;

            item.addEventListener('click', () => {
                this.selectCivilization(civ.id);
            });

            civList.appendChild(item);
        });
    }

    getMapTypes() {
        // 如果有地图生成器，使用它的地图类型
        if (this.game && this.game.mapGenerator) {
            return this.game.mapGenerator.getMapTypes();
        }

        // 默认地图类型
        return [
            { id: 'arabia', name: '阿拉伯', description: '开放式地图，资源分布均衡', icon: '🏜️' },
            { id: 'arena', name: '竞技场', description: '中心封闭区域，需要突破围墙', icon: '🏟️' },
            { id: 'blackforest', name: '黑森林', description: '茂密森林覆盖，适合伏击', icon: '🌲' },
            { id: 'grassland', name: '草原', description: '开阔草原，适合骑兵战术', icon: '🌿' },
            { id: 'islands', name: '岛屿', description: '多岛屿地图，需要发展海军', icon: '🏝️' },
            { id: 'river', name: '河流', description: '河流分割战场，战略要地争夺', icon: '🌊' },
            { id: 'highland', name: '高地', description: '地形起伏，高地具有战略优势', icon: '⛰️' },
            { id: 'goldrush', name: '淘金潮', description: '大量金矿分布，经济战为主', icon: '💰' }
        ];
    }

    selectMap(mapId) {
        // 更新选中状态
        const items = this.panel ? this.panel.querySelectorAll('.map-item') : document.querySelectorAll('.map-item');
        items.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.mapId === mapId) {
                item.classList.add('selected');
            }
        });

        this.selectedMapType = mapId;

        // 更新预览信息（如果有）
        this.updatePreview(mapId);
    }

    selectCivilization(civId) {
        const items = this.panel ? this.panel.querySelectorAll('.civilization-item') : document.querySelectorAll('.civilization-item');
        items.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.civId === civId) {
                item.classList.add('selected');
            }
        });

        this.selectedCivilization = civId;
        this.updateCivilizationDetails();
    }

    updatePreview(mapId) {
        // 可以在这里添加地图预览功能
        // 比如显示地图缩略图或生成预览
    }

    addConfirmButton() {
        const confirmBtn = document.getElementById('map-confirm-btn');
        if (!confirmBtn) return;

        confirmBtn.addEventListener('click', () => {
            this.confirmSelection();
        });
    }

    confirmSelection() {
        // 触发地图选择回调
        if (typeof this.onMapSelected === 'function') {
            this.onMapSelected(this.selectedMapType, this.selectedCivilization);
        }

        // 隐藏面板
        this.hide();
    }

    show() {
        if (this.panel) {
            this.panel.style.display = 'flex';
            // 添加背景遮罩
            this.addOverlay();
        }
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
            // 移除背景遮罩
            this.removeOverlay();
        }
    }

    addOverlay() {
        let overlay = document.getElementById('map-selection-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'map-selection-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999;
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'block';
    }

    removeOverlay() {
        const overlay = document.getElementById('map-selection-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    setOnMapSelected(callback) {
        this.onMapSelected = callback;
    }

    getSelectedMapType() {
        return this.selectedMapType;
    }

    getSelectedCivilization() {
        return this.selectedCivilization;
    }

    getCivilizationTypes() {
        return [
            {
                id: 'generic',
                name: '通用',
                description: '无特殊加成，适合标准规则体验',
                techs: ['没有文明加成，所有经济与军事规则保持基础数值。']
            },
            {
                id: 'spanish',
                name: '西班牙',
                description: '建造效率更高，适合快速铺开基地',
                techs: ['村民建造效率提高 25%。']
            },
            {
                id: 'celts',
                name: '凯尔特',
                description: '伐木经济更强，步兵机动更好',
                techs: ['伐木速度提高 15%。', '步兵移动速度提高 15%。']
            },
            {
                id: 'huns',
                name: '匈奴',
                description: '不依赖房屋人口，节奏更直接',
                techs: ['不需要房屋提供人口上限。']
            },
            {
                id: 'mongols',
                name: '蒙古',
                description: '狩猎效率突出，拥有特殊人口科技',
                techs: ['狩猎采集速度提高 50%。', '蒙古银冠科技可锁定当前最大人口。']
            },
            {
                id: 'khmer',
                name: '高棉',
                description: '村民可进入房屋驻扎',
                techs: ['村民可以驻扎进己方房屋。']
            }
        ];
    }

    updateCivilizationDetails() {
        const detailPanel = document.getElementById('civilization-tech-panel');
        if (!detailPanel) return;

        const civ = this.getCivilizationTypes().find(item => item.id === this.selectedCivilization) || this.getCivilizationTypes()[0];
        detailPanel.innerHTML = `
            <div class="civilization-tech-title">${civ.name}科技</div>
            <ul class="civilization-tech-list">
                ${civ.techs.map(tech => `<li>${tech}</li>`).join('')}
            </ul>
        `;
    }

    destroy() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.removeOverlay();
    }
}

export default MapSelectionPanel;

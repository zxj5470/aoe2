/**
 * 开始游戏配置面板：玩家列表 + 地图信息
 */
class MapSelectionPanel {
    constructor(game) {
        this.game = game;
        this.panel = null;
        this.selectedMapType = 'arabia';
        this.playerCount = 2;
        this.players = this.createDefaultPlayers();
        this.onMapSelected = null;

        this.init();
    }

    init() {
        this.createPanel();
        this.renderPlayerList();
        this.renderMapOptions();
        this.updateMapDetails();
        this.updateTechSummary();
        this.addConfirmButton();
        this.hide();
    }

    createDefaultPlayers() {
        return Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
            name: index === 0 ? '玩家' : `电脑 ${index}`,
            owner: index === 0 ? 'blue' : this.getOwnerByPlayerId(index + 1),
            civilization: index === 0 ? 'franks' : 'huns',
            enabled: index < this.playerCount
        }));
    }

    createPanel() {
        const existingPanel = document.getElementById('map-selection-panel');
        if (existingPanel) {
            this.panel = existingPanel;
            return;
        }

        this.panel = document.createElement('div');
        this.panel.id = 'map-selection-panel';
        this.panel.className = 'map-selection-panel';
        this.panel.innerHTML = `
            <div class="map-panel-header">
                <h2>开始游戏</h2>
                <button class="map-panel-close" onclick="game.mapSelectionPanel.hide()">×</button>
            </div>
            <div class="map-panel-content">
                <section class="start-panel-section player-section">
                    <div class="section-header">
                        <h3>玩家</h3>
                        <div class="player-count-control">
                            <button class="player-count-btn" id="player-count-minus" type="button">-</button>
                            <span id="player-count-value">2</span>
                            <button class="player-count-btn" id="player-count-plus" type="button">+</button>
                        </div>
                    </div>
                    <div class="player-list" id="player-list"></div>
                </section>
                <section class="start-panel-section map-info-section">
                    <div class="section-header">
                        <h3>地图信息</h3>
                    </div>
                    <label class="map-field">
                        <span>地图类型</span>
                        <select id="map-type-select" class="map-type-select"></select>
                    </label>
                    <div class="map-detail-card" id="map-detail-card"></div>
                    <div class="civilization-tech-panel" id="civilization-tech-panel"></div>
                </section>
            </div>
            <div class="map-panel-footer">
                <button class="map-confirm-btn" id="map-confirm-btn">开始游戏</button>
            </div>
        `;

        this.panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 3px solid #8B4513;
            border-radius: 12px;
            padding: 20px;
            width: 920px;
            max-width: 94vw;
            max-height: 90vh;
            overflow: hidden;
            display: none;
            flex-direction: column;
            z-index: 1000;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
        `;

        const style = document.createElement('style');
        style.textContent = `
            .map-selection-panel .map-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 18px;
                padding-bottom: 14px;
                border-bottom: 2px solid #8B4513;
            }

            .map-selection-panel .map-panel-header h2 {
                color: #FFD700;
                margin: 0;
                font-size: 24px;
                font-family: Arial, sans-serif;
            }

            .map-selection-panel .map-panel-close {
                background: none;
                border: none;
                color: #FFD700;
                font-size: 32px;
                cursor: pointer;
                padding: 0 10px;
                transition: color 0.2s;
            }

            .map-selection-panel .map-panel-close:hover {
                color: #FF6347;
            }

            .map-selection-panel .map-panel-content {
                flex: 1;
                min-height: 0;
                overflow: auto;
                display: grid;
                grid-template-columns: minmax(420px, 1.15fr) minmax(300px, 0.85fr);
                gap: 18px;
            }

            .map-selection-panel .start-panel-section {
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            .map-selection-panel .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }

            .map-selection-panel .section-header h3 {
                color: #FFD700;
                margin: 0;
                font-size: 16px;
                font-family: Arial, sans-serif;
            }

            .map-selection-panel .player-count-control {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #FFD700;
                font-weight: bold;
            }

            .map-selection-panel .player-count-btn {
                width: 28px;
                height: 28px;
                border-radius: 4px;
                border: 1px solid rgba(255, 215, 0, 0.55);
                background: rgba(255, 255, 255, 0.08);
                color: #FFD700;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
            }

            .map-selection-panel .player-count-btn:hover {
                background: rgba(255, 215, 0, 0.16);
            }

            .map-selection-panel .player-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow: auto;
                padding-right: 4px;
            }

            .map-selection-panel .player-row {
                display: grid;
                grid-template-columns: 36px minmax(72px, 1fr) minmax(130px, 1.3fr);
                gap: 10px;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 215, 0, 0.16);
                border-radius: 8px;
                padding: 10px;
            }

            .map-selection-panel .player-row.disabled {
                opacity: 0.42;
            }

            .map-selection-panel .player-slot {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-weight: bold;
                font-size: 13px;
            }

            .map-selection-panel .player-name {
                color: #eee;
                font-size: 14px;
                font-weight: bold;
            }

            .map-selection-panel select {
                width: 100%;
                min-height: 34px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 215, 0, 0.38);
                border-radius: 6px;
                color: #fff;
                padding: 6px 8px;
                outline: none;
            }

            .map-selection-panel select:focus {
                border-color: #FFD700;
            }

            .map-selection-panel select option {
                background: #16213e;
                color: #fff;
            }

            .map-selection-panel .map-field {
                display: grid;
                grid-template-columns: 78px 1fr;
                gap: 10px;
                align-items: center;
                color: #ddd;
                font-size: 13px;
                margin-bottom: 12px;
            }

            .map-selection-panel .map-detail-card,
            .map-selection-panel .civilization-tech-panel {
                background: rgba(0, 0, 0, 0.28);
                border: 1px solid rgba(255, 215, 0, 0.25);
                border-radius: 8px;
                padding: 12px;
                color: #ddd;
                line-height: 1.45;
            }

            .map-selection-panel .map-detail-card {
                margin-bottom: 12px;
            }

            .map-selection-panel .map-detail-title,
            .map-selection-panel .civilization-tech-title {
                color: #FFD700;
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 15px;
            }

            .map-selection-panel .map-detail-desc {
                color: #ccc;
                font-size: 13px;
                margin-bottom: 10px;
            }

            .map-selection-panel .map-detail-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
                font-size: 12px;
                color: #aaa;
            }

            .map-selection-panel .civilization-tech-list {
                margin: 0;
                padding-left: 0;
                font-size: 13px;
                list-style: none;
            }

            .map-selection-panel .civilization-tech-list li {
                margin-bottom: 6px;
            }

            .map-selection-panel .civilization-tech-player {
                margin-bottom: 12px;
            }

            .map-selection-panel .civilization-tech-player-name {
                color: #fff;
                font-weight: bold;
                margin-bottom: 6px;
            }

            .map-selection-panel .civilization-tech-item {
                color: #ccc;
                line-height: 1.45;
                padding-left: 14px;
                position: relative;
                overflow-wrap: anywhere;
            }

            .map-selection-panel .civilization-tech-item::before {
                content: "";
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: #FFD700;
                position: absolute;
                left: 0;
                top: 0.65em;
            }

            .map-selection-panel .map-panel-footer {
                margin-top: 18px;
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
                transition: all 0.2s;
            }

            .map-selection-panel .map-confirm-btn:hover {
                transform: scale(1.04);
                box-shadow: 0 0 20px rgba(218, 165, 32, 0.5);
            }

            .map-selection-panel .map-panel-content::-webkit-scrollbar,
            .map-selection-panel .player-list::-webkit-scrollbar {
                width: 6px;
            }

            .map-selection-panel .map-panel-content::-webkit-scrollbar-track,
            .map-selection-panel .player-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
            }

            .map-selection-panel .map-panel-content::-webkit-scrollbar-thumb,
            .map-selection-panel .player-list::-webkit-scrollbar-thumb {
                background: #8B4513;
                border-radius: 3px;
            }

            @media (max-width: 760px) {
                .map-selection-panel .map-panel-content {
                    grid-template-columns: 1fr;
                }

                .map-selection-panel .player-row {
                    grid-template-columns: 32px minmax(64px, 1fr);
                }

                .map-selection-panel .civilization-select {
                    grid-column: 2;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.panel);
    }

    renderPlayerList() {
        const countValue = document.getElementById('player-count-value');
        if (countValue) countValue.textContent = this.playerCount;

        const playerList = document.getElementById('player-list');
        if (!playerList) return;

        const civilizations = this.getCivilizationTypes();
        playerList.innerHTML = '';

        this.players.forEach((player, index) => {
            player.enabled = index < this.playerCount;

            const row = document.createElement('div');
            row.className = `player-row ${player.enabled ? '' : 'disabled'}`;
            row.dataset.playerId = player.id;

            const options = civilizations.map(civ => `
                <option value="${civ.id}" ${civ.id === player.civilization ? 'selected' : ''}>${civ.name}</option>
            `).join('');

            row.innerHTML = `
                <div class="player-slot" style="background:${this.getPlayerColor(player.id)}">${player.id}</div>
                <div class="player-name">${player.name}</div>
                <select class="civilization-select" data-player-id="${player.id}" ${player.enabled ? '' : 'disabled'}>
                    ${options}
                </select>
            `;

            playerList.appendChild(row);
        });

        playerList.querySelectorAll('.civilization-select').forEach(select => {
            select.addEventListener('change', event => {
                const playerId = Number(event.target.dataset.playerId);
                this.setPlayerCivilization(playerId, event.target.value);
            });
        });

        this.bindPlayerCountControls();
    }

    bindPlayerCountControls() {
        const minus = document.getElementById('player-count-minus');
        const plus = document.getElementById('player-count-plus');

        if (minus && !minus.dataset.bound) {
            minus.dataset.bound = 'true';
            minus.addEventListener('click', () => this.setPlayerCount(this.playerCount - 1));
        }

        if (plus && !plus.dataset.bound) {
            plus.dataset.bound = 'true';
            plus.addEventListener('click', () => this.setPlayerCount(this.playerCount + 1));
        }
    }

    renderMapOptions() {
        const select = document.getElementById('map-type-select');
        if (!select) return;

        select.innerHTML = this.getMapTypes().map(mapType => `
            <option value="${mapType.id}" ${mapType.id === this.selectedMapType ? 'selected' : ''}>${mapType.name}</option>
        `).join('');

        select.addEventListener('change', event => {
            this.selectMap(event.target.value);
        });
    }

    getMapTypes() {
        if (this.game && this.game.mapGenerator) {
            return this.game.mapGenerator.getMapTypes();
        }

        return [
            { id: 'arabia', name: '阿拉伯', description: '开放式地图，资源分布均衡', icon: 'desert', size: { width: 200, height: 200 } },
            { id: 'arena', name: '竞技场', description: '中心封闭区域，需要突破围墙', icon: 'arena', size: { width: 200, height: 200 } },
            { id: 'blackforest', name: '黑森林', description: '茂密森林覆盖，适合伏击', icon: 'forest', size: { width: 200, height: 200 } },
            { id: 'grassland', name: '草原', description: '开阔草原，适合骑兵战术', icon: 'grass', size: { width: 200, height: 200 } },
            { id: 'islands', name: '岛屿', description: '多岛屿地图，需要发展海军', icon: 'island', size: { width: 200, height: 200 } },
            { id: 'river', name: '河流', description: '河流分割战场，战略要地争夺', icon: 'river', size: { width: 200, height: 200 } },
            { id: 'highland', name: '高地', description: '地形起伏，高地具有战略优势', icon: 'highland', size: { width: 200, height: 200 } },
            { id: 'goldrush', name: '淘金潮', description: '大量金矿分布，经济战为主', icon: 'gold', size: { width: 200, height: 200 } }
        ];
    }

    selectMap(mapId) {
        this.selectedMapType = mapId;
        this.updateMapDetails();
    }

    setPlayerCount(count) {
        this.playerCount = Math.max(1, Math.min(8, count));
        this.renderPlayerList();
        this.updateTechSummary();
    }

    setPlayerCivilization(playerId, civilization) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.civilization = civilization;
        if (playerId === 1) {
            this.selectedCivilization = civilization;
        }
        this.updateTechSummary();
    }

    updateMapDetails() {
        const detailCard = document.getElementById('map-detail-card');
        if (!detailCard) return;

        const mapType = this.getSelectedMapInfo();
        const size = mapType.size || { width: 200, height: 200 };
        detailCard.innerHTML = `
            <div class="map-detail-title">${mapType.name}</div>
            <div class="map-detail-desc">${mapType.description || ''}</div>
            <div class="map-detail-grid">
                <span>地图尺寸：${size.width} x ${size.height}</span>
                <span>玩家数量：${this.playerCount}</span>
                <span>当前玩家：${this.players[0].name}</span>
                <span>玩家文明：${this.getCivilizationName(this.players[0].civilization)}</span>
            </div>
        `;
    }

    updateTechSummary() {
        const detailPanel = document.getElementById('civilization-tech-panel');
        if (!detailPanel) return;

        const activePlayers = this.getSelectedPlayers();
        detailPanel.innerHTML = `
            <div class="civilization-tech-title">文明科技</div>
            ${activePlayers.map(player => {
                const civ = this.getCivilizationInfo(player.civilization);
                return `
                    <div class="civilization-tech-player">
                        <div class="civilization-tech-player-name">${player.name} - ${civ.name}</div>
                        <ul class="civilization-tech-list">
                            ${civ.techs.map(tech => `<li class="civilization-tech-item">${tech}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }).join('')}
        `;

        this.updateMapDetails();
    }

    addConfirmButton() {
        const confirmBtn = document.getElementById('map-confirm-btn');
        if (!confirmBtn) return;

        confirmBtn.addEventListener('click', () => {
            this.confirmSelection();
        });
    }

    confirmSelection() {
        const selectedPlayers = this.getSelectedPlayers();
        const humanPlayer = selectedPlayers[0] || this.players[0];
        this.selectedCivilization = humanPlayer.civilization;

        if (typeof this.onMapSelected === 'function') {
            this.onMapSelected(this.selectedMapType, this.selectedCivilization, selectedPlayers);
        }

        this.hide();
    }

    show() {
        if (this.panel) {
            this.panel.style.display = 'flex';
            this.addOverlay();
        }
    }

    hide() {
        if (this.panel) {
            this.panel.style.display = 'none';
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

    getSelectedPlayers() {
        return this.players
            .filter((player, index) => index < this.playerCount)
            .map(player => ({ ...player, enabled: true }));
    }

    getSelectedMapInfo() {
        return this.getMapTypes().find(mapType => mapType.id === this.selectedMapType) || this.getMapTypes()[0];
    }

    getCivilizationInfo(civId) {
        return this.getCivilizationTypes().find(civ => civ.id === civId) || this.getCivilizationTypes()[0];
    }

    getCivilizationName(civId) {
        return this.getCivilizationInfo(civId).name;
    }

    getCivilizationTypes() {
        return [
            {
                id: 'franks',
                name: '法兰克',
                description: '骑士与城堡强势',
                techs: [
                    '城堡便宜 25%。',
                    '封建时代开始骑兵生命值 +20%。',
                    '农田升级免费（需要磨坊）。',
                    '浆果采集人的生产效率快 25%。',
                    '组队加成：骑士视野 +2。',
                    '城堡时代特色科技：骑士精神，马厩训练快 40%。',
                    '帝王时代特色科技：芒刺斧，掷斧兵攻击距离 +1。'
                ]
            },
            {
                id: 'spanish',
                name: '西班牙',
                description: '建造效率更高',
                techs: ['村民建造效率提高 25%。']
            },
            {
                id: 'celts',
                name: '凯尔特',
                description: '伐木经济更强',
                techs: ['伐木速度提高 15%。', '步兵移动速度提高 15%。']
            },
            {
                id: 'huns',
                name: '匈奴',
                description: '不依赖房屋人口',
                techs: ['不需要房屋提供人口上限，且不能建造房屋。']
            },
            {
                id: 'mongols',
                name: '蒙古',
                description: '狩猎效率突出',
                techs: ['狩猎采集速度提高 50%。', '蒙古银冠科技可锁定当前最大人口。']
            },
            {
                id: 'khmer',
                name: '高棉',
                description: '房屋可驻扎村民',
                techs: ['村民可以驻扎进己方房屋。']
            }
        ];
    }

    getOwnerByPlayerId(playerId) {
        const owners = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan', 'pink'];
        return owners[playerId - 1] || 'red';
    }

    getPlayerColor(playerId) {
        const colors = ['#0000FF', '#FF0000', '#008000', '#BDBD00', '#FF8000', '#800080', '#00A0A0', '#FF80FF'];
        return colors[playerId - 1] || '#888888';
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

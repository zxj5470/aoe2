import HUD from '../ui/HUD.js';

class UIManager {
    constructor(game) {
        this.game = game;
        this.hud = null;
        this.uiUpdateTimer = 0;
        this.uiUpdateInterval = 1;
    }

    init() {
        this.hud = new HUD(this.game);
        
        if (this.hud && this.hud.setupSelectionListener) {
            this.hud.setupSelectionListener();
        }
    }

    update(deltaTime) {
        if (this.hud) {
            this.hud.update(deltaTime);
        }

        this.uiUpdateTimer += deltaTime;
        if (this.uiUpdateTimer >= this.uiUpdateInterval) {
            this.uiUpdateTimer = 0;
            if (this.hud) {
                this.hud.updateUnitInfoPanel();
            }
        }
    }

    updateResourceDisplay() {
        const goldElement = document.getElementById('resource-gold');
        const woodElement = document.getElementById('resource-wood');
        const foodElement = document.getElementById('resource-food');
        const stoneElement = document.getElementById('resource-stone');
        
        if (goldElement) goldElement.textContent = this.game.resources.gold;
        if (woodElement) woodElement.textContent = this.game.resources.wood;
        if (foodElement) foodElement.textContent = this.game.resources.food;
        if (stoneElement) stoneElement.textContent = this.game.resources.stone;
    }

    getHUD() {
        return this.hud;
    }

    toggleDebugPanel() {
        if (this.hud) {
            this.hud.toggleDebugPanel();
        }
    }

    updateBuildingPanelConfig(config) {
        if (this.hud) {
            this.hud.updateBuildingPanelConfig(config);
        }
    }

    setButtonEmpty(index, isEmpty) {
        if (this.hud) {
            this.hud.setButtonEmpty(index, isEmpty);
        }
    }

    enableButton(index, config) {
        if (this.hud) {
            this.hud.enableButton(index, config);
        }
    }

    nextPreset() {
        if (this.hud) {
            this.hud.nextPreset();
        }
    }

    showNotification(message, duration = 3000) {
        if (this.hud) {
            this.hud.showNotification(message, duration);
        }
    }

    updateProductionProgressUI() {
        if (this.hud) {
            this.hud.updateProductionProgressUI();
        }
    }
}

export default UIManager;

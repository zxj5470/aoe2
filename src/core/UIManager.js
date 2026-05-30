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
        this.game.hud = this.hud;

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
                this.hud.resourceDisplay.updateGameTime(this.game.elapsedGameTime);
            }
        }
    }

    updateResourceDisplay() {
        if (this.hud) {
            this.hud.updateResourceDisplay();
        }
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

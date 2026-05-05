import * as THREE from 'three';
import ResourceDisplay from './ResourceDisplay.js';
import Minimap from './Minimap.js';
import ActionPanel from './ActionPanel.js';
import InfoPanel from './InfoPanel.js';

class HUD {
  constructor(game) {
    this.game = game;
    this.element = document.getElementById('hud');
    
    this.resourceDisplay = new ResourceDisplay(game);
    this.minimap = new Minimap(game);
    this.actionPanel = new ActionPanel(game);
    this.infoPanel = new InfoPanel(game);
    
    this.selectionListenerBound = false;
    this.ageDisplayCameraControl = null;
    
    this.init();
  }

  init() {
    this.resourceDisplay.init();
    this.minimap.init();
    this.actionPanel.init();
    this.infoPanel.init();
    
    this.setupEventListeners();
    this.setupMouseTracking();
    this.setupAgeDisplayCameraControl();
  }

  setupEventListeners() {
    if (this.game.resourceManager) {
      this.game.resourceManager.addListener((type, amount) => {
        this.resourceDisplay.updateResourceDisplay();
      });
    }

    this.setupSelectionListener();
  }

  setupSelectionListener() {
    if (this.selectionListenerBound) return;
    if (!this.game.selectionManager) return;

    this.game.selectionManager.addListener((event, data) => {
      if (event === 'select' || event === 'selectMultiple' || event === 'deselectAll') {
        const selectedEntities = this.game.selectionManager.getSelectedEntities();
        this.infoPanel.updateUnitInfo(selectedEntities);
        this.actionPanel.updateForSelection(selectedEntities);
      }
    });
    this.selectionListenerBound = true;
  }

  setupMouseTracking() {
    if (!this.game.canvas) return;

    this.game.canvas.addEventListener('mousemove', (e) => {
      if (this.game.inputHandler) {
        const worldPos = this.game.inputHandler.getWorldPosition();
        this.infoPanel.setMouseWorldPosition(worldPos);
      }
    });
  }

  setupAgeDisplayCameraControl() {
    const ageDisplay = document.querySelector('.age-display');
    if (!ageDisplay) return;

    let isMouseOver = false;
    let mouseDirection = 0;

    ageDisplay.addEventListener('mouseenter', () => {
      isMouseOver = true;
    });

    ageDisplay.addEventListener('mouseleave', () => {
      isMouseOver = false;
      mouseDirection = 0;
    });

    ageDisplay.addEventListener('mousemove', (e) => {
      if (!isMouseOver) return;

      const rect = ageDisplay.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const centerY = rect.height / 2;

      if (mouseY < centerY) {
        mouseDirection = 1;
      } else {
        mouseDirection = -1;
      }
    });

    this.ageDisplayCameraControl = {
      isActive: () => isMouseOver,
      getDirection: () => mouseDirection
    };
  }

  update(deltaTime) {
    this.minimap.render();
    this.infoPanel.updateDebugPanel(this.actionPanel.getBuildingPanelConfig());
    this.updateAgeDisplayCameraControl(deltaTime);
    this.updateProductionProgressUI();
  }

  updateUnitInfoPanel() {
    if (!this.game.selectionManager) return;
    const selectedEntities = this.game.selectionManager.getSelectedEntities();
    this.infoPanel.updateUnitInfo(selectedEntities);
  }

  updateAgeDisplayCameraControl(deltaTime) {
    if (!this.ageDisplayCameraControl || !this.ageDisplayCameraControl.isActive()) return;
    if (!this.game.camera) return;

    const direction = this.ageDisplayCameraControl.getDirection();
    if (direction === 0) return;

    const moveAmount = this.game.camera.moveSpeed * deltaTime * direction;

    if (direction > 0) {
      const moveDir = new THREE.Vector3(-1, 0, -1).normalize();
      this.game.camera.target.add(moveDir.clone().multiplyScalar(moveAmount));
    } else {
      const moveDir = new THREE.Vector3(1, 0, 1).normalize();
      this.game.camera.target.add(moveDir.clone().multiplyScalar(moveAmount));
    }

    this.game.camera.target.y = 0;
    this.game.camera.updateCameraPosition();
  }

  updateResourceDisplay() {
    this.resourceDisplay.updateResourceDisplay();
  }

  updatePopulation(current, max) {
    this.resourceDisplay.updatePopulation(current, max);
  }

  updateAge(ageName) {
    this.resourceDisplay.updateAge(ageName);
  }

  getPopulation() {
    return this.resourceDisplay.getPopulation();
  }

  getAge() {
    return this.resourceDisplay.getAge();
  }

  toggleDebugPanel() {
    this.infoPanel.toggleDebugPanel();
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

  getBuildingPanelConfig() {
    return this.actionPanel.getBuildingPanelConfig();
  }

  getCurrentPreset() {
    return this.actionPanel.getCurrentPreset();
  }

  updateProductionProgressUI() {
    if (!this.game.selectionManager) return;
    const selected = this.game.selectionManager.getSelectedEntities();
    if (!selected || selected.length !== 1) return;

    const building = selected[0];
    if (building.type !== 'building') return;

    const container = this.actionPanel.container;
    if (!container) return;

    const buttons = container.querySelectorAll('.building-btn');
    if (!buttons.length) return;

    for (const button of buttons) {
      button.style.background = '';
      button.title = '';
    }

    if (building.currentProduction) {
      const progress = building.productionProgress || 0;
      const item = building.currentProduction;
      const name = item.unitType || item.techType || '';

      if (buttons[0]) {
        buttons[0].style.background =
          `linear-gradient(to right, rgba(0,200,0,0.4) ${progress}%, transparent ${progress}%)`;
        buttons[0].title = `生产中: ${name} (${Math.floor(progress)}%)`;
      }
    } else if (building.isUnderConstruction) {
      const progress = building.constructionProgress || 0;
      if (buttons[0]) {
        buttons[0].style.background =
          `linear-gradient(to right, rgba(200,200,0,0.4) ${progress}%, transparent ${progress}%)`;
        buttons[0].title = `建造中 (${Math.floor(progress)}%)`;
      }
    }
  }
}

export default HUD;

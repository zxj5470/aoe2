import * as THREE from 'three';
import ResourceDisplay from './ResourceDisplay.js';
import Minimap from './Minimap.js';
import ActionPanel from './ActionPanel.js';
import InfoPanel from './InfoPanel.js';
import { TECH_CONFIG, getBuildingName } from '../config.js';

class HUD {
  constructor(game) {
    this.game = game;
    this.element = document.getElementById('hud');
    
    this.resourceDisplay = new ResourceDisplay(game);
    this.minimap = new Minimap(game);
    this.actionPanel = new ActionPanel(game);
    this.infoPanel = new InfoPanel(game);
    this.civilizationTechWidget = document.getElementById('civilization-tech-widget');
    this.civilizationTechWidgetSignature = '';
    
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
    this.updateCivilizationTechWidget();
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
    this.updateCivilizationTechWidget();
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
    const bar = document.getElementById('production-queue-bar');
    const container = bar ? bar.querySelector('.production-items') : null;
    if (!bar || !container) return;

    // 收集所有玩家建筑的生产信息
    const productions = [];
    const entities = this.game.entityManager ? this.game.entityManager.getEntities() : [];

    for (const entity of entities) {
      if (entity.type !== 'building' || !entity.isPlayerOwned() || !entity.isAlive) continue;
      if (!entity.currentProduction && entity.productionQueue.length === 0) continue;

      productions.push({
        building: entity,
        current: entity.currentProduction,
        progress: entity.productionProgress || 0,
        queueCount: entity.productionQueue.length
      });
    }

    if (productions.length === 0) {
      bar.classList.remove('visible');
      return;
    }

    bar.classList.add('visible');

    // 构建生产项 HTML
    let html = '';
    const unitIcons = { villager: '👤', soldier: '⚔️', knight: '🐴', archer: '🏹', scout: '🏇' };
    const unitNames = { villager: '村民', soldier: '士兵', knight: '骑士', archer: '弓箭手', scout: '侦察兵' };

    for (const prod of productions) {
      const item = prod.current;
      if (!item) continue;

      const icon = item.type === 'unit'
        ? (unitIcons[item.unitType] || '📦')
        : (TECH_CONFIG[item.techType]?.icon || '技');
      const name = item.type === 'unit'
        ? (unitNames[item.unitType] || item.unitType)
        : (TECH_CONFIG[item.techType]?.name || item.techType || '');
      const progress = Math.min(prod.progress, 100);

      html += `<div class="production-item">`;
      html += `<span class="prod-icon">${icon}</span>`;
      html += `<span>${name}</span>`;
      html += `<div class="prod-progress-bar"><div class="prod-progress-fill" style="width:${progress}%"></div></div>`;
      if (prod.queueCount > 0) {
        html += `<span class="prod-queue-count">${prod.queueCount + 1}</span>`;
      }
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  updateCivilizationTechWidget() {
    if (!this.civilizationTechWidget || !this.game.player) return;

    const civId = this.game.player.civilization || this.game.selectedCivilization || 'franks';
    const civName = this.getCivilizationName(civId);
    const civInitial = civName.slice(0, 2).toUpperCase();
    const researched = this.game.player.researchedTechs || new Set();
    const techLines = this.getTechnologyLines(researched);
    const signature = `${civId}:${[...researched].sort().join(',')}`;
    if (signature === this.civilizationTechWidgetSignature) return;

    this.civilizationTechWidget.innerHTML = `
      <div class="civilization-tech-icon">${civInitial}</div>
      <div class="civilization-tech-dropdown">
        <div class="civilization-tech-heading">${civName}</div>
        ${this.renderTechLineSection('科技树', techLines)}
      </div>
    `;
    this.civilizationTechWidgetSignature = signature;
  }

  getTechnologyLines(researched) {
    const lines = new Map();

    for (const [techType, tech] of Object.entries(TECH_CONFIG)) {
      const lineId = tech.line || techType;
      if (!lines.has(lineId)) {
        lines.set(lineId, {
          id: lineId,
          name: tech.lineName || tech.name || techType,
          icon: tech.icon || '',
          building: tech.building,
          maxTier: tech.maxTier || 1,
          researchedTier: 0,
          entries: []
        });
      }

      const line = lines.get(lineId);
      line.entries.push([techType, tech]);
      line.maxTier = Math.max(line.maxTier, tech.maxTier || tech.tier || 1);
      if (researched.has(techType)) {
        line.researchedTier = Math.max(line.researchedTier, tech.tier || 1);
      }
    }

    return [...lines.values()].map(line => {
      line.entries.sort((a, b) => (a[1].tier || 1) - (b[1].tier || 1));
      const next = line.entries.find(([techType]) => !researched.has(techType));
      const latest = line.entries
        .slice()
        .reverse()
        .find(([techType]) => researched.has(techType));

      line.nextTech = next?.[1] || null;
      line.currentTech = latest?.[1] || null;
      line.description = line.currentTech?.description || line.nextTech?.description || line.entries[0]?.[1]?.description || '';
      line.stateText = line.researchedTier >= line.maxTier ? '完成' : `${line.researchedTier}/${line.maxTier}`;
      return line;
    }).sort((a, b) => {
      if (a.building !== b.building) return String(a.building).localeCompare(String(b.building));
      return a.name.localeCompare(b.name);
    });
  }

  renderTechLineSection(title, rows) {
    if (!rows.length) {
      return `
        <div class="civilization-tech-section">
          <div class="civilization-tech-section-title">${title}</div>
          <div class="civilization-tech-row locked">
            <span class="civilization-tech-row-icon">-</span>
            <span>无</span>
            <span class="civilization-tech-row-state"></span>
          </div>
        </div>
      `;
    }

    return `
      <div class="civilization-tech-section">
        <div class="civilization-tech-section-title">${title}</div>
        <div class="civilization-tech-list">
          ${rows.map(line => `
            <div class="civilization-tech-row ${line.researchedTier > 0 ? 'researched' : 'locked'}">
              <span class="civilization-tech-row-icon">${line.icon || ''}</span>
              <span class="civilization-tech-row-body">
                <span class="civilization-tech-row-name">${line.name}</span>
                <span class="civilization-tech-row-desc">${getBuildingName(line.building)} · ${line.description}</span>
                <span class="civilization-tech-progress">
                  ${Array.from({ length: line.maxTier }, (_, index) =>
                    `<span class="civilization-tech-progress-box ${index < line.researchedTier ? 'researched' : ''}"></span>`
                  ).join('')}
                </span>
              </span>
              <span class="civilization-tech-row-state">${line.stateText}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getCivilizationName(civId) {
    const names = {
      franks: '法兰克',
      spanish: '西班牙',
      celts: '凯尔特',
      huns: '匈奴',
      mongols: '蒙古',
      khmer: '高棉'
    };
    return names[civId] || civId;
  }
}

export default HUD;

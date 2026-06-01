import * as THREE from 'three';
import ResourceDisplay from './ResourceDisplay.js';
import Minimap from './Minimap.js';
import ActionPanel from './ActionPanel.js';
import InfoPanel from './InfoPanel.js';
import { BUILDING_TYPES, TECH_CONFIG, getBuildingName } from '../config.js';

const TECH_GROUP_ORDER = [
  BUILDING_TYPES.BLACKSMITH,
  BUILDING_TYPES.BARRACKS,
  BUILDING_TYPES.ARCHERY_RANGE,
  BUILDING_TYPES.STABLE,
  BUILDING_TYPES.TOWN_CENTER
];

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
    this.civilizationTechHideTimer = null;
    this.productionQueueBar = document.getElementById('production-queue-bar');
    this.productionQueueContainer = this.productionQueueBar?.querySelector('.production-items') || null;
    
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
    this.updateUnitInfoPanel();
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
    const bar = this.productionQueueBar || document.getElementById('production-queue-bar');
    const container = this.productionQueueContainer || bar?.querySelector('.production-items');
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
        queue: entity.productionQueue || []
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
      const queueCount = prod.queue.filter(queueItem => this.isSameProductionItem(queueItem, item)).length;

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
      if (queueCount > 0) {
        html += `<span class="prod-queue-count">${queueCount + 1}</span>`;
      }
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  isSameProductionItem(a, b) {
    if (!a || !b || a.type !== b.type) return false;
    if (a.type === 'unit') return a.unitType === b.unitType;
    if (a.type === 'research') return a.techType === b.techType;
    return false;
  }

  updateCivilizationTechWidget() {
    if (!this.civilizationTechWidget || !this.game.player) return;

    const civId = this.game.player.civilization || this.game.selectedCivilization || 'franks';
    const civName = this.getCivilizationName(civId);
    const civInitial = civName.slice(0, 2).toUpperCase();
    const researched = this.game.player.researchedTechs || new Set();
    const techGroups = this.getTechnologyGroups(researched);
    const signature = `${civId}:${[...researched].sort().join(',')}`;
    if (signature === this.civilizationTechWidgetSignature) return;

    this.civilizationTechWidget.innerHTML = `
      <div class="civilization-tech-icon">${civInitial}</div>
      <div class="civilization-tech-dropdown">
        <div class="civilization-tech-heading">${civName}</div>
        ${this.renderTechGroupSection(techGroups)}
      </div>
    `;
    this.civilizationTechWidgetSignature = signature;
    this.setupCivilizationTechHover();
  }

  setupCivilizationTechHover() {
    if (!this.civilizationTechWidget) return;

    this.civilizationTechWidget.onmouseenter = () => {
      this.showCivilizationTechWidget();
    };
    this.civilizationTechWidget.onmouseleave = () => {
      this.scheduleHideCivilizationTechWidget();
    };
  }

  showCivilizationTechWidget() {
    if (!this.civilizationTechWidget) return;
    if (this.civilizationTechHideTimer) {
      clearTimeout(this.civilizationTechHideTimer);
      this.civilizationTechHideTimer = null;
    }
    this.civilizationTechWidget.classList.add('open');
  }

  scheduleHideCivilizationTechWidget() {
    if (!this.civilizationTechWidget) return;
    if (this.civilizationTechHideTimer) {
      clearTimeout(this.civilizationTechHideTimer);
    }
    this.civilizationTechHideTimer = setTimeout(() => {
      this.civilizationTechWidget.classList.remove('open');
      this.civilizationTechHideTimer = null;
    }, 2000);
  }

  getTechnologyGroups(researched) {
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

    const groups = new Map();
    for (const line of [...lines.values()].map(line => {
      line.entries.sort((a, b) => (a[1].tier || 1) - (b[1].tier || 1));
      const next = line.entries.find(([techType]) => !researched.has(techType));
      const latest = line.entries
        .slice()
        .reverse()
        .find(([techType]) => researched.has(techType));

      line.nextTechType = next?.[0] || null;
      line.nextTech = next?.[1] || null;
      line.currentTech = latest?.[1] || null;
      line.description = line.currentTech?.description || line.nextTech?.description || line.entries[0]?.[1]?.description || '';
      line.stateText = line.researchedTier >= line.maxTier ? '完成' : `${line.researchedTier}/${line.maxTier}`;
      return line;
    })) {
      const building = line.building || 'other';
      if (!groups.has(building)) {
        groups.set(building, {
          building,
          title: getBuildingName(building),
          maxTier: 1,
          lines: []
        });
      }

      const group = groups.get(building);
      group.lines.push(line);
      group.maxTier = Math.max(group.maxTier, line.maxTier);
    }

    return [...groups.values()].map(group => {
      group.lines.sort((a, b) => a.name.localeCompare(b.name));
      return group;
    }).sort((a, b) => {
      const aIndex = TECH_GROUP_ORDER.indexOf(a.building);
      const bIndex = TECH_GROUP_ORDER.indexOf(b.building);
      const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (normalizedA !== normalizedB) return normalizedA - normalizedB;
      return a.title.localeCompare(b.title);
    });
  }

  renderTechGroupSection(groups) {
    if (!groups.length) {
      return `
        <div class="civilization-tech-section">
          <div class="civilization-tech-section-title">科技树</div>
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
        <div class="civilization-tech-section-title">科技树</div>
        <div class="civilization-tech-groups">
          ${groups.map(group => this.renderTechGroup(group)).join('')}
        </div>
      </div>
    `;
  }

  renderTechGroup(group) {
    return `
      <div class="civilization-tech-group">
        <div class="civilization-tech-group-title">
          <span>${group.title}</span>
          <span>${group.lines.length}类科技</span>
        </div>
        <div class="civilization-tech-matrix" style="--tech-columns:${group.maxTier}">
          ${group.lines.map(line => this.renderTechMatrixLine(line, group.maxTier)).join('')}
        </div>
      </div>
    `;
  }

  renderTechMatrixLine(line, groupMaxTier) {
    return `
      <div class="civilization-tech-line-label">
        <span class="civilization-tech-row-icon">${line.icon || ''}</span>
        <span class="civilization-tech-line-name">${line.name}</span>
      </div>
      <div class="civilization-tech-line-cells">
        ${Array.from({ length: groupMaxTier }, (_, index) => this.renderTechCell(line, index + 1)).join('')}
      </div>
      <div class="civilization-tech-row-state">${line.stateText}</div>
    `;
  }

  renderTechCell(line, tier) {
    const entry = line.entries.find(([, tech]) => (tech.tier || 1) === tier);
    if (!entry) {
      return '<span class="civilization-tech-cell unavailable"></span>';
    }

    const [techType, tech] = entry;
    const isResearched = line.researchedTier >= tier;
    const isNext = line.nextTechType === techType;
    const stateClass = isResearched ? 'researched' : (isNext ? 'available' : 'locked');

    return `
      <span class="civilization-tech-cell ${stateClass}" title="${tech.name} - ${tech.description}">
        <span>${tech.icon || tech.name.slice(0, 1)}</span>
      </span>
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

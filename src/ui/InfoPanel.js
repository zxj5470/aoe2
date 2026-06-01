import { CELL_SIZE, TECH_CONFIG, getPlayerColor, getPlayerName } from '../config.js';

// 村民工种名称映射（根据资源类型）
const VILLAGER_JOB_NAMES = {
  wood: '伐木工',
  gold: '矿工',
  stone: '矿工'
};

// 食物类工种映射（根据资源节点名称判断）
const FOOD_JOB_NAMES = {
  sheep: '牧羊人',
  deer: '猎人',
  boar: '猎人',
  berry: '采集工',
  浆果: '采集工'
};

function getVillagerDisplayName(entity) {
  if (entity.unitType !== 'villager') return entity.name;

  // 有当前资源正在采集：优先根据资源节点名称判断食物类工种
  if (entity.currentResource && !entity.isMoving) {
    if (entity.carryType === 'food') {
      const resourceName = entity.currentResource?.name || '';
      const lowerName = resourceName.toLowerCase();
      for (const [key, jobName] of Object.entries(FOOD_JOB_NAMES)) {
        if (lowerName.includes(key)) return jobName;
      }
      return '采集工';
    }
    if (VILLAGER_JOB_NAMES[entity.carryType]) {
      return VILLAGER_JOB_NAMES[entity.carryType];
    }
  }

  // 携带资源但未在采集（中断后）：保留工种名称直到资源投放或切换类型
  if (entity.carryType && entity.carryAmount > 0) {
    if (entity.carryType === 'food') {
      // 食物类：尝试从 lastResourcePosition 获取资源名称
      const lastNode = entity.lastResourcePosition?.node;
      if (lastNode) {
        const lowerName = (lastNode.name || '').toLowerCase();
        for (const [key, jobName] of Object.entries(FOOD_JOB_NAMES)) {
          if (lowerName.includes(key)) return jobName;
        }
      }
      return '采集工';
    }
    if (VILLAGER_JOB_NAMES[entity.carryType]) {
      return VILLAGER_JOB_NAMES[entity.carryType];
    }
  }

  return entity.name;
}

class InfoPanel {
  constructor(game) {
    this.game = game;
    this.unitInfoContent = document.getElementById('unit-info-content');
    this.debugPanel = document.getElementById('debug-panel');
    this.debugElements = {
      position: document.getElementById('debug-position'),
      target: document.getElementById('debug-target'),
      zoom: document.getElementById('debug-zoom'),
      mouseScreen: document.getElementById('debug-mouse-screen'),
      mouseWorld: document.getElementById('debug-mouse-world'),
      nw: document.getElementById('debug-nw'),
      ne: document.getElementById('debug-ne'),
      se: document.getElementById('debug-se'),
      sw: document.getElementById('debug-sw'),
      mapWidth: document.getElementById('debug-map-width'),
      mapHeight: document.getElementById('debug-map-height'),
      panelRows: document.getElementById('debug-panel-rows'),
      panelCols: document.getElementById('debug-panel-cols'),
      panelButtons: document.getElementById('debug-panel-buttons'),
      pickType: document.getElementById('debug-pick-type'),
      pickName: document.getElementById('debug-pick-name'),
      pickPosition: document.getElementById('debug-pick-position'),
      pickOwner: document.getElementById('debug-pick-owner'),
      pickHealth: document.getElementById('debug-pick-health')
    };
    this.mouseWorldPosition = null;
    this.boundProductionQueueClick = null;
  }

  init() {
    this.setupProductionQueueClick();
  }

  setupProductionQueueClick() {
    if (!this.unitInfoContent || this.boundProductionQueueClick) return;

    this.boundProductionQueueClick = (event) => {
      const item = event.target.closest('.info-production-cell');
      if (!item) return;

      event.preventDefault();
      event.stopPropagation();
      this.cancelProductionQueueItem(item.dataset);
    };

    this.unitInfoContent.addEventListener('pointerdown', this.boundProductionQueueClick);
  }

  updateUnitInfo(selectedEntities) {
    if (!this.unitInfoContent) return;

    if (!selectedEntities || selectedEntities.length === 0) {
      this.unitInfoContent.innerHTML = `
        <div style="color: #888; text-align: center; padding: 40px 0;">
          未选择任何单位
        </div>
      `;
      return;
    }

    let html = '';

    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];
      const ownerName = getPlayerName(entity.owner);

      // 第一行：实体名 + 玩家名（玩家名带颜色）
      const displayName = getVillagerDisplayName(entity);
      html = `
        <div class="info-row" style="justify-content: flex-start;">
          <span>${displayName} <span style="color: ${getPlayerColor(entity.owner)}">(${ownerName})</span></span>
        </div>
      `;

      // 显示血量（单位或建筑）
      if (entity.health !== undefined && entity.maxHealth !== undefined) {
        let healthColor = '#00FF00';
        const healthPercent = (entity.health / entity.maxHealth) * 100;
        if (healthPercent <= 30) {
          healthColor = '#FF0000';
        } else if (healthPercent <= 60) {
          healthColor = '#FFFF00';
        }
        html += `
          <div class="info-row" style="margin-top: 8px;">
            <span>生命值:</span>
            <span style="color: ${healthColor};">${entity.health}/${entity.maxHealth}</span>
          </div>
        `;
      }

      // 资源节点（绵羊等有 health 和 amount 两个属性，需要独立显示）
      if (entity.type === 'resource' && entity.amount !== undefined) {
        html += `
          <div class="info-row" style="margin-top: 8px;">
            <span>资源量:</span>
            <span>${Math.ceil(entity.amount)}</span>
          </div>
        `;
      }

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

        if (entity.unitType === 'villager' && entity.carryAmount > 0) {
          html += `
            <div class="info-row" style="margin-top: 8px; color: #FFD700;">
              <span>携带资源:</span>
              <span>${Math.floor(entity.carryAmount)} ${entity.carryType || '无'}</span>
            </div>
          `;
        }
      } else if (entity.type === 'building') {
        html += `
          <div class="info-row" style="margin-top: 8px;">
            <span>建筑类型:</span>
            <span>${entity.buildingType || '未知'}</span>
          </div>
        `;

        // 显示建造信息（如果正在建造中）
        if (entity.isUnderConstruction) {
          const info = entity.getConstructionInfo ? entity.getConstructionInfo() : {
            progress: entity.constructionProgress || 0,
            builderCount: entity.builderVillagers ? entity.builderVillagers.length : 0,
            requiredBuilders: entity.requiredBuilders || 1,
            remainingTimeSec: 0
          };
          const progress = Math.round(info.progress || 0);
          const remainingTimeSec = info.remainingTimeSec || 0;
          const builderCount = info.builderCount || 0;
          const requiredBuilders = info.requiredBuilders || 1;

          html += `
            <div class="info-row" style="margin-top: 8px; color: #FFA500;">
              <span>建造进度:</span>
              <span>${progress}%</span>
            </div>
            <div class="info-row">
              <span>剩余时间:</span>
              <span>${remainingTimeSec}秒</span>
            </div>
            <div class="info-row">
              <span>建造者:</span>
              <span>${builderCount}/${requiredBuilders}</span>
            </div>
          `;
        }

        if (!entity.isUnderConstruction) {
          html += this.renderBuildingProductionQueue(entity);
        }
      }
    } else {
      // 多个单位选择
      html = `<div class="info-row"><span>已选择:</span><span>${selectedEntities.length} 个单位</span></div>`;

      // 计算总血量
      const totalHealth = selectedEntities.reduce((sum, e) => {
        if (e.health !== undefined && e.maxHealth !== undefined) {
          return sum + e.health;
        }
        return sum;
      }, 0);

      const totalMaxHealth = selectedEntities.reduce((sum, e) => {
        if (e.maxHealth !== undefined) {
          return sum + e.maxHealth;
        }
        return sum;
      }, 0);

      if (totalMaxHealth > 0) {
        let healthColor = '#00FF00';
        const avgHealthPercent = (totalHealth / totalMaxHealth) * 100;
        if (avgHealthPercent <= 30) {
          healthColor = '#FF0000';
        } else if (avgHealthPercent <= 60) {
          healthColor = '#FFFF00';
        }
        html += `
          <div class="info-row" style="margin-top: 8px;">
            <span>总生命值:</span>
            <span style="color: ${healthColor};">${totalHealth}/${totalMaxHealth}</span>
          </div>
        `;
      }

      // 统计每种类型的数量和血量范围
      const types = {};
      for (const entity of selectedEntities) {
        const type = entity.unitType || entity.buildingType || entity.type;
        if (!types[type]) {
          types[type] = { count: 0, healths: [], maxHealths: [] };
        }
        types[type].count++;
        if (entity.health !== undefined) {
          types[type].healths.push(entity.health);
        }
        if (entity.maxHealth !== undefined) {
          types[type].maxHealths.push(entity.maxHealth);
        }
      }

      html += '<div style="margin-top: 10px;">';
      for (const type in types) {
        const info = types[type];
        let healthInfo = '';
        if (info.healths.length > 0 && info.maxHealths.length > 0) {
          const minHealth = Math.min(...info.healths);
          const maxHealth = Math.max(...info.healths);
          healthInfo = ` (${minHealth}-${maxHealth})`;
        }
        html += `<div class="info-row"><span>${type}${healthInfo}:</span><span>${info.count}</span></div>`;
      }
      html += '</div>';
    }

    this.unitInfoContent.innerHTML = html;
  }

  renderBuildingProductionQueue(building) {
    const current = building.currentProduction;
    const queue = building.productionQueue || [];

    if (!current && queue.length === 0) {
      return `
        <div class="info-production-panel">
          <div class="info-production-title">生产队列</div>
          <div class="info-production-empty">空闲</div>
        </div>
      `;
    }

    const currentCell = current
      ? this.renderProductionCell(building, current, {
          slot: 'current',
          index: -1,
          progress: building.productionProgress || 0,
          large: true
        })
      : '<div class="info-production-cell info-production-cell-main empty"></div>';
    const queueCells = queue
      .slice(0, 14)
      .map((item, index) => this.renderProductionCell(building, item, {
        slot: 'queue',
        index,
        progress: 0,
        large: false
      }))
      .join('');
    const overflow = queue.length > 14
      ? `<span class="info-production-overflow">+${queue.length - 14}</span>`
      : '';

    return `
      <div class="info-production-panel">
        <div class="info-production-title">生产队列</div>
        <div class="info-production-layout">
          ${currentCell}
          <div class="info-production-queue">
            ${queueCells}
            ${overflow}
          </div>
        </div>
      </div>
    `;
  }

  renderProductionCell(building, item, options) {
    const icon = this.getProductionItemIcon(item);
    const name = this.getProductionItemName(item);
    const progress = Math.max(0, Math.min(options.progress || 0, 100));
    const classes = [
      'info-production-cell',
      options.large ? 'info-production-cell-main' : 'info-production-cell-small'
    ].join(' ');
    const progressBar = options.large
      ? `<span class="info-production-progress"><span style="width:${progress}%"></span></span>`
      : '';

    return `
      <button class="${classes}" type="button"
        data-building-id="${building.id}"
        data-slot="${options.slot}"
        data-index="${options.index}"
        title="点击取消 ${name} 并返还资源">
        <span class="info-production-icon">${icon}</span>
        ${progressBar}
      </button>
    `;
  }

  cancelProductionQueueItem(dataset) {
    const building = this.findEntityById(dataset.buildingId);
    if (!building?.cancelProductionAt) return;

    const slot = dataset.slot;
    const index = Number(dataset.index);
    const canceled = slot === 'current'
      ? building.cancelProductionAt('current')
      : building.cancelProductionAt('queue', index);
    if (!canceled) return;

    this.refundProductionCost(this.getProductionItemCost(canceled));
    this.updateUnitInfo([building]);

    if (this.game.hud) {
      this.game.hud.updateResourceDisplay();
      this.game.hud.updateProductionProgressUI();
      this.game.hud.showNotification(`已取消 ${this.getProductionItemName(canceled)}，资源已返还`, 1200);
    }
  }

  findEntityById(id) {
    if (!id || !this.game.entityManager) return null;
    return this.game.entityManager.getEntities().find(entity => entity.id === id) || null;
  }

  refundProductionCost(cost) {
    if (!cost || !this.game.resourceManager) return;
    this.game.resourceManager.addResources(cost);
  }

  getProductionItemCost(item) {
    if (item.cost) return item.cost;
    if (item.type === 'unit') return this.getUnitCost(item.unitType);
    if (item.type === 'research') return TECH_CONFIG[item.techType]?.cost || {};
    return {};
  }

  getUnitCost(unitType) {
    const costs = {
      villager: { food: 50 },
      soldier: { food: 60, gold: 20 },
      knight: { food: 60, gold: 75 },
      archer: { wood: 25, gold: 45 },
      scout: { food: 80 }
    };
    return costs[unitType] || {};
  }

  getProductionItemName(item) {
    if (item.type === 'unit') {
      const unitNames = { villager: '村民', soldier: '士兵', knight: '骑士', archer: '弓箭手', scout: '侦察兵' };
      return unitNames[item.unitType] || item.unitType;
    }

    if (item.type === 'research') {
      return TECH_CONFIG[item.techType]?.name || item.techType;
    }

    return '生产项';
  }

  getProductionItemIcon(item) {
    if (item.type === 'unit') {
      const unitIcons = { villager: '👤', soldier: '⚔️', knight: '🐴', archer: '🏹', scout: '🏇' };
      return unitIcons[item.unitType] || '📦';
    }

    if (item.type === 'research') {
      return TECH_CONFIG[item.techType]?.icon || '技';
    }

    return '?';
  }

  setMouseWorldPosition(pos) {
    this.mouseWorldPosition = pos;
  }

  updateDebugPanel(panelConfig = null) {
    if (!this.debugPanel || !this.debugPanel.classList.contains('visible')) return;

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

    if (this.debugElements.mouseScreen) {
      this.debugElements.mouseScreen.textContent = this.mouseWorldPosition ? 
        `(${this.mouseWorldPosition.x.toFixed(1)}, ${this.mouseWorldPosition.z.toFixed(1)})` : '-';
    }
    if (this.debugElements.mouseWorld) {
      if (this.mouseWorldPosition) {
        const mapSize = this.game.map ? this.game.map.getSize() : { width: 200, height: 200 };
        const gridX = Math.floor((this.mouseWorldPosition.x + mapSize.width / 2) / CELL_SIZE);
        const gridZ = Math.floor((this.mouseWorldPosition.z + mapSize.height / 2) / CELL_SIZE);
        this.debugElements.mouseWorld.textContent = `X: ${this.mouseWorldPosition.x.toFixed(1)}, Z: ${this.mouseWorldPosition.z.toFixed(1)} (网格: ${gridX}, ${gridZ})`;
      } else {
        this.debugElements.mouseWorld.textContent = '-';
      }
    }

    this.updateMousePickInfo();

    if (this.game.camera && this.game.map) {
      const cameraTarget = this.game.camera.target;
      const camera = this.game.camera.getCamera();
      
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
      
      if (this.debugElements.nw) this.debugElements.nw.textContent = `(${(cameraTarget.x - halfWidth).toFixed(1)}, ${(cameraTarget.z - halfHeight).toFixed(1)})`;
      if (this.debugElements.ne) this.debugElements.ne.textContent = `(${(cameraTarget.x + halfWidth).toFixed(1)}, ${(cameraTarget.z - halfHeight).toFixed(1)})`;
      if (this.debugElements.se) this.debugElements.se.textContent = `(${(cameraTarget.x + halfWidth).toFixed(1)}, ${(cameraTarget.z + halfHeight).toFixed(1)})`;
      if (this.debugElements.sw) this.debugElements.sw.textContent = `(${(cameraTarget.x - halfWidth).toFixed(1)}, ${(cameraTarget.z + halfHeight).toFixed(1)})`;
    }
    
    if (this.game.map) {
      const mapSize = this.game.map.getSize();
      if (this.debugElements.mapWidth) {
        this.debugElements.mapWidth.textContent = `[${(-mapSize.width / 2).toFixed(0)}, ${(mapSize.width / 2).toFixed(0)}]`;
      }
      if (this.debugElements.mapHeight) {
        this.debugElements.mapHeight.textContent = `[${(-mapSize.height / 2).toFixed(0)}, ${(mapSize.height / 2).toFixed(0)}]`;
      }
    }
    
    if (panelConfig) {
      if (this.debugElements.panelRows) {
        this.debugElements.panelRows.textContent = panelConfig.rows;
      }
      if (this.debugElements.panelCols) {
        this.debugElements.panelCols.textContent = panelConfig.cols;
      }
      if (this.debugElements.panelButtons) {
        this.debugElements.panelButtons.textContent = panelConfig.totalButtons;
      }
    }
  }

  updateMousePickInfo() {
    if (!this.debugElements.pickType) return;

    if (!this.game.inputHandler || !this.game.entities) {
      this.debugElements.pickType.textContent = '-';
      this.debugElements.pickName.textContent = '-';
      this.debugElements.pickPosition.textContent = '-';
      this.debugElements.pickOwner.textContent = '-';
      this.debugElements.pickHealth.textContent = '-';
      return;
    }

    const pickedEntity = this.game.pickAtMouse();
    const worldPos = this.game.inputHandler.getWorldPosition();

    if (pickedEntity && pickedEntity.isAlive) {
      this.debugElements.pickType.textContent = pickedEntity.type || '-';
      this.debugElements.pickName.textContent = pickedEntity.name || '-';
      this.debugElements.pickPosition.textContent = `(${pickedEntity.position.x.toFixed(1)}, ${pickedEntity.position.z.toFixed(1)})`;
      this.debugElements.pickOwner.textContent = pickedEntity.owner || '-';

      if (pickedEntity.health !== undefined && pickedEntity.maxHealth !== undefined) {
        const healthPercent = Math.round((pickedEntity.health / pickedEntity.maxHealth) * 100);
        this.debugElements.pickHealth.textContent = `${pickedEntity.health}/${pickedEntity.maxHealth} (${healthPercent}%)`;
      } else if (pickedEntity.amount !== undefined) {
        this.debugElements.pickHealth.textContent = `${pickedEntity.amount}`;
      } else {
        this.debugElements.pickHealth.textContent = '-';
      }
    } else {
      this.debugElements.pickType.textContent = '地形/无';
      this.debugElements.pickName.textContent = worldPos ? `(${worldPos.x.toFixed(1)}, ${worldPos.z.toFixed(1)})` : '-';
      this.debugElements.pickPosition.textContent = '-';
      this.debugElements.pickOwner.textContent = '-';
      this.debugElements.pickHealth.textContent = '-';
    }
  }

  toggleDebugPanel() {
    if (!this.debugPanel) {
      this.debugPanel = document.getElementById('debug-panel');
      if (!this.debugPanel) return;
    }
    
    const isVisible = this.debugPanel.classList.contains('visible');
    this.debugPanel.classList.toggle('visible');
    
    if (this.debugPanel.classList.contains('visible')) {
      this.debugPanel.style.display = 'block';
    }
  }
}

export default InfoPanel;

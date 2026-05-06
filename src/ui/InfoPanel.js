import { CELL_SIZE, getPlayerColor, getPlayerName } from '../config.js';

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
  }

  init() {}

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

      html = `
        <div class="info-row">
          <span>名称:</span>
          <span>${entity.name}</span>
        </div>
        <div class="info-row">
          <span>类型:</span>
          <span>${entity.type}</span>
        </div>
        <div class="info-row">
          <span>所属:</span>
          <span style="color: ${getPlayerColor(entity.owner)}">${ownerName}</span>
        </div>
      `;

      // 显示血量（单位或建筑）
      if (entity.health !== undefined && entity.maxHealth !== undefined) {
        const healthPercent = Math.round((entity.health / entity.maxHealth) * 100);
        let healthColor = '#00FF00';
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
          <div class="info-row">
            <span>百分比:</span>
            <span style="color: ${healthColor};">${healthPercent}%</span>
          </div>
        `;
      } else if (entity.amount !== undefined) {
        // 资源节点
        html += `
          <div class="info-row" style="margin-top: 8px;">
            <span>资源量:</span>
            <span>${entity.amount}</span>
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
              <span>${entity.carryAmount} ${entity.carryType || '无'}</span>
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
      }
    } else {
      // 多个单位选择
      html = `<div class="info-row"><span>已选择:</span><span>${selectedEntities.length} 个单位</span></div>`;

      // 计算总血量和平均血量
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
        const avgHealthPercent = Math.round((totalHealth / totalMaxHealth) * 100);
        let healthColor = '#00FF00';
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
          <div class="info-row">
            <span>平均状态:</span>
            <span style="color: ${healthColor};">${avgHealthPercent}%</span>
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

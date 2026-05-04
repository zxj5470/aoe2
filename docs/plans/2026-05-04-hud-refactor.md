# HUD.js 重构实施计划

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** 将 1691 行的 HUD.js 拆分为 5 个职责清晰的模块

**Architecture:** 按功能域拆分为 ResourceDisplay、Minimap、ActionPanel、InfoPanel 四个子模块，HUD.js 作为主协调器组合各模块

**Tech Stack:** JavaScript ES6 Modules, Three.js

---

## Task 1: 创建 ResourceDisplay.js

**Files:**
- Create: `src/ui/ResourceDisplay.js`

**Step 1: 创建 ResourceDisplay.js 文件**

```javascript
import { getPlayerColor, getPlayerName } from '../config.js';

class ResourceDisplay {
  constructor(game) {
    this.game = game;
    this.elements = {
      gold: document.getElementById('resource-gold'),
      wood: document.getElementById('resource-wood'),
      food: document.getElementById('resource-food'),
      stone: document.getElementById('resource-stone'),
      populationCurrent: document.getElementById('population-current'),
      populationMax: document.getElementById('population-max'),
      age: document.getElementById('current-age')
    };
    
    this.population = { current: 1, max: 20 };
    this.age = '黑暗时代';
  }

  init() {
    this.updateResourceDisplay();
  }

  updateResourceDisplay() {
    if (!this.game.resourceManager) return;
    
    const resources = this.game.resourceManager.getAllResources();
    
    if (this.elements.gold) {
      this.elements.gold.textContent = resources.gold;
    }
    if (this.elements.wood) {
      this.elements.wood.textContent = resources.wood;
    }
    if (this.elements.food) {
      this.elements.food.textContent = resources.food;
    }
    if (this.elements.stone) {
      this.elements.stone.textContent = resources.stone;
    }
  }

  updatePopulation(current, max) {
    this.population.current = current;
    this.population.max = max;
    
    if (this.elements.populationCurrent) {
      this.elements.populationCurrent.textContent = current;
    }
    if (this.elements.populationMax) {
      this.elements.populationMax.textContent = max;
    }
  }

  updateAge(ageName) {
    this.age = ageName;
    if (this.elements.age) {
      this.elements.age.textContent = ageName;
    }
  }

  getPopulation() {
    return this.population;
  }

  getAge() {
    return this.age;
  }
}

export default ResourceDisplay;
```

**Step 2: 验证文件创建成功**

Run: 在 IDE 中确认文件已创建

---

## Task 2: 创建 Minimap.js

**Files:**
- Create: `src/ui/Minimap.js`

**Step 1: 创建 Minimap.js 文件**

```javascript
import * as THREE from 'three';
import { CELL_SIZE, getPlayerColor } from '../config.js';

class Minimap {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isDragging = false;
    this.hasMoved = false;
    this.lastX = 0;
    this.lastY = 0;
    this.startX = 0;
    this.startY = 0;
  }

  init() {
    if (!this.canvas) return;
    
    this.canvas.width = 200;
    this.canvas.height = 200;
    this.setupDragHandler();
  }

  render() {
    if (!this.ctx || !this.game.map) return;

    const canvas = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(0.5, 0.375, -0.5, 0.375, 100, 100);

    const mapSize = this.game.map.getSize();
    const minX = -mapSize.width / 2;
    const maxX = mapSize.width / 2;
    const minZ = -mapSize.height / 2;
    const maxZ = mapSize.height / 2;

    const mapType = this.game.selectedMapType || 'default';
    ctx.fillStyle = mapType === 'arabia' ? '#F5DEB3' : '#4a9c50';
    ctx.fillRect(minX, minZ, mapSize.width, mapSize.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    const gridSize = 10;
    const step = mapSize.width / gridSize;
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
      const pos = minX + i * step;
      ctx.moveTo(minX, pos);
      ctx.lineTo(maxX, pos);
      ctx.moveTo(pos, minZ);
      ctx.lineTo(pos, maxZ);
    }
    ctx.stroke();

    for (const entity of this.game.entities) {
      if (!entity.isAlive) continue;
      
      if (entity.type === 'unit') {
        ctx.fillStyle = getPlayerColor(entity.owner);
        ctx.beginPath();
        ctx.arc(entity.position.x, entity.position.z, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (entity.type === 'building') {
        ctx.fillStyle = getPlayerColor(entity.owner);
        ctx.fillRect(entity.position.x - 3, entity.position.z - 3, 6, 6);
      } else if (entity.type === 'resource') {
        const resourceColors = {
          wood: '#228B22',
          stone: '#C0C0C0',
          gold: '#FFD700',
          food: '#90EE90'
        };
        ctx.fillStyle = resourceColors[entity.resourceType] || '#FFFFFF';
        ctx.fillRect(entity.position.x - 2, entity.position.z - 2, 4, 4);
      }
    }

    this.drawCameraViewport(ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawCameraViewport(ctx) {
    if (!this.game.camera) return;

    const cameraTarget = this.game.camera.target;
    const camera = this.game.camera.getCamera();

    const halfW = (camera.right - camera.left) / 2;
    const halfH = (camera.top - camera.bottom) / 2;

    const cx = cameraTarget.x;
    const cz = cameraTarget.z;
    const centerCanvasX = 0.5 * cx - 0.5 * cz + 100;
    const centerCanvasY = 0.375 * cx + 0.375 * cz + 100;

    const canvasHalfW = 0.5 * halfW + 0.5 * halfH;
    const canvasHalfH = 0.375 * halfW + 0.375 * halfH;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerCanvasX - canvasHalfW,
      centerCanvasY - canvasHalfH,
      canvasHalfW * 2,
      canvasHalfH * 2
    );
  }

  setupDragHandler() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;

      if (Math.abs(e.clientX - this.startX) > 2 || Math.abs(e.clientY - this.startY) > 2) {
        this.hasMoved = true;
      }

      if (this.game.camera && this.hasMoved) {
        const mapSize = this.game.map.getSize();
        const minX = -mapSize.width / 2;
        const maxX = mapSize.width / 2;
        const minZ = -mapSize.height / 2;
        const maxZ = mapSize.height / 2;

        const normDx = dx / this.canvas.width;
        const normDy = dy / this.canvas.height;

        const worldDx = (normDx + normDy) * 0.5 * (maxX - minX);
        const worldDz = (normDy - normDx) * 0.5 * (maxZ - minZ);

        this.game.camera.target.x += worldDx;
        this.game.camera.target.z += worldDz;
        this.game.camera.target.y = 0;
        this.game.camera.updateCameraPosition();
      }

      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        if (this.canvas) {
          this.canvas.style.cursor = 'pointer';
        }

        if (!this.hasMoved && this.canvas) {
          const rect = this.canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;

          if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
            this.handleClick({ clientX: e.clientX, clientY: e.clientY });
          }
        }
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.hasMoved = false;
        if (this.canvas) {
          this.canvas.style.cursor = 'pointer';
        }
      }
    });
  }

  handleClick(event) {
    if (!this.game.map || !this.game.camera) return;
    
    const mapSize = this.game.map.getSize();
    const minX = -mapSize.width / 2;
    const maxX = mapSize.width / 2;
    const minZ = -mapSize.height / 2;
    const maxZ = mapSize.height / 2;
    
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const worldX = minX + (clickX / this.canvas.width) * (maxX - minX);
    const worldZ = minZ + (clickY / this.canvas.height) * (maxZ - minZ);
    
    this.game.camera.target.x = worldX;
    this.game.camera.target.z = worldZ;
    this.game.camera.target.y = 0;
    this.game.camera.updateCameraPosition();
  }
}

export default Minimap;
```

**Step 2: 验证文件创建成功**

---

## Task 3: 创建 InfoPanel.js

**Files:**
- Create: `src/ui/InfoPanel.js`

**Step 1: 创建 InfoPanel.js 文件**

```javascript
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
      html = `<div class="info-row"><span>已选择:</span><span>${selectedEntities.length} 个单位</span></div>`;
      
      const types = {};
      for (const entity of selectedEntities) {
        const type = entity.unitType || entity.buildingType || entity.type;
        types[type] = (types[type] || 0) + 1;
      }
      
      html += '<div style="margin-top: 10px;">';
      for (const type in types) {
        html += `<div class="info-row"><span>${type}:</span><span>${types[type]}</span></div>`;
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
```

**Step 2: 验证文件创建成功**

---

## Task 4: 创建 ActionPanel.js

**Files:**
- Create: `src/ui/ActionPanel.js`

**Step 1: 创建 ActionPanel.js 文件**

```javascript
class ActionPanel {
  constructor(game) {
    this.game = game;
    this.container = document.querySelector('.building-buttons');
    this.buildingButtons = document.querySelectorAll('.building-btn');
    
    this.buildingPanelConfig = {
      rows: 3,
      cols: 5,
      totalButtons: 15,
      buttons: []
    };
    
    this.buildingPanelPresets = {
      default: [
        { id: 'house', icon: '🏠', name: '房屋', type: 'residential' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'farm', icon: '🌾', name: '农田', type: 'economy' },
        { id: 'lumber-camp', icon: '🪓', name: '伐木场', type: 'economy' },
        { id: 'mining-camp', icon: '⛏️', name: '采矿场', type: 'economy' },
        { id: 'watch-tower', icon: '🗼', name: '瞭望塔', type: 'defense' },
        { id: 'stable', icon: '🐴', name: '马厩', type: 'military' },
        { id: 'archery-range', icon: '🏹', name: '射箭场', type: 'military' },
        { id: 'castle', icon: '🏰', name: '城堡', type: 'defense' },
        { id: 'wall', icon: '🧱', name: '城墙', type: 'defense' },
        { id: 'gate', icon: '🚪', name: '城门', type: 'defense' },
        { id: 'blacksmith', icon: '🔨', name: '铁匠铺', type: 'economy' },
        { id: 'market', icon: '🏪', name: '市场', type: 'economy' },
        { id: 'dock', icon: '⚓', name: '码头', type: 'economy' },
        { id: 'church', icon: '⛪', name: '教堂', type: 'special' }
      ],
      military: [
        { id: 'barracks', icon: '⚔️', name: '兵营', type: 'military' },
        { id: 'archery-range', icon: '🎯', name: '靶场', type: 'military' },
        { id: 'stable', icon: '🐴', name: '马厩', type: 'military' },
        { id: 'siege', icon: '🏹', name: '攻城武器', type: 'military' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'watch-tower', icon: '🗼', name: '瞭望塔', type: 'defense' },
        { id: 'wooden-wall', icon: '🪵', name: '木墙', type: 'defense' },
        { id: 'stone-wall', icon: '🧱', name: '石墙', type: 'defense' },
        { id: 'arrow-tower', icon: '🏹', name: '箭塔', type: 'defense' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'stone-gate', icon: '🚪', name: '石头门', type: 'defense' },
        { id: 'wooden-gate', icon: '🚧', name: '木城门', type: 'defense' },
        { id: 'castle', icon: '🏰', name: '城堡', type: 'defense' },
        { id: 'next', icon: '→', name: '下一页', type: 'nav' },
        { id: 'close', icon: '×', name: '关闭', type: 'nav' }
      ],
      town_center_production: [
        { id: 'produce-villager', icon: '👤', name: '村民', type: 'production', cost: { food: 50 }, action: 'produce', target: 'villager' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'research-loom', icon: '🧵', name: '织布机', type: 'research', cost: { gold: 50 }, action: 'research', target: 'loom' },
        { id: 'research-town-watch', icon: '👁️', name: '城镇瞭望', type: 'research', cost: { gold: 100 }, action: 'research', target: 'town_watch' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'close-production', icon: '×', name: '关闭', type: 'nav' }
      ]
    };
    
    this.currentPreset = 'default';
    this.currentSelectedBuilding = null;
  }

  init() {
    this.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
    this.initBuildingButtons();
    this.setupButtonListeners();
  }

  setupButtonListeners() {
    this.buildingButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const buildingType = e.target.dataset.building || e.target.closest('.building-btn')?.dataset.building;
        this.handleBuildingClick(buildingType, e.target);
      });
    });
  }

  updateBuildingPanelConfig(config) {
    this.buildingPanelConfig = {
      rows: config.rows || 4,
      cols: config.cols || 3,
      totalButtons: config.totalButtons || 12
    };
    
    const root = document.documentElement;
    root.style.setProperty('--building-grid-rows', this.buildingPanelConfig.rows);
    root.style.setProperty('--building-grid-cols', this.buildingPanelConfig.cols);
    
    const buttonSize = 52;
    const panelWidth = this.buildingPanelConfig.cols * buttonSize + 20;
    
    const panelLeft = document.querySelector('.hud-panel-left');
    if (panelLeft) {
      panelLeft.style.flex = `0 0 ${panelWidth}px`;
      panelLeft.style.minWidth = `${panelWidth}px`;
    }
    
    const buttonsContainer = document.querySelector('.building-buttons');
    if (buttonsContainer) {
      buttonsContainer.style.gridTemplateColumns = `repeat(${this.buildingPanelConfig.cols}, 1fr)`;
      buttonsContainer.style.gridTemplateRows = `repeat(${this.buildingPanelConfig.rows}, 1fr)`;
    }
  }

  getBuildingPanelConfig() {
    return { ...this.buildingPanelConfig };
  }

  initBuildingButtons() {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    this.buildingPanelConfig.buttons.forEach((button, index) => {
      const btn = document.createElement('button');
      btn.className = 'building-btn';
      btn.dataset.building = button.id || '';
      btn.dataset.index = index;
      
      if (button.type === 'empty') {
        btn.classList.add('building-btn-empty');
        btn.disabled = true;
        btn.dataset.building = '';
      }
      
      if (button.type === 'nav') {
        btn.classList.add('building-btn-nav');
      }
      
      const icon = document.createElement('span');
      icon.className = 'building-btn-icon';
      icon.textContent = button.icon || '';
      
      const text = document.createElement('span');
      text.className = 'building-btn-text';
      text.textContent = button.name || '';
      
      btn.appendChild(icon);
      btn.appendChild(text);
      this.container.appendChild(btn);
    });
    
    this.buildingButtons = document.querySelectorAll('.building-btn');
    this.setupButtonListeners();
  }

  handleBuildingClick(buildingType, button) {
    if (buildingType === 'next') {
      this.nextPreset();
      return;
    }
    
    if (buildingType === 'close' || buildingType === 'close-production') {
      if (this.game.selectionManager) {
        this.game.selectionManager.deselectAll();
      }
      this.switchToPreset('default');
      return;
    }

    const currentButtonConfig = this.buildingPanelConfig.buttons.find(
      btn => btn.id === buildingType
    );

    if (currentButtonConfig && (currentButtonConfig.type === 'production' || currentButtonConfig.type === 'research')) {
      this.handleProductionCommand(currentButtonConfig);
      return;
    }
    
    if (this.game.buildingPlacementSystem) {
      this.game.buildingPlacementSystem.togglePlacement(buildingType);
      
      this.buildingButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      if (this.game.buildingPlacementSystem.isPlacing) {
        button.classList.add('active');
      }
    }
  }

  handleProductionCommand(command) {
    if (!this.currentSelectedBuilding) {
      console.warn('[ActionPanel] 没有选中的建筑');
      return;
    }

    if (!this.hasEnoughResources(command.cost)) {
      console.warn('[ActionPanel] 资源不足');
      return;
    }

    if (command.cost) {
      this.game.resourceManager.spendResources(command.cost);
    }

    switch (command.action) {
      case 'produce':
      case 'train':
        this.trainUnit(command.target);
        break;
      case 'research':
        this.researchTechnology(command.target);
        break;
      default:
        console.warn('[ActionPanel] 未知指令类型:', command.action);
    }
  }

  hasEnoughResources(cost) {
    if (!cost || !this.game.resourceManager) return false;
    return this.game.resourceManager.hasEnoughResources(cost);
  }

  trainUnit(unitType) {
    if (!this.currentSelectedBuilding) return;
    
    if (this.currentSelectedBuilding.addToProductionQueue) {
      this.currentSelectedBuilding.addToProductionQueue({
        type: 'unit',
        unitType: unitType,
        time: this.getUnitTrainingTime(unitType)
      });
    }
  }

  researchTechnology(techType) {
    if (!this.currentSelectedBuilding) return;
    
    if (this.currentSelectedBuilding.addToProductionQueue) {
      this.currentSelectedBuilding.addToProductionQueue({
        type: 'research',
        techType: techType,
        time: this.getResearchTime(techType)
      });
    }
  }

  getUnitTrainingTime(unitType) {
    const times = {
      villager: 20,
      militia: 25,
      spearman: 22,
      scout: 30,
      cavalry: 35,
      archer: 25,
      skirmisher: 28,
      missionary: 40
    };
    return times[unitType] || 30;
  }

  getResearchTime(techType) {
    const times = {
      loom: 30,
      town_watch: 45,
      forging: 40,
      barding: 50,
      fletching: 35,
      iron_casting: 60,
      blast_furnace: 80,
      heresy: 40
    };
    return times[techType] || 45;
  }

  updateForSelection(selectedEntities) {
    if (!selectedEntities || selectedEntities.length === 0) {
      this.restoreDefault();
      return;
    }

    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];
      if (entity.type === 'building') {
        const buildingType = entity.buildingType || entity.type;
        const normalizedType = buildingType.replace(/-/g, '_');
        const productionPresetName = `${normalizedType}_production`;

        if (this.buildingPanelPresets[productionPresetName]) {
          this.currentSelectedBuilding = entity;
          this.switchToPreset(productionPresetName);
        } else {
          this.restoreDefault();
        }
      } else {
        this.restoreDefault();
      }
    } else {
      this.restoreDefault();
    }
  }

  restoreDefault() {
    if (this.currentPreset !== 'default' && !this.currentPreset.includes('_production')) {
      return;
    }
    this.currentSelectedBuilding = null;
    this.switchToPreset('default');
  }

  switchToPreset(presetName) {
    if (!this.buildingPanelPresets[presetName]) {
      console.error(`Preset "${presetName}" not found`);
      return;
    }
    
    const preset = this.buildingPanelPresets[presetName];
    this.currentPreset = presetName;
    
    this.buildingPanelConfig.buttons = preset.map(button => ({ ...button }));
    
    this.initBuildingButtons();
  }

  nextPreset() {
    const presetNames = Object.keys(this.buildingPanelPresets);
    const currentIndex = presetNames.indexOf(this.currentPreset);
    const nextIndex = (currentIndex + 1) % presetNames.length;
    this.switchToPreset(presetNames[nextIndex]);
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  addPreset(name, buttons) {
    this.buildingPanelPresets[name] = buttons.map(button => ({ ...button }));
  }
}

export default ActionPanel;
```

**Step 2: 验证文件创建成功**

---

## Task 5: 重构 HUD.js

**Files:**
- Modify: `src/ui/HUD.js`

**Step 1: 重写 HUD.js 为协调器**

```javascript
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
}

export default HUD;
```

**Step 2: 验证语法正确**

Run: 在浏览器中打开 http://localhost:5174/ 确认无错误

---

## Task 6: 清理与验证

**Step 1: 删除旧代码中不再需要的部分**

确认新模块工作正常后，原 HUD.js 已被重写为协调器。

**Step 2: 运行游戏验证功能**

1. 资源显示正常
2. 小地图渲染正常
3. 建筑面板切换正常
4. 点击城镇中心显示生产面板
5. 单位信息显示正常
6. 调试面板正常

**Step 3: 提交更改**

```bash
git add src/ui/
git commit -m "refactor: 将 HUD.js 拆分为 ResourceDisplay, Minimap, ActionPanel, InfoPanel 四个模块"
```

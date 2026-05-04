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
    
    this.ageUpgradeCosts = {
      1: { food: 500, gold: 250 },
      2: { food: 800, gold: 400 },
      3: { food: 1000, gold: 800 }
    };
    
    this.ageNames = {
      1: '封建时代',
      2: '城堡时代',
      3: '帝王时代'
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
      ]
    };
    
    this.currentPreset = 'default';
    this.currentSelectedBuilding = null;
  }

  getTownCenterProductionPreset() {
    const ageLevel = this.game.player ? this.game.player.getAgeLevel() : 1;
    const canUpgrade = ageLevel < 4;
    const upgradeCost = canUpgrade ? this.ageUpgradeCosts[ageLevel] : null;
    const nextAgeName = canUpgrade ? this.ageNames[ageLevel] : null;
    
    const buttons = [
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
      { id: canUpgrade ? 'age-up' : '', icon: canUpgrade ? '⬆️' : '', name: canUpgrade ? nextAgeName : '', type: canUpgrade ? 'age_upgrade' : 'empty', cost: upgradeCost, action: canUpgrade ? 'age_up' : '', target: canUpgrade ? 'next_age' : '' },
      { id: '', icon: '', name: '', type: 'empty' },
      { id: 'close-production', icon: '×', name: '关闭', type: 'nav' }
    ];
    
    return buttons;
  }

  init() {
    this.switchToPreset('default');
    this.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
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
    this.buildingPanelConfig.rows = config.rows || this.buildingPanelConfig.rows;
    this.buildingPanelConfig.cols = config.cols || this.buildingPanelConfig.cols;
    this.buildingPanelConfig.totalButtons = config.totalButtons || this.buildingPanelConfig.totalButtons;
    
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

    if (currentButtonConfig && currentButtonConfig.type === 'age_upgrade') {
      this.handleAgeUpgrade(currentButtonConfig);
      return;
    }

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

  handleAgeUpgrade(command) {
    if (!this.game.player) {
      console.warn('[ActionPanel] 玩家不存在');
      return;
    }

    const currentAge = this.game.player.getAgeLevel();
    if (currentAge >= 4) {
      console.warn('[ActionPanel] 已是最高时代');
      return;
    }

    if (!this.hasEnoughResources(command.cost)) {
      console.warn('[ActionPanel] 资源不足，无法升级时代');
      return;
    }

    this.game.resourceManager.spendResources(command.cost);
    
    const newAge = currentAge + 1;
    this.game.player.setAgeLevel(newAge);
    
    if (this.game.hud) {
      this.game.hud.updateAge(this.game.player.getAgeName());
      this.game.hud.showNotification(`升级到 ${this.game.player.getAgeName()}！`);
    }

    this.switchToPreset('town_center_production');
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

        const hasPreset = this.buildingPanelPresets[productionPresetName] || 
                          productionPresetName === 'town_center_production';
        
        if (hasPreset) {
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
    let preset;
    
    if (presetName === 'town_center_production') {
      preset = this.getTownCenterProductionPreset();
    } else if (typeof this.buildingPanelPresets[presetName] === 'function') {
      preset = this.buildingPanelPresets[presetName]();
    } else if (this.buildingPanelPresets[presetName]) {
      preset = this.buildingPanelPresets[presetName];
    } else {
      console.error(`Preset "${presetName}" not found`);
      return;
    }
    
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

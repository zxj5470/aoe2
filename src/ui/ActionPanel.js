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
      1: 'Feudal Age',
      2: 'Castle Age',
      3: 'Imperial Age'
    };

    this.buildingPanelPresets = {
      empty: [],
      default: [
        { id: 'house', icon: 'H', name: 'House', type: 'residential' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'farm', icon: 'F', name: 'Farm', type: 'economy' },
        { id: 'lumber-camp', icon: 'L', name: 'Lumber Camp', type: 'economy' },
        { id: 'mining-camp', icon: 'M', name: 'Mining Camp', type: 'economy' },
        { id: 'watch-tower', icon: 'T', name: 'Watch Tower', type: 'defense' },
        { id: 'stable', icon: 'St', name: 'Stable', type: 'military' },
        { id: 'archery-range', icon: 'A', name: 'Archery', type: 'military' },
        { id: 'castle', icon: 'C', name: 'Castle', type: 'defense' },
        { id: 'wall', icon: 'W', name: 'Wall', type: 'defense' },
        { id: 'gate', icon: 'G', name: 'Gate', type: 'defense' },
        { id: 'blacksmith', icon: 'B', name: 'Blacksmith', type: 'economy' },
        { id: 'market', icon: 'Mk', name: 'Market', type: 'economy' },
        { id: 'dock', icon: 'D', name: 'Dock', type: 'economy' },
        { id: 'church', icon: 'Ch', name: 'Church', type: 'special' }
      ],
      military: [
        { id: 'barracks', icon: 'B', name: 'Barracks', type: 'military' },
        { id: 'archery-range', icon: 'A', name: 'Archery', type: 'military' },
        { id: 'stable', icon: 'St', name: 'Stable', type: 'military' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'watch-tower', icon: 'T', name: 'Watch Tower', type: 'defense' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: '', icon: '', name: '', type: 'empty' },
        { id: 'castle', icon: 'C', name: 'Castle', type: 'defense' },
        { id: 'next', icon: '>', name: 'Next', type: 'nav' },
        { id: 'close', icon: 'X', name: 'Close', type: 'nav' }
      ]
    };

    this.currentPreset = 'default';
    this.currentSelectedBuilding = null;
  }

  init() {
    this.switchToPreset('empty');
    this.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
    this.setupButtonListeners();
  }

  setupButtonListeners() {
    this.buildingButtons.forEach(btn => {
      btn.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.building-btn');
        const buildingType = targetButton?.dataset.building || '';
        this.handleBuildingClick(buildingType, targetButton || event.target);
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
    const normalizedType = this.normalizeBuildingType(buildingType);

    if (buildingType === 'next') {
      this.nextPreset();
      return;
    }

    if (buildingType === 'close' || buildingType === 'close-production') {
      if (this.game.selectionManager) {
        this.game.selectionManager.deselectAll();
      }
      this.showEmptyPanel();
      return;
    }

    const currentButtonConfig = this.buildingPanelConfig.buttons.find(
      btn => this.normalizeBuildingType(btn.id) === normalizedType
    );

    if (currentButtonConfig?.type === 'age_upgrade') {
      this.handleAgeUpgrade(currentButtonConfig);
      return;
    }

    if (currentButtonConfig?.type === 'production' || currentButtonConfig?.type === 'research') {
      this.handleProductionCommand(currentButtonConfig);
      return;
    }

    if (this.game.buildingPlacementSystem) {
      const selectedVillagers = this.game.selectionManager ?
        this.game.selectionManager.selectedEntities.filter(
          entity => entity.isAlive && entity.type === 'unit' && entity.unitType === 'villager' && entity.isPlayerOwned()
        ) : [];

      if (selectedVillagers.length === 0) {
        console.warn('[ActionPanel] Select villagers before building');
        if (this.game.hud) {
          this.game.hud.showNotification('Select villagers before building', 2000);
        }
        return;
      }

      this.game.buildingPlacementSystem.togglePlacement(normalizedType);

      this.buildingButtons.forEach(btn => {
        btn.classList.remove('active');
      });

      if (this.game.buildingPlacementSystem.isPlacing && button) {
        button.classList.add('active');
      }
    }
  }

  handleAgeUpgrade(command) {
    if (!this.game.player) return;

    const currentAge = this.game.player.getAgeLevel();
    if (currentAge >= 4) return;

    if (!this.hasEnoughResources(command.cost)) {
      console.warn('[ActionPanel] Not enough resources for age upgrade');
      return;
    }

    this.game.resourceManager.spendResources(command.cost);
    this.game.player.setAgeLevel(currentAge + 1);

    if (this.game.hud) {
      this.game.hud.updateAge(this.game.player.getAgeName());
      this.game.hud.showNotification(`Advanced to ${this.game.player.getAgeName()}`);
    }

    this.switchToPreset('town_center_production');
  }

  handleProductionCommand(command) {
    if (!this.currentSelectedBuilding) {
      console.warn('[ActionPanel] No selected building');
      return;
    }

    if (!this.canStartProductionCommand(command)) {
      return;
    }

    if (!this.hasEnoughResources(command.cost)) {
      console.warn('[ActionPanel] Not enough resources');
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
        console.warn('[ActionPanel] Unknown command:', command.action);
    }
  }

  canStartProductionCommand(command) {
    if (command.action !== 'produce' && command.action !== 'train') return true;

    if (this.currentSelectedBuilding.isUnderConstruction) {
      console.warn('[ActionPanel] Building is still under construction');
      return false;
    }

    if (this.game.player && !this.game.player.canTrainUnit()) {
      console.warn('[ActionPanel] Population is full');
      return false;
    }

    const trainableUnits = this.currentSelectedBuilding.buildingFeatures?.canTrainUnits;
    if (trainableUnits && !trainableUnits.includes(command.target)) {
      console.warn('[ActionPanel] Selected building cannot train:', command.target);
      return false;
    }

    return true;
  }

  hasEnoughResources(cost) {
    if (!cost) return true;
    if (!this.game.resourceManager) return false;
    return this.game.resourceManager.hasEnoughResources(cost);
  }

  trainUnit(unitType) {
    if (!this.currentSelectedBuilding?.addToProductionQueue) return;

    this.currentSelectedBuilding.addToProductionQueue({
      type: 'unit',
      unitType,
      time: this.getUnitTrainingTime(unitType)
    });
  }

  researchTechnology(techType) {
    if (!this.currentSelectedBuilding?.addToProductionQueue) return;

    this.currentSelectedBuilding.addToProductionQueue({
      type: 'research',
      techType,
      time: this.getResearchTime(techType)
    });
  }

  updateForSelection(selectedEntities) {
    if (!selectedEntities || selectedEntities.length === 0) {
      this.showEmptyPanel();
      return;
    }

    const allVillagers = selectedEntities.every(
      entity => entity.type === 'unit' && entity.unitType === 'villager' && entity.isPlayerOwned()
    );

    if (allVillagers) {
      this.currentSelectedBuilding = null;
      this.switchToPreset('default');
      return;
    }

    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];

      if (entity.type === 'building' && entity.isPlayerOwned()) {
        const normalizedType = this.normalizeBuildingType(entity.buildingType || entity.type);
        const productionPresetName = `${normalizedType}_production`;
        const hasPreset = productionPresetName === 'town_center_production' ||
          this.buildingPanelPresets[productionPresetName] ||
          this.hasBuildingProductionPreset(entity);

        if (hasPreset) {
          this.currentSelectedBuilding = entity;
          this.switchToPreset(productionPresetName);
          return;
        }
      }
    }

    this.showEmptyPanel();
  }

  showEmptyPanel() {
    this.currentSelectedBuilding = null;
    this.switchToPreset('empty');
  }

  restoreDefault() {
    this.showEmptyPanel();
  }

  switchToPreset(presetName) {
    let preset;

    if (presetName === 'town_center_production') {
      preset = this.getTownCenterProductionPreset();
    } else if (presetName.endsWith('_production') && this.currentSelectedBuilding && this.hasBuildingProductionPreset(this.currentSelectedBuilding)) {
      preset = this.getBuildingProductionPreset(this.currentSelectedBuilding);
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

  clearActiveBuildingButton() {
    this.buildingButtons.forEach(btn => {
      btn.classList.remove('active');
    });
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

  getTownCenterProductionPreset() {
    const ageLevel = this.game.player ? this.game.player.getAgeLevel() : 1;
    const canUpgrade = ageLevel < 4;
    const upgradeCost = canUpgrade ? this.ageUpgradeCosts[ageLevel] : null;
    const nextAgeName = canUpgrade ? this.ageNames[ageLevel] : null;

    return this.padButtons([
      { id: 'produce-villager', icon: 'V', name: 'Villager', type: 'production', cost: { food: 50 }, action: 'produce', target: 'villager' },
      { id: 'research-loom', icon: 'Lm', name: 'Loom', type: 'research', cost: { gold: 50 }, action: 'research', target: 'loom' },
      { id: 'research-town-watch', icon: 'Tw', name: 'Town Watch', type: 'research', cost: { gold: 100 }, action: 'research', target: 'town_watch' },
      { id: canUpgrade ? 'age-up' : '', icon: canUpgrade ? '^' : '', name: canUpgrade ? nextAgeName : '', type: canUpgrade ? 'age_upgrade' : 'empty', cost: upgradeCost, action: canUpgrade ? 'age_up' : '', target: canUpgrade ? 'next_age' : '' },
      { id: 'close-production', icon: 'X', name: 'Close', type: 'nav' }
    ]);
  }

  getBuildingProductionPreset(building) {
    const trainableUnits = building?.buildingFeatures?.canTrainUnits || [];
    const buttons = trainableUnits.map(unitType => ({
      id: `train-${unitType}`,
      icon: this.getUnitIcon(unitType),
      name: this.getUnitName(unitType),
      type: 'production',
      cost: this.getUnitCost(unitType),
      action: 'train',
      target: unitType
    }));

    buttons.push({ id: 'close-production', icon: 'X', name: 'Close', type: 'nav' });
    return this.padButtons(buttons);
  }

  padButtons(buttons) {
    const padded = buttons.filter(Boolean).map(button => ({ ...button }));
    while (padded.length < this.buildingPanelConfig.totalButtons) {
      const insertIndex = Math.max(0, padded.length - 1);
      padded.splice(insertIndex, 0, { id: '', icon: '', name: '', type: 'empty' });
    }
    return padded.slice(0, this.buildingPanelConfig.totalButtons);
  }

  hasBuildingProductionPreset(building) {
    return !!(building?.buildingFeatures?.canTrainUnits?.length);
  }

  getUnitTrainingTime(unitType) {
    const times = {
      villager: 20,
      soldier: 25,
      knight: 35,
      archer: 25,
      scout: 30
    };
    return times[unitType] || 30;
  }

  getUnitCost(unitType) {
    const costs = {
      villager: { food: 50 },
      soldier: { food: 60, gold: 20 },
      knight: { food: 60, gold: 75 },
      archer: { wood: 25, gold: 45 },
      scout: { food: 80 }
    };
    return costs[unitType] || { food: 50 };
  }

  getUnitIcon(unitType) {
    const icons = {
      villager: 'V',
      soldier: 'S',
      knight: 'K',
      archer: 'A',
      scout: 'Sc'
    };
    return icons[unitType] || 'U';
  }

  getUnitName(unitType) {
    const names = {
      villager: 'Villager',
      soldier: 'Soldier',
      knight: 'Knight',
      archer: 'Archer',
      scout: 'Scout'
    };
    return names[unitType] || unitType;
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

  normalizeBuildingType(buildingType) {
    if (this.game && this.game.normalizeBuildingType) {
      return this.game.normalizeBuildingType(buildingType);
    }

    return buildingType ? buildingType.replace(/-/g, '_') : buildingType;
  }
}

export default ActionPanel;

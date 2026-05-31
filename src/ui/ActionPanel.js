import { BUILDING_TYPES, BUILDING_CONFIG, TOWN_CENTER_ACTIONS, TECH_CONFIG, normalizeBuildingType, getBuildingName, getBuildingDesc, getAgeName } from '../config.js';

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
      1: { food: 500, gold: 0 },
      2: { food: 800, gold: 200 },
      3: { food: 1000, gold: 800 }
    };

    // 时代名称通过 getAgeName() 获取（i18n）

    this.buildingPanelPresets = {
      empty: [],
      villager_commands: [
        { id: 'villager-buildings', icon: 'B', name: '建筑', type: 'category', targetPreset: 'villager_buildings' },
        { id: 'villager-military-buildings', icon: 'M', name: '军事建筑', type: 'category', targetPreset: 'villager_military_buildings' },
        { id: 'garrison', icon: 'G', name: '驻扎', type: 'garrison' }
      ],
      villager_buildings: [
        { id: BUILDING_TYPES.HOUSE, icon: 'A', type: 'residential' },
        { id: '', icon: '', type: 'empty' },
        { id: BUILDING_TYPES.FARM, icon: 'F', type: 'economy' },
        { id: BUILDING_TYPES.LUMBER_CAMP, icon: 'L', type: 'economy' },
        { id: BUILDING_TYPES.MINING_CAMP, icon: 'M', type: 'economy' },
        { id: BUILDING_TYPES.WALL, icon: 'W', type: 'defense' },
        { id: BUILDING_TYPES.GATE, icon: 'G', type: 'defense' },
        { id: BUILDING_TYPES.BLACKSMITH, icon: 'B', type: 'economy' },
        { id: BUILDING_TYPES.MARKET, icon: 'Mk', type: 'economy' },
        { id: BUILDING_TYPES.DOCK, icon: 'D', type: 'economy' },
        { id: BUILDING_TYPES.CHURCH, icon: 'Ch', type: 'special' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: 'back-villager-commands', icon: '<', name: '返回', type: 'nav', targetPreset: 'villager_commands' }
      ],
      villager_military_buildings: [
        { id: BUILDING_TYPES.BARRACKS, icon: 'B', type: 'military' },
        { id: BUILDING_TYPES.ARCHERY_RANGE, icon: 'A', type: 'military' },
        { id: BUILDING_TYPES.STABLE, icon: 'St', type: 'military' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: BUILDING_TYPES.WATCH_TOWER, icon: 'T', type: 'defense' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: '', icon: '', type: 'empty' },
        { id: BUILDING_TYPES.CASTLE, icon: 'C', type: 'defense' },
        { id: '', icon: '', type: 'empty' },
        { id: 'back-villager-commands', icon: '<', name: '返回', type: 'nav', targetPreset: 'villager_commands' }
      ],
      default: []
    };

    this.currentPreset = 'default';
    this.currentSelectedBuilding = null;
    this.garrisonCommandActive = false;
    this.rallyPointModeActive = false;
  }

  init() {
    this.switchToPreset('empty');
    this.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
    this.setupButtonListeners();
    this.updateBuildingButtonTexts();
  }

  // 更新建筑按钮文字（i18n）
  updateBuildingButtonTexts() {
    this.buildingButtons.forEach(btn => {
      const buildingId = btn.dataset.building;
      if (buildingId) {
        const textSpan = btn.querySelector('.building-btn-text');
        if (textSpan) {
          textSpan.textContent = getBuildingName(buildingId);
        }
      }
    });
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

      if (button.type === 'category') {
        btn.classList.add('building-btn-category');
      }

      if (button.type === 'garrison') {
        btn.classList.add('building-btn-garrison');
      }

      const icon = document.createElement('span');
      icon.className = 'building-btn-icon';
      icon.textContent = button.icon || '';

      const text = document.createElement('span');
      text.className = 'building-btn-text';
      text.textContent = button.name || (button.id ? getBuildingName(button.id) : '');

      btn.appendChild(icon);
      btn.appendChild(text);

      if (button.id && button.type !== 'empty' && button.type !== 'nav') {
        btn.addEventListener('mouseenter', (e) => this.showBuildingTooltip(e.currentTarget, button.id));
        btn.addEventListener('mouseleave', () => this.hideBuildingTooltip());
      }

      this.container.appendChild(btn);
    });

    this.buildingButtons = document.querySelectorAll('.building-btn');
    this.setupButtonListeners();
  }

  RESOURCE_EMOJIS = { food: '🍖', wood: '🌲', gold: '🏅', stone: '🪨' };

  showBuildingTooltip(btn, buildingId) {
    const config = BUILDING_CONFIG[buildingId];
    if (!config) return;
    const cost = config.cost;
    if (!cost || Object.keys(cost).length === 0) return;

    this.hideBuildingTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'building-tooltip';

    tooltip.innerHTML = `
      <div class="building-tooltip-name">${getBuildingName(buildingId)}</div>
      <div class="building-tooltip-desc">${getBuildingDesc(buildingId)}</div>
      <hr class="building-tooltip-divider">
      <div class="building-tooltip-cost">
        ${Object.entries(cost).map(([res, val]) =>
          `<span class="building-tooltip-cost-item">${this.RESOURCE_EMOJIS[res] || res} ${val}</span>`
        ).join('')}
      </div>
    `;

    document.body.appendChild(tooltip);

    const rect = btn.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    let top = rect.top - tooltipRect.height - 6;

    if (left < 4) left = 4;
    if (left + tooltipRect.width > window.innerWidth - 4) left = window.innerWidth - tooltipRect.width - 4;
    if (top < 4) top = rect.bottom + 6;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    this._buildingTooltip = tooltip;
  }

  hideBuildingTooltip() {
    if (this._buildingTooltip) {
      this._buildingTooltip.remove();
      this._buildingTooltip = null;
    }
  }

  handleBuildingClick(buildingType, button) {
    const normalizedType = this.normalizeBuildingType(buildingType);

    const currentButtonConfig = this.buildingPanelConfig.buttons.find(
      btn => this.normalizeBuildingType(btn.id) === normalizedType
    );

    if (buildingType === 'next') {
      this.nextPreset();
      return;
    }

    if (currentButtonConfig?.targetPreset && (currentButtonConfig.type === 'category' || currentButtonConfig.type === 'nav')) {
      this.cancelGarrisonCommand();
      this.switchToPreset(currentButtonConfig.targetPreset);
      return;
    }

    if (!this.canUseBuildingButton(normalizedType)) {
      console.warn('[ActionPanel] Building is unavailable for current civilization:', normalizedType);
      return;
    }

    if (buildingType === 'close' || buildingType === 'close-production') {
      if (this.game.selectionManager) {
        this.game.selectionManager.deselectAll();
      }
      this.showEmptyPanel();
      return;
    }

    if (currentButtonConfig?.type === 'age_upgrade') {
      this.handleAgeUpgrade(currentButtonConfig);
      return;
    }

    if (currentButtonConfig?.type === 'production' || currentButtonConfig?.type === 'research') {
      this.handleProductionCommand(currentButtonConfig);
      return;
    }

    if (currentButtonConfig?.type === 'garrison') {
      this.activateGarrisonCommand(button);
      return;
    }

    if (currentButtonConfig?.type === 'rally') {
      this.activateRallyPointMode(button);
      return;
    }

    if (currentButtonConfig?.type === 'cancel' && currentButtonConfig?.action === 'cancel_construction') {
      this.handleCancelConstruction();
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

  handleCancelConstruction() {
    if (!this.currentSelectedBuilding) {
      console.warn('[ActionPanel] No selected building');
      return;
    }

    if (!this.currentSelectedBuilding.isUnderConstruction) {
      console.warn('[ActionPanel] Building is not under construction');
      return;
    }

    const refund = this.currentSelectedBuilding.cancelConstruction();
    if (refund) {
      // 退还资源
      if (this.game.resourceManager) {
        this.game.resourceManager.addResources(refund);
      }

      // 从实体管理器中移除建筑
      if (this.game.entityManager) {
        this.game.entityManager.removeEntity(this.currentSelectedBuilding);
      }

      // 取消选择
      if (this.game.selectionManager) {
        this.game.selectionManager.deselectAll();
      }

      this.showEmptyPanel();

      console.log('[ActionPanel] 建造已取消，退还资源:', refund);
    }
  }

  activateGarrisonCommand(button) {
    const selectedVillagers = this.getSelectedVillagers();
    if (selectedVillagers.length === 0) {
      if (this.game.hud) {
        this.game.hud.showNotification('请选择村民后再驻扎', 2000);
      }
      return;
    }

    this.garrisonCommandActive = true;
    this.clearActiveBuildingButton();
    if (button) button.classList.add('active');

    if (this.game.hud) {
      this.game.hud.showNotification('点击可驻扎建筑驻扎村民', 2000);
    }
  }

  cancelGarrisonCommand() {
    this.garrisonCommandActive = false;
  }

  isGarrisonCommandActive() {
    return this.garrisonCommandActive;
  }

  executeGarrisonCommand(building) {
    if (!this.garrisonCommandActive) return false;

    if (!building || building.type !== 'building' ||
        !this.getSelectedVillagers().some(villager => building.canGarrisonUnit?.(villager))) {
      if (this.game.hud) {
        this.game.hud.showNotification('请选择可驻扎建筑', 1600);
      }
      return true;
    }

    for (const villager of this.getSelectedVillagers()) {
      villager.garrisonTo(building);
    }

    this.cancelGarrisonCommand();
    this.clearActiveBuildingButton();
    return true;
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

    this.switchToPreset(`${BUILDING_TYPES.TOWN_CENTER}_production`);
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
      case 'ungarrison':
        this.handleUngarrisonCommand(command.count || 1);
        break;
      default:
        console.warn('[ActionPanel] Unknown command:', command.action);
    }
  }

  handleUngarrisonCommand(count = 1) {
    if (!this.currentSelectedBuilding?.ungarrison) return;
    const released = this.currentSelectedBuilding.ungarrison(count);
    if (this.game.hud && released.length === 0) {
      this.game.hud.showNotification('没有驻扎单位', 1600);
    }
  }

  activateRallyPointMode(button) {
    if (!this.currentSelectedBuilding?.setRallyPoint) return;

    this.cancelGarrisonCommand();
    this.rallyPointModeActive = true;
    this.clearActiveBuildingButton();
    if (button) button.classList.add('active');

    if (this.game.hud) {
      this.game.hud.showNotification('点击地图设置集结点，按 ESC 取消', 2000);
    }
  }

  cancelRallyPointMode() {
    this.rallyPointModeActive = false;
    this.clearActiveBuildingButton();
  }

  isSettingRallyPoint() {
    return this.rallyPointModeActive;
  }

  setRallyPoint(position) {
    if (!this.rallyPointModeActive || !this.currentSelectedBuilding?.setRallyPoint) return false;

    this.currentSelectedBuilding.setRallyPoint(position);
    this.cancelRallyPointMode();

    if (this.game.hud) {
      this.game.hud.showNotification('集结点已设置', 1600);
    }

    return true;
  }

  canStartProductionCommand(command) {
    if (this.currentSelectedBuilding.isUnderConstruction) {
      console.warn('[ActionPanel] Building is still under construction');
      return false;
    }

    if (command.action === 'research') {
      if (this.game.player?.hasResearched(command.target)) {
        console.warn('[ActionPanel] Technology already researched:', command.target);
        return false;
      }

      if (this.currentSelectedBuilding.currentProduction?.techType === command.target ||
          this.currentSelectedBuilding.productionQueue?.some(item => item.techType === command.target)) {
        console.warn('[ActionPanel] Technology is already queued:', command.target);
        return false;
      }

      return true;
    }

    if (command.action !== 'produce' && command.action !== 'train') return true;

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
      this.cancelGarrisonCommand();
      this.cancelRallyPointMode();
      this.switchToPreset('villager_commands');
      return;
    }

    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];

      if (entity.type === 'building' && entity.isPlayerOwned()) {
        const normalizedType = this.normalizeBuildingType(entity.buildingType || entity.type);
        const productionPresetName = `${normalizedType}_production`;
        const hasPreset = productionPresetName === `${BUILDING_TYPES.TOWN_CENTER}_production` ||
          this.buildingPanelPresets[productionPresetName] ||
          this.hasBuildingProductionPreset(entity) ||
          this.hasGarrisonPanel(entity);

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
    this.cancelGarrisonCommand();
    this.cancelRallyPointMode();
    this.switchToPreset('empty');
  }

  restoreDefault() {
    this.showEmptyPanel();
  }

  switchToPreset(presetName) {
    let preset;

    if (presetName === `${BUILDING_TYPES.TOWN_CENTER}_production`) {
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
    this.buildingPanelConfig.buttons = this.filterPresetForCivilization(preset).map(button => ({ ...button }));
    this.initBuildingButtons();
  }

  filterPresetForCivilization(preset) {
    return preset.map(button => {
      const normalizedId = this.normalizeBuildingType(button.id);
      if (!this.canUseBuildingButton(normalizedId)) {
        return { id: '', icon: '', name: '', type: 'empty' };
      }
      return button;
    });
  }

  canUseBuildingButton(buildingType) {
    if (!buildingType) return true;
    if (!this.game.player || !this.game.player.hasCiv('huns')) return true;
    return buildingType !== BUILDING_TYPES.HOUSE;
  }

  clearActiveBuildingButton() {
    this.buildingButtons.forEach(btn => {
      btn.classList.remove('active');
    });
  }

  getSelectedVillagers() {
    return this.game.selectionManager ?
      this.game.selectionManager.selectedEntities.filter(
        entity => entity.isAlive && entity.type === 'unit' && entity.unitType === 'villager' && entity.isPlayerOwned()
      ) : [];
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
  /**
   * 通过快捷键触发命令面板按钮
   * @param {number} index - 按钮索引
   */
  triggerHotButton(index) {
    const buttonConfig = this.buildingPanelConfig.buttons[index];
    if (!buttonConfig || !buttonConfig.id) {
      console.warn(`[ActionPanel] triggerHotButton(${index}): 无按钮配置`);
      return false;
    }
    if (buttonConfig.type === 'empty' || buttonConfig.type === 'nav') {
      console.warn(`[ActionPanel] triggerHotButton(${index}): 按钮类型为 ${buttonConfig.type}, 跳过`);
      return false;
    }
    this.handleBuildingClick(buttonConfig.id);
    return true;
  }

  triggerHotButtonByKey(key) {
    const normalizedKey = key.toUpperCase();
    const buttonIndex = this.buildingPanelConfig.buttons.findIndex(button => {
      if (!button || !button.id || button.type === 'empty') return false;
      return (button.icon || '').toUpperCase() === normalizedKey;
    });

    if (buttonIndex === -1) return false;
    return this.triggerHotButton(buttonIndex);
  }
  addPreset(name, buttons) {
    this.buildingPanelPresets[name] = buttons.map(button => ({ ...button }));
  }

  getTownCenterProductionPreset() {
    const ageLevel = this.game.player ? this.game.player.getAgeLevel() : 1;
    const canUpgrade = ageLevel < 4;
    const upgradeCost = canUpgrade ? this.ageUpgradeCosts[ageLevel] : null;
    const nextAgeName = canUpgrade ? getAgeName(ageLevel) : null;

    const buttons = [
      { id: TOWN_CENTER_ACTIONS.PRODUCE_VILLAGER, icon: 'V', type: 'production', cost: { food: 50 }, action: 'produce', target: 'villager' },
      { id: TOWN_CENTER_ACTIONS.RESEARCH_LOOM, icon: 'Lm', type: 'research', cost: { gold: 50 }, action: 'research', target: 'loom' },
      { id: TOWN_CENTER_ACTIONS.RESEARCH_TOWN_WATCH, icon: 'Tw', type: 'research', cost: { gold: 100 }, action: 'research', target: 'town_watch' },
      { id: canUpgrade ? 'age-up' : '', icon: canUpgrade ? '^' : '', name: canUpgrade ? nextAgeName : '', type: canUpgrade ? 'age_upgrade' : 'empty', cost: upgradeCost, action: canUpgrade ? 'age_up' : '', target: canUpgrade ? 'next_age' : '' }
    ];

    if (this.hasGarrisonPanel(this.currentSelectedBuilding)) {
      buttons.push(this.getUngarrisonButton());
    }

    if (this.canSetRallyPoint(this.currentSelectedBuilding)) {
      buttons.push(this.getSetRallyPointButton());
    }

    buttons.push({ id: 'close-production', icon: 'X', type: 'nav' });
    return this.padButtons(buttons);
  }

  getBuildingProductionPreset(building) {
    // 如果建筑正在建造中，显示取消建造按钮
    if (building.isUnderConstruction) {
      const buttons = [
        {
          id: 'cancel-construction',
          icon: 'X',
          name: '取消建造',
          type: 'cancel',
          action: 'cancel_construction'
        }
      ];
      return this.padButtons(buttons);
    }

    if (building.buildingType === BUILDING_TYPES.BLACKSMITH) {
      return this.getBlacksmithProductionPreset();
    }

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

    if (this.canSetRallyPoint(building)) {
      buttons.push(this.getSetRallyPointButton());
    }

    if (this.hasGarrisonPanel(building)) {
      buttons.push(this.getUngarrisonButton());
    }

    buttons.push({ id: 'close-production', icon: 'X', name: 'Close', type: 'nav' });
    return this.padButtons(buttons);
  }

  hasGarrisonPanel(building) {
    if (!building?.garrisonCapacity) return false;
    if (building.buildingFeatures?.khmerOnlyGarrison) {
      return Boolean(this.game.player?.hasCiv('khmer'));
    }
    return true;
  }

  getUngarrisonButton() {
    return {
      id: 'ungarrison',
      icon: 'U',
      name: '取消驻扎',
      type: 'production',
      action: 'ungarrison',
      count: 1
    };
  }

  canSetRallyPoint(building) {
    return Boolean(building?.buildingFeatures?.canTrainUnits?.length || building?.buildingFeatures?.canCreateVillagers);
  }

  getSetRallyPointButton() {
    return {
      id: 'set-rally-point',
      icon: 'R',
      name: '设置集结点',
      type: 'rally',
      action: 'set_rally_point'
    };
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
    return building?.buildingType === BUILDING_TYPES.BLACKSMITH ||
      !!(building?.buildingFeatures?.canTrainUnits?.length) ||
      this.hasGarrisonPanel(building);
  }

  getBlacksmithProductionPreset() {
    const buttons = Object.entries(TECH_CONFIG)
      .filter(([, tech]) => tech.building === BUILDING_TYPES.BLACKSMITH)
      .filter(([techType]) => !this.game.player?.hasResearched(techType) && !this.isTechQueued(techType))
      .map(([techType, tech]) => ({
        id: `research-${techType}`,
        icon: tech.icon,
        name: tech.name,
        type: 'research',
        cost: tech.cost,
        action: 'research',
        target: techType
      }));

    buttons.push({ id: 'close-production', icon: 'X', name: 'Close', type: 'nav' });
    return this.padButtons(buttons);
  }

  isTechQueued(techType) {
    return this.currentSelectedBuilding?.currentProduction?.techType === techType ||
      this.currentSelectedBuilding?.productionQueue?.some(item => item.techType === techType);
  }

  getUnitTrainingTime(unitType) {
    const times = {
      villager: 20,
      soldier: 25,
      knight: 35,
      archer: 25,
      scout: 30
    };
    let trainingTime = times[unitType] || 30;
    if (this.currentSelectedBuilding?.buildingType === BUILDING_TYPES.STABLE && this.game.player) {
      trainingTime /= this.game.player.getBonus('stableTrainingSpeed', 1.0);
    }
    return trainingTime;
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
    if (TECH_CONFIG[techType]) return TECH_CONFIG[techType].time;

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
    return normalizeBuildingType(buildingType);
  }
}

export default ActionPanel;

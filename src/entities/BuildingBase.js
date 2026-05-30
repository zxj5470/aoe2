import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import Entity from './Entity.js';
import RomanNumeralCanvas from './RomanNumeralCanvas.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor, HUMAN_OWNER, normalizeBuildingType, BUILDING_TYPES, BUILDING_CONFIG } from '../config.js';
import { BUILDING_EMOJIS } from '../emojis.js';

class BuildingBase extends Entity {
    constructor(config) {
        const maxHealth = config.health || config.maxHealth || 200;
        const isUnderConstruction = config.isUnderConstruction || false;
        const constructionProgress = config.constructionProgress || 0;

        super({
            name: config.name || 'Building',
            type: 'building',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            // 如果正在建造中，生命值根据建造进度计算
            health: isUnderConstruction ? Math.floor(maxHealth * constructionProgress / 100) : maxHealth,
            maxHealth: maxHealth,
            owner: config.owner || HUMAN_OWNER
        });

        this.buildingType = normalizeBuildingType(config.buildingType || BUILDING_TYPES.HOUSE);
        this.width = config.width || 2;
        this.depth = config.depth || 2;
        this.height = config.height || 2;
        this.isUnderConstruction = isUnderConstruction;
        this.constructionProgress = constructionProgress;
        this.builderVillagers = [];
        this.requiredBuilders = 1;
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;

        this.selectionRing = null;
        this.healthBarCSS = null;
        this.healthBarElement = null;
        this.healthBarFill = null;

        // 血条悬停状态
        this.isMouseOver = false;

        this.placementRotation = config.placementRotation || 0;
        this.gridSizeX = config.gridSizeX || this.getDefaultGridSizeX();
        this.gridSizeZ = config.gridSizeZ || this.getDefaultGridSizeZ();

        this.collisionBox = null;

        this.appearanceConfig = this.getAppearanceConfig();
        this.buildingFeatures = this.getBuildingFeatures();

        // 驻军系统
        this.garrisonedUnits = [];
        this.garrisonCapacity = this.buildingFeatures.garrisonCapacity || 0;

        // 防御建筑攻击属性
        if (this.buildingFeatures.canAttack) {
            this.attackDamage = config.attackDamage || 10;
            this.attackRange = this.buildingFeatures.attackRange || 6;
            this.attackCooldown = config.attackCooldown || 2;
            this.lastAttackTime = 0;
            this.targetEntity = null;
            this.isAttacking = false;
        }

        if (this.appearanceConfig) {
            this.width = this.appearanceConfig.width || this.width;
            this.depth = this.appearanceConfig.depth || this.depth;
            this.height = this.appearanceConfig.height || this.height;
        }
    }

    // 占地宽度（X轴方向格子数）
    getDefaultGridSizeX() {
        return BUILDING_CONFIG[this.buildingType]?.width || 2;
    }

    // 占地纵深（Z轴方向格子数，即矩形的"高"）
    getDefaultGridSizeZ() {
        return BUILDING_CONFIG[this.buildingType]?.depth || 2;
    }

    // 建筑外观配置（含尺寸、符号、颜色）
    // width - 占地宽度，depth - 占地纵深，height - 离地高度
    // 建筑外观配置（尺寸引用 BUILDING_CONFIG，仅定义视觉属性）
    getAppearanceConfig() {
        const visualConfigs = {
            [BUILDING_TYPES.HOUSE]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.HOUSE], color: 0x4169E1, bgColor: 0x8B4513 },
            [BUILDING_TYPES.FARM]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.FARM], color: 0x9ACD32, bgColor: 0x8B4513 },
            [BUILDING_TYPES.LUMBER_CAMP]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.LUMBER_CAMP], color: 0x8B4513, bgColor: 0x654321 },
            [BUILDING_TYPES.MINING_CAMP]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.MINING_CAMP], color: 0x708090, bgColor: 0x5C5C5C },
            [BUILDING_TYPES.BARRACKS]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.BARRACKS], color: 0x1E90FF, bgColor: 0x8B4513 },
            [BUILDING_TYPES.STABLE]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.STABLE], color: 0x228B22, bgColor: 0x8B4513 },
            [BUILDING_TYPES.ARCHERY_RANGE]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.ARCHERY_RANGE], color: 0x32CD32, bgColor: 0x8B4513 },
            [BUILDING_TYPES.CASTLE]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.CASTLE], color: 0x00008B, bgColor: 0x696969 },
            [BUILDING_TYPES.MARKET]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.MARKET], color: 0xDAA520, bgColor: 0x8B4513 },
            [BUILDING_TYPES.CHURCH]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.CHURCH], color: 0xFFFAF0, bgColor: 0x8B4513 },
            [BUILDING_TYPES.BLACKSMITH]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.BLACKSMITH], color: 0x708090, bgColor: 0x8B4513 },
            [BUILDING_TYPES.WATCH_TOWER]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.WATCH_TOWER], color: 0x4682B4, bgColor: 0x696969 },
            [BUILDING_TYPES.TOWN_CENTER]: { symbol: BUILDING_EMOJIS[BUILDING_TYPES.TOWN_CENTER], color: 0xF5DEB3, bgColor: 0x8B4513 },
            gate: { symbol: BUILDING_EMOJIS['gate'], color: 0xA0522D, bgColor: 0x696969 }
        };

        const buildingConfig = BUILDING_CONFIG[this.buildingType] || BUILDING_CONFIG[BUILDING_TYPES.HOUSE];
        const visual = visualConfigs[this.buildingType] || visualConfigs[BUILDING_TYPES.HOUSE];

        return {
            width: buildingConfig.width,
            depth: buildingConfig.depth,
            height: buildingConfig.height,
            ...visual
        };
    }

    getBuildingFeatures() {
        const features = {
            [BUILDING_TYPES.HOUSE]: { populationBonus: 5, isResidential: true, garrisonCapacity: 5 },
            [BUILDING_TYPES.FARM]: { producesFood: true, isEconomic: true },
            [BUILDING_TYPES.LUMBER_CAMP]: { dropOffResources: ['wood'], isEconomic: true, isDropOff: true },
            [BUILDING_TYPES.MINING_CAMP]: { dropOffResources: ['gold', 'stone'], isEconomic: true, isDropOff: true },
            [BUILDING_TYPES.BARRACKS]: { canTrainUnits: ['soldier', 'knight'], isMilitary: true },
            [BUILDING_TYPES.STABLE]: { canTrainUnits: ['scout'], isMilitary: true },
            [BUILDING_TYPES.ARCHERY_RANGE]: { canTrainUnits: ['archer'], isMilitary: true },
            [BUILDING_TYPES.CASTLE]: { canTrainUnits: ['elite'], isMilitary: true, isDefensive: true },
            [BUILDING_TYPES.MARKET]: { canTrade: true, isEconomic: true },
            [BUILDING_TYPES.CHURCH]: { canHeal: true, isSpecial: true },
            [BUILDING_TYPES.BLACKSMITH]: { canUpgrade: true, isEconomic: true },
            [BUILDING_TYPES.WATCH_TOWER]: { canAttack: true, isDefensive: true, attackRange: 6 },
            [BUILDING_TYPES.TOWN_CENTER]: { canCreateVillagers: true, isEconomic: true, isDropOff: true },
            gate: { isDefensive: true, isGate: true }
        };

        return features[this.buildingType] || {};
    }

    /**
     * 驻扎单位
     */
    garrison(unit) {
        if (!this.garrisonCapacity || this.garrisonedUnits.length >= this.garrisonCapacity) return false;
        if (!unit.isAlive || unit.type !== 'unit') return false;

        this.garrisonedUnits.push(unit);
        unit.isGarrisoned = true;
        unit.garrisonedBuilding = this;
        if (unit.mesh) unit.mesh.visible = false;
        if (unit.selectionRing) unit.selectionRing.visible = false;
        unit.stop();
        console.log(`[Garrison] ${unit.name} 驻扎进 ${this.name} (${this.garrisonedUnits.length}/${this.garrisonCapacity})`);
        return true;
    }

    /**
     * 放出指定数量的驻扎单位
     */
    ungarrison(count = 1) {
        const released = [];
        for (let i = 0; i < Math.min(count, this.garrisonedUnits.length); i++) {
            const unit = this.garrisonedUnits.shift();
            unit.isGarrisoned = false;
            unit.garrisonedBuilding = null;
            if (unit.mesh) {
                unit.mesh.visible = true;
                unit.mesh.position.copy(this.position);
                unit.mesh.position.x += (Math.random() - 0.5) * 2;
                unit.mesh.position.z += (Math.random() - 0.5) * 2;
            }
            if (unit.selectionRing) unit.selectionRing.visible = Boolean(unit.isSelected);
            released.push(unit);
        }
        return released;
    }

    createMesh() {
        const config = this.appearanceConfig;
        const group = new THREE.Group();

        this.width = config.width;
        this.depth = config.depth;
        // 使用配置中的高度，如果没有则使用默认值
        this.height = this.height || config.height || 2;

        this.createSymbolMarker(group, config);

        if (this.isUnderConstruction) {
            group.scale.y = this.constructionProgress / 100;
        }

        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.scale.set(this.scale, this.scale, this.scale);

        this.mesh.userData = {
            type: 'building',
            buildingType: this.buildingType,
            entity: this,
            owner: this.owner
        };

        this.createSelectionRing();
        this.createHealthBar();

        console.log('[BuildingBase] createMesh completed, healthBarElement:', this.healthBarElement ? 'created' : 'null');

        return this.mesh;
    }

    createSymbolMarker(group, config) {
        const baseGeometry = new THREE.BoxGeometry(this.width, 0.1, this.depth);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: config.bgColor,
            transparent: true,
            opacity: 0.4,
            roughness: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.05;
        base.receiveShadow = true;
        base.name = 'base';
        group.add(base);

        const edgesGeometry = new THREE.EdgesGeometry(baseGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(getPlayerColor(this.owner)),
            transparent: true,
            opacity: 0.8
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        edges.position.y = 0.06;
        edges.name = 'border';
        group.add(edges);

        let texture;
        
        if (this.buildingType === BUILDING_TYPES.TOWN_CENTER) {
            texture = RomanNumeralCanvas.createTexture(this.ageLevel || 1);
        } else {
            const canvas = document.createElement('canvas');
            const size = 256;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = getPlayerColor(this.owner);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = `${size * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(config.symbol, size / 2, size / 2 + size * 0.05);

            texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
        }

        let symbolSize = Math.min(this.width, this.depth) * 0.7;
        let posX = 0;
        let posZ = 0;

        if (this.buildingType === BUILDING_TYPES.TOWN_CENTER) {
            symbolSize = 1.4;
            posX = -this.width / 2 + 1;
            posZ = -this.depth / 2 + 1;
        }

        const planeGeometry = new THREE.PlaneGeometry(symbolSize, symbolSize);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.symbolPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.symbolPlane.rotation.x = -Math.PI / 2;
        this.symbolPlane.rotation.z = Math.PI / 4;
        this.symbolPlane.position.set(posX, 0.12, posZ);
        this.symbolPlane.name = 'symbol';
        group.add(this.symbolPlane);
    }

    setAgeLevel(level) {
        this.ageLevel = Math.min(Math.max(level, 1), 4);
        this.updateSymbolTexture();
    }

    updateSymbolTexture() {
        if (!this.symbolPlane || !this.mesh) return;

        if (this.buildingType === BUILDING_TYPES.TOWN_CENTER) {
            RomanNumeralCanvas.updateTexture(this.symbolPlane, this.ageLevel || 1);
        } else {
            const config = this.appearanceConfig;
            const canvas = document.createElement('canvas');
            const size = 256;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = getPlayerColor(this.owner);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = `${size * 0.7}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(config.symbol, size / 2, size / 2 + size * 0.05);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            this.symbolPlane.material.map = texture;
            this.symbolPlane.material.needsUpdate = true;
        }
    }

    createSelectionRing() {
        const gridSize = CELL_SIZE;

        const buildingCenterX = this.position.x;
        const buildingCenterZ = this.position.z;

        const gridX = Math.floor(buildingCenterX / gridSize) * gridSize + gridSize / 2;
        const gridZ = Math.floor(buildingCenterZ / gridSize) * gridSize + gridSize / 2;

        const gridWidth = Math.ceil(this.width / gridSize) * gridSize;
        const gridDepth = Math.ceil(this.depth / gridSize) * gridSize;
        
        const halfWidth = gridWidth / 2;
        const halfDepth = gridDepth / 2;
        
        const boxGeometry = new THREE.BoxGeometry(gridWidth, 0.1, gridDepth);
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: new THREE.Color(getPlayerColor(this.owner)),
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        this.selectionRing = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.selectionRing.position.set(0, 0.05, 0);
        this.selectionRing.visible = false;
        this.selectionRing.name = 'selectionRing';
        this.mesh.add(this.selectionRing);
        
        if (this.selectionGlow) {
            this.selectionGlow.geometry.dispose();
            this.selectionGlow.material.dispose();
            this.mesh.remove(this.selectionGlow);
            this.selectionGlow = null;
        }
    }
    
    createHealthBar() {
        // 创建 HTML 血条容器
        const healthBarDiv = document.createElement('div');
        healthBarDiv.style.cssText = `
            width: 80px;
            height: 8px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 2px;
            overflow: hidden;
            pointer-events: none;
        `;

        // 创建血量填充条
        const healthFill = document.createElement('div');
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #00FF00;
            transition: width 0.2s ease;
        `;
        healthBarDiv.appendChild(healthFill);

        // 创建 CSS2DObject
        this.healthBarCSS = new CSS2DObject(healthBarDiv);
        this.healthBarCSS.position.y = 0.5;
        this.healthBarCSS.name = 'healthBarCSS';
        this.healthBarCSS.visible = false; // 默认隐藏
        this.mesh.add(this.healthBarCSS);

        // 保存引用
        this.healthBarElement = healthBarDiv;
        this.healthBarFill = healthFill;

        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBarFill) return;

        const healthPercentage = this.getHealthPercentage();

        // 更新血条宽度
        this.healthBarFill.style.width = `${healthPercentage * 100}%`;

        // 更新血条颜色
        if (healthPercentage > 0.6) {
            this.healthBarFill.style.background = '#00FF00';
        } else if (healthPercentage > 0.3) {
            this.healthBarFill.style.background = '#FFFF00';
        } else {
            this.healthBarFill.style.background = '#FF0000';
        }
    }

    onHover() {
        super.onHover();
    }

    onHoverOut() {
        super.onHoverOut();
    }


    /**
     * 显示血条
     */
    showHealthBar() {
        if (this.healthBarCSS) {
            this.healthBarCSS.visible = true;
        }
    }

    /**
     * 隐藏血条
     */
    hideHealthBar() {
        if (this.healthBarCSS) {
            this.healthBarCSS.visible = false;
        }
    }

    /**
     * 每帧更新血条可见性 — 单一仲裁点
     * 规则：建造中 / 血量不满 / 鼠标悬停 → 显示，否则隐藏
     */
    updateHealthBarAnimation(deltaTime) {
        if (!this.healthBarCSS) return;

        const shouldShow = this.isUnderConstruction || this.health < this.maxHealth || this.isMouseOver;

        if (shouldShow) {
            this.showHealthBar();
        } else {
            this.hideHealthBar();
        }
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        if (this.isSelected) {
            this.updateSelectionVisual(deltaTime);
        }
    }

    updateSelectionVisual(deltaTime = 0) {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;

        this.showHealthBar();
        this.updateHealthBar();

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);

        this.updateHealthBar();

        // 满血时隐藏血条
        if (this.health >= this.maxHealth) {
            this.hideHealthBar();
        }
    }
    
    die() {
        this.isAlive = false;
        
        if (this.selectionRing) {
            this.selectionRing.visible = false;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = false;
        }
        this.hideHealthBar();
        
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.position.y -= 0.5;
                }
            });
        }
        
        console.log(`建筑 ${this.name} 已摧毁`);
    }

    getBuildingType() {
        return this.buildingType;
    }

    getSize() {
        return {
            width: this.width,
            depth: this.depth,
            height: this.height
        };
    }
}

export default BuildingBase;

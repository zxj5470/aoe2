import * as THREE from 'three';
import Entity from './Entity.js';
import RomanNumeralCanvas from './RomanNumeralCanvas.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor, HUMAN_OWNER } from '../config.js';

class BuildingBase extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Building',
            type: 'building',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 200,
            maxHealth: config.maxHealth || 200,
            owner: config.owner || HUMAN_OWNER
        });

        this.buildingType = config.buildingType || 'house';
        this.width = config.width || 2;
        this.depth = config.depth || 2;
        this.height = config.height || 2;
        this.isUnderConstruction = config.isUnderConstruction || false;
        this.constructionProgress = config.constructionProgress || 0;
        this.builderVillagers = [];
        this.requiredBuilders = 1;
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;

        this.selectionRing = null;
        this.healthBar = null;
        this.healthBarGroup = null;

        this.gridSizeX = config.gridSizeX || this.getDefaultGridSizeX();
        this.gridSizeZ = config.gridSizeZ || this.getDefaultGridSizeZ();

        this.collisionBox = null;

        this.appearanceConfig = this.getAppearanceConfig();
        this.buildingFeatures = this.getBuildingFeatures();

        if (this.appearanceConfig) {
            this.width = this.appearanceConfig.width || this.width;
            this.depth = this.appearanceConfig.depth || this.depth;
            this.height = this.appearanceConfig.height || this.height;
        }
    }

    getDefaultGridSizeX() {
        const gridSizes = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 3,
            blacksmith: 3,
            watch_tower: 2,
            town_center: 4
        };
        return gridSizes[this.buildingType] || 2;
    }

    getDefaultGridSizeZ() {
        const gridSizes = {
            house: 2,
            barracks: 3,
            stable: 3,
            archery_range: 3,
            castle: 5,
            market: 3,
            church: 4,
            blacksmith: 3,
            watch_tower: 2,
            town_center: 4
        };
        return gridSizes[this.buildingType] || 2;
    }

    getAppearanceConfig() {
        const configs = {
            house: {
                width: 2,
                depth: 2,
                symbol: '🏠',
                color: 0x4169E1,
                bgColor: 0x8B4513
            },
            barracks: {
                width: 3,
                depth: 3,
                symbol: '⚔️',
                color: 0x1E90FF,
                bgColor: 0x8B4513
            },
            stable: {
                width: 3,
                depth: 3,
                symbol: '🐴',
                color: 0x228B22,
                bgColor: 0x8B4513
            },
            archery_range: {
                width: 3,
                depth: 3,
                symbol: '🏹',
                color: 0x32CD32,
                bgColor: 0x8B4513
            },
            castle: {
                width: 5,
                depth: 5,
                symbol: '🏰',
                color: 0x00008B,
                bgColor: 0x696969
            },
            market: {
                width: 3,
                depth: 3,
                symbol: '💰',
                color: 0xDAA520,
                bgColor: 0x8B4513
            },
            church: {
                width: 3,
                depth: 4,
                symbol: '⛪',
                color: 0xFFFAF0,
                bgColor: 0x8B4513
            },
            blacksmith: {
                width: 3,
                depth: 3,
                symbol: '🔨',
                color: 0x708090,
                bgColor: 0x8B4513
            },
            watch_tower: {
                width: 2,
                depth: 2,
                symbol: '🗼',
                color: 0x4682B4,
                bgColor: 0x696969
            },
            town_center: {
                width: 4,
                depth: 4,
                symbol: '🏛️',
                color: 0xF5DEB3,
                bgColor: 0x8B4513
            }
        };

        return configs[this.buildingType] || configs.house;
    }

    getBuildingFeatures() {
        const features = {
            house: { populationBonus: 5, isResidential: true },
            barracks: { canTrainUnits: ['soldier', 'knight'], isMilitary: true },
            stable: { canTrainUnits: ['scout'], isMilitary: true },
            archery_range: { canTrainUnits: ['archer'], isMilitary: true },
            castle: { canTrainUnits: ['elite'], isMilitary: true, isDefensive: true },
            market: { canTrade: true, isEconomic: true },
            church: { canHeal: true, isSpecial: true },
            blacksmith: { canUpgrade: true, isEconomic: true },
            watch_tower: { canAttack: true, isDefensive: true, attackRange: 6 },
            town_center: { canCreateVillagers: true, isEconomic: true, isDropOff: true }
        };

        return features[this.buildingType] || {};
    }

    createMesh() {
        const config = this.appearanceConfig;
        const group = new THREE.Group();

        this.width = config.width;
        this.depth = config.depth;
        this.height = 1;

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
        
        if (this.buildingType === 'town_center') {
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

        if (this.buildingType === 'town_center') {
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

        if (this.buildingType === 'town_center') {
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
        const healthBarGroup = new THREE.Group();
        healthBarGroup.position.y = 0.3;
        healthBarGroup.name = 'healthBarGroup';
        
        const bgGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 0.8, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        background.position.z = 0.01;
        background.name = 'healthBarBackground';
        healthBarGroup.add(background);
        
        const healthGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 0.8, 0.1);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.02;
        this.healthBar.name = 'healthBar';
        healthBarGroup.add(this.healthBar);
        
        const borderGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 0.85, 0.17);
        const borderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.z = 0.005;
        border.name = 'healthBarBorder';
        healthBarGroup.add(border);
        
        this.mesh.add(healthBarGroup);
        this.healthBarGroup = healthBarGroup;
        
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        if (!this.healthBar) return;
        
        const healthPercentage = this.getHealthPercentage();
        
        this.healthBar.scale.x = healthPercentage;
        
        if (healthPercentage > 0.6) {
            this.healthBar.material.color.setHex(0x00FF00);
        } else if (healthPercentage > 0.3) {
            this.healthBar.material.color.setHex(0xFFFF00);
        } else {
            this.healthBar.material.color.setHex(0xFF0000);
        }
        
        const originalWidth = this.healthBar.geometry.parameters.width;
        const newWidth = originalWidth * healthPercentage;
        this.healthBar.position.x = -(originalWidth - newWidth) / 2;
        
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = healthPercentage < 1.0;
        }
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateConstruction(deltaTime);
        this.updateProduction(deltaTime);
        
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
        
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = true;
        }
        
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        this.updateHealthBar();
        
        if (this.health >= this.maxHealth && this.healthBarGroup) {
            this.healthBarGroup.visible = false;
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
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
        
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

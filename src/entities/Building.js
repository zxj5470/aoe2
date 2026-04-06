import * as THREE from 'three';
import Entity from './Entity.js';

class Building extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Building',
            type: 'building',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 200,
            maxHealth: config.maxHealth || 200,
            owner: config.owner || 'player'
        });

        this.buildingType = config.buildingType || 'house';
        this.width = config.width || 2;
        this.depth = config.depth || 2;
        this.height = config.height || 2;
        this.isUnderConstruction = config.isUnderConstruction || false;
        this.constructionProgress = config.constructionProgress || 0;
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;
        
        this.selectionRing = null;
        this.selectionGlow = null;
        this.healthBar = null;
        this.healthBarGroup = null;
        
        // 根据建筑类型设置外观配置
        this.appearanceConfig = this.getAppearanceConfig();
        this.buildingFeatures = this.getBuildingFeatures();
    }
    
    /**
     * 根据建筑类型获取外观配置
     */
    getAppearanceConfig() {
        const configs = {
            house: {
                width: 2,
                depth: 2,
                height: 2,
                wallColor: 0x4169E1,
                roofColor: 0x8B0000,
                roofType: 'pyramid',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'chimney'
            },
            barracks: {
                width: 3,
                depth: 2.5,
                height: 2.5,
                wallColor: 0x1E90FF,
                roofColor: 0x8B0000,
                roofType: 'gable',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'flag'
            },
            stable: {
                width: 3,
                depth: 3,
                height: 2.2,
                wallColor: 0x228B22,
                roofColor: 0x8B4513,
                roofType: 'flat',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'stall'
            },
            archery_range: {
                width: 2.5,
                depth: 2.5,
                height: 2,
                wallColor: 0x32CD32,
                roofColor: 0x8B4513,
                roofType: 'pyramid',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'target'
            },
            castle: {
                width: 5,
                depth: 5,
                height: 4,
                wallColor: 0x00008B,
                roofColor: 0x8B0000,
                roofType: 'multiple',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x696969,
                decoration: 'towers'
            },
            market: {
                width: 3,
                depth: 2.5,
                height: 2,
                wallColor: 0xDAA520,
                roofColor: 0x8B4513,
                roofType: 'dome',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'stall'
            },
            church: {
                width: 3,
                depth: 4,
                height: 3.5,
                wallColor: 0xFFFAF0,
                roofColor: 0x4B0082,
                roofType: 'spire',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'cross'
            },
            blacksmith: {
                width: 2.5,
                depth: 2.5,
                height: 2,
                wallColor: 0x708090,
                roofColor: 0x8B0000,
                roofType: 'gable',
                hasDoor: true,
                hasWindows: true,
                baseColor: 0x8B4513,
                decoration: 'anvil'
            },
            watch_tower: {
                width: 1.5,
                depth: 1.5,
                height: 3,
                wallColor: 0x4682B4,
                roofColor: 0x8B0000,
                roofType: 'pyramid',
                hasDoor: false,
                hasWindows: true,
                baseColor: 0x696969,
                decoration: 'battlements'
            }
        };
        
        return configs[this.buildingType] || configs.house;
    }
    
    /**
     * 获取建筑特性
     */
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
            watch_tower: { canAttack: true, isDefensive: true, attackRange: 6 }
        };
        
        return features[this.buildingType] || {};
    }

    createMesh() {
        const config = this.appearanceConfig;
        const group = new THREE.Group();
        
        // 根据配置调整尺寸
        this.width = config.width;
        this.depth = config.depth;
        this.height = config.height;
        
        // 创建地基
        this.createBase(group, config);
        
        // 创建墙壁
        this.createWalls(group, config);
        
        // 创建屋顶
        this.createRoof(group, config);
        
        // 创建门窗
        if (config.hasDoor) {
            this.createDoor(group, config);
        }
        if (config.hasWindows) {
            this.createWindows(group, config);
        }
        
        // 创建装饰
        this.createDecorations(group, config);
        
        // 应用建造进度缩放
        if (this.isUnderConstruction) {
            group.scale.y = this.constructionProgress / 100;
        }
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        
        // 创建选择环
        this.createSelectionRing();
        
        // 创建生命值条
        this.createHealthBar();
        
        return this.mesh;
    }
    
    /**
     * 创建建筑地基
     */
    createBase(group, config) {
        const baseGeometry = new THREE.BoxGeometry(this.width + 0.2, 0.2, this.depth + 0.2);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: config.baseColor,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = 'base';
        group.add(base);
    }
    
    /**
     * 创建墙壁
     */
    createWalls(group, config) {
        const playerColor = this.owner === 'player' ? config.wallColor : 0xDC143C;
        
        const wallGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: playerColor,
            roughness: 0.7,
            metalness: 0.1
        });
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = this.height / 2 + 0.2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        walls.name = 'walls';
        group.add(walls);
    }
    
    /**
     * 创建屋顶（根据类型）
     */
    createRoof(group, config) {
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: config.roofColor,
            roughness: 0.8
        });
        
        switch (config.roofType) {
            case 'pyramid':
                // 金字塔屋顶
                const pyramidGeometry = new THREE.ConeGeometry(
                    Math.max(this.width, this.depth) * 0.7,
                    this.height * 0.5,
                    4
                );
                const pyramid = new THREE.Mesh(pyramidGeometry, roofMaterial);
                pyramid.position.y = this.height + 0.2;
                pyramid.rotation.y = Math.PI / 4;
                pyramid.castShadow = true;
                pyramid.name = 'roof';
                group.add(pyramid);
                break;
                
            case 'gable':
                // 双坡屋顶
                const gableGeometry = new THREE.CylinderGeometry(
                    0.1,
                    Math.max(this.width, this.depth) * 0.6,
                    this.height * 0.6,
                    4
                );
                const gable = new THREE.Mesh(gableGeometry, roofMaterial);
                gable.position.y = this.height + 0.3;
                gable.rotation.x = Math.PI / 2;
                gable.rotation.z = Math.PI / 4;
                gable.castShadow = true;
                gable.name = 'roof';
                group.add(gable);
                break;
                
            case 'flat':
                // 平顶
                const flatGeometry = new THREE.BoxGeometry(
                    this.width + 0.3,
                    0.15,
                    this.depth + 0.3
                );
                const flat = new THREE.Mesh(flatGeometry, roofMaterial);
                flat.position.y = this.height + 0.3;
                flat.castShadow = true;
                flat.name = 'roof';
                group.add(flat);
                break;
                
            case 'dome':
                // 圆顶
                const domeGeometry = new THREE.SphereGeometry(
                    Math.max(this.width, this.depth) * 0.4,
                    16,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2
                );
                const dome = new THREE.Mesh(domeGeometry, roofMaterial);
                dome.position.y = this.height + 0.2;
                dome.castShadow = true;
                dome.name = 'roof';
                group.add(dome);
                break;
                
            case 'spire':
                // 尖塔屋顶
                const spireGeometry = new THREE.ConeGeometry(
                    Math.max(this.width, this.depth) * 0.5,
                    this.height * 0.8,
                    8
                );
                const spire = new THREE.Mesh(spireGeometry, roofMaterial);
                spire.position.y = this.height + 0.4;
                spire.castShadow = true;
                spire.name = 'roof';
                group.add(spire);
                break;
                
            case 'multiple':
                // 多塔屋顶（城堡）
                const mainRoofGeometry = new THREE.BoxGeometry(
                    this.width - 0.5,
                    0.2,
                    this.depth - 0.5
                );
                const mainRoof = new THREE.Mesh(mainRoofGeometry, roofMaterial);
                mainRoof.position.y = this.height + 0.3;
                mainRoof.castShadow = true;
                mainRoof.name = 'mainRoof';
                group.add(mainRoof);
                
                // 四个角落的塔
                const towerPositions = [
                    { x: -(this.width - 0.5) / 2, z: -(this.depth - 0.5) / 2 },
                    { x: (this.width - 0.5) / 2, z: -(this.depth - 0.5) / 2 },
                    { x: -(this.width - 0.5) / 2, z: (this.depth - 0.5) / 2 },
                    { x: (this.width - 0.5) / 2, z: (this.depth - 0.5) / 2 }
                ];
                
                towerPositions.forEach(pos => {
                    const towerGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
                    const tower = new THREE.Mesh(towerGeometry, roofMaterial);
                    tower.position.set(pos.x, this.height + 0.7, pos.z);
                    tower.rotation.y = Math.PI / 4;
                    tower.castShadow = true;
                    tower.name = 'towerRoof';
                    group.add(tower);
                });
                break;
        }
    }
    
    /**
     * 创建门
     */
    createDoor(group, config) {
        const doorGeometry = new THREE.BoxGeometry(0.6, this.height * 0.5, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, this.height * 0.25 + 0.2, this.depth / 2 + 0.05);
        door.name = 'door';
        group.add(door);
        
        // 门框
        const frameGeometry = new THREE.BoxGeometry(0.8, this.height * 0.55, 0.12);
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, this.height * 0.25 + 0.2, this.depth / 2 + 0.06);
        frame.name = 'doorFrame';
        group.add(frame);
    }
    
    /**
     * 创建窗户
     */
    createWindows(group, config) {
        const windowMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        
        // 前面窗户
        const frontWindowGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.05);
        const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
        frontWindow.position.set(0, this.height * 0.6, this.depth / 2 + 0.05);
        frontWindow.name = 'frontWindow';
        group.add(frontWindow);
        
        // 侧面窗户
        if (this.width > 2) {
            const sideWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
            sideWindow.position.set(this.width / 2 + 0.05, this.height * 0.6, 0);
            sideWindow.name = 'sideWindow';
            group.add(sideWindow);
        }
    }
    
    /**
     * 创建装饰
     */
    createDecorations(group, config) {
        switch (config.decoration) {
            case 'chimney':
                // 烟囱
                const chimneyGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
                const chimneyMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
                chimney.position.set(this.width * 0.2, this.height + 0.6, this.depth * 0.2);
                chimney.name = 'chimney';
                group.add(chimney);
                break;
                
            case 'flag':
                // 旗帜
                const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
                const poleMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.set(this.width * 0.4, this.height + 1.2, this.depth * 0.4);
                pole.name = 'flagPole';
                group.add(pole);
                
                const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
                const flagMaterial = new THREE.MeshStandardMaterial({ 
                    color: this.owner === 'player' ? 0x4169E1 : 0xDC143C,
                    side: THREE.DoubleSide
                });
                const flag = new THREE.Mesh(flagGeometry, flagMaterial);
                flag.position.set(this.width * 0.4, this.height + 1.8, this.depth * 0.4);
                flag.name = 'flag';
                group.add(flag);
                break;
                
            case 'stall':
                // 货摊支架
                const stallGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
                const stallMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                for (let i = -1; i <= 1; i += 2) {
                    const stall = new THREE.Mesh(stallGeometry, stallMaterial);
                    stall.position.set(i * this.width * 0.3, this.height * 0.5, this.depth / 2 + 0.3);
                    stall.name = 'stall';
                    group.add(stall);
                }
                break;
                
            case 'battlements':
                // 垛口（防御建筑）
                const battlementHeight = 0.2;
                const battlementGeometry = new THREE.BoxGeometry(0.2, battlementHeight, 0.2);
                const battlementMaterial = new THREE.MeshStandardMaterial({ 
                    color: config.wallColor,
                    roughness: 0.7
                });
                
                const positions = [
                    { x: -this.width / 2 + 0.2, z: -this.depth / 2 + 0.2 },
                    { x: 0, z: -this.depth / 2 + 0.2 },
                    { x: this.width / 2 - 0.2, z: -this.depth / 2 + 0.2 },
                    { x: -this.width / 2 + 0.2, z: this.depth / 2 - 0.2 },
                    { x: 0, z: this.depth / 2 - 0.2 },
                    { x: this.width / 2 - 0.2, z: this.depth / 2 - 0.2 }
                ];
                
                positions.forEach(pos => {
                    const battlement = new THREE.Mesh(battlementGeometry, battlementMaterial);
                    battlement.position.set(pos.x, this.height + 0.2, pos.z);
                    battlement.name = 'battlement';
                    group.add(battlement);
                });
                break;
        }
    }

    createSelectionRing() {
        const config = this.appearanceConfig;
        const radius = Math.max(this.width, this.depth) * 0.7;
        
        // 主选择环
        const ringGeometry = new THREE.RingGeometry(radius, radius + 0.15, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionRing.rotation.x = -Math.PI / 2;
        this.selectionRing.position.y = 0.05;
        this.selectionRing.visible = false;
        this.selectionRing.name = 'selectionRing';
        this.mesh.add(this.selectionRing);
        
        // 外部闪烁环
        const glowRingGeometry = new THREE.RingGeometry(radius + 0.2, radius + 0.35, 32);
        const glowRingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        this.selectionGlow = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
        this.selectionGlow.rotation.x = -Math.PI / 2;
        this.selectionGlow.position.y = 0.05;
        this.selectionGlow.visible = false;
        this.selectionGlow.name = 'selectionGlow';
        this.mesh.add(this.selectionGlow);
    }
    
    /**
     * 创建生命值条
     */
    createHealthBar() {
        const config = this.appearanceConfig;
        
        // 创建生命值条容器
        const healthBarGroup = new THREE.Group();
        healthBarGroup.position.y = this.height + 1.2;
        healthBarGroup.name = 'healthBarGroup';
        
        // 背景
        const bgGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.5, 0.25);
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
        
        // 生命值填充
        const healthGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.5, 0.2);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.02;
        this.healthBar.name = 'healthBar';
        healthBarGroup.add(this.healthBar);
        
        // 边框
        const borderGeometry = new THREE.PlaneGeometry(Math.max(this.width, this.depth) * 1.55, 0.27);
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
        
        // 初始更新生命值条
        this.updateHealthBar();
    }
    
    /**
     * 更新生命值条显示
     */
    updateHealthBar() {
        if (!this.healthBar) return;
        
        const healthPercentage = this.getHealthPercentage();
        
        // 更新生命值条宽度
        this.healthBar.scale.x = healthPercentage;
        
        // 根据生命值改变颜色
        if (healthPercentage > 0.6) {
            this.healthBar.material.color.setHex(0x00FF00); // 绿色
        } else if (healthPercentage > 0.3) {
            this.healthBar.material.color.setHex(0xFFFF00); // 黄色
        } else {
            this.healthBar.material.color.setHex(0xFF0000); // 红色
        }
        
        // 调整生命值条位置使其左对齐
        const originalWidth = this.healthBar.geometry.parameters.width;
        const newWidth = originalWidth * healthPercentage;
        this.healthBar.position.x = -(originalWidth - newWidth) / 2;
        
        // 默认隐藏生命值条，只有受伤时显示
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = healthPercentage < 1.0;
        }
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateConstruction(deltaTime);
        this.updateProduction(deltaTime);
        
        // 更新选择环动画
        if (this.isSelected) {
            this.updateSelectionVisual(deltaTime);
        }
    }

    updateConstruction(deltaTime) {
        if (this.isUnderConstruction && this.constructionProgress < 100) {
            this.constructionProgress += deltaTime * 10; // 建造速度
            
            if (this.constructionProgress >= 100) {
                this.constructionProgress = 100;
                this.isUnderConstruction = false;
                this.onConstructionComplete();
            }
            
            // 建造动画：建筑从地面升起
            if (this.mesh) {
                const progress = this.constructionProgress / 100;
                
                // 垂直升起动画
                const baseY = progress * 0.5;
                const base = this.mesh.getObjectByName('base');
                if (base) {
                    base.position.y = 0.1 + (1 - progress) * 0.5;
                }
                
                // 墙壁逐渐显现
                const walls = this.mesh.getObjectByName('walls');
                if (walls) {
                    walls.position.y = (this.height / 2 + 0.2) * progress;
                    walls.scale.y = progress;
                }
                
                // 屋顶逐渐出现
                const roof = this.mesh.getObjectByName('roof');
                if (roof) {
                    roof.position.y = (this.height + 0.2) * progress;
                    roof.scale.setScalar(progress);
                }
                
                // 添加建造进度颜色变化
                this.mesh.children.forEach(child => {
                    if (child.material) {
                        const originalColor = new THREE.Color(this.appearanceConfig.wallColor);
                        const progressColor = originalColor.clone().lerp(
                            new THREE.Color(0x8B4513),
                            1 - progress
                        );
                        if (child.name === 'walls' || child.name === 'base') {
                            child.material.color = progressColor;
                        }
                    }
                });
                
                // 更新生命值条显示建造进度
                if (this.healthBar) {
                    this.healthBarGroup.visible = true;
                    this.healthBar.scale.x = progress;
                    this.healthBar.material.color.setHex(0x00FF00);
                }
            }
        }
    }

    updateProduction(deltaTime) {
        if (this.currentProduction) {
            this.productionProgress += deltaTime * (100 / this.currentProduction.time);
            
            if (this.productionProgress >= 100) {
                this.productionProgress = 0;
                this.onProductionComplete(this.currentProduction);
                this.currentProduction = null;
                
                // 开始下一个生产任务
                if (this.productionQueue.length > 0) {
                    this.currentProduction = this.productionQueue.shift();
                }
            }
        }
    }

    onConstructionComplete() {
        // 建造完成时的回调
        this.health = this.maxHealth;
    }

    onProductionComplete(productionItem) {
        // 生产完成时的回调
        if (productionItem.onComplete) {
            productionItem.onComplete();
        }
    }

    addToProductionQueue(item) {
        this.productionQueue.push(item);
        
        if (!this.currentProduction) {
            this.currentProduction = this.productionQueue.shift();
        }
    }

    cancelProduction() {
        if (this.currentProduction) {
            this.currentProduction = null;
            this.productionProgress = 0;
        }
    }

    getConstructionProgress() {
        return this.constructionProgress;
    }

    getProductionProgress() {
        return this.productionProgress;
    }

    getProductionQueue() {
        return this.productionQueue;
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

    updateSelectionVisual(deltaTime = 0) {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = this.isSelected;
        }
        
        // 如果选中，更新选择环颜色和闪烁效果
        if (this.isSelected && this.selectionRing && this.selectionGlow) {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 2) * 0.3 + 0.7;
            
            this.selectionGlow.material.opacity = 0.3 * pulse;
            
            // 根据建筑状态改变颜色
            if (this.isUnderConstruction) {
                this.selectionRing.material.color.setHex(0xFFFF00); // 黄色（建造中）
            } else if (this.health < this.maxHealth * 0.5) {
                this.selectionRing.material.color.setHex(0xFF6600); // 橙色（受损）
            } else {
                this.selectionRing.material.color.setHex(0x00FF00); // 绿色（正常）
            }
        }
    }
    
    /**
     * 重写takeDamage方法，添加生命值条显示
     */
    takeDamage(amount) {
        this.health -= amount;
        
        // 显示生命值条
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = true;
        }
        
        // 更新生命值条
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    /**
     * 重写heal方法，添加生命值条隐藏
     */
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        // 更新生命值条
        this.updateHealthBar();
        
        // 如果生命值满了，隐藏生命值条
        if (this.health >= this.maxHealth && this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
    }
    
    /**
     * 重写die方法，添加死亡效果
     */
    die() {
        this.isAlive = false;
        
        // 隐藏选择环和生命值条
        if (this.selectionRing) {
            this.selectionRing.visible = false;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = false;
        }
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
        
        // 建筑倒塌动画
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    // 添加倒塌效果
                    child.position.y -= 0.5;
                }
            });
        }
        
        console.log(`建筑 ${this.name} 已摧毁`);
    }

    getOccupiedCells() {
        const cells = [];
        const gridX = Math.floor(this.position.x / 2);
        const gridZ = Math.floor(this.position.z / 2);
        
        for (let dx = 0; dx < this.width; dx++) {
            for (let dz = 0; dz < this.depth; dz++) {
                cells.push({
                    x: gridX + dx,
                    z: gridZ + dz
                });
            }
        }
        
        return cells;
    }
}

export default Building;
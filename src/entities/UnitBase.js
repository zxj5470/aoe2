import * as THREE from 'three';
import Entity from './Entity.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor, UNIT_CONFIG, HUMAN_OWNER } from '../config.js';

class UnitBase extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Unit',
            type: 'unit',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 50,
            maxHealth: config.maxHealth || 50,
            owner: config.owner || HUMAN_OWNER
        });

        this.unitType = config.unitType || 'villager';
        this.speed = config.speed || UNIT_CONFIG.defaultSpeed;
        this.attackDamage = config.attackDamage || 5;
        this.attackRange = config.attackRange || 1;
        this.attackSpeed = config.attackSpeed || 1;
        this.armor = config.armor || 0;
        this.sightRange = config.sightRange || 5;
        
        this.targetPosition = null;
        this.targetEntity = null;
        this.currentAction = 'idle';
        this.actionQueue = [];
        
        this.movementSpeed = this.speed;
        this.isMoving = false;
        this.isAttacking = false;
        
        this.lastAttackTime = 0;
        this.attackCooldown = UNIT_CONFIG.attackCooldown / this.attackSpeed;
        
        this.selectionRing = null;
        this.healthBar = null;

        // 血条悬停状态
        this.isMouseOver = false;
        this.healthBarHideTimer = 0;
        this.healthBarHideDelay = 1.0; // 1秒后开始隐藏
        this.healthBarFadeTimer = 0;
        this.healthBarFadeDuration = 0.5; // 0.5秒完成渐隐

        this.animationState = 'idle';
        this.animationProgress = 0;
        this.animationSpeed = UNIT_CONFIG.animationSpeed;

        this.carryAmount = 0;
        this.carryType = null;
        this.currentResource = null;
        this.gatherTimer = 0;
        this.gatherInterval = UNIT_CONFIG.gatherInterval;
        this.returnTimer = 0;
        this.returnTime = UNIT_CONFIG.returnTime;
        this.isReturning = false;
        this.dropOffPoint = null;

        this.isBuilding = false;
        this.buildingTarget = null;
        this.buildArrivalDistance = 1.5;

        this.appearanceConfig = this.getAppearanceConfig();
        
        this.path = [];
        this.currentPathIndex = 0;
        this.pathfindingSystem = config.pathfindingSystem || null;
        this.formationSystem = config.formationSystem || null;
        this.game = config.game || null;
        
        this.id = config.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getAppearanceConfig() {
        return UNIT_CONFIG.appearance[this.unitType] || UNIT_CONFIG.appearance.villager;
    }

    createMesh() {
        const group = new THREE.Group();
        
        const config = this.appearanceConfig;
        const playerColorHex = getPlayerColor(this.owner);
        const playerColor = new THREE.Color(playerColorHex).getHex() || config.bodyColor;
        
        const bodyGeometry = new THREE.BoxGeometry(
            config.bodyWidth, 
            config.bodyHeight, 
            config.bodyWidth * 0.6
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: playerColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = config.bodyHeight / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        body.name = 'body';
        group.add(body);
        
        const headGeometry = new THREE.SphereGeometry(
            config.headSize, 
            16, 
            16
        );
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFDBB4,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = config.bodyHeight + config.headSize * 0.8;
        head.castShadow = true;
        head.receiveShadow = true;
        head.name = 'head';
        group.add(head);
        
        this.createWeapon(group, config);
        this.createLegs(group, config);
        
        group.scale.set(config.scale, config.scale, config.scale);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        
        this.mesh.userData = {
            type: 'unit',
            unitType: this.unitType,
            entity: this,
            owner: this.owner
        };
        
        this.createSelectionRing();
        this.createHealthBar();
        
        return this.mesh;
    }
    
    createWeapon(group, config) {
        const weaponPosition = new THREE.Vector3(config.bodyWidth * 0.5, config.bodyHeight * 0.6, 0);
        
        switch (config.weaponType) {
            case 'sword':
                const swordGeometry = new THREE.BoxGeometry(0.08, 1.0, 0.08);
                const swordMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xC0C0C0,
                    metalness: 0.9,
                    roughness: 0.2
                });
                const sword = new THREE.Mesh(swordGeometry, swordMaterial);
                sword.position.copy(weaponPosition);
                sword.castShadow = true;
                sword.name = 'weapon';
                group.add(sword);
                
                const hiltGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.15);
                const hiltMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
                hilt.position.copy(weaponPosition);
                hilt.position.y -= 0.4;
                hilt.name = 'weapon_hilt';
                group.add(hilt);
                break;
                
            case 'lance':
                const lanceGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
                const lanceMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const lance = new THREE.Mesh(lanceGeometry, lanceMaterial);
                lance.position.set(config.bodyWidth * 0.3, config.bodyHeight * 1.2, 0);
                lance.rotation.z = Math.PI / 6;
                lance.castShadow = true;
                lance.name = 'weapon';
                group.add(lance);
                break;
                
            case 'bow':
                const bowGeometry = new THREE.TorusGeometry(0.4, 0.03, 8, 16, Math.PI);
                const bowMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const bow = new THREE.Mesh(bowGeometry, bowMaterial);
                bow.position.set(config.bodyWidth * 0.4, config.bodyHeight * 0.7, 0);
                bow.rotation.z = Math.PI / 2;
                bow.rotation.y = Math.PI / 2;
                bow.castShadow = true;
                bow.name = 'weapon';
                group.add(bow);
                break;
                
            case 'none':
            default:
                const toolGeometry = new THREE.BoxGeometry(0.08, 0.6, 0.08);
                const toolMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const tool = new THREE.Mesh(toolGeometry, toolMaterial);
                tool.position.copy(weaponPosition);
                tool.castShadow = true;
                tool.name = 'tool';
                group.add(tool);
                break;
        }
    }
    
    createLegs(group, config) {
        const leftLegGeometry = new THREE.BoxGeometry(
            config.bodyWidth * 0.35, 
            config.bodyHeight * 0.4, 
            config.bodyWidth * 0.35
        );
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4169E1,
            roughness: 0.7
        });
        const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        leftLeg.position.set(
            -config.bodyWidth * 0.25, 
            config.bodyHeight * 0.25, 
            0
        );
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        leftLeg.name = 'leftLeg';
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        rightLeg.position.set(
            config.bodyWidth * 0.25, 
            config.bodyHeight * 0.25, 
            0
        );
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        rightLeg.name = 'rightLeg';
        group.add(rightLeg);
    }

    createSelectionRing() {
        const config = this.appearanceConfig;
        const radius = Math.max(config.bodyWidth, config.bodyWidth * 0.6) * 0.7;
        
        const ringGeometry = new THREE.RingGeometry(radius, radius + 0.1, 32);
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
        
        const glowRingGeometry = new THREE.RingGeometry(radius + 0.15, radius + 0.25, 32);
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
    
    createHealthBar() {
        const config = this.appearanceConfig;

        const healthBarGroup = new THREE.Group();
        healthBarGroup.position.y = config.bodyHeight * 1.5 + 0.5;
        healthBarGroup.name = 'healthBarGroup';

        const bgGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });
        const background = new THREE.Mesh(bgGeometry, bgMaterial);
        background.position.z = 0.01;
        background.name = 'healthBarBackground';
        healthBarGroup.add(background);

        const healthGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2, 0.15);
        const healthMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.02;
        this.healthBar.name = 'healthBar';
        healthBarGroup.add(this.healthBar);

        const borderGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2.05, 0.22);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.z = 0.005;
        border.name = 'healthBarBorder';
        healthBarGroup.add(border);

        this.mesh.add(healthBarGroup);
        this.healthBarGroup = healthBarGroup;

        // 血条默认可见
        healthBarGroup.visible = true;

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

        // 血量不满时，血条始终可见（不考虑渐隐）
        if (healthPercentage < 1.0) {
            if (this.healthBarGroup) {
                this.healthBarGroup.visible = true;
                this.healthBarGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = child.material.userData?.baseOpacity || child.material.opacity;
                    }
                });
            }
            return;
        }

        // 正常状态下，鼠标移开后1秒开始渐隐
    }

    onHover() {
        this.isMouseOver = true;
        this.healthBarHideTimer = 0;
        this.healthBarFadeTimer = 0;

        if (this.healthBarGroup) {
            this.healthBarGroup.visible = true;
            this.healthBarGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (!child.material.userData) {
                        child.material.userData = { baseOpacity: child.material.opacity };
                    }
                    child.material.opacity = child.material.userData.baseOpacity;
                }
            });
        }
    }

    onHoverOut() {
        this.isMouseOver = false;
        // 不立即隐藏，等待1秒后开始渐隐
    }

    updateHealthBarAnimation(deltaTime) {
        if (!this.healthBarGroup) return;

        // 血量不满时，不执行渐隐逻辑
        if (this.health < this.maxHealth) {
            return;
        }

        // 如果鼠标悬停，不执行渐隐
        if (this.isMouseOver) {
            this.healthBarHideTimer = 0;
            this.healthBarFadeTimer = 0;
            return;
        }

        // 鼠标移出后，等待1秒再开始渐隐
        if (this.healthBarHideTimer < this.healthBarHideDelay) {
            this.healthBarHideTimer += deltaTime;
            return;
        }

        // 开始渐隐
        if (this.healthBarFadeTimer < this.healthBarFadeDuration) {
            this.healthBarFadeTimer += deltaTime;
            const fadeProgress = this.healthBarFadeTimer / this.healthBarFadeDuration;

            this.healthBarGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (!child.material.userData) {
                        child.material.userData = { baseOpacity: child.material.opacity };
                    }
                    const baseOpacity = child.material.userData.baseOpacity;
                    child.material.opacity = baseOpacity * (1 - fadeProgress);
                }
            });
        } else {
            // 渐隐完成，隐藏血条
            this.healthBarGroup.visible = false;
        }
    }

    die() {
        super.die();
        this.currentAction = 'dying';
        this.animationState = 'dying';
        this.animationProgress = 0;
        this.isMoving = false;
        this.isAttacking = false;
        this.targetPosition = null;
        this.targetEntity = null;
        this._deathTimer = 0;
        this._deathDuration = 1.5;
        this._deathStartY = this.mesh ? this.mesh.position.y : 0;
    }

    update(deltaTime) {
        if (!this.isAlive) {
            this._deathTimer = (this._deathTimer || 0) + deltaTime;
            this.animateDying(deltaTime);
            if (this._deathTimer >= (this._deathDuration || 1.5)) {
                this._markedForRemoval = true;
            }
            return;
        }

        this.updateAction(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCombat(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateHealthBar();

        this.updateBuilding(deltaTime);
        this.updateResourceGathering(deltaTime);
    }

    updateSelectionVisual() {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = this.isSelected;
        }
        
        if (this.isSelected && this.selectionRing && this.selectionGlow) {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            
            this.selectionGlow.material.opacity = 0.3 * pulse;
            
            if (this.isAttacking) {
                this.selectionRing.material.color.setHex(0xFF6600);
            } else if (this.isMoving) {
                this.selectionRing.material.color.setHex(0x00FF00);
            } else {
                this.selectionRing.material.color.setHex(0x00FF00);
            }
        }
    }

    getUnitType() {
        return this.unitType;
    }

    getSpeed() {
        return this.speed;
    }

    getAttackDamage() {
        return this.attackDamage;
    }

    getAttackRange() {
        return this.attackRange;
    }

    getArmor() {
        return this.armor;
    }

    getSightRange() {
        return this.sightRange;
    }

    setSpeed(speed) {
        this.speed = speed;
        this.movementSpeed = speed;
    }

    queueAction(action) {
        this.actionQueue.push(action);
    }

    stop() {
        this.clearBuildingState();
        this.isMoving = false;
        this.isAttacking = false;
        this.targetPosition = null;
        this.targetEntity = null;
        this.actionQueue = [];
        this.currentAction = 'idle';
        
        this.setAnimationState('idle');
        this.path = [];
        
        if (this.game && this.game.scene) {
            this.game.scene.clearPathVisualizer(this.id);
        }
    }
}

export default UnitBase;

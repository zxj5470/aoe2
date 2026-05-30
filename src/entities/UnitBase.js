import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
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
        this.healthBarHideDelay = 0.5; // 0.5秒后开始渐隐
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
        
        // 侦察骑兵：骑马模型
        if (this.unitType === 'scout') {
            this.createScoutMesh(group, config, playerColor);
        } else {
            // 其他单位：普通模型
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
        }
        
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
    
    /**
     * 创建侦察骑兵骑马模型
     */
    createScoutMesh(group, config, playerColor) {
        // 马身（椭圆体）
        const horseBodyGeometry = new THREE.SphereGeometry(0.5, 12, 8);
        horseBodyGeometry.scale(1, 0.7, 1.6);
        const horseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8
        });
        const horseBody = new THREE.Mesh(horseBodyGeometry, horseMaterial);
        horseBody.position.y = 0.6;
        horseBody.castShadow = true;
        horseBody.receiveShadow = true;
        horseBody.name = 'horseBody';
        group.add(horseBody);
        
        // 马头
        const horseHeadGeometry = new THREE.SphereGeometry(0.22, 8, 8);
        horseHeadGeometry.scale(0.8, 1, 1.2);
        const horseHead = new THREE.Mesh(horseHeadGeometry, horseMaterial);
        horseHead.position.set(0, 0.9, 0.7);
        horseHead.rotation.x = -0.3;
        horseHead.castShadow = true;
        horseHead.name = 'horseHead';
        group.add(horseHead);
        
        // 马耳
        for (let side = -1; side <= 1; side += 2) {
            const earGeometry = new THREE.ConeGeometry(0.06, 0.15, 6);
            const ear = new THREE.Mesh(earGeometry, horseMaterial);
            ear.position.set(side * 0.1, 1.15, 0.65);
            ear.rotation.x = -0.3;
            ear.name = 'horseEar';
            group.add(ear);
        }
        
        // 马尾
        const tailGeometry = new THREE.CylinderGeometry(0.04, 0.02, 0.5, 6);
        const tail = new THREE.Mesh(tailGeometry, horseMaterial);
        tail.position.set(0, 0.7, -0.85);
        tail.rotation.x = 0.5;
        tail.name = 'horseTail';
        group.add(tail);
        
        // 四条马腿
        const legGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.6, 6);
        const legPositions = [
            { x: -0.25, z: 0.35 },
            { x: 0.25, z: 0.35 },
            { x: -0.25, z: -0.35 },
            { x: 0.25, z: -0.35 }
        ];
        legPositions.forEach((pos, i) => {
            const leg = new THREE.Mesh(legGeometry, horseMaterial);
            leg.position.set(pos.x, 0.3, pos.z);
            leg.castShadow = true;
            leg.name = `horseLeg_${i}`;
            group.add(leg);
        });
        
        // 骑手身体（使用玩家颜色）
        const riderBodyGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.25);
        const riderMaterial = new THREE.MeshStandardMaterial({ 
            color: playerColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const riderBody = new THREE.Mesh(riderBodyGeometry, riderMaterial);
        riderBody.position.y = 1.25;
        riderBody.castShadow = true;
        riderBody.name = 'riderBody';
        group.add(riderBody);
        
        // 骑手头
        const riderHeadGeometry = new THREE.SphereGeometry(0.15, 12, 12);
        const riderHeadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFDBB4,
            roughness: 0.8
        });
        const riderHead = new THREE.Mesh(riderHeadGeometry, riderHeadMaterial);
        riderHead.position.y = 1.6;
        riderHead.castShadow = true;
        riderHead.name = 'riderHead';
        group.add(riderHead);
        
        // 帽子（侦察骑兵特征）
        const hatGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.12, 8);
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 1.75;
        hat.name = 'hat';
        group.add(hat);
        
        // 帽檐
        const brimGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12);
        const brim = new THREE.Mesh(brimGeometry, hatMaterial);
        brim.position.y = 1.7;
        brim.name = 'hatBrim';
        group.add(brim);
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

        // 创建 HTML 血条容器
        const healthBarDiv = document.createElement('div');
        healthBarDiv.style.cssText = `
            width: 30px;
            height: 6px;
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
        this.healthBarCSS.position.y = config.bodyHeight * 1.5 + 0.5;
        this.healthBarCSS.name = 'healthBarCSS';
        this.healthBarCSS.visible = false; // 默认隐藏
        this.mesh.add(this.healthBarCSS);

        // 保存引用
        this.healthBarElement = healthBarDiv;
        this.healthBarFill = healthFill;

        // 兼容旧代码
        this.healthBarGroup = this.healthBarCSS;

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

    /**
     * 每帧更新血条可见性 — 单一仲裁点
     * 规则：血量不满 / 鼠标悬停 → 显示，否则隐藏
     */
    updateHealthBarAnimation(deltaTime) {
        if (!this.healthBarCSS) return;
        const shouldShow = this.health < this.maxHealth || this.isSelected || this.isMouseOver;
        if (shouldShow) {
            this.healthBarCSS.visible = true;
        } else {
            this.healthBarCSS.visible = false;
        }
    }

    onHover() {
        super.onHover();
    }

    onHoverOut() {
        super.onHoverOut();
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
        this.updateHealthBarAnimation(deltaTime);

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
        this.stopGathering();
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

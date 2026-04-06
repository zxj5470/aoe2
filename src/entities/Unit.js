import * as THREE from 'three';
import Entity from './Entity.js';

class Unit extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Unit',
            type: 'unit',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 50,
            maxHealth: config.maxHealth || 50,
            owner: config.owner || 'player'
        });

        this.unitType = config.unitType || 'villager';
        this.speed = config.speed || 5;
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
        this.attackCooldown = 1 / this.attackSpeed;
        
        this.selectionRing = null;
        this.healthBar = null;
        
        // 动画状态系统
        this.animationState = 'idle'; // idle, walking, attacking, gathering, dying
        this.animationProgress = 0;
        this.animationSpeed = 5; // 动画播放速度
        
        // 根据单位类型设置外观配置
        this.appearanceConfig = this.getAppearanceConfig();
        
        // 路径相关
        this.path = [];
        this.currentPathIndex = 0;
        this.pathfindingSystem = config.pathfindingSystem || null;
        this.formationSystem = config.formationSystem || null;
    }
    
    /**
     * 根据单位类型获取外观配置
     */
    getAppearanceConfig() {
        const configs = {
            villager: {
                bodyColor: 0x4169E1,
                bodyHeight: 1.2,
                bodyWidth: 0.6,
                headSize: 0.25,
                weaponType: 'none',
                scale: 1.0
            },
            soldier: {
                bodyColor: 0x1E90FF,
                bodyHeight: 1.4,
                bodyWidth: 0.7,
                headSize: 0.25,
                weaponType: 'sword',
                scale: 1.0
            },
            knight: {
                bodyColor: 0x00008B,
                bodyHeight: 1.6,
                bodyWidth: 0.8,
                headSize: 0.3,
                weaponType: 'lance',
                scale: 1.1
            },
            archer: {
                bodyColor: 0x228B22,
                bodyHeight: 1.3,
                bodyWidth: 0.5,
                headSize: 0.25,
                weaponType: 'bow',
                scale: 0.95
            },
            scout: {
                bodyColor: 0x8B4513,
                bodyHeight: 1.1,
                bodyWidth: 0.5,
                headSize: 0.22,
                weaponType: 'none',
                scale: 0.9
            }
        };
        
        return configs[this.unitType] || configs.villager;
    }

    createMesh() {
        // 创建单位模型组
        const group = new THREE.Group();
        
        // 获取外观配置
        const config = this.appearanceConfig;
        const playerColor = this.owner === 'player' ? config.bodyColor : 0xDC143C;
        
        // 身体（根据单位类型调整尺寸）
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
        
        // 头部（根据单位类型调整大小）
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
        
        // 根据单位类型添加武器
        this.createWeapon(group, config);
        
        // 添加腿部（用于动画）
        this.createLegs(group, config);
        
        // 应用单位缩放
        group.scale.set(config.scale, config.scale, config.scale);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        
        // 创建选择环
        this.createSelectionRing();
        
        // 创建生命值条
        this.createHealthBar();
        
        return this.mesh;
    }
    
    /**
     * 根据武器类型创建武器模型
     */
    createWeapon(group, config) {
        const weaponPosition = new THREE.Vector3(config.bodyWidth * 0.5, config.bodyHeight * 0.6, 0);
        
        switch (config.weaponType) {
            case 'sword':
                // 剑
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
                
                // 剑柄
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
                // 长矛
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
                // 弓
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
                // 没有武器，添加工具（村民）
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
    
    /**
     * 创建腿部模型（用于行走动画）
     */
    createLegs(group, config) {
        // 左腿
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
        
        // 右腿
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
        
        // 主选择环
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
        
        // 外部闪烁环
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
    
    /**
     * 创建生命值条
     */
    createHealthBar() {
        const config = this.appearanceConfig;
        
        // 创建生命值条容器
        const healthBarGroup = new THREE.Group();
        healthBarGroup.position.y = config.bodyHeight * 1.5 + 0.5;
        healthBarGroup.name = 'healthBarGroup';
        
        // 背景
        const bgGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2, 0.2);
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
        const healthGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2, 0.15);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.02;
        this.healthBar.name = 'healthBar';
        healthBarGroup.add(this.healthBar);
        
        // 边框
        const borderGeometry = new THREE.PlaneGeometry(config.bodyWidth * 2.05, 0.22);
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
        
        this.updateAction(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCombat(deltaTime);
        this.updateAnimation(deltaTime);
        this.updateHealthBar();
    }
    
    /**
     * 设置动画状态
     */
    setAnimationState(state) {
        if (this.animationState !== state) {
            this.animationState = state;
            this.animationProgress = 0;
        }
    }
    
    /**
     * 更新动画
     */
    updateAnimation(deltaTime) {
        if (!this.mesh) return;
        
        this.animationProgress += deltaTime * this.animationSpeed;
        
        switch (this.animationState) {
            case 'idle':
                this.animateIdle(deltaTime);
                break;
            case 'walking':
                this.animateWalking(deltaTime);
                break;
            case 'attacking':
                this.animateAttacking(deltaTime);
                break;
            case 'gathering':
                this.animateGathering(deltaTime);
                break;
            case 'dying':
                this.animateDying(deltaTime);
                break;
        }
    }
    
    /**
     * 待机动画
     */
    animateIdle(deltaTime) {
        // 轻微的呼吸效果
        const breathOffset = Math.sin(this.animationProgress) * 0.02;
        
        const body = this.mesh.getObjectByName('body');
        if (body) {
            body.position.y = this.appearanceConfig.bodyHeight / 2 + breathOffset;
        }
        
        const head = this.mesh.getObjectByName('head');
        if (head) {
            head.position.y = this.appearanceConfig.bodyHeight + this.appearanceConfig.headSize * 0.8 + breathOffset;
        }
    }
    
    /**
     * 行走动画
     */
    animateWalking(deltaTime) {
        const legSwing = Math.sin(this.animationProgress * 2) * 0.3;
        
        // 腿部摆动
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        
        if (leftLeg) {
            leftLeg.rotation.x = legSwing;
        }
        if (rightLeg) {
            rightLeg.rotation.x = -legSwing;
        }
        
        // 身体轻微上下移动
        const bodyBounce = Math.abs(Math.sin(this.animationProgress * 2)) * 0.05;
        const body = this.mesh.getObjectByName('body');
        if (body) {
            body.position.y = this.appearanceConfig.bodyHeight / 2 + bodyBounce;
        }
    }
    
    /**
     * 攻击动画
     */
    animateAttacking(deltaTime) {
        const attackPhase = this.animationProgress % 2;
        
        const weapon = this.mesh.getObjectByName('weapon');
        const tool = this.mesh.getObjectByName('tool');
        
        // 武器挥动
        if (weapon) {
            if (attackPhase < 1) {
                // 挥起
                weapon.rotation.x = Math.PI / 4 * Math.sin(attackPhase * Math.PI);
            } else {
                // 挥下
                weapon.rotation.x = -Math.PI / 4 * Math.sin((attackPhase - 1) * Math.PI);
            }
        }
        
        if (tool) {
            // 工具挥动（更缓慢）
            if (attackPhase < 1) {
                tool.rotation.z = Math.PI / 6 * Math.sin(attackPhase * Math.PI);
            } else {
                tool.rotation.z = -Math.PI / 6 * Math.sin((attackPhase - 1) * Math.PI);
            }
        }
        
        // 身体前倾
        const body = this.mesh.getObjectByName('body');
        if (body) {
            body.rotation.x = Math.sin(attackPhase * Math.PI) * 0.1;
        }
    }
    
    /**
     * 采集动画
     */
    animateGathering(deltaTime) {
        const gatherPhase = this.animationProgress % 2;
        
        const body = this.mesh.getObjectByName('body');
        const head = this.mesh.getObjectByName('head');
        
        // 身体前后倾斜（模拟采集动作）
        if (body) {
            body.rotation.x = Math.sin(gatherPhase * Math.PI) * 0.2;
        }
        
        if (head) {
            head.rotation.x = Math.sin(gatherPhase * Math.PI) * 0.15;
        }
        
        // 工具上下移动
        const tool = this.mesh.getObjectByName('tool');
        if (tool) {
            tool.position.y = this.appearanceConfig.bodyHeight * 0.6 + Math.sin(gatherPhase * Math.PI) * 0.3;
        }
    }
    
    /**
     * 死亡动画
     */
    animateDying(deltaTime) {
        const deathProgress = Math.min(this.animationProgress / 2, 1);
        
        // 身体倒下
        if (this.mesh) {
            this.mesh.rotation.x = deathProgress * Math.PI / 2;
            this.mesh.position.y -= deathProgress * 0.5;
        }
        
        if (deathProgress >= 1) {
            this.die();
        }
    }

    updateAction(deltaTime) {
        if (this.actionQueue.length > 0) {
            const currentAction = this.actionQueue[0];
            
            switch (currentAction.type) {
                case 'move':
                    this.moveTo(currentAction.target);
                    this.actionQueue.shift();
                    break;
                case 'attack':
                    this.attackEntity(currentAction.target);
                    this.actionQueue.shift();
                    break;
                case 'gather':
                    this.gatherResource(currentAction.target);
                    this.actionQueue.shift();
                    break;
            }
        }
    }

    updateMovement(deltaTime) {
        if (!this.isMoving) {
            this.setAnimationState('idle');
            return;
        }
        
        // 设置移动动画状态
        this.setAnimationState('walking');
        
        let targetPos = this.targetPosition;
        
        // 如果有路径，跟随路径
        if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
            const currentCell = this.path[this.currentPathIndex];
            targetPos = new THREE.Vector3(
                currentCell.x * 2 + 1,
                0,
                currentCell.y * 2 + 1
            );
            
            const distance = this.position.distanceTo(targetPos);
            
            if (distance < 0.5) {
                this.currentPathIndex++;
                if (this.currentPathIndex >= this.path.length) {
                    // 到达最终目标
                    this.isMoving = false;
                    this.path = [];
                    this.currentAction = 'idle';
                    this.setAnimationState('idle');
                    return;
                }
            }
        }
        
        if (targetPos) {
            const direction = new THREE.Vector3()
                .subVectors(targetPos, this.position);
            const distance = direction.length();
            
            if (distance > 0.1) {
                direction.normalize();
                const moveDistance = this.movementSpeed * deltaTime;
                
                if (distance <= moveDistance) {
                    this.position.copy(targetPos);
                    
                    if (this.path.length === 0 || this.currentPathIndex >= this.path.length) {
                        this.isMoving = false;
                        this.targetPosition = null;
                        this.currentAction = 'idle';
                        this.setAnimationState('idle');
                    }
                } else {
                    this.position.add(direction.multiplyScalar(moveDistance));
                }
                
                this.mesh.position.copy(this.position);
                
                // 旋转朝向目标
                const targetRotation = Math.atan2(direction.x, direction.z);
                this.mesh.rotation.y = targetRotation;
            } else {
                this.isMoving = false;
                this.targetPosition = null;
                this.path = [];
                this.currentAction = 'idle';
                this.setAnimationState('idle');
            }
        }
    }

    updateCombat(deltaTime) {
        if (this.isAttacking && this.targetEntity && this.targetEntity.isAlive) {
            const distance = this.position.distanceTo(this.targetEntity.position);
            
            if (distance <= this.attackRange) {
                // 设置攻击动画状态
                this.setAnimationState('attacking');
                
                const currentTime = Date.now() / 1000;
                
                if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.performAttack();
                    this.lastAttackTime = currentTime;
                }
            } else {
                // 移动到攻击范围内
                this.moveTo(this.targetEntity.position);
            }
        }
    }

    moveTo(targetPosition) {
        this.targetPosition = targetPosition.clone();
        this.isMoving = true;
        this.currentAction = 'moving';
        this.isAttacking = false;
        this.targetEntity = null;
        
        // 如果有路径规划系统，计算路径
        if (this.pathfindingSystem) {
            const result = this.pathfindingSystem.findPath(
                this.position.x,
                this.position.z,
                targetPosition.x,
                targetPosition.z
            );
            
            if (result.success) {
                this.path = result.path;
                this.currentPathIndex = 0;
            } else {
                this.path = [];
            }
        }
    }

    attackEntity(targetEntity) {
        if (!targetEntity || !targetEntity.isAlive) return;
        
        this.targetEntity = targetEntity;
        this.isAttacking = true;
        this.currentAction = 'attacking';
        this.isMoving = false;
    }

    performAttack() {
        if (this.targetEntity && this.targetEntity.isAlive) {
            this.targetEntity.takeDamage(this.attackDamage);
            
            // 面向目标
            const direction = new THREE.Vector3()
                .subVectors(this.targetEntity.position, this.position)
                .normalize();
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }
    }

    gatherResource(resourceEntity) {
        // 资源收集逻辑
        this.moveTo(resourceEntity.position);
        // 添加收集动作到队列
        this.actionQueue.push({
            type: 'collect',
            target: resourceEntity
        });
        
        // 设置采集动画状态
        this.setAnimationState('gathering');
    }

    queueAction(action) {
        this.actionQueue.push(action);
    }

    stop() {
        this.isMoving = false;
        this.isAttacking = false;
        this.targetPosition = null;
        this.targetEntity = null;
        this.actionQueue = [];
        this.currentAction = 'idle';
        
        // 重置动画状态
        this.setAnimationState('idle');
        this.path = [];
    }

    updateSelectionVisual() {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
        if (this.selectionGlow) {
            this.selectionGlow.visible = this.isSelected;
        }
        
        // 如果选中，更新选择环颜色和闪烁效果
        if (this.isSelected && this.selectionRing && this.selectionGlow) {
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            
            this.selectionGlow.material.opacity = 0.3 * pulse;
            
            // 根据单位状态改变颜色
            if (this.isAttacking) {
                this.selectionRing.material.color.setHex(0xFF6600); // 橙色
            } else if (this.isMoving) {
                this.selectionRing.material.color.setHex(0x00FF00); // 绿色
            } else {
                this.selectionRing.material.color.setHex(0x00FF00); // 绿色
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
}

export default Unit;
import * as THREE from 'three';
import Entity from './Entity.js';
import { CELL_SIZE, MAP_CONFIG } from '../config.js';

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

        // 资源采集相关
        this.carryAmount = 0; // 当前携带资源量
        this.carryType = null; // 资源类型
        this.currentResource = null; // 当前采集的资源节点
        this.gatherTimer = 0; // 采集计时器
        this.gatherInterval = 2; // 每2秒采集一次
        this.returnTimer = 0; // 返回计时器
        this.returnTime = 20; // 20秒后返回
        this.isReturning = false; // 是否正在返回城镇中心
        this.dropOffPoint = null; // 投放点（城镇中心）

        // 根据单位类型设置外观配置
        this.appearanceConfig = this.getAppearanceConfig();
        
        // 路径相关
        this.path = [];
        this.currentPathIndex = 0;
        this.pathfindingSystem = config.pathfindingSystem || null;
        this.formationSystem = config.formationSystem || null;
        this.game = config.game || null; // 游戏实例引用
        
        // 唯一ID用于路径可视化
        this.id = config.id || `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        
        // 设置userData，让选择系统能够识别实体
        this.mesh.userData = {
            type: 'unit',
            unitType: this.unitType,
            entity: this,
            owner: this.owner
        };
        
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
        
        // 更新资源采集逻辑
        this.updateResourceGathering(deltaTime);
    }

    /**
     * 更新资源采集逻辑
     */
    updateResourceGathering(deltaTime) {
        // 如果没有在采集，直接返回
        if (!this.currentResource || this.isReturning) {
            return;
        }

        // 检查资源是否还存在且还有资源
        if (!this.currentResource.isAlive || this.currentResource.amount <= 0) {
            this.stopGathering();
            return;
        }

        // 检查是否到达资源点
        const distanceToResource = this.position.distanceTo(this.currentResource.position);
        if (distanceToResource > 1.5) {
            // 还在前往资源点的路上
            return;
        }

        // 累加采集计时器
        this.gatherTimer += deltaTime;
        this.returnTimer += deltaTime;

        // 每2秒采集一次
        if (this.gatherTimer >= this.gatherInterval) {
            this.gatherTimer = 0;
            this.carryAmount += 1;
            
            console.log(`[村民采集] 携带资源: ${this.carryAmount}, 类型: ${this.carryType}`);
        }

        // 20秒后自动返回城镇中心
        if (this.returnTimer >= this.returnTime) {
            console.log('[村民采集] 20秒已到，开始返回城镇中心');
            this.returnToTownCenter();
        }
    }

    /**
     * 返回城镇中心
     */
    returnToTownCenter() {
        if (!this.dropOffPoint) {
            console.warn('[村民采集] 没有投放点，无法返回');
            this.stopGathering();
            return;
        }

        this.isReturning = true;
        this.currentAction = 'returning';
        
        // 移动到城镇中心
        const townCenterPos = this.dropOffPoint.position;
        this.moveTo(new THREE.Vector3(townCenterPos.x, 0, townCenterPos.z));
    }

    /**
     * 停止采集
     */
    stopGathering() {
        this.currentResource = null;
        this.carryType = null;
        this.carryAmount = 0;
        this.gatherTimer = 0;
        this.returnTimer = 0;
        this.isReturning = false;
        this.dropOffPoint = null;
        this.currentAction = 'idle';
        this.setAnimationState('idle');
    }

    /**
     * 交付资源到城镇中心
     */
    deliverResources() {
        console.log(`[村民采集] 尝试交付资源 - 携带量: ${this.carryAmount}, 类型: ${this.carryType}`);
        
        if (this.carryAmount <= 0) {
            console.log('[村民采集] 没有携带资源，无需交付');
            this.stopGathering();
            return;
        }

        const deliveredAmount = this.carryAmount;
        const resourceType = this.carryType;

        console.log(`[村民采集] 交付资源: ${deliveredAmount} ${resourceType}`);

        // 获取游戏实例的ResourceManager并添加资源
        if (this.game && this.game.resourceManager) {
            this.game.resourceManager.addResource(resourceType, deliveredAmount);
            console.log(`[村民采集] 总资源增加: ${deliveredAmount} ${resourceType}`);
            
            // 更新HUD显示
            if (this.game.hud) {
                this.game.hud.updateResourceDisplay();
            }
        } else {
            console.error('[村民采集] 无法访问ResourceManager', {
                hasGame: !!this.game,
                hasResourceManager: this.game ? !!this.game.resourceManager : false
            });
        }

        // 重置采集状态
        this.stopGathering();
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
                    this.gatherResource(currentAction.target, currentAction.dropOffPoint);
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
            const gs = this.pathfindingSystem.grid;
            const cellSize = gs.cellSize;
            const halfW = gs.width * cellSize / 2;
            const halfH = gs.height * cellSize / 2;
            targetPos = new THREE.Vector3(
                currentCell.x * cellSize + cellSize / 2 - halfW,
                0,
                currentCell.y * cellSize + cellSize / 2 - halfH
            );
            console.log(`[Unit] 正在跟随路径: 点 ${this.currentPathIndex}/${this.path.length} → (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
            
            const distance = this.position.distanceTo(targetPos);
            
            if (distance < 0.5) {
                this.currentPathIndex++;
                console.log(`[Unit] 到达路径点 ${this.currentPathIndex - 1}，下一个是 ${this.currentPathIndex}`);
                if (this.currentPathIndex >= this.path.length) {
                    // 到达最终目标
                    console.log(`[村民移动] 到达目标位置 - isReturning: ${this.isReturning}, carryAmount: ${this.carryAmount}`);

                    // 如果是返回城镇中心，检查距离并交付资源
                    // 注意：城镇中心是4x4网格的大型建筑，使用更大的到达判定距离
                    if (this.isReturning && this.dropOffPoint) {
                        const distanceToTownCenter = this.position.distanceTo(this.dropOffPoint.position);
                        const townCenterArrivalDistance = 3; // 城镇中心较大（4x4网格），3单位距离即可
                        
                        console.log(`[村民移动] 距离城镇中心: ${distanceToTownCenter.toFixed(1)}, 判定距离: ${townCenterArrivalDistance}`);
                        
                        if (distanceToTownCenter <= townCenterArrivalDistance) {
                            console.log('[村民移动] 已到达城镇中心，开始交付资源');
                            this.deliverResources();
                        }
                    }

                    // 到达最终目标
                    this.isMoving = false;
                    this.path = [];
                    this.currentAction = 'idle';
                    this.setAnimationState('idle');
                    
                    // 清除路径可视化
                    if (this.game && this.game.scene) {
                        this.game.scene.clearPathVisualizer(this.id);
                    }
                    return;
                }
            }
        } else {
            console.log(`[Unit] 没有可用路径，直接走直线到 (${targetPos.x.toFixed(1)}, ${targetPos.z.toFixed(1)})`);
        }
        
        if (targetPos) {
            const direction = new THREE.Vector3()
                .subVectors(targetPos, this.position);
            const distance = direction.length();
            
            if (distance > 0.1) {
                direction.normalize();
                const moveDistance = this.movementSpeed * deltaTime;
                
                let newPosition;
                if (distance <= moveDistance) {
                    newPosition = targetPos.clone();

                    if (this.path.length === 0 || this.currentPathIndex >= this.path.length) {
                        this.isMoving = false;
                        this.targetPosition = null;

                        // 如果是返回城镇中心，检查距离并交付资源
                        if (this.isReturning && this.dropOffPoint) {
                            const distanceToTownCenter = this.position.distanceTo(this.dropOffPoint.position);
                            const townCenterArrivalDistance = 3;
                            
                            console.log(`[村民移动-无路径] 距离城镇中心: ${distanceToTownCenter.toFixed(1)}, 判定距离: ${townCenterArrivalDistance}`);
                            
                            if (distanceToTownCenter <= townCenterArrivalDistance) {
                                console.log('[村民移动-无路径] 已到达城镇中心，开始交付资源');
                                this.deliverResources();
                            }
                        }

                        // 如果有采集目标，保持采集状态
                        if (!this.currentResource) {
                            this.currentAction = 'idle';
                            this.setAnimationState('idle');
                        }
                    }
                } else {
                    newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));
                }
                
                // 限制位置在地图边界内
                const mapWidth = this.pathfindingSystem ? this.pathfindingSystem.grid.width * this.pathfindingSystem.grid.cellSize : MAP_CONFIG.width * MAP_CONFIG.cellSize;
                const mapHeight = this.pathfindingSystem ? this.pathfindingSystem.grid.height * this.pathfindingSystem.grid.cellSize : MAP_CONFIG.height * MAP_CONFIG.cellSize;
                const cellSize = this.pathfindingSystem ? this.pathfindingSystem.grid.cellSize : CELL_SIZE;
                const minX = -mapWidth / 2 + cellSize;
                const maxX = mapWidth / 2 - cellSize;
                const minZ = -mapHeight / 2 + cellSize;
                const maxZ = mapHeight / 2 - cellSize;
                
                newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x));
                newPosition.z = Math.max(minZ, Math.min(maxZ, newPosition.z));
                
                this.position.copy(newPosition);
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
        // 限制目标位置在地图边界内
        const mapWidth = this.pathfindingSystem ? this.pathfindingSystem.grid.width * this.pathfindingSystem.grid.cellSize : MAP_CONFIG.width * MAP_CONFIG.cellSize;
        const mapHeight = this.pathfindingSystem ? this.pathfindingSystem.grid.height * this.pathfindingSystem.grid.cellSize : MAP_CONFIG.height * MAP_CONFIG.cellSize;
        const cellSize = this.pathfindingSystem ? this.pathfindingSystem.grid.cellSize : CELL_SIZE;

        // 地图坐标范围是[-100, 100]，所以需要转换
        const minX = -mapWidth / 2 + cellSize;
        const maxX = mapWidth / 2 - cellSize;
        const minZ = -mapHeight / 2 + cellSize;
        const maxZ = mapHeight / 2 - cellSize;
        
        // 限制目标位置
        targetPosition.x = Math.max(minX, Math.min(maxX, targetPosition.x));
        targetPosition.z = Math.max(minZ, Math.min(maxZ, targetPosition.z));
        
        this.targetPosition = targetPosition.clone();
        this.isMoving = true;
        this.currentAction = 'moving';
        this.isAttacking = false;
        this.targetEntity = null;
        
        // 如果有路径规划系统，计算路径
        if (this.pathfindingSystem) {
            console.log(`[Unit] 开始寻路: 起点 (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) → 终点 (${targetPosition.x.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
            const result = this.pathfindingSystem.findPath(
                this.position.x,
                this.position.z,
                targetPosition.x,
                targetPosition.z
            );
            
            if (result.success) {
                console.log(`[Unit] 找到路径! 原始路径长度: ${result.path.length} 个点`);
                // 打印原始路径点信息
                result.path.forEach((cell, i) => console.log(`[Unit] 原始点 ${i}: (${cell.x}, ${cell.y})`));
                
                // 平滑路径
                this.path = this.pathfindingSystem.smoothPath(result.path);
                this.currentPathIndex = 0;
                console.log(`[Unit] 平滑后路径长度: ${this.path.length} 个点`);
                
                // 可视化路径
                if (this.game && this.game.scene && this.pathfindingSystem && this.pathfindingSystem.grid) {
                    this.game.scene.visualizePath(this.id, this.path, this.pathfindingSystem.grid);
                }
            } else {
                this.path = [];
                console.log('[Unit] 未找到路径，将直线移动');
                
                // 清除路径可视化
                if (this.game && this.game.scene) {
                    this.game.scene.clearPathVisualizer(this.id);
                }
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

    gatherResource(resourceEntity, dropOffPoint = null) {
        // 资源收集逻辑 - 移动到资源点并开始采集
        if (!resourceEntity || !resourceEntity.userData) return;

        // 检查资源是否还有
        if (resourceEntity.userData.resourceAmount <= 0) {
            return;
        }

        // 设置当前采集目标
        this.currentResource = resourceEntity;
        this.carryType = resourceEntity.userData.resourceType;
        if (this.carryAmount === undefined) this.carryAmount = 0;
        
        // 设置投放点（城镇中心）
        if (dropOffPoint) {
            this.dropOffPoint = dropOffPoint;
        }
        
        console.log(`[村民采集] 开始采集 ${this.carryType}，投放点: ${this.dropOffPoint ? '已设置' : '未设置'}`);

        // 移动到资源点
        this.moveTo(resourceEntity.position);

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
        
        // 清除路径可视化
        if (this.game && this.game.scene) {
            this.game.scene.clearPathVisualizer(this.id);
        }
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

    /**
     * 创建碰撞体积（单位较小，0.5x0.5）
     */
    createCollisionBox() {
        const width = 0.5; // 单位碰撞体
        const depth = 0.5;
        const height = 2;

        this.collisionBox = {
            minX: this.position.x - width / 2,
            maxX: this.position.x + width / 2,
            minZ: this.position.z - depth / 2,
            maxZ: this.position.z + depth / 2,
            minY: 0,
            maxY: height,
            width: width,
            depth: depth,
            height: height,
            center: this.position.clone()
        };

        return this.collisionBox;
    }

    /**
     * 更新碰撞体积位置
     */
    updateCollisionBox() {
        if (this.collisionBox) {
            const width = this.collisionBox.width;
            const depth = this.collisionBox.depth;
            
            this.collisionBox.minX = this.position.x - width / 2;
            this.collisionBox.maxX = this.position.x + width / 2;
            this.collisionBox.minZ = this.position.z - depth / 2;
            this.collisionBox.maxZ = this.position.z + depth / 2;
            this.collisionBox.center.copy(this.position);
        }
    }

    /**
     * 获取碰撞体积
     */
    getCollisionBox() {
        if (!this.collisionBox) {
            this.createCollisionBox();
        }
        return this.collisionBox;
    }

    /**
     * 检测点是否在碰撞体积内
     */
    containsPoint(point) {
        const box = this.getCollisionBox();
        return (
            point.x >= box.minX &&
            point.x <= box.maxX &&
            point.z >= box.minZ &&
            point.z <= box.maxZ
        );
    }

    /**
     * 检测是否与另一个碰撞体积相交
     */
    intersectsBox(otherBox) {
        const box = this.getCollisionBox();
        return (
            box.minX < otherBox.maxX &&
            box.maxX > otherBox.minX &&
            box.minZ < otherBox.maxZ &&
            box.maxZ > otherBox.minZ
        );
    }

    /**
     * 获取单位占用的网格坐标（单位很小，只占一个格子）
     */
    getOccupiedGridCells(cellSize = CELL_SIZE) {
        const cells = [];
        const gridX = Math.floor(this.position.x / cellSize);
        const gridZ = Math.floor(this.position.z / cellSize);

        cells.push({ x: gridX, z: gridZ });

        return cells;
    }

    /**
     * 创建碰撞体积可视化（调试用）
     */
    createCollisionVisual(color = 0x00FF00) {
        if (!this.collisionBox) {
            this.createCollisionBox();
        }

        const box = this.collisionBox;
        const width = box.width;
        const depth = box.depth;
        const height = box.maxY - box.minY;

        // 创建线框盒子
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: 2,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(edges, material);
        
        wireframe.position.set(
            box.center.x,
            height / 2,
            box.center.z
        );
        
        wireframe.name = 'collisionVisual';
        this.collisionVisual = wireframe;
        
        return wireframe;
    }

    /**
     * 更新碰撞体积可视化位置
     */
    updateCollisionVisual() {
        if (this.collisionVisual) {
            this.updateCollisionBox();
            const box = this.collisionBox;
            const height = box.maxY - box.minY;
            
            this.collisionVisual.position.set(
                box.center.x,
                height / 2,
                box.center.z
            );
        }
    }

    /**
     * 显示/隐藏碰撞体积可视化
     */
    toggleCollisionVisual(visible) {
        if (this.collisionVisual) {
            this.collisionVisual.visible = visible;
            
            // 如果可视化不存在但需要显示，则创建
            if (visible && !this.collisionVisual.parent && this.mesh) {
                this.mesh.add(this.collisionVisual);
            }
        } else if (visible) {
            const visual = this.createCollisionVisual();
            if (this.mesh) {
                this.mesh.add(visual);
            }
        }
    }
}

export default Unit;
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
        
        // 路径相关
        this.path = [];
        this.currentPathIndex = 0;
        this.pathfindingSystem = config.pathfindingSystem || null;
        this.formationSystem = config.formationSystem || null;
    }

    createMesh() {
        // 创建单位模型（简单的人形模型）
        const group = new THREE.Group();
        
        // 身体
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.owner === 'player' ? 0x4169E1 : 0xDC143C 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        
        // 头
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFDBB4 
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        group.add(head);
        
        // 武器（简化）
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513 
        });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.4, 0.8, 0);
        weapon.castShadow = true;
        group.add(weapon);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        
        // 创建选择环
        this.createSelectionRing();
        
        return this.mesh;
    }

    createSelectionRing() {
        const ringGeometry = new THREE.RingGeometry(0.8, 1, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionRing.rotation.x = -Math.PI / 2;
        this.selectionRing.position.y = 0.05;
        this.selectionRing.visible = false;
        this.mesh.add(this.selectionRing);
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateAction(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCombat(deltaTime);
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
        if (!this.isMoving) return;
        
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
            }
        }
    }

    updateCombat(deltaTime) {
        if (this.isAttacking && this.targetEntity && this.targetEntity.isAlive) {
            const distance = this.position.distanceTo(this.targetEntity.position);
            
            if (distance <= this.attackRange) {
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
    }

    updateSelectionVisual() {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
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
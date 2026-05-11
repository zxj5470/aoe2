import * as THREE from 'three';
import { OWNER_TO_PLAYER_ID } from '../config.js';

class CombatSystem {
    constructor() {
        this.combatants = [];
        this.projectiles = [];
        
        // 单位克制关系
        this.damageModifiers = {
            swordsman: {
                archer: 1.5,
                spearman: 0.8,
                cavalry: 1.2,
                building: 0.5
            },
            spearman: {
                cavalry: 2.0,
                swordsman: 1.0,
                archer: 0.8,
                building: 0.3
            },
            archer: {
                swordsman: 1.0,
                spearman: 1.0,
                cavalry: 0.5,
                building: 0.2
            },
            cavalry: {
                archer: 1.5,
                spearman: 0.3,
                swordsman: 1.2,
                building: 0.8
            }
        };
        
        // 建筑攻击类型
        this.buildingDamageTypes = {
            tower: { damage: 10, range: 8, attackSpeed: 1 },
            castle: { damage: 15, range: 10, attackSpeed: 1.5 }
        };
    }

    registerCombatant(entity) {
        if (!this.combatants.includes(entity)) {
            this.combatants.push(entity);
        }
    }

    unregisterCombatant(entity) {
        const index = this.combatants.indexOf(entity);
        if (index > -1) {
            this.combatants.splice(index, 1);
        }
    }

    update(deltaTime) {
        this.updateCombatants(deltaTime);
        this.updateProjectiles(deltaTime);
        this.cleanupDeadEntities();
    }

    updateCombatants(deltaTime) {
        for (const combatant of this.combatants) {
            if (!combatant.isAlive) continue;
            
            if (combatant.isAttacking && combatant.targetEntity) {
                this.processAttack(combatant, deltaTime);
            }
        }
    }

    processAttack(attacker, deltaTime) {
        const target = attacker.targetEntity;
        
        if (!target || !target.isAlive) {
            attacker.isAttacking = false;
            attacker.targetEntity = null;
            return;
        }
        
        const distance = attacker.position.distanceTo(target.position);
        
        if (distance > attacker.attackRange) {
            // 移动到攻击范围内
            attacker.moveTo(target.position, { preserveAttack: true });
            return;
        }
        
        const currentTime = Date.now() / 1000;
        
        if (currentTime - attacker.lastAttackTime >= attacker.attackCooldown) {
            this.performAttack(attacker, target);
            attacker.lastAttackTime = currentTime;
        }
    }

    performAttack(attacker, target) {
        let damage = attacker.attackDamage;
        
        // 应用单位克制
        if (attacker.unitType && target.unitType) {
            const attackerType = attacker.unitType;
            const targetType = target.unitType;
            
            if (this.damageModifiers[attackerType] && 
                this.damageModifiers[attackerType][targetType]) {
                damage *= this.damageModifiers[attackerType][targetType];
            }
        }
        
        // 应用护甲
        damage = Math.max(1, damage - target.armor);
        
        // 造成伤害
        target.takeDamage(damage);
        
        // 创建攻击效果
        this.createAttackEffect(attacker, target);
    }

    createAttackEffect(attacker, target) {
        // 简单的攻击效果（可以扩展为粒子效果）
        const effectGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8
        });
        
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(target.position);
        effect.position.y = 1;
        
        // 添加到场景并设置自动销毁
        this.projectiles.push({
            mesh: effect,
            lifetime: 0.2,
            maxLifetime: 0.2
        });
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.lifetime -= deltaTime;
            
            if (projectile.lifetime <= 0) {
                // 移除弹丸
                if (projectile.mesh.parent) {
                    projectile.mesh.parent.remove(projectile.mesh);
                }
                projectile.mesh.geometry.dispose();
                projectile.mesh.material.dispose();
                
                this.projectiles.splice(i, 1);
            } else {
                // 更新效果
                const opacity = projectile.lifetime / projectile.maxLifetime;
                projectile.mesh.material.opacity = opacity;
            }
        }
    }

    cleanupDeadEntities() {
        for (const combatant of this.combatants) {
            if (!combatant.isAlive) {
                this.unregisterCombatant(combatant);
            }
        }
    }

    findTarget(attacker, range = attacker.sightRange) {
        let closestTarget = null;
        let closestDistance = range;
        
        for (const combatant of this.combatants) {
            if (combatant === attacker || !combatant.isAlive) continue;
            
            // 检查是否是同阵营（通过玩家ID映射比较，而非直接比较owner字符串）
            const attackerPlayerId = OWNER_TO_PLAYER_ID[attacker.owner];
            const targetPlayerId = OWNER_TO_PLAYER_ID[combatant.owner];
            if (attackerPlayerId === targetPlayerId) continue;
            
            const distance = attacker.position.distanceTo(combatant.position);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = combatant;
            }
        }
        
        return closestTarget;
    }

    getDamageModifier(attackerType, targetType) {
        if (this.damageModifiers[attackerType] && 
            this.damageModifiers[attackerType][targetType]) {
            return this.damageModifiers[attackerType][targetType];
        }
        return 1.0;
    }

    calculateDamage(attacker, target) {
        let damage = attacker.attackDamage;
        
        // 应用单位克制
        if (attacker.unitType && target.unitType) {
            damage *= this.getDamageModifier(attacker.unitType, target.unitType);
        }
        
        // 应用护甲
        damage = Math.max(1, damage - target.armor);
        
        return damage;
    }

    createProjectile(attacker, target) {
        // 创建投射物（箭矢、魔法弹等）
        const projectileGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0x8B4513
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(attacker.position);
        projectile.position.y = 1.5;
        
        // 计算方向
        const direction = new THREE.Vector3()
            .subVectors(target.position, attacker.position)
            .normalize();
        
        projectile.rotation.z = Math.PI / 2;
        projectile.rotation.y = Math.atan2(direction.x, direction.z);
        
        this.projectiles.push({
            mesh: projectile,
            direction: direction,
            speed: 30,
            target: target,
            damage: attacker.attackDamage,
            lifetime: 2,
            maxLifetime: 2
        });
        
        return projectile;
    }

    getCombatStats(entity) {
        return {
            damage: entity.attackDamage,
            range: entity.attackRange,
            attackSpeed: entity.attackSpeed,
            armor: entity.armor
        };
    }

    reset() {
        this.combatants = [];
        
        // 清除所有弹丸
        for (const projectile of this.projectiles) {
            if (projectile.mesh.parent) {
                projectile.mesh.parent.remove(projectile.mesh);
            }
            projectile.mesh.geometry.dispose();
            projectile.mesh.material.dispose();
        }
        
        this.projectiles = [];
    }
}

export default CombatSystem;

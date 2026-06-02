import * as THREE from 'three';

class UnitCombat {
    constructor(unit) {
        this.unit = unit;
    }

    attackEntity(targetEntity) {
        if (!targetEntity || !targetEntity.isAlive) return;

        this.unit.targetEntity = targetEntity;
        this.unit.isAttacking = true;
        this.unit.currentAction = 'attacking';
        this.unit.isMoving = false;
        this.unit.currentResource = null;
        this.unit.isReturning = false;
        this.unit.dropOffPoint = null;
    }

    updateCombat(deltaTime) {
        if (!this.unit.isAttacking) return;

        if (!this.unit.targetEntity || !this.unit.targetEntity.isAlive) {
            this.unit.isAttacking = false;
            this.unit.targetEntity = null;
            this.unit.currentAction = 'idle';
            return;
        }

        const target = this.unit.targetEntity;
        const distance = this.unit.position.distanceTo(target.position);

        if (this.shouldUseHuntingAttack(target)) {
            const huntingRange = this.unit.huntingAttackRange || 4;
            if (distance > huntingRange) {
                const approach = this.getApproachPosition(target, huntingRange * 0.85);
                if (this.shouldUpdateHuntingApproach(approach)) {
                    this.unit._huntingApproachTarget = approach.clone();
                    this.unit.moveTo(approach, { preserveAttack: true });
                }
                return;
            }

            this.unit._huntingApproachTarget = null;
            this.unit.isMoving = false;
            this.unit.setAnimationState('attacking');
            this.faceTarget(target);
            this.performHuntingAttack(target);
            return;
        }

        if (distance <= this.unit.attackRange) {
            this.unit.setAnimationState('attacking');
            this.faceTarget(target);
        }
    }

    shouldUpdateHuntingApproach(approach) {
        if (!this.unit.isMoving) return true;
        if (!this.unit._huntingApproachTarget) return true;
        return this.unit._huntingApproachTarget.distanceToSquared(approach) > 0.25;
    }

    shouldUseHuntingAttack(targetEntity) {
        return this.unit.unitType === 'villager' &&
            targetEntity?.type === 'resource' &&
            targetEntity.isBoar &&
            targetEntity.isHuntableBoar?.();
    }

    getApproachPosition(targetEntity, desiredDistance) {
        const direction = new THREE.Vector3()
            .subVectors(this.unit.position, targetEntity.position);

        if (direction.lengthSq() <= 0.001) {
            direction.set(1, 0, 0);
        }

        direction.normalize();
        return targetEntity.position.clone().add(direction.multiplyScalar(desiredDistance));
    }

    performHuntingAttack(targetEntity) {
        const currentTime = Date.now() / 1000;
        if (currentTime - this.unit.lastAttackTime < this.unit.attackCooldown) return;

        const damage = this.unit.huntingAttackDamage || this.unit.attackDamage;
        targetEntity.takeDamage(damage, this.unit);
        this.createHuntingProjectile(targetEntity);
        this.unit.lastAttackTime = currentTime;

        if (!targetEntity.isHuntableBoar?.()) {
            this.unit.isAttacking = false;
            this.unit.targetEntity = null;
            this.unit.currentAction = 'idle';
        }
    }

    createHuntingProjectile(targetEntity) {
        const scene = this.unit.game?.scene?.getScene?.();
        if (!scene) return;

        const direction = new THREE.Vector3()
            .subVectors(targetEntity.position, this.unit.position)
            .normalize();
        const length = Math.min(1.2, this.unit.position.distanceTo(targetEntity.position));
        const geometry = new THREE.CylinderGeometry(0.035, 0.035, length, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x5A3A1E });
        const projectile = new THREE.Mesh(geometry, material);

        projectile.position.copy(this.unit.position).add(targetEntity.position).multiplyScalar(0.5);
        projectile.position.y = 1.1;
        projectile.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        scene.add(projectile);

        setTimeout(() => {
            if (projectile.parent) projectile.parent.remove(projectile);
            projectile.geometry.dispose();
            projectile.material.dispose();
        }, 120);
    }

    faceTarget(targetEntity) {
        if (targetEntity && targetEntity.isAlive) {
            const direction = new THREE.Vector3()
                .subVectors(targetEntity.position, this.unit.position)
                .normalize();
            this.unit.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }
    }
}

export default UnitCombat;

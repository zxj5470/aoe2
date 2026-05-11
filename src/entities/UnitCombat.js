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
    }

    performAttack() {
        if (this.unit.targetEntity && this.unit.targetEntity.isAlive) {
            const direction = new THREE.Vector3()
                .subVectors(this.unit.targetEntity.position, this.unit.position)
                .normalize();
            this.unit.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }
    }

    updateCombat(deltaTime) {
        if (!this.unit.isAttacking) return;

        if (!this.unit.targetEntity || !this.unit.targetEntity.isAlive) {
            this.unit.isAttacking = false;
            this.unit.targetEntity = null;
            this.unit.currentAction = 'idle';
            return;
        }

        const distance = this.unit.position.distanceTo(this.unit.targetEntity.position);

        if (distance <= this.unit.attackRange) {
            this.unit.setAnimationState('attacking');
            this.performAttack();
        } else {
            this.unit.moveTo(this.unit.targetEntity.position, { preserveAttack: true });
        }
    }
}

export default UnitCombat;

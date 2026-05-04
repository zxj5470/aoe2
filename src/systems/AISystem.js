import * as THREE from 'three';

class AISystem {
    constructor(game) {
        this.game = game;
        this.aiUnits = [];
        this.updateInterval = 0.5;
        this.timeSinceLastUpdate = 0;
    }

    registerUnit(unit) {
        if (!this.aiUnits.includes(unit)) {
            unit.aiState = unit.aiState || 'idle';
            unit.aiTarget = unit.aiTarget || null;
            this.aiUnits.push(unit);
        }
    }

    unregisterUnit(unit) {
        const index = this.aiUnits.indexOf(unit);
        if (index > -1) {
            this.aiUnits.splice(index, 1);
        }
    }

    update(deltaTime) {
        this.timeSinceLastUpdate += deltaTime;
        if (this.timeSinceLastUpdate < this.updateInterval) return;
        this.timeSinceLastUpdate = 0;

        this.aiUnits = this.aiUnits.filter(u => u.isAlive);

        for (const unit of this.aiUnits) {
            if (!unit.isAlive) continue;
            this.updateUnitAI(unit);
        }
    }

    updateUnitAI(unit) {
        switch (unit.aiState) {
            case 'idle':
                this.checkForThreats(unit);
                break;
            case 'chase':
                this.updateChase(unit);
                break;
            case 'attack':
                this.updateAttack(unit);
                break;
            case 'flee':
                this.updateFlee(unit);
                break;
            default:
                unit.aiState = 'idle';
                break;
        }
    }

    checkForThreats(unit) {
        if (!this.game.combatSystem) return;

        const closestEnemy = this.game.combatSystem.findTarget(unit, unit.sightRange);
        if (closestEnemy) {
            unit.aiTarget = closestEnemy;
            unit.aiState = 'chase';
        }
    }

    updateChase(unit) {
        if (!unit.aiTarget || !unit.aiTarget.isAlive) {
            unit.aiState = 'idle';
            unit.aiTarget = null;
            unit.isAttacking = false;
            unit.targetEntity = null;
            return;
        }

        const distance = new THREE.Vector3(
            unit.position.x - unit.aiTarget.position.x,
            0,
            unit.position.z - unit.aiTarget.position.z
        ).length();

        if (distance <= unit.attackRange) {
            unit.aiState = 'attack';
            unit.isAttacking = true;
            unit.targetEntity = unit.aiTarget;
        } else if (distance <= unit.sightRange * 1.5) {
            unit.moveTo(unit.aiTarget.position);
        } else {
            unit.aiState = 'idle';
            unit.aiTarget = null;
        }
    }

    updateAttack(unit) {
        if (!unit.aiTarget || !unit.aiTarget.isAlive) {
            unit.aiState = 'idle';
            unit.isAttacking = false;
            unit.targetEntity = null;
            unit.aiTarget = null;
            return;
        }

        const distance = new THREE.Vector3(
            unit.position.x - unit.aiTarget.position.x,
            0,
            unit.position.z - unit.aiTarget.position.z
        ).length();

        if (distance > unit.attackRange * 1.3) {
            unit.aiState = 'chase';
            unit.isAttacking = false;
            unit.targetEntity = null;
        }

        if (unit.health < unit.maxHealth * 0.2) {
            unit.aiState = 'flee';
            unit.isAttacking = false;
            unit.targetEntity = null;
        }
    }

    updateFlee(unit) {
        if (!unit.aiTarget || !unit.aiTarget.isAlive) {
            unit.aiState = 'idle';
            unit.aiTarget = null;
            return;
        }

        if (unit.health >= unit.maxHealth * 0.5) {
            unit.aiState = 'idle';
            return;
        }

        const fleeDir = new THREE.Vector3(
            unit.position.x - unit.aiTarget.position.x,
            0,
            unit.position.z - unit.aiTarget.position.z
        ).normalize();

        const fleeTarget = new THREE.Vector3(
            unit.position.x + fleeDir.x * 15,
            0,
            unit.position.z + fleeDir.z * 15
        );

        unit.moveTo(fleeTarget);
    }

    reset() {
        this.aiUnits = [];
        this.timeSinceLastUpdate = 0;
    }
}

export default AISystem;

import * as THREE from 'three';

class Entity {
    constructor(config) {
        this.id = this.generateId();
        this.name = config.name || 'Entity';
        this.type = config.type || 'entity';
        this.mesh = null;
        this.position = new THREE.Vector3(
            config.x || 0,
            config.y || 0,
            config.z || 0
        );
        this.rotation = config.rotation || 0;
        this.scale = config.scale || 1;
        this.health = config.health || 100;
        this.maxHealth = config.maxHealth || 100;
        this.isSelected = false;
        this.owner = config.owner || 'player';
        this.isAlive = true;
    }

    generateId() {
        return 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createMesh() {
        // 子类实现具体的网格创建
        return null;
    }

    update(deltaTime) {
        // 子类实现具体的更新逻辑
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    setRotation(rotation) {
        this.rotation = rotation;
        if (this.mesh) {
            this.mesh.rotation.y = rotation;
        }
    }

    setScale(scale) {
        this.scale = scale;
        if (this.mesh) {
            this.mesh.scale.set(scale, scale, scale);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    die() {
        this.isAlive = false;
        this.isSelected = false;
        if (this.mesh) {
            this.mesh.userData.dead = true;
        }
    }

    select() {
        this.isSelected = true;
        this.updateSelectionVisual();
    }

    deselect() {
        this.isSelected = false;
        this.updateSelectionVisual();
    }

    updateSelectionVisual() {
        // 子类实现选中视觉效果
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position.clone();
    }

    getHealth() {
        return this.health;
    }

    getMaxHealth() {
        return this.maxHealth;
    }

    getHealthPercentage() {
        return this.health / this.maxHealth;
    }

    getOwner() {
        return this.owner;
    }

    isPlayerOwned() {
        return this.owner === 'player';
    }

    isEnemy() {
        return this.owner === 'enemy';
    }

    destroy() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => material.dispose());
            } else {
                this.mesh.material.dispose();
            }
        }
    }
}

export default Entity;
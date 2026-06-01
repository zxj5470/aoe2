import * as THREE from 'three';
import Entity from './Entity.js';
import RomanNumeralCanvas from './RomanNumeralCanvas.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor, OWNER_TO_PLAYER_ID } from '../config.js';
import BuildingBase from './BuildingBase.js';
import BuildingConstruction from './BuildingConstruction.js';
import BuildingProduction from './BuildingProduction.js';
import BuildingCollision from './BuildingCollision.js';

class Building extends BuildingBase {
    constructor(config) {
        super(config);
        
        this.construction = new BuildingConstruction(this);
        this.production = new BuildingProduction(this);
        this.collision = new BuildingCollision(this);
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        this.construction.updateConstruction(deltaTime);
        this.production.updateProduction(deltaTime);

        // 防御建筑自动攻击
        if (this.buildingFeatures.canAttack && !this.isUnderConstruction) {
            this.updateDefensiveAttack(deltaTime);
        }

        // 更新血条渐隐动画
        this.updateHealthBarAnimation(deltaTime);

        if (this.isSelected) {
            this.updateSelectionVisual(deltaTime);
        }
    }

    updateDefensiveAttack(deltaTime) {
        const currentTime = Date.now() / 1000;

        // 如果有目标且目标存活，检查是否在攻击范围内
        if (this.targetEntity && this.targetEntity.isAlive) {
            if (this.isPlayerOwned() && !this._game?.fogOfWarSystem?.isEntityVisible(this.targetEntity)) {
                this.targetEntity = null;
                this.isAttacking = false;
                return;
            }

            const distance = this.position.distanceTo(this.targetEntity.position);

            if (distance > this.attackRange) {
                // 目标超出攻击范围，清除目标
                this.targetEntity = null;
                this.isAttacking = false;
            } else if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                // 攻击冷却完成，执行攻击
                this.performDefensiveAttack(currentTime);
            }
        } else {
            // 没有目标或目标已死亡，寻找新目标
            this.findDefensiveTarget();
        }
    }

    findDefensiveTarget() {
        if (!this._game || !this._game.combatSystem) return;

        const closestEnemy = this._game.combatSystem.findTarget(this, this.attackRange);
        if (closestEnemy) {
            this.targetEntity = closestEnemy;
            this.isAttacking = true;
        }
    }

    performDefensiveAttack(currentTime) {
        if (!this.targetEntity || !this.targetEntity.isAlive) return;

        // 计算伤害
        let damage = this.attackDamage;

        // 应用护甲
        damage = Math.max(1, damage - (this.targetEntity.armor || 0));

        // 造成伤害
        this.targetEntity.takeDamage(damage);

        // 更新攻击时间
        this.lastAttackTime = currentTime;

        // 创建攻击效果
        this.createDefensiveAttackEffect();

        console.log(`[防御建筑] ${this.name} 攻击 ${this.targetEntity.name}，造成 ${damage} 点伤害`);
    }

    createDefensiveAttackEffect() {
        if (!this._game || !this._game.scene) return;

        // 创建简单的攻击效果（黄色闪光）
        const effectGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8
        });

        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(this.position);
        effect.position.y = this.height;

        this._game.scene.add(effect);

        // 自动移除效果
        setTimeout(() => {
            if (this._game && this._game.scene) {
                this._game.scene.remove(effect);
                effect.geometry.dispose();
                effect.material.dispose();
            }
        }, 200);
    }

    updateConstruction(deltaTime) {
        this.construction.updateConstruction(deltaTime);
    }

    updateProduction(deltaTime) {
        this.production.updateProduction(deltaTime);
    }

    onConstructionComplete() {
        this.construction.onConstructionComplete();
    }

    addBuilder(villager) {
        this.construction.addBuilder(villager);
    }

    removeBuilder(villager) {
        this.construction.removeBuilder(villager);
    }

    needsBuilder() {
        return this.construction.needsBuilder();
    }

    onProductionComplete(productionItem) {
        this.production.onProductionComplete(productionItem);
    }

    addToProductionQueue(item) {
        this.production.addToProductionQueue(item);
    }

    cancelProduction() {
        return this.production.cancelProduction();
    }

    cancelQueuedProduction(match = null) {
        return this.production.cancelQueuedProduction(match);
    }

    cancelProductionAt(slot, index = -1) {
        return this.production.cancelProductionAt(slot, index);
    }

    getConstructionProgress() {
        return this.construction.getConstructionProgress();
    }

    cancelConstruction() {
        return this.construction.cancelConstruction();
    }

    getConstructionInfo() {
        return this.construction.getConstructionInfo();
    }

    getProductionProgress() {
        return this.production.getProductionProgress();
    }

    getProductionQueue() {
        return this.production.getProductionQueue();
    }

    createCollisionBox() {
        return this.collision.createCollisionBox();
    }

    updateCollisionBox() {
        this.collision.updateCollisionBox();
    }

    getCollisionBox() {
        return this.collision.getCollisionBox();
    }

    containsPoint(point) {
        return this.collision.containsPoint(point);
    }

    intersectsBox(otherBox) {
        return this.collision.intersectsBox(otherBox);
    }

    getOccupiedGridCells(cellSize = CELL_SIZE) {
        return this.collision.getOccupiedGridCells(cellSize);
    }

    createCollisionVisual(color = 0xFF0000) {
        return this.collision.createCollisionVisual(color);
    }

    updateCollisionVisual() {
        this.collision.updateCollisionVisual();
    }

    toggleCollisionVisual(visible) {
        this.collision.toggleCollisionVisual(visible);
    }

    getOccupiedCells() {
        return this.collision.getOccupiedCells();
    }
}

export default Building;

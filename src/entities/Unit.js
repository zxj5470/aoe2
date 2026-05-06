import * as THREE from 'three';
import Entity from './Entity.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor } from '../config.js';
import UnitBase from './UnitBase.js';
import UnitMovement from './UnitMovement.js';
import UnitCombat from './UnitCombat.js';
import UnitGathering from './UnitGathering.js';
import UnitAnimation from './UnitAnimation.js';
import UnitCollision from './UnitCollision.js';

class Unit extends UnitBase {
    constructor(config) {
        super(config);
        
        this.movement = new UnitMovement(this);
        this.combat = new UnitCombat(this);
        this.gathering = new UnitGathering(this);
        this.animation = new UnitAnimation(this);
        this.collision = new UnitCollision(this);
    }

    update(deltaTime) {
        if (!this.isAlive) {
            this._deathTimer = (this._deathTimer || 0) + deltaTime;
            this.animation.animateDying(deltaTime);
            if (this._deathTimer >= (this._deathDuration || 1.5)) {
                this._markedForRemoval = true;
            }
            return;
        }

        this.updateAction(deltaTime);
        this.movement.updateMovement(deltaTime);
        this.combat.updateCombat(deltaTime);
        this.animation.updateAnimation(deltaTime);
        this.updateHealthBar();

        // 更新血条渐隐动画
        this.updateHealthBarAnimation(deltaTime);

        this.gathering.updateBuilding(deltaTime);
        this.gathering.updateResourceGathering(deltaTime);
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
                case 'build':
                    this.sendToBuild(currentAction.target);
                    this.actionQueue.shift();
                    break;
            }
        }
    }

    moveTo(targetPosition, options = {}) {
        this.movement.moveTo(targetPosition, options);
    }

    attackEntity(targetEntity) {
        this.combat.attackEntity(targetEntity);
    }

    performAttack() {
        this.combat.performAttack();
    }

    gatherResource(resourceEntity, dropOffPoint = null) {
        this.gathering.gatherResource(resourceEntity, dropOffPoint);
    }

    sendToBuild(building) {
        this.gathering.sendToBuild(building);
    }

    updateBuilding(deltaTime) {
        this.gathering.updateBuilding(deltaTime);
    }

    updateResourceGathering(deltaTime) {
        this.gathering.updateResourceGathering(deltaTime);
    }

    returnToTownCenter() {
        this.gathering.returnToTownCenter();
    }

    stopGathering() {
        this.gathering.stopGathering();
    }

    deliverResources() {
        this.gathering.deliverResources();
    }

    clearBuildingState() {
        this.gathering.clearBuildingState();
    }

    setAnimationState(state) {
        this.animation.setAnimationState(state);
    }

    updateAnimation(deltaTime) {
        this.animation.updateAnimation(deltaTime);
    }

    animateIdle(deltaTime) {
        this.animation.animateIdle(deltaTime);
    }

    animateWalking(deltaTime) {
        this.animation.animateWalking(deltaTime);
    }

    animateAttacking(deltaTime) {
        this.animation.animateAttacking(deltaTime);
    }

    animateGathering(deltaTime) {
        this.animation.animateGathering(deltaTime);
    }

    animateDying(deltaTime) {
        this.animation.animateDying(deltaTime);
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

    createCollisionVisual(color = 0x00FF00) {
        return this.collision.createCollisionVisual(color);
    }

    updateCollisionVisual() {
        this.collision.updateCollisionVisual();
    }

    toggleCollisionVisual(visible) {
        this.collision.toggleCollisionVisual(visible);
    }

    getTerrainHeightAt(worldX, worldZ) {
        return this.movement.getTerrainHeightAt(worldX, worldZ);
    }
}

export default Unit;

import * as THREE from 'three';
import Entity from './Entity.js';
import RomanNumeralCanvas from './RomanNumeralCanvas.js';
import { CELL_SIZE, MAP_CONFIG, getPlayerColor } from '../config.js';
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

        // 更新血条渐隐动画
        this.updateHealthBarAnimation(deltaTime);

        if (this.isSelected) {
            this.updateSelectionVisual(deltaTime);
        }
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
        this.production.cancelProduction();
    }

    getConstructionProgress() {
        return this.construction.getConstructionProgress();
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

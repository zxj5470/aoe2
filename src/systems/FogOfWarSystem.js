import * as THREE from 'three';
import { BUILDING_TYPES } from '../config.js';

const UNIT_VISION_RANGES = {
    villager: 8,
    scout: 14,
    soldier: 9,
    archer: 10,
    knight: 10
};

const BUILDING_VISION_RANGES = {
    [BUILDING_TYPES.TOWN_CENTER]: 12,
    [BUILDING_TYPES.HOUSE]: 4,
    [BUILDING_TYPES.WATCH_TOWER]: 18,
    [BUILDING_TYPES.CASTLE]: 14,
    [BUILDING_TYPES.BARRACKS]: 7,
    [BUILDING_TYPES.ARCHERY_RANGE]: 7,
    [BUILDING_TYPES.STABLE]: 7,
    [BUILDING_TYPES.LUMBER_CAMP]: 6,
    [BUILDING_TYPES.MINING_CAMP]: 6,
    [BUILDING_TYPES.MARKET]: 7,
    [BUILDING_TYPES.BLACKSMITH]: 7,
    [BUILDING_TYPES.CHURCH]: 7,
    [BUILDING_TYPES.FARM]: 3,
    [BUILDING_TYPES.WALL]: 2,
    [BUILDING_TYPES.GATE]: 3
};

class FogOfWarSystem {
    constructor(game) {
        this.game = game;
        this.map = game.map;
        this.scene = game.scene;
        this.grid = this.map?.getGrid();

        this.width = this.grid?.width || 0;
        this.height = this.grid?.height || 0;
        this.cellSize = this.grid?.cellSize || 1;
        this.cellCount = this.width * this.height;

        this.explored = new Uint8Array(this.cellCount);
        this.visible = new Uint8Array(this.cellCount);
        this.cheatExplored = false;
        this.cheatVisible = false;

        this.updateInterval = 0.2;
        this.updateTimer = this.updateInterval;

        this.textureScale = Math.max(1, Math.floor(256 / Math.max(this.width, this.height)));
        this.textureWidth = Math.max(1, this.width * this.textureScale);
        this.textureHeight = Math.max(1, this.height * this.textureScale);
        this.canvas = null;
        this.ctx = null;
        this.texture = null;
        this.fogMesh = null;
        this.initialized = false;

        this.initFogMesh();
    }

    initFogMesh() {
        if (!this.scene || !this.map || !this.width || !this.height) return;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.textureWidth;
        this.canvas.height = this.textureHeight;
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.ctx.imageSmoothingEnabled = false;

        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.generateMipmaps = false;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;

        const mapSize = this.map.getSize();
        const geometry = new THREE.PlaneGeometry(mapSize.width, mapSize.height);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            depthWrite: false
        });

        this.fogMesh = new THREE.Mesh(geometry, material);
        this.fogMesh.rotation.x = -Math.PI / 2;
        this.fogMesh.position.set(0, 0.08, 0);
        this.fogMesh.renderOrder = 10;
        this.fogMesh.name = 'fog-of-war';

        this.scene.getScene().add(this.fogMesh);
        this.redrawFogTexture({ forceFullBlack: true });
    }

    update(deltaTime) {
        this.updateTimer += deltaTime;
        if (this.updateTimer < this.updateInterval) return;

        this.updateTimer = 0;
        this.refreshVisibility();
        this.redrawFogTexture();
        this.updateEntityVisibility();
        this.initialized = true;
    }

    refreshVisibility() {
        this.visible.fill(0);

        if (this.cheatExplored || this.cheatVisible) {
            this.explored.fill(1);
        }

        if (this.cheatVisible) {
            this.visible.fill(1);
            return;
        }

        for (const entity of this.game.entities) {
            if (!entity?.isAlive || !this.isFriendlyVisionSource(entity)) continue;

            const radius = this.getVisionRange(entity);
            if (radius <= 0) continue;

            this.revealCircle(entity.position, radius);
        }
    }

    isFriendlyVisionSource(entity) {
        if (entity.type === 'unit' || entity.type === 'building') {
            return typeof entity.isPlayerOwned === 'function' && entity.isPlayerOwned();
        }

        return entity.type === 'resource' &&
            entity.isSheep &&
            entity.sheepState === 'owned' &&
            typeof entity.isPlayerOwned === 'function' &&
            entity.isPlayerOwned();
    }

    getVisionRange(entity) {
        if (Number.isFinite(entity.visionRange)) return entity.visionRange;
        if (Number.isFinite(entity.sightRange)) return entity.sightRange;

        if (entity.type === 'unit') {
            return UNIT_VISION_RANGES[entity.unitType] || 8;
        }

        if (entity.type === 'building') {
            return BUILDING_VISION_RANGES[entity.buildingType] || 6;
        }

        if (entity.type === 'resource' && entity.isSheep && entity.sheepState === 'owned') {
            return 2;
        }

        return 0;
    }

    revealCircle(position, radius) {
        const center = this.worldToCell(position);
        if (!center) return;

        const radiusCells = Math.ceil(radius / this.cellSize);
        const radiusSq = radiusCells * radiusCells;

        const minX = Math.max(0, center.x - radiusCells);
        const maxX = Math.min(this.width - 1, center.x + radiusCells);
        const minY = Math.max(0, center.y - radiusCells);
        const maxY = Math.min(this.height - 1, center.y + radiusCells);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = x - center.x;
                const dy = y - center.y;
                if (dx * dx + dy * dy > radiusSq) continue;

                const index = this.getIndex(x, y);
                this.visible[index] = 1;
                this.explored[index] = 1;
            }
        }
    }

    redrawFogTexture(options = {}) {
        if (!this.ctx || !this.texture) return;

        const scale = this.textureScale;
        this.ctx.clearRect(0, 0, this.textureWidth, this.textureHeight);

        if (options.forceFullBlack) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            this.ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
            this.texture.needsUpdate = true;
            return;
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = this.getIndex(x, y);
                if (this.visible[index]) continue;

                this.ctx.fillStyle = this.explored[index]
                    ? 'rgba(0, 0, 0, 0.45)'
                    : 'rgba(0, 0, 0, 0.95)';
                this.ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        this.texture.needsUpdate = true;
    }

    updateEntityVisibility() {
        if (this.cheatVisible) {
            for (const entity of this.game.entities) {
                if (!entity?.mesh || !entity.isAlive) continue;
                this.setEntityFogVisible(entity, true);
            }
            return;
        }

        for (const entity of this.game.entities) {
            if (!entity?.mesh || !entity.isAlive) continue;

            if (entity.isGarrisoned) {
                this.setEntityFogVisible(entity, false);
                continue;
            }

            if (typeof entity.isPlayerOwned === 'function' && entity.isPlayerOwned()) {
                this.setEntityFogVisible(entity, true);
                continue;
            }

            if (entity.type === 'resource') {
                this.updateResourceVisibility(entity);
                continue;
            }

            const isVisible = this.isPositionVisible(entity.position);
            const isExplored = this.isPositionExplored(entity.position);
            const shouldShow = entity.type === 'building'
                ? isVisible || isExplored
                : isVisible;
            this.setEntityFogVisible(entity, shouldShow);
        }

        this.clearHiddenSelections();
    }

    updateResourceVisibility(entity) {
        const isVisible = this.isPositionVisible(entity.position);
        const isExplored = this.isPositionExplored(entity.position);

        if (entity.isSheep) {
            this.setEntityFogVisible(entity, isVisible || entity.isPlayerOwned?.());
            return;
        }

        if ((this.cheatExplored || this.cheatVisible) && !entity.fogKnownResourceState) {
            entity.fogKnownResourceState = this.captureResourceState(entity);
        }

        if (isVisible) {
            entity.fogKnownResourceState = this.captureResourceState(entity);
            this.setEntityResourcePresentation(entity, entity.fogKnownResourceState);
            this.setEntityFogVisible(entity, !entity.isDepleted);
            return;
        }

        if (isExplored && entity.fogKnownResourceState && !entity.fogKnownResourceState.isDepleted) {
            this.setEntityResourcePresentation(entity, entity.fogKnownResourceState);
            this.setEntityFogVisible(entity, true);
            return;
        }

        this.setEntityFogVisible(entity, false);
    }

    captureResourceState(entity) {
        return {
            amount: entity.amount,
            maxAmount: entity.maxAmount,
            isDepleted: entity.isDepleted,
            scale: entity.mesh ? entity.mesh.scale.clone() : null
        };
    }

    setEntityResourcePresentation(entity, state) {
        if (!entity.mesh || !state) return;

        if (state.scale) {
            entity.mesh.scale.copy(state.scale);
            return;
        }

        if (Number.isFinite(state.amount) && Number.isFinite(state.maxAmount) && state.maxAmount > 0) {
            const remainingRatio = Math.max(0.2, Math.min(state.amount / state.maxAmount, 1));
            entity.mesh.scale.setScalar(remainingRatio);
        }
    }

    setEntityFogVisible(entity, visible) {
        entity.fogVisible = visible;
        entity.mesh.visible = visible;
    }

    prepareEntityForFog(entity) {
        if (!entity?.mesh) return;

        if (typeof entity.isPlayerOwned === 'function' && entity.isPlayerOwned()) {
            entity.fogVisible = true;
            return;
        }

        entity.fogVisible = false;
        entity.mesh.visible = false;
    }

    clearHiddenSelections() {
        const selectionManager = this.game.selectionManager;
        if (!selectionManager?.selectedEntities?.length) return;

        for (const entity of [...selectionManager.selectedEntities]) {
            if (!this.isEntitySelectable(entity)) {
                selectionManager.deselectEntity(entity);
            }
        }
    }

    isEntityVisible(entity) {
        if (!entity || !entity.isAlive) return false;
        if (this.cheatVisible) return true;
        if (typeof entity.isPlayerOwned === 'function' && entity.isPlayerOwned()) return true;
        return this.isPositionVisible(entity.position);
    }

    isEntitySelectable(entity) {
        if (!entity || !entity.isAlive) return false;
        if (this.cheatVisible) return true;
        if (typeof entity.isPlayerOwned === 'function' && entity.isPlayerOwned()) return true;
        return this.isPositionVisible(entity.position);
    }

    isEntityHoverable(entity) {
        if (!entity || !entity.isAlive) return false;
        if (this.isEntitySelectable(entity)) return true;

        if (entity.type === 'resource' && !entity.isSheep) {
            return this.isPositionExplored(entity.position) &&
                entity.fogKnownResourceState &&
                !entity.fogKnownResourceState.isDepleted;
        }

        return false;
    }

    isPositionVisible(position) {
        if (this.cheatVisible) return true;
        const cell = this.worldToCell(position);
        return !!cell && this.isCellVisible(cell.x, cell.y);
    }

    isPositionExplored(position) {
        if (this.cheatExplored || this.cheatVisible) return true;
        const cell = this.worldToCell(position);
        return !!cell && this.isCellExplored(cell.x, cell.y);
    }

    isCellVisible(x, y) {
        if (this.cheatVisible) return true;
        if (!this.isInBounds(x, y)) return false;
        return this.visible[this.getIndex(x, y)] === 1;
    }

    isCellExplored(x, y) {
        if (this.cheatExplored || this.cheatVisible) return true;
        if (!this.isInBounds(x, y)) return false;
        return this.explored[this.getIndex(x, y)] === 1;
    }

    toggleCheatExplored() {
        this.cheatExplored = !this.cheatExplored;
        if (this.cheatExplored) {
            this.explored.fill(1);
            this.captureAllExploredMapElements();
        }
        this.refreshVisibility();
        this.redrawFogTexture();
        this.updateEntityVisibility();
        return this.cheatExplored;
    }

    toggleCheatVisible() {
        this.cheatVisible = !this.cheatVisible;
        if (this.cheatVisible) {
            this.cheatExplored = true;
            this.explored.fill(1);
            this.visible.fill(1);
            this.captureAllExploredMapElements();
        }
        this.refreshVisibility();
        this.redrawFogTexture();
        this.updateEntityVisibility();
        return this.cheatVisible;
    }

    captureAllExploredMapElements() {
        for (const entity of this.game.entities) {
            if (!entity?.isAlive) continue;
            if (entity.type === 'resource' && !entity.isSheep) {
                entity.fogKnownResourceState = this.captureResourceState(entity);
            }
        }
    }

    worldToCell(position) {
        if (!position) return null;

        const x = Math.floor(position.x / this.cellSize + this.width / 2);
        const y = Math.floor(position.z / this.cellSize + this.height / 2);

        if (!this.isInBounds(x, y)) return null;
        return { x, y };
    }

    getIndex(x, y) {
        return y * this.width + x;
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    dispose() {
        if (this.fogMesh) {
            this.scene?.getScene()?.remove(this.fogMesh);
            this.fogMesh.geometry.dispose();
            this.fogMesh.material.dispose();
        }
        this.texture?.dispose();
    }
}

export default FogOfWarSystem;

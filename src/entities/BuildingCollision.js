import * as THREE from 'three';
import { CELL_SIZE, MAP_CONFIG, BUILDING_TYPES } from '../config.js';

class BuildingCollision {
    constructor(building) {
        this.building = building;
    }

    createCollisionBox() {
        let width = this.building.gridSizeX * 1;
        let depth = this.building.gridSizeZ * 1;
        let offsetX = 0;
        let offsetZ = 0;
        
        if (this.building.buildingType === BUILDING_TYPES.TOWN_CENTER) {
            width = 2;
            depth = 2;
            offsetX = -(this.building.gridSizeX - width) / 2;
            offsetZ = -(this.building.gridSizeZ - depth) / 2;
        }
        
        const height = this.building.height;

        this.building.collisionBox = {
            minX: this.building.position.x + offsetX - width / 2,
            maxX: this.building.position.x + offsetX + width / 2,
            minZ: this.building.position.z + offsetZ - depth / 2,
            maxZ: this.building.position.z + offsetZ + depth / 2,
            minY: 0,
            maxY: height,
            width: width,
            depth: depth,
            height: height,
            center: new THREE.Vector3(
                this.building.position.x + offsetX,
                this.building.position.y,
                this.building.position.z + offsetZ
            )
        };

        return this.building.collisionBox;
    }

    updateCollisionBox() {
        if (this.building.collisionBox) {
            const width = this.building.collisionBox.width;
            const depth = this.building.collisionBox.depth;
            
            let offsetX = 0;
            let offsetZ = 0;
            
            if (this.building.buildingType === BUILDING_TYPES.TOWN_CENTER) {
                offsetX = -(this.building.gridSizeX - width) / 2;
                offsetZ = -(this.building.gridSizeZ - depth) / 2;
            }
            
            this.building.collisionBox.minX = this.building.position.x + offsetX - width / 2;
            this.building.collisionBox.maxX = this.building.position.x + offsetX + width / 2;
            this.building.collisionBox.minZ = this.building.position.z + offsetZ - depth / 2;
            this.building.collisionBox.maxZ = this.building.position.z + offsetZ + depth / 2;
            this.building.collisionBox.center.set(
                this.building.position.x + offsetX,
                this.building.position.y,
                this.building.position.z + offsetZ
            );
        }
    }

    getCollisionBox() {
        if (!this.building.collisionBox) {
            this.createCollisionBox();
        }
        return this.building.collisionBox;
    }

    containsPoint(point) {
        const box = this.getCollisionBox();
        return (
            point.x >= box.minX &&
            point.x <= box.maxX &&
            point.z >= box.minZ &&
            point.z <= box.maxZ
        );
    }

    intersectsBox(otherBox) {
        const box = this.getCollisionBox();
        return (
            box.minX < otherBox.maxX &&
            box.maxX > otherBox.minX &&
            box.minZ < otherBox.maxZ &&
            box.maxZ > otherBox.minZ
        );
    }

    getOccupiedGridCells(cellSize = CELL_SIZE) {
        const cells = [];

        const worldX = this.building.position.x;
        const worldZ = this.building.position.z;

        const halfMapWidth = MAP_CONFIG.width / 2;
        const halfMapHeight = MAP_CONFIG.height / 2;

        const centerGridX = Math.floor((worldX + halfMapWidth) / cellSize);
        const centerGridZ = Math.floor((worldZ + halfMapHeight) / cellSize);

        let actualGridSizeX = this.building.gridSizeX;
        let actualGridSizeZ = this.building.gridSizeZ;
        let offsetX = 0;
        let offsetZ = 0;
        
        if (this.building.buildingType === BUILDING_TYPES.TOWN_CENTER) {
            actualGridSizeX = 2;
            actualGridSizeZ = 2;
            offsetX = -(this.building.gridSizeX - actualGridSizeX) / 2;
            offsetZ = -(this.building.gridSizeZ - actualGridSizeZ) / 2;
        }

        const halfGridX = Math.floor(actualGridSizeX / 2);
        const halfGridZ = Math.floor(actualGridSizeZ / 2);

        for (let x = centerGridX - halfGridX + offsetX; x < centerGridX - halfGridX + offsetX + actualGridSizeX; x++) {
            for (let z = centerGridZ - halfGridZ + offsetZ; z < centerGridZ - halfGridZ + offsetZ + actualGridSizeZ; z++) {
                if (x >= 0 && x < MAP_CONFIG.width && z >= 0 && z < MAP_CONFIG.height) {
                    cells.push({ x, z });
                }
            }
        }

        return cells;
    }

    createCollisionVisual(color = 0xFF0000) {
        if (!this.building.collisionBox) {
            this.createCollisionBox();
        }

        const box = this.building.collisionBox;
        const width = box.width;
        const depth = box.depth;
        const height = box.maxY - box.minY;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: 2,
            transparent: true,
            opacity: 0.5
        });
        const wireframe = new THREE.LineSegments(edges, material);
        
        wireframe.position.set(
            box.center.x,
            height / 2,
            box.center.z
        );
        
        wireframe.name = 'collisionVisual';
        this.building.collisionVisual = wireframe;
        
        return wireframe;
    }

    updateCollisionVisual() {
        if (this.building.collisionVisual) {
            this.updateCollisionBox();
            const box = this.building.collisionBox;
            const height = box.maxY - box.minY;
            
            this.building.collisionVisual.position.set(
                box.center.x,
                height / 2,
                box.center.z
            );
        }
    }

    toggleCollisionVisual(visible) {
        if (this.building.collisionVisual) {
            this.building.collisionVisual.visible = visible;
            
            if (visible && !this.building.collisionVisual.parent && this.building.mesh) {
                this.building.mesh.add(this.building.collisionVisual);
            }
        } else if (visible) {
            const visual = this.createCollisionVisual();
            if (this.building.mesh) {
                this.building.mesh.add(visual);
            }
        }
    }

    /** @deprecated Use getOccupiedGridCells() instead — this method lacks MAP_CONFIG offset. */
    getOccupiedCells() {
        console.warn('BuildingCollision.getOccupiedCells() is deprecated. Use getOccupiedGridCells() instead.');
        return this.getOccupiedGridCells();
    }
}

export default BuildingCollision;

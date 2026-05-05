import * as THREE from 'three';
import { CELL_SIZE } from '../config.js';

class UnitCollision {
    constructor(unit) {
        this.unit = unit;
    }

    createCollisionBox() {
        const width = 0.5;
        const depth = 0.5;
        const height = 2;

        this.unit.collisionBox = {
            minX: this.unit.position.x - width / 2,
            maxX: this.unit.position.x + width / 2,
            minZ: this.unit.position.z - depth / 2,
            maxZ: this.unit.position.z + depth / 2,
            minY: 0,
            maxY: height,
            width: width,
            depth: depth,
            height: height,
            center: this.unit.position.clone()
        };

        return this.unit.collisionBox;
    }

    updateCollisionBox() {
        if (this.unit.collisionBox) {
            const width = this.unit.collisionBox.width;
            const depth = this.unit.collisionBox.depth;
            
            this.unit.collisionBox.minX = this.unit.position.x - width / 2;
            this.unit.collisionBox.maxX = this.unit.position.x + width / 2;
            this.unit.collisionBox.minZ = this.unit.position.z - depth / 2;
            this.unit.collisionBox.maxZ = this.unit.position.z + depth / 2;
            this.unit.collisionBox.center.copy(this.unit.position);
        }
    }

    getCollisionBox() {
        if (!this.unit.collisionBox) {
            this.createCollisionBox();
        }
        return this.unit.collisionBox;
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
        const gridX = Math.floor(this.unit.position.x / cellSize);
        const gridZ = Math.floor(this.unit.position.z / cellSize);

        cells.push({ x: gridX, z: gridZ });

        return cells;
    }

    createCollisionVisual(color = 0x00FF00) {
        if (!this.unit.collisionBox) {
            this.createCollisionBox();
        }

        const box = this.unit.collisionBox;
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
        this.unit.collisionVisual = wireframe;
        
        return wireframe;
    }

    updateCollisionVisual() {
        if (this.unit.collisionVisual) {
            this.updateCollisionBox();
            const box = this.unit.collisionBox;
            const height = box.maxY - box.minY;
            
            this.unit.collisionVisual.position.set(
                box.center.x,
                height / 2,
                box.center.z
            );
        }
    }

    toggleCollisionVisual(visible) {
        if (this.unit.collisionVisual) {
            this.unit.collisionVisual.visible = visible;
            
            if (visible && !this.unit.collisionVisual.parent && this.unit.mesh) {
                this.unit.mesh.add(this.unit.collisionVisual);
            }
        } else if (visible) {
            const visual = this.createCollisionVisual();
            if (this.unit.mesh) {
                this.unit.mesh.add(visual);
            }
        }
    }
}

export default UnitCollision;

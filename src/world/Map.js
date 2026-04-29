import * as THREE from 'three';
import Grid from './Grid.js';
import Terrain from './Terrain.js';

class GameMap {
    constructor(width = 100, height = 100, cellSize = 1) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.grid = new Grid(width, height, cellSize);
        this.terrain = new Terrain(this.grid);
        this.mesh = null;
        this.resources = [];
        this.decorations = [];
    }

    init() {
        // 创建地形网格
        this.mesh = this.terrain.createTerrainMesh();
        
        // 生成随机地形
        this.terrain.generateRandomTerrain();
        
        // 添加装饰物
        this.addDecorations();
        
        return this.mesh;
    }

    addDecorations() {
        // 添加一些树木
        this.addTrees(30);
        
        // 添加一些石头
        this.addRocks(15);
    }

    addTrees(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const cell = this.grid.getCell(x, y);
            
            if (cell && cell.type === 'forest' && !cell.occupied) {
                this.addTree(x, y);
            }
        }
    }

    addTree(gridX, gridY) {
        // 网格坐标转换为世界坐标（地图中心为原点）
        const worldX = gridX * this.cellSize - (this.width * this.cellSize) / 2 + this.cellSize / 2;
        const worldZ = gridY * this.cellSize - (this.height * this.cellSize) / 2 + this.cellSize / 2;

        // 创建简单的树模型（缩小以适应1x1网格）
        const treeGroup = new THREE.Group();

        // 树干（更细更小）
        const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // 树冠（更小）
        const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        treeGroup.position.set(worldX, 0, worldZ);

        // 随机旋转和缩放
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.8 + Math.random() * 0.4;
        treeGroup.scale.set(scale, scale, scale);

        treeGroup.userData = {
            type: 'tree',
            gridX: gridX,
            gridY: gridY,
            resourceType: 'wood',
            resourceAmount: 100
        };

        this.decorations.push(treeGroup);
        this.grid.setOccupied(gridX, gridY, true, treeGroup);

        return treeGroup;
    }

    addRocks(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            const cell = this.grid.getCell(x, y);
            
            if (cell && (cell.type === 'stone' || cell.type === 'grass') && !cell.occupied) {
                this.addRock(x, y);
            }
        }
    }

    addRock(gridX, gridY) {
        // 网格坐标转换为世界坐标（地图中心为原点）
        const worldX = gridX * this.cellSize - (this.width * this.cellSize) / 2 + this.cellSize / 2;
        const worldZ = gridY * this.cellSize - (this.height * this.cellSize) / 2 + this.cellSize / 2;

        // 创建简单的石头模型（缩小以适应1x1网格）
        const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.2
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(worldX, 0.25, worldZ);
        rock.rotation.set(
            Math.random() * 0.2,
            Math.random() * Math.PI,
            Math.random() * 0.2
        );
        rock.castShadow = true;

        const scale = 0.8 + Math.random() * 0.6;
        rock.scale.set(scale, scale, scale);

        rock.userData = {
            type: 'rock',
            gridX: gridX,
            gridY: gridY,
            resourceType: 'stone',
            resourceAmount: 50
        };

        this.decorations.push(rock);
        this.grid.setOccupied(gridX, gridY, true, rock);

        return rock;
    }

    isPositionWalkable(worldX, worldZ) {
        const cell = this.grid.getCellAtPosition(worldX, worldZ);
        return cell && cell.walkable && !cell.occupied;
    }

    getClosestWalkablePosition(worldX, worldZ, maxDistance = 10) {
        for (let distance = 1; distance <= maxDistance; distance++) {
            const neighbors = this.getNeighborsAtDistance(worldX, worldZ, distance);
            
            for (const pos of neighbors) {
                if (this.isPositionWalkable(pos.x, pos.z)) {
                    return pos;
                }
            }
        }
        
        return null;
    }

    getNeighborsAtDistance(worldX, worldZ, distance) {
        const positions = [];
        const cellX = Math.floor(worldX / this.cellSize);
        const cellY = Math.floor(worldZ / this.cellSize);
        
        for (let dx = -distance; dx <= distance; dx++) {
            for (let dy = -distance; dy <= distance; dy++) {
                if (Math.abs(dx) + Math.abs(dy) === distance) {
                    const newX = (cellX + dx) * this.cellSize + this.cellSize / 2;
                    const newZ = (cellY + dy) * this.cellSize + this.cellSize / 2;
                    positions.push({ x: newX, z: newZ });
                }
            }
        }
        
        return positions;
    }

    removeDecoration(decoration) {
        const index = this.decorations.indexOf(decoration);
        if (index > -1) {
            this.decorations.splice(index, 1);
            
            // 释放网格占用
            if (decoration.userData) {
                const gridX = decoration.userData.gridX;
                const gridY = decoration.userData.gridY;
                this.grid.setOccupied(gridX, gridY, false, null);
            }
        }
    }

    getDecorations() {
        return this.decorations;
    }

    getGrid() {
        return this.grid;
    }

    getTerrain() {
        return this.terrain;
    }

    getMesh() {
        return this.mesh;
    }

    getSize() {
        return {
            width: this.width * this.cellSize,
            height: this.height * this.cellSize,
            gridWidth: this.width,
            gridHeight: this.height
        };
    }
}

export default GameMap;
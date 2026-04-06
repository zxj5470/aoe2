import * as THREE from 'three';
import Entity from './Entity.js';

class Building extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Building',
            type: 'building',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 200,
            maxHealth: config.maxHealth || 200,
            owner: config.owner || 'player'
        });

        this.buildingType = config.buildingType || 'house';
        this.width = config.width || 2;
        this.depth = config.depth || 2;
        this.height = config.height || 2;
        this.isUnderConstruction = config.isUnderConstruction || false;
        this.constructionProgress = config.constructionProgress || 0;
        this.productionQueue = [];
        this.currentProduction = null;
        this.productionProgress = 0;
        
        this.selectionRing = null;
    }

    createMesh() {
        // 创建建筑模型
        const group = new THREE.Group();
        
        // 基础
        const baseGeometry = new THREE.BoxGeometry(this.width, 0.2, this.depth);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // 墙壁
        const wallGeometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: this.owner === 'player' ? 0x4169E1 : 0xDC143C,
            roughness: 0.8
        });
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = this.height / 2 + 0.2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        group.add(walls);
        
        // 屋顶
        const roofGeometry = new THREE.ConeGeometry(
            Math.max(this.width, this.depth) * 0.7,
            this.height * 0.5,
            4
        );
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            roughness: 0.9
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = this.height + 0.2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
        
        // 门
        const doorGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.1);
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 0.8, this.depth / 2 + 0.05);
        group.add(door);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        
        // 创建选择环
        this.createSelectionRing();
        
        return this.mesh;
    }

    createSelectionRing() {
        const ringGeometry = new THREE.RingGeometry(
            Math.max(this.width, this.depth) * 0.6,
            Math.max(this.width, this.depth) * 0.7,
            32
        );
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.selectionRing.rotation.x = -Math.PI / 2;
        this.selectionRing.position.y = 0.05;
        this.selectionRing.visible = false;
        this.mesh.add(this.selectionRing);
    }

    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateConstruction(deltaTime);
        this.updateProduction(deltaTime);
    }

    updateConstruction(deltaTime) {
        if (this.isUnderConstruction && this.constructionProgress < 100) {
            this.constructionProgress += deltaTime * 10; // 建造速度
            
            if (this.constructionProgress >= 100) {
                this.constructionProgress = 100;
                this.isUnderConstruction = false;
                this.onConstructionComplete();
            }
            
            // 更新建筑透明度显示建造进度
            if (this.mesh) {
                this.mesh.material = this.mesh.material || [];
                const opacity = 0.3 + (this.constructionProgress / 100) * 0.7;
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(mat => {
                        mat.transparent = true;
                        mat.opacity = opacity;
                    });
                } else if (this.mesh.material) {
                    this.mesh.material.transparent = true;
                    this.mesh.material.opacity = opacity;
                }
            }
        }
    }

    updateProduction(deltaTime) {
        if (this.currentProduction) {
            this.productionProgress += deltaTime * (100 / this.currentProduction.time);
            
            if (this.productionProgress >= 100) {
                this.productionProgress = 0;
                this.onProductionComplete(this.currentProduction);
                this.currentProduction = null;
                
                // 开始下一个生产任务
                if (this.productionQueue.length > 0) {
                    this.currentProduction = this.productionQueue.shift();
                }
            }
        }
    }

    onConstructionComplete() {
        // 建造完成时的回调
        this.health = this.maxHealth;
    }

    onProductionComplete(productionItem) {
        // 生产完成时的回调
        if (productionItem.onComplete) {
            productionItem.onComplete();
        }
    }

    addToProductionQueue(item) {
        this.productionQueue.push(item);
        
        if (!this.currentProduction) {
            this.currentProduction = this.productionQueue.shift();
        }
    }

    cancelProduction() {
        if (this.currentProduction) {
            this.currentProduction = null;
            this.productionProgress = 0;
        }
    }

    getConstructionProgress() {
        return this.constructionProgress;
    }

    getProductionProgress() {
        return this.productionProgress;
    }

    getProductionQueue() {
        return this.productionQueue;
    }

    getBuildingType() {
        return this.buildingType;
    }

    getSize() {
        return {
            width: this.width,
            depth: this.depth,
            height: this.height
        };
    }

    updateSelectionVisual() {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
        }
    }

    getOccupiedCells() {
        const cells = [];
        const gridX = Math.floor(this.position.x / 2);
        const gridZ = Math.floor(this.position.z / 2);
        
        for (let dx = 0; dx < this.width; dx++) {
            for (let dz = 0; dz < this.depth; dz++) {
                cells.push({
                    x: gridX + dx,
                    z: gridZ + dz
                });
            }
        }
        
        return cells;
    }
}

export default Building;
import * as THREE from 'three';

class Terrain {
    constructor(grid) {
        this.grid = grid;
        this.mesh = null;
        this.terrainTypes = {
            grass: { color: 0x3d8c40, roughness: 0.8, metalness: 0.1 },
            grassland: { color: 0x3d8c40, roughness: 0.8, metalness: 0.1 },
            water: { color: 0x1e90ff, roughness: 0.2, metalness: 0.3 },
            sand: { color: 0xf4a460, roughness: 0.9, metalness: 0.1 },
            desert: { color: 0xF5DEB3, roughness: 0.9, metalness: 0.1 },
            sand_dunes: { color: 0xF0D58C, roughness: 0.9, metalness: 0.1 },
            forest: { color: 0x228b22, roughness: 0.7, metalness: 0.1 },
            stone: { color: 0x808080, roughness: 0.9, metalness: 0.2 },
            mountain: { color: 0x696969, roughness: 0.95, metalness: 0.1 }
        };
    }

    createTerrainMesh() {
        const size = this.grid.getSize();
        const geometry = new THREE.PlaneGeometry(
            size.width * size.cellSize,
            size.height * size.cellSize,
            size.width,
            size.height
        );

        // 创建材质数组，为每个网格单元设置不同的材质
        const materials = [];
        const totalCells = size.width * size.height;

        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                const cell = this.grid.getCell(x, y);
                const terrainType = this.terrainTypes[cell.type] || this.terrainTypes.grass;
                
                const material = new THREE.MeshStandardMaterial({
                    color: terrainType.color,
                    roughness: terrainType.roughness,
                    metalness: terrainType.metalness,
                    flatShading: true
                });
                
                materials.push(material);
            }
        }

        // 创建网格（居中到世界坐标系原点）
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        this.mesh.position.set(0, 0, 0);

        return this.mesh;
    }

    updateTerrainCell(x, y) {
        if (!this.mesh) return;

        const cell = this.grid.getCell(x, y);
        if (!cell) return;

        const size = this.grid.getSize();
        const index = y * size.width + x;

        if (index >= 0 && index < this.mesh.material.length) {
            const terrainType = this.terrainTypes[cell.type] || this.terrainTypes.grass;
            this.mesh.material[index].color.setHex(terrainType.color);
            this.mesh.material[index].roughness = terrainType.roughness;
            this.mesh.material[index].metalness = terrainType.metalness;
        }
    }

    addTerrainFeature(type, x, y, size = 1) {
        for (let dx = 0; dx < size; dx++) {
            for (let dy = 0; dy < size; dy++) {
                const cell = this.grid.getCell(x + dx, y + dy);
                if (cell) {
                    cell.type = type;
                    cell.walkable = (type !== 'water' && type !== 'mountain');
                    this.updateTerrainCell(x + dx, y + dy);
                }
            }
        }
    }

    generateRandomTerrain() {
        const size = this.grid.getSize();
        
        // 生成一些随机地形特征
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * size.width);
            const y = Math.floor(Math.random() * size.height);
            const types = ['forest', 'sand', 'stone'];
            const type = types[Math.floor(Math.random() * types.length)];
            const featureSize = Math.floor(Math.random() * 3) + 1;
            this.addTerrainFeature(type, x, y, featureSize);
        }

        // 生成一些水域
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * size.width);
            const y = Math.floor(Math.random() * size.height);
            const waterSize = Math.floor(Math.random() * 4) + 2;
            this.addTerrainFeature('water', x, y, waterSize);
        }
    }

    getMesh() {
        return this.mesh;
    }

    getHeightAtPosition(x, z) {
        const cell = this.grid.getCellAtPosition(x, z);
        return cell ? cell.height : 0;
    }
}

export default Terrain;
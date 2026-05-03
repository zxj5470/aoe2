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
            size.width - 1,
            size.height - 1
        );

        const positions = geometry.attributes.position.array;
        const vertexCount = geometry.attributes.position.count;
        const colors = new Float32Array(vertexCount * 3);

        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                const cell = this.grid.getCell(x, y);
                const terrainType = this.terrainTypes[cell.type] || this.terrainTypes.grass;
                const color = new THREE.Color(terrainType.color);

                const vertexIndex = y * size.width + x;
                const idx = vertexIndex * 3;

                positions[idx + 2] = cell.height || 0;

                colors[idx] = color.r;
                colors[idx + 1] = color.g;
                colors[idx + 2] = color.b;
            }
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
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
        const terrainType = this.terrainTypes[cell.type] || this.terrainTypes.grass;
        const color = new THREE.Color(terrainType.color);

        const vertexIndex = y * size.width + x;
        const idx = vertexIndex * 3;
        const colors = this.mesh.geometry.attributes.color.array;

        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;

        this.mesh.geometry.attributes.color.needsUpdate = true;
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
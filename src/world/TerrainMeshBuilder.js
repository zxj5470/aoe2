import * as THREE from 'three';

const TERRAIN_COLORS = {
    grassland: 0x4a9c50,
    desert: 0xd2691e,
    sand_dunes: 0xf4a460,
    forest: 0x228b22,
    water: 0x1e90ff,
    river: 0x4169e1,
    shallow_water: 0x87ceeb,
    beach: 0xf5deb3,
    hill: 0x6b8e23,
    upland: 0x8fbc8f,
    oasis: 0x32cd32,
    arena_center: 0x556b2f,
    wall: 0x8b7355,
    flower_field: 0x90ee90
};

export class TerrainMeshBuilder {
    static createMapMesh(mapData) {
        const group = new THREE.Group();
        
        const geometry = new THREE.PlaneGeometry(mapData.width, mapData.height, mapData.width - 1, mapData.height - 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a9c50,
            roughness: 0.8
        });
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        group.add(terrain);

        if (mapData.heightData) {
            const positions = geometry.attributes.position;
            for (let x = 0; x < mapData.width; x++) {
                for (let y = 0; y < mapData.height; y++) {
                    const index = y * mapData.width + x;
                    positions.setZ(index, mapData.heightData[x][y] || 0);
                }
            }
            positions.needsUpdate = true;
            geometry.computeVertexNormals();
        }

        return group;
    }

    static getTerrainColor(terrainType) {
        return TERRAIN_COLORS[terrainType] || 0x4a9c50;
    }
}

import * as THREE from 'three';

class Scene {
    constructor() {
        this.scene = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.entities = [];
        this.pathVisualizers = new Map();
    }

    init() {
        // 创建Three.js场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // 添加光照
        this.setupLighting();
        
        // 添加地面
        this.setupGround();
        
        // 添加辅助网格
        this.addGridHelper();
    }

    setupLighting() {
        // 环境光（降低强度以增加对比度）
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);
        
        // 主方向光（太阳光）- 增强强度，添加暖色调
        this.directionalLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
        this.directionalLight.position.set(80, 120, 60);
        this.directionalLight.castShadow = true;
        
        // 设置阴影参数 - 扩大范围以覆盖整个地图
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 600;
        this.directionalLight.shadow.camera.left = -150;
        this.directionalLight.shadow.camera.right = 150;
        this.directionalLight.shadow.camera.top = 150;
        this.directionalLight.shadow.camera.bottom = -150;
        this.directionalLight.shadow.bias = -0.0005;
        this.directionalLight.shadow.normalBias = 0.02;
        
        this.scene.add(this.directionalLight);
        
        // 添加辅助光源（半球光模拟天空和地面的颜色散射）
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d8c40, 0.4);
        this.scene.add(hemisphereLight);
    }

    setupGround() {
        // 地面由 Terrain 系统渲染，此处不创建额外的地面网格
        // 仅创建一个不可见的接收阴影平面
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'ground';
        
        this.scene.add(ground);
    }

    addGridHelper() {
        // 添加网格辅助线
        const gridHelper = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.1;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    addEntity(entity) {
        if (entity.getMesh) {
            const mesh = entity.getMesh();
            if (mesh) {
                this.scene.add(mesh);
            }
        }
        this.entities.push(entity);
    }

    removeEntity(entity) {
        if (entity.getMesh) {
            const mesh = entity.getMesh();
            if (mesh) {
                this.scene.remove(mesh);
            }
        }
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    update(deltaTime) {
        // 更新场景中的所有实体
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    getScene() {
        return this.scene;
    }

    /**
     * 可视化路径
     * @param {string} unitId - 单位ID
     * @param {Array} path - 路径单元格数组
     * @param {Grid} grid - 网格系统
     */
    visualizePath(unitId, path, grid) {
        this.clearPathVisualizer(unitId);

        if (!path || path.length === 0) {
            return;
        }

        const cellSize = grid.cellSize;
        const halfW = grid.width * cellSize / 2;
        const halfH = grid.height * cellSize / 2;

        // 创建路径点
        const points = [];
        for (const cell of path) {
            const x = cell.x * cellSize + cellSize / 2 - halfW;
            const z = cell.y * cellSize + cellSize / 2 - halfH;
            points.push(new THREE.Vector3(x, 0.05, z));
        }

        // 创建路径线
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffaa00,
            linewidth: 2
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);

        // 创建路径点标记
        const markers = [];
        for (const point of points) {
            const markerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(point);
            marker.position.y = 0.1;
            markers.push(marker);
        }

        // 添加到场景
        this.scene.add(line);
        for (const marker of markers) {
            this.scene.add(marker);
        }

        this.pathVisualizers.set(unitId, { line, markers });
    }

    /**
     * 清除路径可视化
     * @param {string} unitId - 单位ID
     */
    clearPathVisualizer(unitId) {
        const visualizer = this.pathVisualizers.get(unitId);
        if (visualizer) {
            this.scene.remove(visualizer.line);
            for (const marker of visualizer.markers) {
                this.scene.remove(marker);
            }
            this.pathVisualizers.delete(unitId);
        }
    }

    /**
     * 清除所有路径可视化
     */
    clearAllPathVisualizers() {
        for (const unitId of this.pathVisualizers.keys()) {
            this.clearPathVisualizer(unitId);
        }
    }
}

export default Scene;
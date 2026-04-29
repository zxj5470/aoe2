import * as THREE from 'three';

class Scene {
    constructor() {
        this.scene = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.entities = [];
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
        // 环境光
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        
        // 主方向光（太阳光）
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 100, 50);
        this.directionalLight.castShadow = true;
        
        // 设置阴影参数
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(this.directionalLight);
        
        // 添加辅助光源
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
        this.scene.add(hemisphereLight);
    }

    setupGround() {
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d8c40,
            roughness: 0.8,
            metalness: 0.1
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
}

export default Scene;
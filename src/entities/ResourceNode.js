import * as THREE from 'three';
import Entity from './Entity.js';

class ResourceNode extends Entity {
    constructor(config) {
        super({
            name: config.name || 'Resource',
            type: 'resource',
            x: config.x || 0,
            y: config.y || 0,
            z: config.z || 0,
            health: config.health || 100,
            maxHealth: config.maxHealth || 100,
            owner: 'neutral'
        });

        this.resourceType = config.resourceType || 'wood'; // wood, stone, gold, food
        this.amount = config.amount || 100;
        this.maxAmount = config.maxAmount || 100;
        this.gatherSpeed = config.gatherSpeed || 1;
        this.gatherer = null;
        this.isBeingGathered = false;
        
        // 资源节点特性
        this.canRespawn = config.canRespawn || false;
        this.respawnTime = config.respawnTime || 30; // 重生时间（秒）
        this.respawnTimer = 0;
        this.isDepleted = false;
        
        // 视觉效果
        this.gatherParticles = [];
        this.particleInterval = 0;
        
        // 根据资源类型设置外观配置
        this.appearanceConfig = this.getAppearanceConfig();
    }
    
    /**
     * 根据资源类型获取外观配置
     */
    getAppearanceConfig() {
        const configs = {
            wood: {
                type: 'tree',
                trunkColor: 0x8B4513,
                foliageColor: 0x228B22,
                size: 1.2,
                hasMultipleTrunks: true
            },
            stone: {
                type: 'rock',
                color: 0x696969,
                size: 1.0,
                irregular: false
            },
            gold: {
                type: 'ore',
                color: 0xFFD700,
                secondaryColor: 0x8B8000,
                size: 0.8,
                sparkle: false
            },
            food: {
                type: 'bush',
                color: 0x32CD32,
                berryColor: 0xFF6347,
                size: 0.6,
                hasBerries: true
            }
        };
        
        return configs[this.resourceType] || configs.wood;
    }

    createMesh() {
        const config = this.appearanceConfig;
        const group = new THREE.Group();
        
        switch (config.type) {
            case 'tree':
                this.createTree(group, config);
                break;
            case 'rock':
                this.createRock(group, config);
                break;
            case 'ore':
                this.createOre(group, config);
                break;
            case 'bush':
                this.createBush(group, config);
                break;
        }
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        
        // 创建选择环（在设置旋转之前添加，避免选择环也跟着旋转）
        this.createSelectionRing();
        
        // 设置随机旋转（只影响资源节点本身，不影响选择环）
        this.mesh.rotation.y = Math.random() * Math.PI * 2;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        
        // 设置userData，让选择系统能够识别实体
        this.mesh.userData = {
            type: 'resource',
            resourceType: this.resourceType,
            entity: this,
            owner: this.owner
        };
        
        return this.mesh;
    }
    
    /**
     * 创建树木模型
     */
    createTree(group, config) {
        // 树干
        const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: config.trunkColor,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        trunk.name = 'trunk';
        group.add(trunk);
        
        // 树冠（多层圆锥）
        const foliageColors = [
            config.foliageColor,
            new THREE.Color(config.foliageColor).multiplyScalar(0.9).getHex(),
            new THREE.Color(config.foliageColor).multiplyScalar(0.8).getHex()
        ];
        
        const foliagePositions = [
            { y: 1.8, radius: 0.6, height: 1.2 },
            { y: 2.5, radius: 0.5, height: 1.0 },
            { y: 3.2, radius: 0.4, height: 0.8 }
        ];
        
        foliagePositions.forEach((pos, index) => {
            const foliageGeometry = new THREE.ConeGeometry(pos.radius, pos.height, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({ 
                color: foliageColors[index],
                roughness: 0.8
            });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = pos.y;
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            foliage.name = `foliage_${index}`;
            group.add(foliage);
        });
        
        // 添加一些分支
        for (let i = 0; i < 3; i++) {
            const branchGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.4, 6);
            const branchMaterial = new THREE.MeshStandardMaterial({ 
                color: config.trunkColor,
                roughness: 0.9
            });
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.y = 1.5 + i * 0.3;
            branch.rotation.z = Math.PI / 4;
            branch.rotation.y = (i * Math.PI * 2) / 3;
            branch.name = `branch_${i}`;
            group.add(branch);
        }
    }
    
    /**
     * 创建岩石模型
     */
    createRock(group, config) {
        // 主岩石（使用DodecahedronGeometry创建不规则形状）
        const rockGeometry = new THREE.DodecahedronGeometry(config.size, 1);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            roughness: 0.9,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = config.size * 0.4;
        rock.scale.y = 0.6;
        rock.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.name = 'mainRock';
        group.add(rock);
        
        // 添加一些小岩石
        for (let i = 0; i < 3; i++) {
            const smallRockGeometry = new THREE.DodecahedronGeometry(config.size * 0.4, 0);
            const smallRockMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                roughness: 0.9,
                flatShading: true
            });
            const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
            const angle = (i * Math.PI * 2) / 3;
            const distance = config.size * 0.8;
            smallRock.position.set(
                Math.cos(angle) * distance,
                config.size * 0.2,
                Math.sin(angle) * distance
            );
            smallRock.scale.y = 0.5;
            smallRock.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );
            smallRock.castShadow = true;
            smallRock.receiveShadow = true;
            smallRock.name = `smallRock_${i}`;
            group.add(smallRock);
        }
    }
    
    /**
     * 创建矿石模型
     */
    createOre(group, config) {
        // 主矿脉
        const oreGeometry = new THREE.DodecahedronGeometry(config.size, 0);
        const oreMaterial = new THREE.MeshStandardMaterial({ 
            color: config.secondaryColor,
            roughness: 0.8,
            flatShading: true
        });
        const ore = new THREE.Mesh(oreGeometry, oreMaterial);
        ore.position.y = config.size * 0.3;
        ore.scale.y = 0.5;
        ore.rotation.set(
            Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3
        );
        ore.castShadow = true;
        ore.receiveShadow = true;
        ore.name = 'mainOre';
        group.add(ore);
        
        // 金矿脉（金色条纹）
        const veinCount = 5;
        for (let i = 0; i < veinCount; i++) {
            const veinGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
            const veinMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                roughness: 0.3,
                metalness: 0.8,
                emissive: config.color,
                emissiveIntensity: 0.2
            });
            const vein = new THREE.Mesh(veinGeometry, veinMaterial);
            
            // 随机分布在矿石表面
            const phi = Math.random() * Math.PI;
            const theta = Math.random() * Math.PI * 2;
            const radius = config.size * 0.6;
            
            vein.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                config.size * 0.3 + radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
            vein.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            vein.name = `vein_${i}`;
            group.add(vein);
        }
        
        // 添加闪烁效果（如果配置了）
        if (config.sparkle) {
            this.sparkleMeshes = [];
            for (let i = 0; i < 3; i++) {
                const sparkleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const sparkleMaterial = new THREE.MeshBasicMaterial({ 
                    color: config.color,
                    transparent: true,
                    opacity: 0
                });
                const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
                sparkle.position.set(
                    (Math.random() - 0.5) * config.size,
                    config.size * 0.3 + Math.random() * config.size * 0.4,
                    (Math.random() - 0.5) * config.size
                );
                sparkle.name = `sparkle_${i}`;
                group.add(sparkle);
                this.sparkleMeshes.push(sparkle);
            }
        }
    }
    
    /**
     * 创建灌木模型
     */
    createBush(group, config) {
        // 主灌木
        const bushGeometry = new THREE.SphereGeometry(config.size, 8, 8);
        const bushMaterial = new THREE.MeshStandardMaterial({ 
            color: config.color,
            roughness: 0.9
        });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.y = config.size * 0.5;
        bush.scale.y = 0.7;
        bush.castShadow = true;
        bush.receiveShadow = true;
        bush.name = 'mainBush';
        group.add(bush);
        
        // 浆果（如果有）
        if (config.hasBerries) {
            const berryCount = 12;
            this.berryMeshes = [];
            
            for (let i = 0; i < berryCount; i++) {
                const berryGeometry = new THREE.SphereGeometry(0.08, 8, 8);
                const berryMaterial = new THREE.MeshStandardMaterial({ 
                    color: config.berryColor,
                    roughness: 0.8
                });
                const berry = new THREE.Mesh(berryGeometry, berryMaterial);
                
                // 随机分布在灌木表面
                const phi = Math.random() * Math.PI;
                const theta = Math.random() * Math.PI * 2;
                const radius = config.size * 0.8;
                
                berry.position.set(
                    radius * Math.sin(phi) * Math.cos(theta),
                    config.size * 0.5 + radius * Math.cos(phi) * 0.7,
                    radius * Math.sin(phi) * Math.sin(theta)
                );
                berry.name = `berry_${i}`;
                group.add(berry);
                this.berryMeshes.push(berry);
            }
        }
    }

    update(deltaTime) {
        if (!this.isAlive) {
            // 如果资源已耗尽，处理重生逻辑
            if (this.canRespawn && this.isDepleted) {
                this.respawnTimer += deltaTime;
                
                if (this.respawnTimer >= this.respawnTime) {
                    this.respawn();
                }
            }
            return;
        }
        
        // 更新闪烁效果
        if (this.sparkleMeshes) {
            this.updateSparkle(deltaTime);
        }
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
    }
    
    /**
     * 更新闪烁效果
     */
    updateSparkle(deltaTime) {
        const time = Date.now() / 1000;
        
        this.sparkleMeshes.forEach((sparkle, index) => {
            const offset = index * 0.5;
            const sparkleIntensity = (Math.sin(time * 3 + offset) + 1) / 2;
            sparkle.material.opacity = sparkleIntensity * 0.5;
        });
    }
    
    /**
     * 更新粒子效果
     */
    updateParticles(deltaTime) {
        // 移除过期的粒子
        this.gatherParticles = this.gatherParticles.filter(particle => {
            particle.life -= deltaTime;
            particle.mesh.position.y += particle.velocity * deltaTime;
            particle.mesh.material.opacity = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                particle.mesh.parent.remove(particle.mesh);
                return false;
            }
            return true;
        });
    }
    
    /**
     * 采集资源
     */
    gather(amount) {
        if (!this.isAlive || this.isDepleted) return 0;
        
        const actualAmount = Math.min(amount, this.amount);
        this.amount -= actualAmount;
        
        // 创建采集粒子效果
        this.createGatherParticle();
        
        // 检查资源是否耗尽
        if (this.amount <= 0) {
            this.amount = 0;
            this.deplete();
        }
        
        // 根据剩余数量调整视觉效果
        this.updateVisualBasedOnAmount();
        
        return actualAmount;
    }
    
    /**
     * 创建采集粒子效果
     */
    createGatherParticle() {
        const particleGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        let particleColor;
        
        switch (this.resourceType) {
            case 'wood':
                particleColor = 0x8B4513;
                break;
            case 'stone':
                particleColor = 0x696969;
                break;
            case 'gold':
                particleColor = 0xFFD700;
                break;
            case 'food':
                particleColor = 0xFF6347;
                break;
        }
        
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: particleColor,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // 随机位置
        particle.position.set(
            (Math.random() - 0.5) * this.appearanceConfig.size,
            this.appearanceConfig.size * 0.8,
            (Math.random() - 0.5) * this.appearanceConfig.size
        );
        
        this.mesh.add(particle);
        
        this.gatherParticles.push({
            mesh: particle,
            life: 0.5,
            maxLife: 0.5,
            velocity: 2 + Math.random()
        });
    }
    
    /**
     * 根据剩余数量更新视觉效果
     */
    updateVisualBasedOnAmount() {
        if (!this.mesh) return;
        
        const remainingRatio = this.amount / this.maxAmount;
        
        // 调整缩放
        this.mesh.scale.setScalar(remainingRatio);
        
        // 如果是灌木，减少浆果数量
        if (this.resourceType === 'food' && this.berryMeshes) {
            const visibleBerryCount = Math.floor(this.berryMeshes.length * remainingRatio);
            this.berryMeshes.forEach((berry, index) => {
                berry.visible = index < visibleBerryCount;
            });
        }
    }
    
    /**
     * 资源耗尽
     */
    deplete() {
        this.isDepleted = true;
        this.isBeingGathered = false;
        this.gatherer = null;
        
        // 隐藏资源
        if (this.mesh) {
            this.mesh.visible = false;
        }
        
        console.log(`${this.name} 资源已耗尽`);
    }
    
    /**
     * 资源重生
     */
    respawn() {
        this.amount = this.maxAmount;
        this.isDepleted = false;
        this.health = this.maxHealth;
        
        // 显示资源
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.scale.setScalar(1);
        }
        
        // 恢复浆果
        if (this.resourceType === 'food' && this.berryMeshes) {
            this.berryMeshes.forEach(berry => {
                berry.visible = true;
            });
        }
        
        console.log(`${this.name} 资源已重生`);
    }
    
    /**
     * 设置采集者
     */
    setGatherer(entity) {
        this.gatherer = entity;
        this.isBeingGathered = entity !== null;
    }
    
    /**
     * 获取资源类型
     */
    getResourceType() {
        return this.resourceType;
    }
    
    /**
     * 获取剩余资源数量
     */
    getAmount() {
        return this.amount;
    }
    
    /**
     * 获取最大资源数量
     */
    getMaxAmount() {
        return this.maxAmount;
    }
    
    /**
     * 检查资源是否可用
     */
    isAvailable() {
        return this.isAlive && !this.isDepleted;
    }
    
    /**
     * 创建选择环（对齐网格的白色边框）
     */
    createSelectionRing() {
        const gridSize = 2; // 网格单元格大小
        const size = this.appearanceConfig.size;
        
        // 资源节点占用1个网格单元
        const gridWidth = gridSize;
        const gridDepth = gridSize;
        
        // 创建白色边框（使用BoxGeometry作为线框）
        const boxGeometry = new THREE.BoxGeometry(gridWidth, 0.1, gridDepth);
        const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        this.selectionRing = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.selectionRing.position.set(0, 0.05, 0);
        this.selectionRing.visible = false;
        this.selectionRing.name = 'selectionRing';
        this.mesh.add(this.selectionRing);
        
        // 保存mesh的初始旋转，用于反向旋转选择环
        this.meshInitialRotation = this.mesh.rotation.y;
    }
    
    /**
     * 更新选择视觉效果
     */
    updateSelectionVisual() {
        if (this.selectionRing) {
            this.selectionRing.visible = this.isSelected;
            // 反向旋转选择环，使其始终朝向世界坐标系的正方向
            this.selectionRing.rotation.y = -this.mesh.rotation.y + this.meshInitialRotation;
        }
    }
    
    /**
     * 获取碰撞盒
     */
    getCollisionBox() {
        const size = this.appearanceConfig.size;
        return {
            min: new THREE.Vector3(
                this.position.x - size / 2,
                this.position.y,
                this.position.z - size / 2
            ),
            max: new THREE.Vector3(
                this.position.x + size / 2,
                this.position.y + size,
                this.position.z + size / 2
            )
        };
    }
}

export default ResourceNode;
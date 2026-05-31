import * as THREE from 'three';
import Unit from '../entities/Unit.js';
import Building from '../entities/Building.js';
import ResourceNode from '../entities/ResourceNode.js';
import { HUMAN_OWNER, ENEMY_OWNER, isHumanPlayer, BUILDING_TYPES } from '../config.js';

class EntityManager {
    constructor(game) {
        this.game = game;
        this.entities = [];
    }

    addEntity(entity) {
        entity._game = this.game;
        this.entities.push(entity);
        this.game.scene.addEntity(entity);

        if (this.game.collisionSystem) {
            if (entity.type === 'building' || entity.type === 'resource' || entity.type === 'unit') {
                this.game.collisionSystem.registerEntity(entity);
                this.game.collisionSystem.updateGridOccupancy();
            }
        }

        if (this.game.spatialIndex) {
            if (entity.type === 'resource' || entity.type === 'building' || entity.type === 'unit') {
                this.game.spatialIndex.insert(entity);
            }
        }

        if (this.game.aiSystem && entity.type === 'unit' && entity.isEnemy()) {
            this.game.aiSystem.registerUnit(entity);
        }

        if (this.game.combatSystem && entity.type === 'unit' && entity.attackDamage > 0) {
            this.game.combatSystem.registerCombatant(entity);
        }

        // 注册防御建筑到战斗系统
        if (this.game.combatSystem && entity.type === 'building' && entity.buildingFeatures?.canAttack) {
            this.game.combatSystem.registerCombatant(entity);
        }

        // 建筑/资源新增时，使受影响的缓存路径失效
        if (entity.type === 'building' || entity.type === 'resource') {
            this.invalidatePathCacheForEntity(entity);
        }

        // 建筑变更时更新人口上限
        if (entity.type === 'building' && this.game.player) {
            this.game.player.onBuildingChange(this);
        }

        // 单位添加时更新当前人口
        if (entity.type === 'unit' && this.game.player && entity.isPlayerOwned()) {
            console.log(`[EntityManager] 添加玩家单位: ${entity.unitType} ${entity.name}`);
            this.game.player.addUnit(entity);
        }
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            if (entity.clearRallyPoint) {
                entity.clearRallyPoint();
            }
            this.entities.splice(index, 1);
            this.game.scene.removeEntity(entity);

            if (this.game.spatialIndex && (entity.type === 'resource' || entity.type === 'building' || entity.type === 'unit')) {
                this.game.spatialIndex.remove(entity);
            }

            // 统一处理所有实体类型的碰撞系统注销
            if (this.game.collisionSystem) {
                this.game.collisionSystem.unregisterEntity(entity);
            }

            if (entity.type === 'unit') {
                if (this.game.combatSystem) {
                    this.game.combatSystem.unregisterCombatant(entity);
                }
                if (this.game.player && entity.isPlayerOwned()) {
                    this.game.player.removeUnit(entity);
                }
            }

            // 建筑/资源移除时，刷新网格占用并使缓存路径失效
            if (entity.type === 'building' || entity.type === 'resource') {
                this.invalidatePathCacheForEntity(entity);
                if (this.game.collisionSystem) {
                    this.game.collisionSystem.updateGridOccupancy();
                }
            }

            // 建筑变更时更新人口上限
            if (entity.type === 'building' && this.game.player) {
                this.game.player.onBuildingChange(this);
            }
        }
    }

    /**
     * 使受实体占用格子影响的缓存路径失效
     */
    invalidatePathCacheForEntity(entity) {
        if (!this.game.pathfinding) return;

        const cells = entity.getOccupiedGridCells
            ? entity.getOccupiedGridCells(this.game.pathfinding.grid.cellSize)
            : [];

        for (const cell of cells) {
            this.game.pathfinding.invalidateCacheForCell(cell.x, cell.z);
        }
    }

    updateEntities(deltaTime) {
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity._markedForRemoval) {
                this.removeEntity(entity);
            }
        }
    }

    getEntities() {
        return this.entities;
    }

    getEntitiesByType(type) {
        return this.entities.filter(entity => entity.type === type);
    }

    getEntitiesByOwner(owner) {
        return this.entities.filter(entity => entity.owner === owner);
    }

    getEntitiesByTypeAndOwner(type, owner) {
        return this.entities.filter(entity => entity.type === type && entity.owner === owner);
    }

    getEntityById(id) {
        return this.entities.find(entity => entity.id === id);
    }

    getEntitiesInRadius(x, z, radius) {
        return this.entities.filter(entity => {
            const dx = entity.position.x - x;
            const dz = entity.position.z - z;
            return Math.sqrt(dx * dx + dz * dz) <= radius;
        });
    }

    // 按建筑类型统计数量（只统计已完成的建筑）
    getBuildingCountByType(buildingType, owner = null) {
        return this.entities.filter(e =>
            e.type === 'building' &&
            e.buildingType === buildingType &&
            e.isAlive &&
            !e.isUnderConstruction &&
            (owner === null || e.owner === owner)
        ).length;
    }

    // 统计玩家的建筑数量（使用 isHumanPlayer 检查，兼容 'blue' 和 'player'）
    getPlayerBuildingCountByType(buildingType) {
        return this.entities.filter(e =>
            e.type === 'building' &&
            e.buildingType === buildingType &&
            e.isAlive &&
            !e.isUnderConstruction &&
            isHumanPlayer(e.owner)
        ).length;
    }

    getEntitiesInRect(x1, z1, x2, z2) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minZ = Math.min(z1, z2);
        const maxZ = Math.max(z1, z2);

        return this.entities.filter(entity => {
            return entity.position.x >= minX && entity.position.x <= maxX &&
                   entity.position.z >= minZ && entity.position.z <= maxZ;
        });
    }

    spawnTownCenters(mapData) {
        const alignToGrid = (coord, size = 4) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        for (const tc of mapData.townCenters) {
            const worldX = tc.x - mapData.width / 2 + 0.5;
            const worldZ = tc.y - mapData.height / 2 + 0.5;

            const townCenter = new Building({
                buildingType: BUILDING_TYPES.TOWN_CENTER,
                name: `${tc.owner}_town_center`,
                x: alignToGrid(worldX, 4),
                z: alignToGrid(worldZ, 4),
                owner: tc.owner,
                health: 1000,
                maxHealth: 1000,
                width: 4,
                depth: 4,
                height: 3
            });

            const tcMesh = townCenter.createMesh();
            if (tcMesh) {
                console.log(`[EntityManager] 创建城镇中心: ${townCenter.name}, owner: ${townCenter.owner}, isPlayerOwned: ${townCenter.isPlayerOwned()}`);
                this.addEntity(townCenter);
                // 将城镇中心注册为资源投放点
                if (this.game.resourceGatheringSystem) {
                    this.game.resourceGatheringSystem.addDropOffPoint(
                        townCenter, ['wood', 'food', 'gold', 'stone']
                    );
                }
            }
        }

        console.log(`已生成 ${mapData.townCenters.length} 个城镇中心`);
    }

    spawnResourcesFromMapData(mapData) {
        if (!mapData.resources || mapData.resources.length === 0) return;

        for (const resource of mapData.resources) {
            const terrainHeight = mapData.heightData && mapData.heightData[resource.x] 
                ? mapData.heightData[resource.x][resource.y] || 0 
                : 0;

            const resourceNode = new ResourceNode({
                resourceType: resource.type,
                name: resource.type + '_' + Math.random().toString(36).substr(2, 9),
                x: resource.x - mapData.width / 2 + 0.5,
                z: resource.y - mapData.height / 2 + 0.5,
                y: terrainHeight,
                amount: resource.amount,
                health: 100,
                maxHealth: 100,
                gatherSpeed: 1,
                canRespawn: true,
                respawnTime: 60
            });

            const resourceMesh = resourceNode.createMesh();
            if (resourceMesh) {
                this.addEntity(resourceNode);
            }
        }

        console.log(`已生成 ${mapData.resources.length} 个资源节点`);
    }

    initArabiaEntities() {
        const alignToGrid = (coord, size = 1) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        const townCenters = this.entities.filter(e => e.buildingType === BUILDING_TYPES.TOWN_CENTER);
        console.log(`[EntityManager] 找到 ${townCenters.length} 个城镇中心`);

        let totalVillagers = 0;

        for (const tc of townCenters) {
            const tcX = tc.position.x;
            const tcZ = tc.position.z;
            const owner = tc.owner;
            console.log(`[EntityManager] 为 ${owner} 的城镇中心创建村民`);

            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const distance = 5;
                const x = alignToGrid(tcX + Math.cos(angle) * distance, 1);
                const z = alignToGrid(tcZ + Math.sin(angle) * distance, 1);

                const villager = new Unit({
                    unitType: 'villager',
                    name: `${owner}_villager_${i + 1}`,
                    x,
                    z,
                    owner,
                    health: 50,
                    maxHealth: 50,
                    speed: 5,
                    attackDamage: 5,
                    attackRange: 1,
                    attackSpeed: 1,
                    armor: 1,
                    sightRange: 6,
                    pathfindingSystem: this.game.pathfinding,
                    formationSystem: this.game.formationSystem,
                    game: this.game
                });

                const villagerMesh = villager.createMesh();
                if (villagerMesh) {
                    this.addEntity(villager);
                    totalVillagers++;
                }
            }

            // 为玩家生成侦察骑兵
            if (tc.isPlayerOwned() || owner === 'blue') {
                this.spawnScoutNearTownCenter(tc, alignToGrid);
            }
        }

        this.spawnSheepAroundTownCenters(townCenters, alignToGrid);

        console.log(`阿拉伯地图初始化：${townCenters.length} 个城镇中心，${totalVillagers} 个村民，8 只羊`);
    }

    spawnScoutNearTownCenter(tc, alignToGrid) {
        const angle = Math.PI * 0.75; // 与村民位置错开
        const distance = 5;
        const x = alignToGrid(tc.position.x + Math.cos(angle) * distance, 1);
        const z = alignToGrid(tc.position.z + Math.sin(angle) * distance, 1);

        const scout = new Unit({
            unitType: 'scout',
            name: `${tc.owner}_scout`,
            x,
            z,
            owner: tc.owner,
            health: 35,
            maxHealth: 35,
            speed: 8,
            attackDamage: 3,
            attackRange: 1,
            attackSpeed: 1,
            armor: 0,
            sightRange: 6,
            pathfindingSystem: this.game.pathfinding,
            formationSystem: this.game.formationSystem,
            game: this.game
        });

        const scoutMesh = scout.createMesh();
        if (scoutMesh) {
            this.addEntity(scout);
            console.log(`[EntityManager] 创建侦察骑兵: ${scout.name}, owner: ${scout.owner}`);
        }
    }

    spawnSheepAroundTownCenters(townCenters, alignToGrid) {
        const sheepCount = 8;
        let sheepIndex = 0;

        for (const tc of townCenters) {
            const tcX = tc.position.x;
            const tcZ = tc.position.z;

            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 3 + Math.random() * 5;
                const x = alignToGrid(tcX + Math.cos(angle) * distance, 1);
                const z = alignToGrid(tcZ + Math.sin(angle) * distance, 1);

                const sheep = new ResourceNode({
                    resourceType: 'food',
                    name: `sheep_${sheepIndex++}`,
                    x,
                    z,
                    amount: 100,
                    health: 100,
                    maxHealth: 100,
                    gatherSpeed: 1,
                    canRespawn: false,
                    respawnTime: 0
                });

                const sheepMesh = sheep.createMesh();
                if (sheepMesh) {
                    this.addEntity(sheep);
                }
            }

            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 8 + Math.random() * 8;
                const x = alignToGrid(tcX + Math.cos(angle) * distance, 1);
                const z = alignToGrid(tcZ + Math.sin(angle) * distance, 1);

                const sheep = new ResourceNode({
                    resourceType: 'food',
                    name: `sheep_${sheepIndex++}`,
                    x,
                    z,
                    amount: 100,
                    health: 100,
                    maxHealth: 100,
                    gatherSpeed: 1,
                    canRespawn: false,
                    respawnTime: 0
                });

                const sheepMesh = sheep.createMesh();
                if (sheepMesh) {
                    this.addEntity(sheep);
                }
            }
        }
    }

    initTestUnits() {
        const alignToGrid = (coord, size = 1) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        const unitConfigs = [
            { unitType: 'villager', name: '村民1', x: alignToGrid(-5), z: alignToGrid(0) },
            { unitType: 'villager', name: '村民2', x: alignToGrid(-5), z: alignToGrid(3) },
            { unitType: 'villager', name: '村民3', x: alignToGrid(-5), z: alignToGrid(-3) },
            { unitType: 'scout', name: '侦察骑兵', x: alignToGrid(2), z: alignToGrid(4) },
            { unitType: 'soldier', name: '士兵1', x: alignToGrid(0), z: alignToGrid(5) },
            { unitType: 'soldier', name: '士兵2', x: alignToGrid(3), z: alignToGrid(5) },
            { unitType: 'knight', name: '骑士1', x: alignToGrid(5), z: alignToGrid(0) },
            { unitType: 'knight', name: '骑士2', x: alignToGrid(5), z: alignToGrid(-3) },
            { unitType: 'archer', name: '弓箭手1', x: alignToGrid(0), z: alignToGrid(-5) },
            { unitType: 'archer', name: '弓箭手2', x: alignToGrid(-3), z: alignToGrid(-5) },
            { unitType: 'scout', name: '侦察兵1', x: alignToGrid(10), z: alignToGrid(10) }
        ];

        for (const config of unitConfigs) {
            const unit = new Unit({
                ...config,
                owner: HUMAN_OWNER,
                health: 50,
                maxHealth: 50,
                speed: 5,
                attackDamage: config.unitType === 'knight' ? 15 :
                             config.unitType === 'soldier' ? 10 :
                             config.unitType === 'archer' ? 8 : 5,
                attackRange: config.unitType === 'archer' ? 5 : 1,
                attackSpeed: 1,
                armor: config.unitType === 'knight' ? 3 :
                       config.unitType === 'soldier' ? 2 : 1,
                sightRange: 6,
                pathfindingSystem: this.game.pathfinding,
                formationSystem: this.game.formationSystem,
                game: this.game
            });

            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.addEntity(unit);
            }
        }

        const enemyConfigs = [
            { unitType: 'soldier', name: '敌人士兵1', x: alignToGrid(-10), z: alignToGrid(10), owner: ENEMY_OWNER },
            { unitType: 'knight', name: '敌方骑士1', x: alignToGrid(-10), z: alignToGrid(15), owner: ENEMY_OWNER },
            { unitType: 'archer', name: '敌方弓箭手1', x: alignToGrid(-15), z: alignToGrid(10), owner: ENEMY_OWNER }
        ];

        for (const config of enemyConfigs) {
            const unit = new Unit({
                ...config,
                health: 50,
                maxHealth: 50,
                speed: 5,
                attackDamage: config.unitType === 'knight' ? 15 :
                             config.unitType === 'soldier' ? 10 :
                             config.unitType === 'archer' ? 8 : 5,
                attackRange: config.unitType === 'archer' ? 5 : 1,
                attackSpeed: 1,
                armor: config.unitType === 'knight' ? 3 :
                       config.unitType === 'soldier' ? 2 : 1,
                sightRange: 6,
                pathfindingSystem: this.game.pathfinding,
                formationSystem: this.game.formationSystem,
                game: this.game
            });

            const unitMesh = unit.createMesh();
            if (unitMesh) {
                this.addEntity(unit);
            }
        }

        console.log(`已创建 ${unitConfigs.length + enemyConfigs.length} 个测试单位`);
    }

    initTestBuildings() {
        const alignToGrid = (coord, size = 2) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        const getSize = (type) => this.game.getBuildingWidth(type) || 2;

        const buildingConfigs = [
            { buildingType: BUILDING_TYPES.HOUSE, name: '房屋1', x: alignToGrid(8, getSize(BUILDING_TYPES.HOUSE)), z: alignToGrid(0, getSize(BUILDING_TYPES.HOUSE)) },
            { buildingType: BUILDING_TYPES.HOUSE, name: '房屋2', x: alignToGrid(8, getSize(BUILDING_TYPES.HOUSE)), z: alignToGrid(4, getSize(BUILDING_TYPES.HOUSE)) },
            { buildingType: BUILDING_TYPES.HOUSE, name: '房屋3', x: alignToGrid(8, getSize(BUILDING_TYPES.HOUSE)), z: alignToGrid(-4, getSize(BUILDING_TYPES.HOUSE)) },
            { buildingType: BUILDING_TYPES.BARRACKS, name: '兵营', x: alignToGrid(12, getSize(BUILDING_TYPES.BARRACKS)), z: alignToGrid(8, getSize(BUILDING_TYPES.BARRACKS)) },
            { buildingType: BUILDING_TYPES.STABLE, name: '马厩', x: alignToGrid(15, getSize(BUILDING_TYPES.STABLE)), z: alignToGrid(12, getSize(BUILDING_TYPES.STABLE)) },
            { buildingType: BUILDING_TYPES.ARCHERY_RANGE, name: '靶场', x: alignToGrid(18, getSize(BUILDING_TYPES.ARCHERY_RANGE)), z: alignToGrid(8, getSize(BUILDING_TYPES.ARCHERY_RANGE)) },
            { buildingType: BUILDING_TYPES.WATCH_TOWER, name: '瞭望塔', x: alignToGrid(20, getSize(BUILDING_TYPES.WATCH_TOWER)), z: alignToGrid(5, getSize(BUILDING_TYPES.WATCH_TOWER)) },
            { buildingType: BUILDING_TYPES.MARKET, name: '市场', x: alignToGrid(12, getSize(BUILDING_TYPES.MARKET)), z: alignToGrid(-8, getSize(BUILDING_TYPES.MARKET)) },
            { buildingType: BUILDING_TYPES.BLACKSMITH, name: '铁匠铺', x: alignToGrid(15, getSize(BUILDING_TYPES.BLACKSMITH)), z: alignToGrid(-12, getSize(BUILDING_TYPES.BLACKSMITH)) },
            { buildingType: BUILDING_TYPES.CHURCH, name: '教堂', x: alignToGrid(20, getSize(BUILDING_TYPES.CHURCH)), z: alignToGrid(0, getSize(BUILDING_TYPES.CHURCH)) },
            { buildingType: BUILDING_TYPES.CASTLE, name: '城堡', x: alignToGrid(25, getSize(BUILDING_TYPES.CASTLE)), z: alignToGrid(0, getSize(BUILDING_TYPES.CASTLE)) }
        ];

        for (const config of buildingConfigs) {
            const building = new Building({
                ...config,
                owner: HUMAN_OWNER,
                health: 200,
                maxHealth: 200,
                width: this.game.getBuildingWidth(config.buildingType),
                depth: this.game.getBuildingDepth(config.buildingType),
                height: this.game.getBuildingHeight(config.buildingType)
            });

            const buildingMesh = building.createMesh();
            if (buildingMesh) {
                this.addEntity(building);
            }
        }

        const enemyBuildingConfigs = [
            { buildingType: BUILDING_TYPES.BARRACKS, name: '敌军兵营', x: alignToGrid(-15, getSize(BUILDING_TYPES.BARRACKS)), z: alignToGrid(8, getSize(BUILDING_TYPES.BARRACKS)), owner: ENEMY_OWNER },
            { buildingType: BUILDING_TYPES.WATCH_TOWER, name: '敌军瞭望塔', x: alignToGrid(-18, getSize(BUILDING_TYPES.WATCH_TOWER)), z: alignToGrid(12, getSize(BUILDING_TYPES.WATCH_TOWER)), owner: ENEMY_OWNER },
            { buildingType: BUILDING_TYPES.HOUSE, name: '敌军房屋', x: alignToGrid(-12, getSize(BUILDING_TYPES.HOUSE)), z: alignToGrid(15, getSize(BUILDING_TYPES.HOUSE)), owner: ENEMY_OWNER }
        ];

        for (const config of enemyBuildingConfigs) {
            const building = new Building({
                ...config,
                health: 200,
                maxHealth: 200,
                width: this.game.getBuildingWidth(config.buildingType),
                depth: this.game.getBuildingDepth(config.buildingType),
                height: this.game.getBuildingHeight(config.buildingType)
            });

            const buildingMesh = building.createMesh();
            if (buildingMesh) {
                this.addEntity(building);
            }
        }

        console.log(`已创建 ${buildingConfigs.length + enemyBuildingConfigs.length} 个测试建筑`);
    }

    initTestResources() {
        const alignToGrid = (coord, size = 1) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        const resourceConfigs = [
            { resourceType: 'wood', name: '树木1', x: alignToGrid(-15), z: alignToGrid(0), amount: 150 },
            { resourceType: 'wood', name: '树木2', x: alignToGrid(-18), z: alignToGrid(3), amount: 150 },
            { resourceType: 'wood', name: '树木3', x: alignToGrid(-18), z: alignToGrid(-3), amount: 150 },
            { resourceType: 'wood', name: '树木4', x: alignToGrid(-20), z: alignToGrid(6), amount: 150 },
            { resourceType: 'wood', name: '树木5', x: alignToGrid(-20), z: alignToGrid(-6), amount: 150 },
            { resourceType: 'wood', name: '树木6', x: alignToGrid(-22), z: alignToGrid(0), amount: 150 },
            { resourceType: 'stone', name: '岩石1', x: alignToGrid(-10), z: alignToGrid(-10), amount: 200 },
            { resourceType: 'stone', name: '岩石2', x: alignToGrid(-13), z: alignToGrid(-12), amount: 200 },
            { resourceType: 'stone', name: '岩石3', x: alignToGrid(-7), z: alignToGrid(-13), amount: 200 },
            { resourceType: 'gold', name: '金矿1', x: alignToGrid(0), z: alignToGrid(-15), amount: 300 },
            { resourceType: 'gold', name: '金矿2', x: alignToGrid(3), z: alignToGrid(-18), amount: 300 },
            { resourceType: 'gold', name: '金矿3', x: alignToGrid(-3), z: alignToGrid(-18), amount: 300 },
            { resourceType: 'food', name: '浆果丛1', x: alignToGrid(10), z: alignToGrid(15), amount: 100 },
            { resourceType: 'food', name: '浆果丛2', x: alignToGrid(13), z: alignToGrid(18), amount: 100 },
            { resourceType: 'food', name: '浆果丛3', x: alignToGrid(7), z: alignToGrid(18), amount: 100 },
            { resourceType: 'food', name: '浆果丛4', x: alignToGrid(15), z: alignToGrid(15), amount: 100 }
        ];

        for (const config of resourceConfigs) {
            const resourceNode = new ResourceNode({
                ...config,
                health: 100,
                maxHealth: 100,
                gatherSpeed: 1,
                canRespawn: true,
                respawnTime: 60
            });

            const resourceMesh = resourceNode.createMesh();
            if (resourceMesh) {
                this.addEntity(resourceNode);
            }
        }

        console.log(`已创建 ${resourceConfigs.length} 个测试资源节点`);
    }

    initTownCenter() {
        const alignToGrid = (coord, size = 4) => {
            const offset = size % 2 === 0 ? 0 : 0.5;
            return Math.round(coord) + offset;
        };

        const townCenter = new Building({
            buildingType: BUILDING_TYPES.TOWN_CENTER,
            name: '城镇中心',
            x: alignToGrid(0, 4),
            z: alignToGrid(0, 4),
            owner: HUMAN_OWNER,
            health: 1000,
            maxHealth: 1000,
            width: 4,
            depth: 4,
            height: 4,
            gridSizeX: 4,
            gridSizeZ: 4
        });

        const townCenterMesh = townCenter.createMesh();
        if (townCenterMesh) {
            townCenter.setAgeLevel(this.game.player.getAgeLevel());
            this.addEntity(townCenter);
        }

        if (this.game.resourceGatheringSystem) {
            this.game.resourceGatheringSystem.addDropOffPoint(townCenter, ['wood', 'food', 'gold', 'stone']);
            console.log('已创建城镇中心并添加为资源存储点');
        }
    }

    registerUnitsToGatheringSystem() {
        if (!this.game.resourceGatheringSystem) return;

        for (const entity of this.entities) {
            if (entity.unitType === 'villager' && entity.isPlayerOwned()) {
                this.game.resourceGatheringSystem.registerGatherer(entity);
            }
        }

        console.log(`已注册 ${this.game.resourceGatheringSystem.getGathererCount()} 个村民到资源收集系统`);
    }

    registerResourceNodesToGatheringSystem() {
        if (!this.game.resourceGatheringSystem) return;

        for (const entity of this.entities) {
            if (entity.type === 'resource' && entity.userData) {
                this.game.resourceGatheringSystem.registerResourceNode(entity);
            }
        }

        console.log(`已注册 ${this.game.resourceGatheringSystem.getResourceNodeCount()} 个资源节点到资源收集系统`);
    }

    assignBuilderToBuilding(building) {
        const villagers = this.entities.filter(
            e => e.isAlive && e.type === 'unit' && e.unitType === 'villager'
                && e.isPlayerOwned() && !e.isBuilding && !e._markedForRemoval
        );

        if (villagers.length === 0) return null;

        let closest = null;
        let closestDist = Infinity;

        for (const v of villagers) {
            const dx = v.position.x - building.position.x;
            const dz = v.position.z - building.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closest = v;
            }
        }

        if (closest) {
            closest.sendToBuild(building);
        }

        return closest;
    }

    spawnUnitFromBuilding(building, unitType) {
        console.log(`[EntityManager] spawnUnitFromBuilding: ${unitType} from ${building.name}, owner: ${building.owner}, isPlayerOwned: ${building.isPlayerOwned()}`);

        const unitConfig = this.game.getUnitConfig(unitType);
        const halfW = (building.gridSizeX || 2) / 2 + 1;
        const spawnX = building.position.x + halfW;
        const spawnZ = building.position.z;

        const unit = new Unit({
            unitType: unitType,
            name: `${building.owner}_${unitType}_${Date.now()}`,
            x: spawnX,
            z: spawnZ,
            owner: building.owner,
            health: unitConfig.health,
            maxHealth: unitConfig.health,
            speed: unitConfig.speed,
            attackDamage: unitConfig.attackDamage,
            attackRange: unitConfig.attackRange,
            attackSpeed: unitConfig.attackSpeed,
            armor: unitConfig.armor,
            sightRange: unitConfig.sightRange,
            pathfindingSystem: this.game.pathfinding,
            formationSystem: this.game.formationSystem,
            game: this.game
        });

        const mesh = unit.createMesh();
        if (mesh) {
            console.log(`[EntityManager] 单位已创建: ${unit.name}, isPlayerOwned: ${unit.isPlayerOwned()}`);
            this.addEntity(unit);
            if (building.rallyPoint) {
                unit.moveTo(building.rallyPoint);
            }
            // addEntity 已经调用了 addUnit，无需重复调用
            if (this.game.resourceGatheringSystem && unit.unitType === 'villager') {
                this.game.resourceGatheringSystem.registerGatherer(unit);
            }
        }

        return unit;
    }

    selectTownCenter() {
        if (!this.game.selectionManager) return;

        const townCenters = this.entities.filter(entity => 
            entity.type === 'building' && 
            entity.buildingType === BUILDING_TYPES.TOWN_CENTER &&
            entity.isAlive &&
            entity.isPlayerOwned()
        );

        if (townCenters.length === 0) {
            console.log('没有找到城镇中心');
            return;
        }

        const currentlySelected = this.game.selectionManager.getSelectedEntities();
        let currentIndex = -1;

        if (currentlySelected.length === 1 && currentlySelected[0].buildingType === BUILDING_TYPES.TOWN_CENTER) {
            currentIndex = townCenters.indexOf(currentlySelected[0]);
        }

        const nextIndex = (currentIndex + 1) % townCenters.length;
        const targetTownCenter = townCenters[nextIndex];

        this.game.selectionManager.deselectAll();
        this.game.selectionManager.selectEntity(targetTownCenter);

        if (this.game.camera) {
            this.game.camera.target.x = targetTownCenter.position.x;
            this.game.camera.target.z = targetTownCenter.position.z;
            this.game.camera.target.y = 0;
            this.game.camera.updateCameraPosition();
        }

        console.log(`已选择城镇中心 ${nextIndex + 1}/${townCenters.length}`);
    }

    toggleCollisionVisuals() {
        if (!this.game.collisionSystem) return;

        this.game.showCollisionVisuals = !this.game.showCollisionVisuals;

        console.log(`碰撞体积可视化: ${this.game.showCollisionVisuals ? '显示' : '隐藏'}`);

        for (const building of this.game.collisionSystem.buildings) {
            if (building.toggleCollisionVisual) {
                building.toggleCollisionVisual(this.game.showCollisionVisuals);
            }
        }

        for (const resource of this.game.collisionSystem.resourceNodes) {
            if (resource.toggleCollisionVisual) {
                resource.toggleCollisionVisual(this.game.showCollisionVisuals);
            }
        }

        for (const unit of this.game.collisionSystem.units) {
            if (unit.toggleCollisionVisual) {
                unit.toggleCollisionVisual(this.game.showCollisionVisuals);
            }
        }
    }
}

export default EntityManager;

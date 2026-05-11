# 控制台调试指令

## 架构概览

```
Game
├── entityManager (EntityManager)    ← 实体 CRUD + 查询
├── systemManager (SystemManager)    ← 系统初始化和管理
├── eventManager (EventManager)      ← DOM 事件委托 + 事件总线
├── uiManager (UIManager)            ← HUD 生命周期管理
├── player (Player)
│   ├── resourceManager (ResourceManager)  ← 资源管理器属于玩家
│   ├── ageLevel, population
│   └── units[]
├── selectionManager (SelectionManager)
├── camera (Camera)
├── hud (HUD)
│   ├── resourceDisplay (ResourceDisplay)
│   ├── minimap (Minimap)
│   ├── actionPanel (ActionPanel)
│   └── infoPanel (InfoPanel)
├── mapGenerator (MapGenerator)
├── mapSelectionPanel (MapSelectionPanel)
├── spatialIndex (SpatialIndex)
├── pathfinding (Pathfinding)
├── formationSystem (FormationSystem)
├── buildingPlacementSystem (BuildingPlacementSystem)
├── combatSystem (CombatSystem)
├── resourceGatheringSystem (ResourceGatheringSystem)
├── collisionSystem (CollisionSystem)
├── aiSystem (AISystem)
└── entities[] (via entityManager.getEntities())
```

**注意**：`game.resourceManager` 是 getter 属性，返回 `game.player.resourceManager`。

---

## 基础访问

所有调试指令通过 `game` 全局变量访问。

```javascript
// 检查 game 是否可用
console.log(game);

// 检查玩家资源管理器
console.log(game.player.resourceManager);

// 快捷方式（等价于 game.player.resourceManager）
console.log(game.resourceManager);
```

---

## 资源管理 (ResourceManager)

资源通过 `game.player.resourceManager` 或快捷方式 `game.resourceManager` 访问。

### 查看资源

```javascript
// 查看所有资源
game.resourceManager.getAllResources();

// 查看单个资源
game.resourceManager.getResource('wood');
game.resourceManager.getResource('food');
game.resourceManager.getResource('gold');
game.resourceManager.getResource('stone');
```

### 添加资源

```javascript
game.resourceManager.addResource('wood', 1000);
game.resourceManager.addResource('food', 1000);
game.resourceManager.addResource('gold', 500);
game.resourceManager.addResource('stone', 500);
```

### 消耗与检查

```javascript
// 检查资源是否足够
game.resourceManager.hasEnoughResources({ wood: 100, food: 50 });

// 消耗资源
game.resourceManager.spendResources({ wood: 100, gold: 50 });
```

### 资源监听

```javascript
game.resourceManager.addListener((type, amount) => {
  console.log(`资源变化: ${type} = ${amount}`);
});
```

---

## 玩家管理 (Player)

### 时代管理

```javascript
game.player.getAgeLevel();          // 1-4
game.player.getAgeName();           // '黑暗时代'
game.player.setAgeLevel(2);         // 1=黑暗, 2=封建, 3=城堡, 4=帝王
game.player.getAgeRomanNumeral();   // 'II'
```

### 人口管理

```javascript
game.player.population.current;
game.player.population.max;
game.player.setMaxPopulation(200);
game.player.canTrainUnit();
```

### 单位管理

```javascript
game.player.getUnits();
game.player.getUnitsByType('villager');
game.player.addUnit(entity);
game.player.removeUnit(entity);
```

### 事件监听

```javascript
game.player.on('ageChange', (data) => {
  console.log('时代变化:', data);
  // data: { oldLevel, newLevel, ageName, romanNumeral }
});

game.player.on('populationChange', (data) => {
  console.log('人口变化:', data);
  // data: { oldCurrent, newCurrent, max }
});

game.player.on('unitAdd', (data) => {
  console.log('单位添加:', data.unit);
});

game.player.on('unitRemove', (data) => {
  console.log('单位移除:', data.unit);
});

// 取消监听
const callback = (data) => console.log(data);
game.player.on('ageChange', callback);
game.player.off('ageChange', callback);
```

---

## 选择管理 (SelectionManager)

```javascript
// 获取选中实体
game.selectionManager.getSelectedEntities();
game.selectionManager.selectedEntities.length;

// 选择操作
game.selectionManager.selectEntity(entity);
game.selectionManager.selectEntities([entity1, entity2]);
game.selectionManager.deselectAll();
```

---

## 实体管理 (Entities)

### 查看与筛选实体

```javascript
// 所有实体
game.entities;
game.entities.length;

// 筛选 — 使用 isPlayerOwned() / isEnemy() 而非硬编码 owner
game.entities.filter(e => e.type === 'building');
game.entities.filter(e => e.type === 'unit');
game.entities.filter(e => e.type === 'resource');
game.entities.filter(e => e.buildingType === 'town_center');
game.entities.filter(e => e.unitType === 'villager');
game.entities.filter(e => e.isAlive);
game.entities.filter(e => e.isPlayerOwned());
game.entities.filter(e => e.isEnemy());
```

### 实体属性

```javascript
const entity = game.entities[0];

// 基本属性
entity.name;
entity.type;          // 'unit', 'building', 'resource'
entity.position;      // THREE.Vector3
entity.isAlive;
entity.isSelected;
entity.owner;         // 'blue', 'red', 等

// 判断归属（推荐方式）
entity.isPlayerOwned();
entity.isEnemy();

// 单位特有
entity.unitType;      // 'villager', 'soldier', 'knight', 'archer', 'scout'
entity.speed;
entity.attackDamage;
entity.attackRange;
entity.armor;

// 建筑特有
entity.buildingType;  // 'house', 'barracks', 'town_center', etc.
entity.isUnderConstruction;
entity.constructionProgress;

// 资源节点特有
entity.resourceType;  // 'wood', 'stone', 'gold', 'food'
entity.amount;
```

---

## 相机控制 (Camera)

```javascript
game.camera.getCamera();
game.camera.target;
game.camera.target.x = 50;
game.camera.target.z = 50;
game.camera.target.y = 0;
game.camera.updateCameraPosition();
game.camera.currentZoom;
```

---

## 地图系统

```javascript
// 地图尺寸
game.map.width;
game.map.height;

// 地图网格
game.map.getGrid();

// 地图数据
game.map.mapData;

// 当前地图类型
game.selectedMapType;  // 'arabia', 'arena', 'blackforest', etc.
```

---

## 空间索引 (SpatialIndex)

使用 RBush 库进行高效空间查询。

```javascript
game.spatialIndex.insert(entity);
game.spatialIndex.remove(entity);
game.spatialIndex.query(minX, minY, maxX, maxY);
game.spatialIndex.queryPoint(x, z, radius);
game.spatialIndex.clear();
```

---

## 建筑放置系统 (BuildingPlacementSystem)

```javascript
// 开始放置建筑
game.buildingPlacementSystem.startPlacement('house', game.resourceManager);
game.buildingPlacementSystem.startPlacement('barracks', game.resourceManager);

// 切换放置（UI 按钮使用的入口）
game.buildingPlacementSystem.togglePlacement('house');

// 取消放置
game.buildingPlacementSystem.cancelPlacement();

// 检查状态
game.buildingPlacementSystem.isPlacing;
game.buildingPlacementSystem.currentBuildingType;

// 查看建筑类型配置
console.log(game.buildingPlacementSystem.buildingTypes);
// 包含: house, farm, lumber-camp, mining-camp, barracks, archery, stable,
//       blacksmith, market, watch-tower, castle
```

---

## 战斗系统 (CombatSystem)

```javascript
game.combatSystem.registerCombatant(entity);
game.combatSystem.unregisterCombatant(entity);
game.combatSystem.combatants;
console.log(game.combatSystem.damageModifiers);
console.log(game.combatSystem.buildingDamageTypes);
```

---

## AI 系统 (AISystem)

```javascript
// 注册/取消注册 AI 单位
game.aiSystem.registerUnit(unit);
game.aiSystem.unregisterUnit(unit);

// 查看所有 AI 单位
game.aiSystem.aiUnits;

// AI 状态: idle, patrol, chase, attack, flee
```

---

## 资源收集系统 (ResourceGatheringSystem)

```javascript
game.resourceGatheringSystem.registerGatherer(entity);
game.resourceGatheringSystem.unregisterGatherer(entity);
game.resourceGatheringSystem.registerResourceNode(node);
game.resourceGatheringSystem.addDropOffPoint(building, ['wood', 'food', 'gold', 'stone']);
game.resourceGatheringSystem.gatherers.length;
game.resourceGatheringSystem.resourceNodes.length;
```

---

## 寻路系统 (Pathfinding)

```javascript
const path = game.pathfinding.findPath(startX, startZ, endX, endZ);
game.pathfinding.isWalkable(x, z);
```

---

## gameDebug 全局对象

```javascript
// 打印指定区域网格状态
gameDebug.printGridArea(x, z, radius);

// 打印指定格子状态
gameDebug.printCell(x, z);

// 打印所有资源节点信息
gameDebug.printResources();

// 获取实例
gameDebug.getGame();
gameDebug.getGrid();
gameDebug.getCollisionSystem();
gameDebug.getPathfinding();
```

---

## 快捷调试命令

### 一键添加资源

```javascript
function addAllResources(amount = 10000) {
  game.resourceManager.addResource('wood', amount);
  game.resourceManager.addResource('food', amount);
  game.resourceManager.addResource('gold', amount);
  game.resourceManager.addResource('stone', amount);
  console.log(`已添加 ${amount} 单位所有资源`);
}
addAllResources();
```

### 一键升级时代

```javascript
game.player.setAgeLevel(4);  // 帝王时代
```

### 快速选择城镇中心

```javascript
game.entityManager.selectTownCenter();
```

### 查看实体统计

```javascript
function entityStats() {
  const units = game.entities.filter(e => e.type === 'unit');
  const buildings = game.entities.filter(e => e.type === 'building');
  const resources = game.entities.filter(e => e.type === 'resource');
  console.log(`单位: ${units.length}, 建筑: ${buildings.length}, 资源: ${resources.length}`);
  console.log(`玩家单位: ${units.filter(e => e.isPlayerOwned()).length}`);
  console.log(`敌方单位: ${units.filter(e => e.isEnemy()).length}`);
  console.log(`村民: ${units.filter(e => e.unitType === 'villager').length}`);
}
entityStats();
```

### 杀死所有敌方单位

```javascript
game.entities.filter(e => e.type === 'unit' && e.isEnemy()).forEach(e => e.kill());
```

---

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `W`/`S`/`A`/`D` 或方向键 | 相机移动 |
| 鼠标右键拖拽 | 平移视角 |
| 滚轮 | 缩放视野 |
| 左键点击 | 选择单位/建筑/确认建筑放置 |
| `Shift` + 左键 | 多选 |
| 拖拽框选 | 批量选择 |
| 右键点击 | 移动/攻击/采集；建筑放置时取消 |
| `Escape` | 取消建筑放置 |
| `Ctrl`+`1`~`5` | 切换编队类型 |
| `F12` | 显示/隐藏 Debug 面板 |
| `H` | 选择城镇中心 |
| `C` | 切换碰撞体积可视化 |
| `V` | 切换建筑面板预设 |
| `1`/`2`/`3` | 切换建筑面板布局 |

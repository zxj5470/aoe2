# 控制台调试指令

## 架构概览

```
Game
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
├── movementSystem (MovementSystem)
├── formationSystem (FormationSystem)
├── buildingPlacementSystem (BuildingPlacementSystem)
├── combatSystem (CombatSystem)
├── resourceGatheringSystem (ResourceGatheringSystem)
├── collisionSystem (CollisionSystem)
└── entities[]
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
// 添加木材
game.resourceManager.addResource('wood', 1000);

// 添加食物
game.resourceManager.addResource('food', 1000);

// 添加黄金
game.resourceManager.addResource('gold', 500);

// 添加石头
game.resourceManager.addResource('stone', 500);
```

### 移除资源

```javascript
game.resourceManager.removeResource('wood', 100);
game.resourceManager.removeResource('food', 100);
game.resourceManager.removeResource('gold', 50);
game.resourceManager.removeResource('stone', 50);
```

### 检查资源是否足够

```javascript
// 检查是否有足够资源（返回 true/false）
game.resourceManager.hasEnoughResources({ wood: 100, food: 50 });

// 批量消耗资源
game.resourceManager.spendResources({ wood: 100, gold: 50 });
```

### 资源容量

```javascript
// 获取某类资源的最大容量
game.resourceManager.getMaxResource('wood');

// 设置额外容量
game.resourceManager.setResourceCapacity('wood', 500);

// 获取额外容量
game.resourceManager.getResourceCapacity('wood');
```

### 资源监听

```javascript
// 监听资源变化
game.resourceManager.addListener((type, amount) => {
  console.log(`资源变化: ${type} = ${amount}`);
});
```

---

## 玩家管理 (Player)

### 时代管理

```javascript
// 获取当前时代等级 (1-4)
game.player.getAgeLevel();

// 获取时代名称
game.player.getAgeName();

// 设置时代等级
game.player.setAgeLevel(2);  // 1=黑暗, 2=封建, 3=城堡, 4=帝王

// 获取罗马数字
game.player.getAgeRomanNumeral();
```

### 人口管理

```javascript
// 获取当前人口
game.player.population.current;

// 获取最大人口
game.player.population.max;

// 设置最大人口
game.player.setMaxPopulation(200);

// 检查是否可以训练新单位
game.player.canTrainUnit(1);
```

### 单位管理

```javascript
// 获取所有单位
game.player.getUnits();

// 按类型筛选单位
game.player.getUnitsByType('villager');

// 手动添加单位到玩家
game.player.addUnit(entity);

// 手动移除单位
game.player.removeUnit(entity);
```

### 事件监听

```javascript
// 监听时代变化
game.player.on('ageChange', (data) => {
  console.log('时代变化:', data);
  // data: { oldLevel, newLevel, ageName, romanNumeral }
});

// 监听人口变化
game.player.on('populationChange', (data) => {
  console.log('人口变化:', data);
  // data: { oldCurrent, newCurrent, max }
});

// 监听单位添加
game.player.on('unitAdd', (data) => {
  console.log('单位添加:', data.unit);
});

// 监听单位移除
game.player.on('unitRemove', (data) => {
  console.log('单位移除:', data.unit);
});

// 取消监听
const callback = (data) => console.log(data);
game.player.on('ageChange', callback);
game.player.off('ageChange', callback);
```

**注意**：Player 类**不直接管理资源数据**。资源操作通过 `game.player.resourceManager` 进行，资源监听通过 `game.resourceManager.addListener()` 注册。

---

## 选择管理 (SelectionManager)

### 获取选中单位

```javascript
// 获取所有选中实体
game.selectionManager.getSelectedEntities();

// 获取选中数量
game.selectionManager.selectedEntities.length;
```

### 选择操作

```javascript
// 选择单个实体
game.selectionManager.selectEntity(entity);

// 选择多个实体
game.selectionManager.selectEntities([entity1, entity2]);

// 取消所有选择
game.selectionManager.deselectAll();
```

### 编队

```javascript
// 获取/设置编队类型
game.selectionManager.formationType;  // 'line', 'box', 'staggered'
```

---

## 实体管理 (Entities)

### 查看所有实体

```javascript
// 所有实体数组
game.entities;

// 实体数量
game.entities.length;

// 遍历所有实体
game.entities.forEach(e => console.log(e.name, e.type));
```

### 筛选实体

```javascript
// 筛选建筑
game.entities.filter(e => e.type === 'building');

// 筛选单位
game.entities.filter(e => e.type === 'unit');

// 筛选资源节点
game.entities.filter(e => e.type === 'resource');

// 筛选城镇中心
game.entities.filter(e => e.buildingType === 'town_center');

// 筛选村民
game.entities.filter(e => e.unitType === 'villager');

// 筛选存活的实体
game.entities.filter(e => e.isAlive);

// 筛选特定玩家的实体
game.entities.filter(e => e.owner === 'player');
game.entities.filter(e => e.owner === 'enemy');
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
entity.owner;         // 'player', 'enemy', 'neutral'

// 单位特有
entity.unitType;      // 'villager', 'soldier', 'knight', 'archer', 'scout'
entity.speed;
entity.attackDamage;
entity.attackRange;
entity.armor;

// 建筑特有
entity.buildingType;  // 'house', 'barracks', 'town_center', etc.

// 资源节点特有
entity.resourceType;  // 'wood', 'stone', 'gold', 'food'
entity.amount;

// 操作
entity.kill();
entity.select();
entity.deselect();
```

---

## 相机控制 (Camera)

### 位置控制

```javascript
// 获取相机对象
game.camera.getCamera();

// 获取目标位置
game.camera.target;

// 设置目标位置并更新
game.camera.target.x = 50;
game.camera.target.z = 50;
game.camera.updateCameraPosition();
```

### 缩放控制

```javascript
// 获取当前缩放
game.camera.currentZoom;

// 设置缩放
game.camera.currentZoom = 0.5;
game.camera.updateCameraPosition();
```

---

## 地图系统

### 地图信息

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

### 地形查询

```javascript
// 获取特定位置的地形
game.map.getTerrainAt(x, z);

// 检查位置是否可通行
game.map.isWalkable(x, z);

// 检查位置是否可建造
game.map.isBuildable(x, z);
```

### 地图选择面板

```javascript
// 显示地图选择面板
game.mapSelectionPanel.show();

// 隐藏地图选择面板
game.mapSelectionPanel.hide();

// 获取已选地图类型
game.mapSelectionPanel.selectedMapType;
```

### 地图生成器

```javascript
// 获取所有地图类型
game.mapGenerator.getMapTypes();

// 获取地图类型信息
game.mapGenerator.getMapTypeInfo('arabia');
```

---

## 空间索引 (SpatialIndex)

使用 RBush 库进行高效空间查询，优化碰撞检测和实体查询。

```javascript
// 插入实体
game.spatialIndex.insert(entity);

// 移除实体
game.spatialIndex.remove(entity);

// 按范围查询（返回范围内的实体数组）
game.spatialIndex.query(minX, minY, maxX, maxY);

// 清空索引
game.spatialIndex.clear();
```

---

## 建筑放置系统 (BuildingPlacementSystem)

### 放置建筑

```javascript
// 开始放置建筑（需要传入资源管理器）
game.buildingPlacementSystem.startPlacement('house', game.resourceManager);
game.buildingPlacementSystem.startPlacement('barracks', game.resourceManager);
game.buildingPlacementSystem.startPlacement('stable', game.resourceManager);

// 取消放置
game.buildingPlacementSystem.cancelPlacement();

// 检查是否正在放置
game.buildingPlacementSystem.isPlacing;

// 当前放置类型
game.buildingPlacementSystem.currentBuildingType;
```

### 可用建筑类型

```javascript
// 查看所有建筑类型配置
console.log(game.buildingPlacementSystem.buildingTypes);
// 包含: house, barracks, archery, stable, blacksmith, market, tower, castle
```

---

## 寻路系统 (Pathfinding)

```javascript
// 查找路径
const path = game.pathfinding.findPath(startX, startZ, endX, endZ);
console.log(path);

// 检查位置是否可通行
game.pathfinding.isWalkable(x, z);
```

---

## 战斗系统 (CombatSystem)

```javascript
// 注册战斗单位
game.combatSystem.registerCombatant(entity);

// 取消注册
game.combatSystem.unregisterCombatant(entity);

// 查看所有参战单位
game.combatSystem.combatants;

// 查看克制关系表
console.log(game.combatSystem.damageModifiers);

// 查看建筑攻击配置
console.log(game.combatSystem.buildingDamageTypes);
```

---

## 资源收集系统 (ResourceGatheringSystem)

```javascript
// 注册采集者（村民）
game.resourceGatheringSystem.registerGatherer(entity);

// 取消注册
game.resourceGatheringSystem.unregisterGatherer(entity);

// 注册资源节点
game.resourceGatheringSystem.registerResourceNode(node);

// 添加存储点（如城镇中心）
game.resourceGatheringSystem.addDropOffPoint(building, ['wood', 'food', 'gold', 'stone']);

// 查看采集者数量
game.resourceGatheringSystem.gatherers.length;

// 查看资源节点数量
game.resourceGatheringSystem.resourceNodes.length;
```

---

## HUD 界面

HUD 已模块化重构，拆分为 4 个子模块：

### 资源显示 (ResourceDisplay)

```javascript
// 更新资源显示
game.hud.resourceDisplay.updateResourceDisplay();

// 更新人口显示
game.hud.resourceDisplay.updatePopulation(10, 20);

// 更新时代显示
game.hud.resourceDisplay.updateAge('封建时代');
```

### 小地图 (Minimap)

```javascript
// 渲染小地图
game.hud.minimap.render();
```

### 操作面板 (ActionPanel)

```javascript
// 切换建筑面板预设
game.hud.actionPanel.switchToPreset('default');
game.hud.actionPanel.switchToPreset('military');

// 获取当前预设
game.hud.actionPanel.currentPreset;

// 获取城镇中心生产预设
game.hud.actionPanel.getTownCenterProductionPreset();

// 更新建筑面板布局
game.hud.actionPanel.updateBuildingPanelConfig({ rows: 3, cols: 5, totalButtons: 15 });
```

### 信息面板 (InfoPanel)

```javascript
// 更新单位信息显示
game.hud.infoPanel.updateUnitInfo(selectedEntities);

// 设置鼠标世界坐标
game.hud.infoPanel.setMouseWorldPosition({ x: 10, z: 20 });
```

### HUD 主控制器

```javascript
// 切换调试面板
game.hud.toggleDebugPanel();
```

---

## 多玩家颜色系统

玩家颜色定义在 `config.js` 中：

```javascript
// 查看所有玩家颜色
console.log(game.constructor);  // 需要从 config 导入

// 根据 owner 获取颜色
// PLAYER_COLORS: { 1:蓝色, 2:红色, 3:绿色, 4:黄色, 5:橙色, 6:紫色, 7:青色, 8:粉色 }

// OWNER_TO_PLAYER_ID 映射
// player -> 1(蓝), enemy -> 2(红), blue -> 1, red -> 2
```

---

## 快捷调试命令

### 一键添加资源

```javascript
// 添加所有资源各 10000
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
// 升级到指定时代
function setAge(level) {
  game.player.setAgeLevel(level);
  console.log(`已升级到 ${game.player.getAgeName()}`);
}
setAge(4);  // 帝王时代
```

### 快速选择建筑

```javascript
// 选择所有城镇中心
function selectTownCenters() {
  const tcs = game.entities.filter(e => e.buildingType === 'town_center');
  game.selectionManager.selectEntities(tcs);
  return tcs;
}
selectTownCenters();
```

### 查看实体统计

```javascript
function entityStats() {
  const units = game.entities.filter(e => e.type === 'unit');
  const buildings = game.entities.filter(e => e.type === 'building');
  const resources = game.entities.filter(e => e.type === 'resource');
  console.log(`单位: ${units.length}, 建筑: ${buildings.length}, 资源: ${resources.length}`);
  console.log(`玩家单位: ${units.filter(e => e.owner === 'player').length}`);
  console.log(`敌方单位: ${units.filter(e => e.owner === 'enemy').length}`);
  console.log(`村民: ${units.filter(e => e.unitType === 'villager').length}`);
}
entityStats();
```

### 杀死所有敌方单位

```javascript
function killAllEnemies() {
  game.entities.filter(e => e.type === 'unit' && e.owner === 'enemy').forEach(e => e.kill());
  console.log('已杀死所有敌方单位');
}
```

### 重置游戏

```javascript
location.reload();
```

---

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `W`/`S`/`A`/`D` 或 方向键 | 相机移动 |
| 鼠标右键拖拽 | 平移视角 |
| 滚轮 | 缩放视野 |
| 左键点击 | 选择单位/建筑 |
| `Shift` + 左键 | 多选 |
| 拖拽框选 | 批量选择 |
| 右键点击 | 移动/攻击/采集 |
| `Ctrl`+`1`~`5` | 切换编队 |
| `F12` | 显示/隐藏Debug面板 |
| `1`/`2`/`3` | 切换建筑面板布局 |
| `Q`/`E`/`R` | 建筑面板调试 |

---

## 调试技巧

### 1. 查看对象结构

```javascript
console.dir(game.player);
console.dir(game.resourceManager);
console.dir(game.hud.actionPanel.buildingPanelPresets);
```

### 2. 监控资源变化

```javascript
game.resourceManager.addListener((type, amount) => {
  console.log(`[${type}] ${amount}`);
});
```

### 3. 性能检查

```javascript
console.log('实体总数:', game.entities.length);
console.log('单位数:', game.entities.filter(e => e.type === 'unit').length);
console.log('建筑数:', game.entities.filter(e => e.type === 'building').length);
console.log('资源节点数:', game.entities.filter(e => e.type === 'resource').length);
```

### 4. 位置调试

```javascript
game.selectionManager.getSelectedEntities().forEach(e => {
  console.log(e.name, `(${e.position.x.toFixed(1)}, ${e.position.z.toFixed(1)})`);
});
```

### 5. 事件调试

```javascript
game.player.on('ageChange', (data) => console.log('[Age]', data));
game.player.on('populationChange', (data) => console.log('[Pop]', data));
game.player.on('unitAdd', (data) => console.log('[Unit+]', data.unit.name));
game.player.on('unitRemove', (data) => console.log('[Unit-]', data.unit.name));
```

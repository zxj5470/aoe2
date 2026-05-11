# 帝国时代2 Web版功能文档

## UI 系统

### 资源面板
- **位置**: 左上角
- **显示内容**:
  - 资源：肉 🍖、木 🌲、金矿 🏅、石料 🪨
  - 人口：🏠 1/20
  - 当前时代：顶部居中显示时代名称与罗马数字符号

### 建筑面板（ActionPanel）
- **位置**: 左下角
- **模块**: 已从 HUD 拆分为独立 ActionPanel.js
- **默认布局**: 3 行 5 列（15 个格子）
- **可切换布局**: 按 `1`/`2`/`3` 键切换

#### 建筑按钮配置
每个按钮包含以下属性：
- `id`: 建筑 ID
- `icon`: 图标（emoji）
- `name`: 建筑名称
- `type`: 建筑类型（residential/military/economy/defense/special/production/research/age_upgrade/nav/empty）

#### 预设系统
- `default` — 默认建造菜单（房屋、农田、伐木场等）
- `military` — 军事建造菜单（兵营、靶场、马厩等）
- `town_center_production` — 城镇中心生产面板（村民、织布机、城镇瞭望、时代升级）
- `empty` — 空面板

#### 建筑放置
- 选中村民后点击建筑按钮进入放置模式
- 放置模式下鼠标移动显示绿色（有效）/红色（无效）预览
- 左键确认放置，右键或 Escape 取消放置
- 放置后选中村民自动前往建造

#### 建筑列表（default 预设 15 个）
- 第 1 行：房屋、[空白]、农田、伐木场、采矿场
- 第 2 行：瞭望塔、马厩、靶场、城堡、城墙
- 第 3 行：城门、铁匠铺、市场、码头、教堂

### 单位信息面板（InfoPanel）
- **位置**: 底部中间
- **模块**: 已从 HUD 拆分为独立 InfoPanel.js
- **功能**: 显示选中单位的详细信息
- **内容**: 名称、生命值（带进度条）、所属玩家（颜色标识）、属性等
- **村民特殊**: 显示携带资源类型和数量
- **建筑特殊**: 显示建筑类型、建造状态

### 小地图（Minimap）
- **位置**: 右下角
- **模块**: 已从 HUD 拆分为独立 Minimap.js
- **显示方式**: 菱形坐标变换
- **功能**:
  - 点击跳转到对应位置
  - 拖拽平移视角
  - 显示实体点（颜色对应玩家归属）
  - 显示白色视野框

### 地图选择面板（MapSelectionPanel）
- **位置**: 游戏启动前全屏覆盖
- **功能**: 选择地图类型后开始游戏
- **可选地图**: Arabia、Arena、BlackForest、Grassland、Islands、River、Highland、GoldRush

### Debug 面板
- **位置**: 右上角
- **切换**: 按 `F12` 键显示/隐藏
- **显示内容**:
  - 相机位置（Position、Target、Zoom）
  - 鼠标位置（屏幕坐标、世界坐标、网格坐标）
  - 拾取实体信息（类型、名称、位置、所属、生命值）
  - 小地图视野（四角坐标）
  - 地图范围

## 相机系统

### 视角配置
- **相机类型**: 正交摄像机（OrthographicCamera）
- **视角方向**: 东南方向 45 度俯视
- **俯仰角度**: 精确 45 度
- **固定朝向**: 不支持旋转，只支持平移

### 移动控制
- **键盘控制**: `W`/`S`/`A`/`D` 或方向键
- **鼠标边缘滚动**: 移动到屏幕边缘触发滚动
- **鼠标拖拽**: 右键拖拽平移
- **滚轮缩放**: 调整视野大小
- **时代显示区**: 鼠标悬停时代显示区域，上半区向前滚动，下半区向后滚动

## 实体系统

### 单位类型
| 类型 | 生命值 | 速度 | 攻击 | 范围 | 护甲 | 视野 |
|------|--------|------|------|------|------|------|
| 村民 villager | 25 | 5 | 3 | 1 | 0 | 4 |
| 士兵 soldier | 40 | 4 | 6 | 1 | 1 | 4 |
| 骑士 knight | 60 | 6 | 10 | 1 | 2 | 4 |
| 弓箭手 archer | 30 | 4 | 5 | 5 | 0 | 6 |
| 侦察兵 scout | 35 | 8 | 3 | 1 | 0 | 6 |

### 建筑类型
| 类型 | 尺寸 | 生命值 | 资源消耗 |
|------|------|--------|----------|
| 房屋 house | 2x2 | 500 | 木 50 |
| 农田 farm | 3x3 | 200 | 木 60 |
| 伐木场 lumber-camp | 2x2 | 300 | 木 100 |
| 采矿场 mining-camp | 2x2 | 300 | 木 100 |
| 兵营 barracks | 3x3 | 800 | 木 150 |
| 靶场 archery | 3x3 | 700 | 木 175 |
| 马厩 stable | 3x3 | 700 | 木 175 |
| 铁匠铺 blacksmith | 3x3 | 600 | 木 175 |
| 市场 market | 3x3 | 600 | 木 175 |
| 瞭望塔 watch-tower | 2x2 | 1000 | 石 100 |
| 城堡 castle | 5x5 | 3000 | 石 600 金 300 |

### 资源类型
| 类型 | 几何体 | 典型数量 |
|------|--------|----------|
| 木材 wood | 树木 | 150 |
| 石材 stone | 岩石 | 200 |
| 黄金 gold | 金矿 | 300 |
| 食物 food | 浆果丛 | 100 |
| 羊 sheep（食物） | 羊模型 | 100 |

## 玩家系统

### Player 属性
- `id` — 玩家 ID（HUMAN_OWNER = 'blue'）
- `resourceManager` — 资源管理器（Player 属性）
- `ageLevel` — 时代等级（1-4）
- `population` — 人口（current/max）
- `units` — 玩家拥有的单位列表

### 时代系统
| 等级 | 名称 | 罗马数字 | 升级消耗 |
|------|------|----------|----------|
| 1 | 黑暗时代 | I | — |
| 2 | 封建时代 | II | 食物 500 金 250 |
| 3 | 城堡时代 | III | 食物 800 金 400 |
| 4 | 帝王时代 | IV | 食物 1000 金 800 |

### 多玩家颜色
| 玩家 ID | 颜色 | owner 值 |
|---------|------|----------|
| 1 | 蓝色 | blue（人类玩家） |
| 2 | 红色 | red（敌方） |
| 3-8 | 绿/黄/橙/紫/青/粉 | 预留 |

> 判断玩家归属必须使用 `entity.isPlayerOwned()` / `entity.isEnemy()`，不要硬编码 `owner === 'player'`。

## HUD API

HUD 已模块化重构为 4 个子模块 + 主协调器。

### ResourceDisplay
```javascript
game.hud.resourceDisplay.updateResourceDisplay();
game.hud.resourceDisplay.updatePopulation(10, 20);
game.hud.resourceDisplay.updateAge('封建时代');
```

### Minimap
```javascript
game.hud.minimap.render();
```

### ActionPanel
```javascript
// 切换预设
game.hud.actionPanel.switchToPreset('default');
game.hud.actionPanel.switchToPreset('military');
game.hud.actionPanel.switchToPreset('town_center_production');

// 获取当前预设
game.hud.actionPanel.currentPreset;

// 清除建筑按钮激活状态
game.hud.actionPanel.clearActiveBuildingButton();
```

### InfoPanel
```javascript
game.hud.actionPanel.updateUnitInfo(selectedEntities);
game.hud.infoPanel.setMouseWorldPosition({ x: 10, z: 20 });
game.hud.infoPanel.toggleDebugPanel();
```

### HUD 主控制器
```javascript
game.hud.updateResourceDisplay();
game.hud.updatePopulation(current, max);
game.hud.updateAge('封建时代');
game.hud.toggleDebugPanel();
game.hud.showNotification('消息', 3000);
```

## 调试接口

### gameDebug 全局对象
```javascript
// 打印指定区域网格状态
gameDebug.printGridArea(x, z, radius);

// 打印指定格子状态
gameDebug.printCell(x, z);

// 打印所有资源节点信息
gameDebug.printResources();

// 获取游戏实例
gameDebug.getGame();

// 获取网格实例
gameDebug.getGrid();

// 获取碰撞系统实例
gameDebug.getCollisionSystem();

// 获取寻路系统实例
gameDebug.getPathfinding();
```

### 资源管理（通过 Player 属性）
```javascript
// 查看所有资源
game.resourceManager.getAllResources();

// 添加资源
game.resourceManager.addResource('wood', 1000);

// 检查资源是否足够
game.resourceManager.hasEnoughResources({ wood: 100, food: 50 });

// 消耗资源
game.resourceManager.spendResources({ wood: 100, gold: 50 });
```

### 时代管理
```javascript
game.player.getAgeLevel();       // 1-4
game.player.getAgeName();        // '黑暗时代'
game.player.setAgeLevel(2);      // 升级到封建时代
game.player.getAgeRomanNumeral(); // 'II'
```

### 人口管理
```javascript
game.player.population.current;
game.player.population.max;
game.player.setMaxPopulation(200);
game.player.canTrainUnit();
```

### 事件监听
```javascript
game.player.on('ageChange', (data) => { /* data: { oldLevel, newLevel, ageName, romanNumeral } */ });
game.player.on('populationChange', (data) => { /* data: { oldCurrent, newCurrent, max } */ });
game.player.on('unitAdd', (data) => { /* data: { unit } */ });
game.player.on('unitRemove', (data) => { /* data: { unit } */ });
```

### 快捷调试命令
```javascript
// 一键添加所有资源各 10000
game.resourceManager.addResource('wood', 10000);
game.resourceManager.addResource('food', 10000);
game.resourceManager.addResource('gold', 10000);
game.resourceManager.addResource('stone', 10000);

// 一键升级时代
game.player.setAgeLevel(4);  // 帝王时代

// 选择城镇中心
game.entityManager.selectTownCenter();

// 查看实体统计
const units = game.entities.filter(e => e.type === 'unit');
const buildings = game.entities.filter(e => e.type === 'building');
const resources = game.entities.filter(e => e.type === 'resource');
console.log(`单位: ${units.length}, 建筑: ${buildings.length}, 资源: ${resources.length}`);

// 杀死所有敌方单位
game.entities.filter(e => e.type === 'unit' && e.isEnemy()).forEach(e => e.kill());
```

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

## 技术实现要点

### 相机位置计算
```javascript
const height = this.zoomLevel / Math.sqrt(2);
this.position.x = this.target.x + height;
this.position.z = this.target.z - height;
this.position.y = height;
```

### 小地图坐标变换
```javascript
// 正向变换（世界坐标 → 屏幕坐标）
const nx = (x - minX) / (maxX - minX) - 0.5;
const nz = (z - minZ) / (maxZ - minZ) - 0.5;
const screenX = (nx - nz) * width * 0.5 + width / 2;
const screenY = (nx + nz) * height * 0.5 + height / 2;
```

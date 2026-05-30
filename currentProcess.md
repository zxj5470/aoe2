# 帝国时代2 Web版 - 项目当前进度

**项目名称**: aoe2-web
**当前版本**: v0.5.1-alpha
**更新日期**: 2026-05-27

---

## 一、项目概述

基于 Three.js 和 Vite 构建的《帝国时代2》网页版复刻项目，使用现代 Web 技术还原经典 RTS 游戏的体验。

**技术栈**:
- Three.js (^0.160.0) - 3D 渲染引擎
- Vite (^5.0.0) - 构建工具
- RBush (^4.0.1) - 空间索引
- JavaScript (ES Modules)

---

## 二、已实现功能

### 2.1 核心系统

| 系统 | 功能 | 状态 |
|------|------|------|
| 游戏循环 | Game.js 主控制器，场景管理 | ✅ |
| 相机系统 | 正交相机，45度俯视，键盘/鼠标/边缘滚动控制 | ✅ |
| 输入系统 | 键盘、鼠标、相机控制 | ✅ |
| 场景系统 | 200x200网格地图，地形渲染 | ✅ |
| 空间索引 | RBush R-tree 优化碰撞检测和实体查询 | ✅ |

### 2.2 实体系统

**单位 (5种)**:
| 类型 | 特性 |
|------|------|
| 村民 | 可采集资源，携带容量10单位 |
| 士兵 | 基础战斗单位 |
| 骑士 | 高生命值，高攻击 |
| 弓箭手 | 远程攻击 |
| 侦察兵 | 快速移动 |

**建筑 (11种 + 城门)**: house、barracks、stable、archery_range、market、church、blacksmith、watch_tower、castle、town_center、wall、gate

**资源节点 (5种)**: 木材(树木)、石材(岩石)、黄金(金矿)、食物(浆果丛)、羊

### 2.3 移动与寻路

- **A*寻路算法**: 完整实现，路径缓存(1000条，10秒TTL)，支持对角线移动
- **编队系统**: 5种队形(line/column/square/wedge/circle)，快捷键 Ctrl+1~5 切换
- **右键移动**: 点击地面移动单位/编队

### 2.4 资源收集系统

- 村民右键点击资源节点自动采集
- 携带容量限制(10单位)
- 自动寻找最近存储点(城镇中心)
- 完整采集循环: 采集→返回→存储→继续采集
- 资源耗尽后自动清理

### 2.5 建筑系统

- 建筑放置预览与位置验证
- 建筑资源消耗检查
- 网格对齐放置
- 城镇中心作为资源存储点
- 城墙建造与旋转放置
- 城门建筑
- 建筑类型枚举中心化 (BUILDING_TYPES)

### 2.6 战斗系统

- 攻击判定与伤害计算
- 单位属性: 攻击、防御、速度、护甲
- 单位克制关系
- 护甲减免
- 攻击冷却
- 基础AI状态机 (idle/patrol/chase/attack/flee)

### 2.7 生产系统

- 建筑生产队列
- 单位训练
- 科技研究 (织布机、城镇瞭望)
- 时代升级

### 2.8 多玩家系统

- 8色玩家颜色 (AOE2经典8色)
- 玩家ID映射 (player/enemy → PlayerID → 颜色)
- 阿拉伯地图双城镇中心 (红蓝双方各3村民、8只羊)
- Player事件系统 (ageChange、populationChange、unitAdd、unitRemove)

### 2.9 UI系统

**HUD界面**:
| 面板 | 功能 |
|------|------|
| 资源面板 | 肉、木、金、石显示，人口数，当前时代 |
| 建筑面板 | 按钮动态配置，支持默认建造菜单和军事菜单 |
| 单位信息面板 | 名称、生命值(进度条)、属性、所属玩家颜色 |
| 小地图 | 菱形坐标变换，点击跳转，显示实体点和视野框 |
| Debug面板 | 相机位置、地图范围、鼠标坐标、拾取实体信息 |
| 地图选择面板 | 游戏启动前选择地图类型 |

**其他UI特性**:
- 血条悬停显示与渐隐动画
- 罗马数字时代显示
- 村民携带资源显示

### 2.10 地图生成器 (8种地形)

Arabia、Arena、BlackForest、GoldRush、Grassland、Highland、Islands、River

### 2.11 代码质量

- BUILDING_TYPES 枚举替代硬编码字符串
- BUILDING_CONFIG 统一建筑配置单一数据源
- BUILDING_TYPE_ALIASES 别名映射
- HUD 模块化重构 (ResourceDisplay、Minimap、ActionPanel、InfoPanel、HUD)
- 实体系统拆分 (UnitBase/UnitMovement/UnitCombat/UnitGathering/UnitAnimation/UnitCollision, BuildingBase/BuildingConstruction/BuildingProduction/BuildingCollision)
- isPlayerOwned() / isEnemy() 方法判断玩家归属

---

## 三、开发进度统计

| 指标 | 数值 |
|------|------|
| 总阶段数 | 10 |
| 已完成阶段 | 3 (第一/二/三阶段) |
| 进行中阶段 | 4 (第四/五/八/九阶段部分完成) |
| 待开发阶段 | 3 (第六/七/十阶段) |
| 阶段完成度 | 3/10 (30%) 完成, 4/10 (40%) 进行中 |
| 整体进度 | ~68% |

---

## 四、项目结构

```
src/
├── main.js                         # 应用入口
├── config.js                       # 全局配置常量 (BUILDING_TYPES, BUILDING_CONFIG等)
├── emojis.js                       # 建筑表情配置
├── core/                           # 核心系统
│   ├── Game.js                     # 游戏主控制器
│   ├── Scene.js                    # 场景管理器
│   ├── Camera.js                   # 相机控制器
│   ├── EntityManager.js            # 实体 CRUD + 查询
│   ├── SystemManager.js            # 系统初始化和管理
│   ├── EventManager.js             # DOM 事件委托 + 事件总线
│   ├── UIManager.js                # HUD 生命周期管理
│   └── SpatialIndex.js             # RBush R-tree 空间索引
├── entities/                       # 实体系统
│   ├── Entity.js                   # 实体基类
│   ├── Player.js                   # 玩家状态
│   ├── ResourceManager.js          # 资源管理
│   ├── ResourceNode.js             # 资源节点
│   ├── RomanNumeralCanvas.js       # 罗马数字时代显示
│   ├── UnitBase.js                 # 单位基础属性
│   ├── Unit.js                     # 单位（组合子模块）
│   ├── UnitMovement.js             # 移动逻辑
│   ├── UnitCombat.js               # 战斗逻辑
│   ├── UnitGathering.js            # 资源采集逻辑
│   ├── UnitAnimation.js            # 动画逻辑
│   ├── UnitCollision.js            # 碰撞逻辑
│   ├── BuildingBase.js             # 建筑基础属性
│   ├── Building.js                 # 建筑（组合子模块）
│   ├── BuildingConstruction.js     # 建造逻辑
│   ├── BuildingProduction.js       # 生产逻辑
│   └── BuildingCollision.js        # 碰撞逻辑
├── systems/                        # 游戏系统
│   ├── Pathfinding.js              # A*寻路
│   ├── FormationSystem.js          # 编队系统
│   ├── CombatSystem.js             # 战斗系统
│   ├── BuildingPlacementSystem.js  # 建筑放置系统
│   ├── ResourceGatheringSystem.js  # 资源收集系统
│   ├── CollisionSystem.js          # 碰撞检测系统
│   └── AISystem.js                 # AI 状态机
├── input/                          # 输入系统
│   ├── InputHandler.js             # 输入处理
│   └── SelectionManager.js         # 选择管理
├── ui/                             # UI 系统
│   ├── HUD.js                      # HUD 主协调器
│   ├── ResourceDisplay.js          # 资源显示
│   ├── Minimap.js                  # 小地图
│   ├── ActionPanel.js              # 操作面板
│   ├── InfoPanel.js                # 信息面板
│   └── MapSelectionPanel.js        # 地图选择面板
└── world/                          # 世界系统
    ├── Map.js                      # 地图系统
    ├── MapConfig.js                # 地图配置
    ├── MapGenerator.js             # 地图生成器
    ├── Terrain.js                  # 地形系统
    ├── TerrainMeshBuilder.js       # 地形网格构建
    ├── Grid.js                     # 网格系统
    └── generators/                 # 8 种地图生成器
```

---

## 五、下一步开发方向

### 优先级 P0
- 建筑建造进度显示与取消 (第四阶段核心未完成项)

### 优先级 P1
- 生产队列管理完善 (第六阶段起点)
- 防御建筑攻击逻辑
- AI系统完善 (巡逻/追击/逃跑状态机)

### 优先级 P2
- 属性升级系统
- 科技树完善
- 战争迷雾
- 视锥剔除与LOD

---

**详细路线图**: 见 [roadmap.md](roadmap.md)

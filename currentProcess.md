# 帝国时代2 Web版 - 项目当前进度

**项目名称**: aoe2-web
**当前版本**: v0.5.1-alpha
**更新日期**: 2026-05-12

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

### 2.2 实体系统

**单位 (5种)**:
| 类型 | 特性 |
|------|------|
| 村民 | 可采集资源，携带容量10单位 |
| 士兵 | 基础战斗单位 |
| 骑士 | 高生命值，高攻击 |
| 弓箭手 | 远程攻击 |
| 侦察兵 | 快速移动 |

**建筑 (10种)**: house、barracks、stable、archery_range、market、church、blacksmith、watch_tower、castle、town_center

**资源节点 (4种)**: 木材(树木)、石材(岩石)、黄金(金矿)、食物(浆果丛)

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

### 2.6 战斗系统(基础)

- 攻击判定与伤害计算
- 单位属性: 攻击、防御、速度、护甲
- 单位克制关系

### 2.7 UI系统

**HUD界面**:
| 面板 | 功能 |
|------|------|
| 资源面板 | 肉、木、金、石显示，人口数，当前时代 |
| 建筑面板 | 15个按钮，支持3种布局(3x5/4x3/4x4)，空白占位 |
| 单位信息面板 | 名称、生命值(进度条)、属性 |
| 小地图 | 菱形坐标变换，点击跳转，显示实体点和视野框 |
| Debug面板 | 相机位置、地图范围、建筑面板配置 |

**键盘快捷键**:
| 按键 | 功能 |
|------|------|
| W/S/A/D 或 方向键 | 相机移动 |
| 鼠标右键拖拽 | 平移视角 |
| 滚轮 | 缩放视野 |
| 左键点击 | 选择单位/建筑 |
| Shift + 左键 | 多选 |
| 拖拽框选 | 批量选择 |
| 右键点击 | 移动/攻击/采集 |
| Ctrl+1~5 | 切换编队 |
| F12 | 显示/隐藏Debug面板 |
| 1/2/3 | 切换建筑面板布局 |
| Q/E/R | 建筑面板调试 |

### 2.8 地图生成器 (8种地形)

Arabia、ArabiaGenerator、Arena、BlackForest、GoldRush、Grassland、Highland、Islands、River

---

## 三、开发进度统计

| 指标 | 数值 |
|------|------|
| 总阶段数 | 10 |
| 已完成阶段 | 3 (第一/二/三阶段) |
| 进行中阶段 | 2 (第四/五阶段部分完成) |
| 任务完成度 | 52/60 (87%) |
| 阶段完成度 | 5/10 (50%) |

---

## 四、项目结构

```
src/
├── main.js              # 应用入口
├── config.js            # 配置文件
├── core/                # 核心系统
│   ├── Game.js          # 游戏主控制器
│   ├── Scene.js         # 场景管理器
│   ├── Camera.js        # 相机系统
│   └── SpatialIndex.js  # 空间索引(RBush)
├── entities/            # 实体
│   ├── Entity.js        # 实体基类
│   ├── Unit.js          # 单位类
│   ├── Building.js       # 建筑类
│   ├── ResourceNode.js  # 资源节点
│   ├── Player.js        # 玩家
│   ├── ResourceManager.js # 资源管理
│   └── RomanNumeralCanvas.js # 罗马数字
├── systems/             # 游戏系统
│   ├── MovementSystem.js      # 移动系统
│   ├── Pathfinding.js         # A*寻路
│   ├── FormationSystem.js     # 编队系统
│   ├── CollisionSystem.js     # 碰撞系统
│   ├── CombatSystem.js        # 战斗系统
│   ├── BuildingPlacementSystem.js # 建筑放置
│   └── ResourceGatheringSystem.js # 资源收集
├── input/               # 输入系统
│   ├── InputHandler.js      # 输入处理
│   └── SelectionManager.js  # 选择管理
├── ui/                  # UI系统
│   ├── HUD.js               # HUD主控制器
│   └── MapSelectionPanel.js  # 小地图面板
└── world/               # 世界系统
    ├── Map.js           # 地图
    ├── Grid.js          # 网格
    ├── Terrain.js       # 地形
    ├── MapConfig.js     # 地图配置
    ├── MapGenerator.js  # 地图生成器
    ├── TerrainMeshBuilder.js # 地形网格构建
    └── generators/      # 地形生成器
        ├── ArabiaGenerator.js
        ├── ArenaGenerator.js
        ├── BlackForestGenerator.js
        ├── GoldRushGenerator.js
        ├── GrasslandGenerator.js
        ├── HighlandGenerator.js
        ├── IslandsGenerator.js
        └── RiverGenerator.js
```

---

## 五、下一步开发方向

- 完成第四阶段: 建筑建造系统(建筑升级、建筑队列)
- 完成第五阶段: 战斗系统(战斗动画、单位死亡)
- 第六阶段: 经济系统(科技树、时代演进)
- 第七阶段: AI系统

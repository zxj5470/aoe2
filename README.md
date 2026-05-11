# 帝国时代2 Web版 (Age of Empires II Web)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.5.1--alpha-orange.svg)](https://github.com/)

一个基于Three.js和Vite构建的《帝国时代2》网页版复刻项目，旨在使用现代Web技术还原经典RTS游戏的体验。

## 在线演示

> 待部署后添加演示链接

## 功能特性

### 已实现功能
- **基础架构**: 游戏循环、场景管理、相机系统、EntityManager/SystemManager/EventManager/UIManager 分层架构
- **地图系统**: 200x200 网格地图、地形高度系统（Diamond-Square 算法）、8 种地图生成器（Arabia、Arena、BlackForest、Grassland、Islands、River、Highland、GoldRush）
- **实体系统**: 单位（5 种类型）、建筑（11 种类型 + 城镇中心）、资源节点（4 种类型 + 羊）
- **移动系统**: A*寻路算法（路径缓存 1000 条/10 秒 TTL）、5 种编队队形
- **资源收集**: 完整采集→运输→存储循环、村民携带容量限制、自动寻找最近存储点
- **战斗系统**: 攻击判定、伤害计算、单位克制、护甲减免、攻击冷却
- **建造系统**: 建筑放置预览与验证、资源消耗检查、村民自动建造
- **生产系统**: 建筑生产队列、单位训练、科技研究、时代升级
- **多玩家系统**: 8 色玩家颜色、玩家 ID 映射、阿拉伯地图双城镇中心
- **AI 系统**: 基础状态机（idle/patrol/chase/attack/flee）
- **UI 系统**: HUD 模块化（ResourceDisplay、Minimap、ActionPanel、InfoPanel）、血条悬停渐隐、罗马数字时代显示
- **空间索引**: RBush R-tree 优化碰撞检测和实体查询
- **调试功能**: 调试面板、控制台调试接口（gameDebug）、碰撞体积可视化

### 开发中功能
- 建筑建造进度显示与取消
- 属性升级系统
- 防御建筑攻击
- 科技树完善
- 战争迷雾
- 视锥剔除与 LOD

## 技术栈

- 渲染引擎: Three.js (^0.160.0)
- 构建工具: Vite (^5.0.0)
- 开发语言: JavaScript (ES6+ Modules)
- 空间索引: RBush (^4.0.1)

## 安装与运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 http://localhost:5173 查看项目

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 dist/ 目录

### 预览生产版本

```bash
npm run preview
```

## 控制说明

### 相机控制
| 操作 | 功能 |
|------|------|
| W / ↑ | 向北西方向移动 |
| S / ↓ | 向南东方向移动 |
| A / ← | 向南西方向移动 |
| D / → | 向北东方向移动 |
| 鼠标右键拖拽 | 平移视角 |
| 鼠标滚轮 | 缩放视野 |
| 鼠标移至屏幕边缘 | 自动滚动 |

### 游戏操作
| 操作 | 功能 |
|------|------|
| 左键点击 | 选择单位/建筑/确认建筑放置 |
| Shift + 左键 | 多选单位 |
| 拖拽框选 | 批量选择 |
| 右键点击 | 移动/攻击/采集；建筑放置时取消放置 |
| Escape | 取消建筑放置 |
| Ctrl+1~5 | 切换编队类型 |
| F12 | 显示/隐藏 Debug 面板 |
| H | 选择城镇中心 |
| C | 切换碰撞体积可视化 |
| V | 切换建筑面板预设 |

## 项目结构

```
aoe2/
├── src/
│   ├── main.js                         # 应用入口
│   ├── config.js                       # 全局配置常量
│   ├── core/                           # 核心系统
│   │   ├── Game.js                     # 游戏主控制器
│   │   ├── Scene.js                    # 场景管理器
│   │   ├── Camera.js                   # 相机控制器
│   │   ├── EntityManager.js            # 实体 CRUD + 查询
│   │   ├── SystemManager.js            # 系统初始化和管理
│   │   ├── EventManager.js             # DOM 事件委托 + 事件总线
│   │   ├── UIManager.js                # HUD 生命周期管理
│   │   └── SpatialIndex.js             # RBush R-tree 空间索引
│   ├── entities/                       # 实体系统
│   │   ├── Entity.js                   # 实体基类
│   │   ├── Player.js                   # 玩家状态（资源、人口、时代、科技）
│   │   ├── ResourceManager.js          # 资源管理（Player 属性）
│   │   ├── ResourceNode.js             # 资源节点
│   │   ├── RomanNumeralCanvas.js       # 罗马数字时代显示
│   │   ├── UnitBase.js                 # 单位基础属性
│   │   ├── Unit.js                     # 单位（组合子模块）
│   │   ├── UnitMovement.js             # 移动逻辑
│   │   ├── UnitCombat.js               # 战斗逻辑
│   │   ├── UnitGathering.js            # 资源采集逻辑
│   │   ├── UnitAnimation.js            # 动画逻辑
│   │   ├── UnitCollision.js            # 碰撞逻辑
│   │   ├── BuildingBase.js             # 建筑基础属性
│   │   ├── Building.js                 # 建筑（组合子模块）
│   │   ├── BuildingConstruction.js     # 建造逻辑
│   │   ├── BuildingProduction.js       # 生产逻辑
│   │   └── BuildingCollision.js        # 碰撞逻辑
│   ├── systems/                        # 游戏系统
│   │   ├── Pathfinding.js              # A*寻路（路径缓存）
│   │   ├── FormationSystem.js          # 编队系统（5 种队形）
│   │   ├── CombatSystem.js             # 战斗系统（攻击/克制）
│   │   ├── BuildingPlacementSystem.js  # 建筑放置系统
│   │   ├── ResourceGatheringSystem.js  # 资源收集系统
│   │   ├── CollisionSystem.js          # 碰撞检测系统
│   │   └── AISystem.js                # AI 状态机
│   ├── input/                          # 输入系统
│   │   ├── InputHandler.js             # 输入处理
│   │   └── SelectionManager.js         # 选择管理
│   ├── ui/                             # UI 系统
│   │   ├── HUD.js                      # HUD 主协调器
│   │   ├── ResourceDisplay.js          # 资源显示
│   │   ├── Minimap.js                  # 小地图
│   │   ├── ActionPanel.js              # 操作面板
│   │   ├── InfoPanel.js                # 信息面板
│   │   └── MapSelectionPanel.js        # 地图选择面板
│   └── world/                          # 世界系统
│       ├── Map.js                      # 地图系统
│       ├── MapConfig.js                # 地图配置
│       ├── MapGenerator.js             # 地图生成器
│       ├── Terrain.js                  # 地形系统
│       ├── TerrainMeshBuilder.js       # 地形网格构建
│       ├── Grid.js                     # 网格系统
│       └── generators/                 # 8 种地图生成器
├── index.html                          # HTML 入口（包含所有 CSS 和 DOM 结构）
├── package.json                        # 项目配置
├── AGENTS.md                           # Agent 开发指南
├── roadmap.md                          # 开发路线图
└── docs/                               # 文档
    ├── dev-debug.md                    # 调试指令文档
    ├── plans/                          # 开发计划
    └── blog/                           # 开发反思日志
```

## 开发路线图

详见 [roadmap.md](roadmap.md)。

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (git checkout -b feature/AmazingFeature)
3. 提交更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启 Pull Request

### 代码规范
- 使用 ES6+ 语法
- 类名使用大驼峰命名（PascalCase）
- 方法名使用小驼峰命名（camelCase）
- 常量使用大写蛇形命名（UPPER_SNAKE_CASE）
- 判断玩家归属必须使用 `entity.isPlayerOwned()` / `entity.isEnemy()`

### 提交规范

```
<type>: <subject>

<body>

<footer>
```

类型（type）:
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## 许可证

本项目基于 MIT License 开源。

## 致谢

- 灵感来源于经典游戏《帝国时代2》（Age of Empires II）
- 使用 Three.js 强大的 3D 渲染能力
- 使用 Vite 快速的开发体验

## 联系方式

- 问题反馈: GitHub Issues
- 项目主页: GitHub Repository

---

**注意**: 本项目仅供学习和研究使用，与微软及《帝国时代》系列游戏官方无关。

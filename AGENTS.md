## 对于LLM
1. 思考过程使用中文。
2. 执行的命令使用powershell，执行多个命令之间需要用分号分隔开。

## 前端代码犯过的蠢事
1. 如果用户没有特别要求，不应该在代码调用过程中使用 import 语句。
2. 开发过程不需要集成验证例如执行 npm run build和npm run dev，已经有一个dev环境启动了。
3. **建筑物 id 命名不一致**：在 `EntityManager.js` 中使用下划线命名（如 `archery_range`、`watch_tower`），而在 `ActionPanel.js` 中使用连字符命名（如 `archery-range`、`watch-tower`）。这可能导致匹配失败。需要在引用时进行规范化处理，或统一命名规范。

## 常用命令

| 命令 | 用途 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 (localhost:5173) |
| `npm run build` | 生产构建 → dist/ |
| `npm run preview` | 预览生产构建 |

无测试框架、无 linter、无 vite.config.js（使用 Vite 默认配置）。

## 项目架构

帝国时代2 Web版 — 基于 Three.js + Vite 的浏览器 RTS 游戏。纯 JavaScript (ES Modules)，无 TypeScript，无前端框架。

### 核心架构：Game 中心控制器 + Entity-System 模式

```
Game (src/core/Game.js) — 主控制器，暴露为 window.game
├── EntityManager      → 实体 CRUD + 查询
├── SystemManager      → 初始化和管理所有游戏系统
├── EventManager       → DOM 事件委托 + 自定义事件总线
├── UIManager          → HUD 生命周期管理
├── Scene              → Three.js 场景 (src/core/Scene.js)
├── Camera             → 正交相机，45° 等轴视角 (src/core/Camera.js)
└── Player             → 玩家状态（资源、人口、时代、科技）
```

### 游戏循环

`Game.animate()` → requestAnimationFrame → updateCore → updateSystems → updateUI → updateEntities → render

### 实体层次（继承 + 委托组合）

```
Entity (基类)
├── UnitBase → Unit（包含 Movement/Combat/Gathering/Animation/Collision 子系统）
├── BuildingBase → Building（包含 Construction/Production/Collision 子系统）
└── ResourceNode
```

Unit 和 Building 通过组合模式委托给子系统对象，不是纯 ECS。

### 关键目录

| 目录 | 职责 |
|------|------|
| `src/core/` | Game, Scene, Camera, EntityManager, SystemManager, EventManager |
| `src/entities/` | Entity 基类、Unit、Building、ResourceNode 及其子系统 |
| `src/systems/` | Pathfinding(A*), FormationSystem, CombatSystem, ResourceGatheringSystem, BuildingPlacementSystem, CollisionSystem, AISystem |
| `src/input/` | InputHandler, SelectionManager |
| `src/ui/` | HUD, ResourceDisplay, Minimap, ActionPanel, InfoPanel（纯 DOM 操作，无框架） |
| `src/world/` | Map, Terrain, Grid, SpatialIndex(RBush), MapGenerator + 8种地图生成器 |

### 重要设计决策

- **index.html 包含所有 CSS 和 DOM 结构**，不拆分为单独文件
- **所有 3D 模型为程序化生成**（Three.js 基本几何体），无外部模型文件
- **UI 是 HTML/CSS 覆盖层**，直接操作 DOM，无 React/Vue
- **SpatialIndex** 使用 RBush R-tree 做空间查询（碰撞检测、资源邻近查找）
- **Pathfinding** 有路径缓存（1000条，10秒 TTL）
- **配置常量**统一在 `src/config.js`

### 玩家 Owner 约定

- **人类玩家 PlayerID = 1**（`HUMAN_PLAYER_ID`，定义在 `src/config.js`）
- owner 字符串通过 `OWNER_TO_PLAYER_ID` 映射到玩家ID：`blue` → 1（人类），`red` → 2（敌方）
- **判断玩家归属必须使用 `entity.isPlayerOwned()` / `entity.isEnemy()`**，不要硬编码 `owner === 'player'`
- 原因：地图生成器使用颜色名（blue/red）作为 owner，不是 `'player'`/`'enemy'`

### 代码规范

- ES6+ 语法
- 类名 PascalCase，方法名 camelCase，常量 UPPER_SNAKE_CASE
- 提交格式：`<type>: <subject>`（feat/fix/docs/style/refactor/test/chore）

### 依赖

| 包 | 版本 | 用途 |
|----|------|------|
| three | ^0.160.0 | 3D 渲染引擎 |
| rbush | ^4.0.1 | R-tree 空间索引 |
| vite | ^5.0.0 | 构建工具 + 开发服务器 |
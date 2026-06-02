## 禅道项目状态

本项目使用禅道（ZenTao）进行进度管理，通过 Claude Code 的 `zentao-cli` / `zentao-api` skill 与禅道交互。支持查询/创建/更新需求、Bug、任务等操作，用户可直接用自然语言下达项目管理指令。

常用示例：
- `zentao project` / `zentao bug --page=1 --product=1` → 查询项目/Bug 列表
- `zentao story create --product=1 --title="需求标题" --reviewer=admin` → 创建需求
- `zentao bug create --product=1 --title="Bug标题" --severity=2 --openedBuild="主干"` → 创建 Bug
- `zentao story close <id> --data='{"closedReason":"done"}'` → 关闭需求
- `zentao bug resolve <id> --data='{"resolution":"fixed","resolvedBuild":"trunk"}'` → 解决 Bug


> **重要**：代码实现完成不等于需求已关闭。需求/Bug 的状态变更（close/resolve/activate）必须经用户明确确认后方可执行。未经用户验证，只能将需求标记为「待验证」，不得在禅道中变更状态。

### 工作流

1. **开始任务前**：在 AGENTS.md 添加当前正在处理的事项
2. **执行任务**：在代码中完成修复或功能开发
3. **完成任务后**：
   - 将需求列入 AGENTS.md「待验证需求」列表
   - 从 AGENTS.md 删除进行中标记
   - **等待用户验证通过后**，由用户指示或在用户确认后调用禅道更新状态（Bug → resolve，需求 → close）
> 数据来源：禅道 (zentao-cli)，更新时间：2026-05-31

### 项目概况

| 字段 | 值 |
|------|-----|
| 项目名称 | aoe2 |
| 状态 | 进行中 |
| 周期 | 2026-05-17 ~ 2027-05-16 (260天) |
| 预估工时 | 15.25h |
| 已消耗 | 9h |
| 剩余 | 6.25h |
| 团队成员 | admin |

### 当前迭代

**Sprint 1 - v0.5.1 收口里程碑**（2026-05-17 ~ 2026-05-31）— 状态：进行中

### 已完成任务

| 禅道ID | 任务名称 | 完成时间 |
|--------|----------|----------|
| 1 | [P0] 补充BuildingPlacementSystem的CHURCH建筑配置 | 2026-05-27 |
| 2 | [P0] 补充TOWN_CENTER在getBuildingWidth/Depth/Height的条目 | 2026-05-27 |
| 3 | [P0] 移除BuildingBase.js高频调试日志 | 2026-05-27 |
| 4 | [P0] 补充BUILDING_TYPE_ALIASES短名映射 | 2026-05-27 |
| 5 | [P0] 确认并修复ageUpgradeCosts数值 | 2026-05-27 |
| 6 | [P0] 统一建筑ID命名（下划线标准化） | 2026-05-27 |
| 7 | [P0] 收敛战斗执行链（CombatSystem统一仲裁） | 2026-05-27 |
| 8 | [P1] 同步项目文档版本号与状态描述 | 2026-05-27 |
| 9 | [P1] 补齐兵营/靶场/马厩生产面板 | 2026-05-27 |
| 10 | [P1] 补齐建筑建造取消与建造中进度UI | 2026-05-27 |
 11 | [P1] 接通防御建筑自动攻击链路 | 2026-05-28 |

### 已完成需求

| 禅道ID | 需求名称 | 完成时间 |
|--------|----------|----------|
| 17 | 村民采集时显示名称改为对应工种 | 2026-05-27 |
| 20 | [P1] 双击村民选择视角内所有村民 | 2026-05-30 |
| 21 | [P1] 框选时优先选取人物排除建筑 | 2026-05-30 |
| 24 | [P2] 游戏初始化后相机默认看向我方城镇中心 | 2026-05-30 |
| 25 | [P2] 按H键视角跳转到城镇中心并选中 | 2026-05-30 |
| 26 | [P1] ASDF绑定命令面板前4按钮关闭WASD相机移动 | 2026-05-30 |
| 27 | [P2] 地图初始化默认生成侦察骑兵 | 2026-05-30 |
| 28 | [P2] 增加游戏内时间显示系统 | 2026-05-30 |
| 29 | [P2] 框选多个人物时所有人血条显示 | 2026-05-30 |
| 1 | 补齐兵营/靶场/马厩生产面板 | 2026-05-30 |
| 2 | 补齐建筑建造取消与建造中进度UI | 2026-05-30 |
| 3 | 接通防御建筑自动攻击 | 2026-05-30 |

### 待验证需求

| 禅道ID | 需求名称 | 实现日期 |
|--------|----------|----------|
| 18 | [P1] 高棉文明：村民可驻扎进房屋 | 2026-05-30 |
| 22 | [P1] Ctrl多选同类型军事建筑 | 2026-05-30 |
| 23 | [P1] 绵羊可被捕获成为我方单位并移动/宰杀 | 2026-05-30 |
| 30 | 开始游戏界面新增文明选择，并且增加文明科技显示文字 | 2026-05-31 |
| Bug 47 | 相机镜头每次滚动的缩放比例幅度值需要减小 | 2026-05-31 |
| Camera | 右键按住拖拽平移幅度增大 | 2026-05-31 |
| Bug 48 | 小地图单击点击后的位置不在鼠标点击正中心 | 2026-05-31 |
| Bug 49 | 正在建造房屋的村民点击其他位置后，模型消失 | 2026-05-31 |
| Story | 村民命令面板改为建筑/军事建筑/驻扎入口 | 2026-05-31 |
| Story | 命令面板大写字母支持键盘快捷触发 | 2026-05-31 |
| Bug | 建造房屋快捷键与H回城镇中心冲突 | 2026-05-31 |
| Story | 村民建造房屋快捷键改为A | 2026-05-31 |
| Story | 驻扎系统与取消驻扎命令 | 2026-05-31 |
| Story | 取消驻扎释放点与生产建筑集结点 | 2026-05-31 |
| Story | 集结点flag仅在选中建筑时显示 | 2026-05-31 |
| Story | 战争迷雾功能 | 2026-05-31 |
| Story | 战争迷雾：已探索自然资源保留与绵羊2格视野 | 2026-05-31 |
| Bug | 开局会出现全部可见然后才出现战争迷雾 | 2026-05-31 |
| Story | 科技树功能：铁匠铺5个科技 | 2026-05-31 |
| 32 | 界面右上角文明科技树hover面板 | 2026-05-31 |
| Story | 游戏初始默认拥有200黄金 | 2026-05-31 |
| Story | 科技树覆盖其他建筑科技并中文化技能面板 | 2026-05-31 |
| Story | 兵营马厩科技与科技树分组进度方块 | 2026-05-31 |
| Story | 科技树hover面板延迟关闭并支持面板内停留 | 2026-05-31 |
| Story | 城镇中心生产村民快捷键改为A | 2026-05-31 |
| Story | 选中城镇中心或军事建筑后右键设置集结点 | 2026-05-31 |
| Story | 采集资源自动提交到最近可用提交点 | 2026-05-31 |
| Story | 村民命令入口快捷键A普通建筑B军事建筑 | 2026-05-31 |
| Story | 房屋建造价格改为25木材 | 2026-05-31 |
| Story | 伐木场建造快捷键改为R | 2026-05-31 |
| Story | 铁匠铺快捷键改为S并确认伐木场R | 2026-05-31 |
| Story | 科技树弹窗按建筑类别分块并用矩阵显示科技线 | 2026-06-01 |
| Story | 建筑信息面板显示生产队列并支持点击取消退款 | 2026-06-01 |
| Story | 拆分 index.html 内联 CSS 到独立样式文件 | 2026-06-01 |
| Story | 继续拆分 CSS 模块并创建 CODE_MAP.md | 2026-06-01 |
| Story | 列出每一个命令面板并形成文档 | 2026-06-01 |
| Story | 检查并修复命令面板按钮快捷键覆盖 | 2026-06-01 |
| Story | 命令面板按钮显示改为大字快捷键小字4字缩略命令 | 2026-06-01 |
| Story | 村民建造子面板使用Esc返回前一个命令面板 | 2026-06-01 |
| Story | 命令面板小字调整为10px并禁止换行 | 2026-06-01 |
| Story | 双击单位或绵羊选择视野内所有同类单位 | 2026-06-01 |
| Bug | 多选己方绵羊后右键无法移动 | 2026-06-01 |
| Story | 下方中部信息面板横向渐变透明背景 | 2026-06-02 |
| Story | HUD中部信息面板扩大折叠与Ctrl数字编队条 | 2026-06-02 |
| Story | HUD中右透明穿透且仅显示非空编队按钮 | 2026-06-02 |
| Story | HUD中部容器宽度收窄到信息面板且保留底部编队容器 | 2026-06-02 |
| Story | HUD顶部横线仅覆盖左侧可见面板宽度 | 2026-06-02 |
| Bug | Ctrl点击单位连续追加选择失效 | 2026-06-02 |
| Story | Ctrl点击允许不同类型实体混合选择 | 2026-06-02 |
| Story | 混合选择存在村民时显示建造命令面板 | 2026-06-02 |
| Story | 建筑信息面板生产队列首个单位显示进度条 | 2026-06-02 |
| Story | 科技研发完成后按钮留空不重排 | 2026-06-02 |
| Story | 信息面板压缩建筑信息与生产队列避免溢出 | 2026-06-02 |
| Story | unit-info-content 数据未变化时跳过DOM重绘 | 2026-06-02 |
| Bug | 信息面板生产队列第二个小图标误显示进度条 | 2026-06-02 |
| Story | 鼠标位于界面最下方时触发镜头向下移动 | 2026-06-02 |
| Story | 增加聊天框并在输入时屏蔽游戏快捷键 | 2026-06-02 |
| Story | 聊天作弊码marco已探索与polo完全可见 | 2026-06-02 |
| Story | 聊天输入居中浮动且历史消息左侧20秒自动隐藏 | 2026-06-02 |
| Bug | 聊天输入框hidden被CSS覆盖导致默认不隐藏 | 2026-06-02 |
| Story | marco已探索包含自然资源与敌方建筑等地图要素 | 2026-06-02 |
| Bug | HUD中部与右侧之间空白区域无法穿透场景交互 | 2026-06-02 |
| Bug | 鼠标移动拾取树木时轻微卡顿 | 2026-06-02 |
| Bug | 鼠标旁边一格也能拾取到实体范围过大 | 2026-06-02 |
| Story | 已探索自然资源支持鼠标hover高亮 | 2026-06-02 |
| Story | 战争迷雾保留1x1网格粒度边缘不抗锯齿 | 2026-06-02 |
| Bug | 查询寻路性能影响侦察骑兵快速拾取 | 2026-06-02 |
| Story | 战争迷雾边缘轻微伪抗锯齿不规则化 | 2026-06-02 |
| Story | 右下角小地图右键移动选中人物 | 2026-06-02 |
| Story | 野猪机制：村民远程狩猎、野猪追击反击并死亡后可采集 | 2026-06-02 |
| Story | 野猪食物采集速度提升并修复村民攻击野猪寻路 | 2026-06-02 |

### 当前进行中
|BugID|标题|状态|
|---|---|---|
|41|村民存在无法进入采集资源的状态的bug|🔧 已修复，待验证|
|42|绵羊移动时没有改变方向朝向|🔧 已修复，待验证|
### 已修复 Bug
|BugID|标题|状态|修复时间|
|---|---|---|---|
|19|教堂(CHURCH)建筑尺寸应为3x3，当前配置不一致|✅ closed|2026-05-27|
|24|创建马厩没有正确扣除资源|✅ resolved|2026-05-28|
|25|正在建造的建筑生命值应该跟随建造进度增加|✅ resolved|2026-05-28|
|26|建筑血条应该只在鼠标悬停时显示|✅ resolved|2026-05-28|
|38|村民移动时绵羊不会自动捕获|✅ resolved|2026-05-30|
|39|右键点击绵羊直接捕获而非村民移动到附近后自动捕获|✅ resolved|2026-05-30|
|40|村民采集绵羊食物中断，变成普通村民，显示的资源内容消失|✅ resolved|2026-05-31|

---

## 对于LLM
1. 思考过程使用中文。
2. 执行的命令使用powershell，执行多个命令之间需要用分号分隔开。读取文件 Get-Content 命令需要指定编码UTF-8例如 -Encoding UTF-8。
3. 当用户输入 `bug:<具体问题内容>` 时，应将该内容作为标题在禅道中创建一条新的 Bug（`zentao bug create --product=1 --title="<内容>"`）。创建后回复 Bug ID 及链接，不自动修复。
4. **优先使用 LSP 进行代码分析**：本项目已接入 TypeScript Language Server，对于代码理解、符号查找、引用分析、重命名等操作，应优先使用 LSP 工具而非文本搜索。LSP 能提供精确的类型信息和跨文件引用关系。

## LSP 使用指南

本项目已正确接入 TypeScript Language Server (typescript-language-server)，支持以下功能：

### 核心能力
- **定义跳转**：`lsp definition` - 跳转到符号定义处（支持跨文件）
- **引用查找**：`lsp references` - 查找符号在项目中的所有引用
- **悬停信息**：`lsp hover` - 显示符号类型签名和文档
- **重命名**：`lsp rename` - 跨文件重命名符号（预览后应用）
- **代码操作**：`lsp code_actions` - 获取可用的重构和快速修复
- **实现查找**：`lsp implementation` - 查找接口/抽象方法的实现
- **类型定义**：`lsp type_definition` - 跳转到类型定义
- **诊断**：`lsp diagnostics` - 检查文件或工作区的错误/警告
- **符号列表**：`lsp symbols` - 列出文件或工作区中的符号

### 使用场景
1. **理解代码结构**：先使用 `lsp symbols` 了解文件结构，再用 `lsp definition` 跳转到具体实现
2. **安全重构**：使用 `lsp rename` 进行跨文件重命名，避免遗漏引用
3. **查找使用**：使用 `lsp references` 查找符号在项目中的所有使用位置
4. **类型检查**：使用 `lsp hover` 查看变量/函数的类型信息
5. **错误诊断**：使用 `lsp diagnostics` 检查代码错误

### 优先级规则
1. **代码理解**：优先使用 LSP 工具，而非文本搜索（`search`/`find`）
2. **符号查找**：优先使用 `lsp definition`/`lsp references`，而非手动搜索
3. **重构操作**：优先使用 `lsp rename`/`lsp code_actions`，确保跨文件一致性
4. **类型信息**：优先使用 `lsp hover`，获取精确的类型签名

### 注意事项
- LSP 支持 `.js` 文件（通过 TypeScript 的 JavaScript 语言服务）
- 对于 `src/config.js` 中的常量（如 `HUMAN_PLAYER_ID`），LSP 能提供精确的引用信息
- 重命名操作会预览变更，需确认后应用
- 诊断信息已针对整个工作区配置

## 前端代码犯过的蠢事
1. 如果用户没有特别要求，不应该在代码调用过程中使用 import 语句。
2. 开发过程不需要集成验证例如执行 npm run build和npm run dev，已经有一个dev环境启动了。

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
- **配置常量**统一在 `src/config.js`，建筑配置（尺寸/成本/生命值）使用 `BUILDING_CONFIG` 单一数据源

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

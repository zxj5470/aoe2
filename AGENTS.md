# 帝国时代2 Web版 - Agent 指南

## 项目概述

**项目名称**: aoe2-web  
**版本**: v0.2.0-alpha
**描述**: 基于Three.js的帝国时代2网页版复刻项目  
**许可证**: MIT  
**开发语言**: JavaScript (ES Modules)  
**构建工具**: Vite 5.0.0  

### 项目目标

使用现代Web技术栈（Three.js + Vite）复刻经典RTS游戏《帝国时代2》的核心玩法和体验。

### 当前状态

- ✅ 基础架构完成（游戏循环、场景管理、相机系统）
- ✅ UI系统基础框架（HUD、小地图、资源面板）
- ✅ 输入系统（键盘、鼠标、相机控制）
- ✅ 地图系统基础实现
- ✅ 实体系统基础（单位、建筑、资源节点渲染）
- ✅ 移动和寻路系统（A*算法、编队系统）
- 🚧 资源收集系统开发中
- 🚧 游戏系统开发中（战斗、建筑放置）

---

## 技术栈

### 核心依赖
- **Three.js** (^0.160.0): 3D渲染引擎，用于游戏场景渲染

### 开发依赖
- **Vite** (^5.0.0): 现代化前端构建工具，提供快速的开发服务器和构建流程

### 技术特点
- 模块化设计（ES Modules）
- 正交摄像机实现2.5D视角
- Canvas 2D用于UI渲染（小地图）
- 组件化架构

---

## 项目架构

### 目录结构

```
aoe2/
├── src/
│   ├── main.js                 # 应用入口
│   ├── core/                   # 核心系统
│   │   ├── Game.js            # 游戏主控制器
│   │   ├── Scene.js           # 场景管理器
│   │   └── Camera.js          # 相机控制器
│   ├── world/                  # 世界系统
│   │   ├── Map.js             # 地图系统
│   │   ├── Terrain.js         # 地形渲染
│   │   └── Grid.js            # 网格系统
│   ├── entities/               # 实体系统
│   │   ├── Unit.js            # 单位基类
│   │   ├── Building.js        # 建筑基类
│   │   └── ResourceManager.js # 资源管理器
│   ├── systems/                # 游戏系统
│   │   ├── MovementSystem.js  # 移动系统
│   │   ├── CombatSystem.js    # 战斗系统
│   │   ├── FormationSystem.js # 编队系统
│   │   ├── Pathfinding.js     # 寻路算法（A*）
│   │   ├── BuildingPlacementSystem.js # 建筑放置
│   │   └── ResourceGatheringSystem.js # 资源收集
│   ├── input/                  # 输入系统
│   │   ├── InputHandler.js    # 输入处理
│   │   └── SelectionManager.js # 选择管理
│   └── ui/                     # UI系统
│       └── HUD.js             # 游戏HUD界面
├── index.html                  # HTML入口
├── package.json                # 项目配置
├── feature.md                  # 功能文档
└── plan.md                     # 开发计划
```

### 核心类关系

```
Game (游戏主控)
├── Scene (场景管理)
│   └── Three.js Scene
├── Camera (相机系统)
│   └── OrthographicCamera
├── Map (地图系统)
│   ├── Grid (网格)
│   └── Terrain (地形)
├── InputHandler (输入处理)
│   └── Raycaster (射线检测)
├── SelectionManager (选择管理)
│   └── Entity (实体选择)
├── Systems (游戏系统)
│   ├── MovementSystem
│   ├── CombatSystem
│   ├── Pathfinding
│   ├── FormationSystem
│   ├── BuildingPlacementSystem
│   └── ResourceGatheringSystem
└── HUD (UI系统)
    ├── 资源面板
    ├── 建筑面板
    ├── 单位信息面板
    └── 小地图
```

---

## 核心系统详解

### 1. Game 类（游戏主控）

**职责**: 游戏初始化、主循环、系统协调

**核心功能**:
- 初始化Three.js渲染器和场景
- 管理游戏生命周期（init, start, update）
- 协调各子系统的运行
- 处理全局事件（窗口调整、键盘鼠标输入）
- 实体管理（添加/移除/更新实体）

**关键方法**:
```javascript
async init()      // 异步初始化游戏
start()           // 启动游戏循环
animate()         // 每帧更新逻辑
addEntity()       // 添加实体到场景
removeEntity()    // 从场景移除实体
updateEntities()  // 更新所有实体状态
```

**资源加载**:
- 模拟资源加载过程（纹理、音频、模型）
- 加载进度显示（loading-screen）
- 5个加载步骤，每个步骤0.2秒

### 2. Camera 类（相机系统）

**职责**: 视角控制、相机移动、缩放

**相机配置**:
- 类型: `OrthographicCamera`（正交摄像机）
- 视角: 东南方向45度俯视
- 俯仰角: 精确45度
- 朝向: 固定，不支持旋转，只支持平移

**控制方式**:
- **键盘**: W/A/S/D 或方向键移动
- **鼠标边缘**: 移动到屏幕边缘触发滚动
- **鼠标拖拽**: 右键拖拽平移
- **滚轮**: 缩放视野

**移动方向映射**:
```
屏幕上方向 (W/上边缘) → 地图西北方向 (-x, -z)
屏幕下方向 (S/下边缘) → 地图东南方向 (+x, +z)
屏幕左方向 (A/左边缘) → 地图西南方向 (-x, +z)
屏幕右方向 (D/右边缘) → 地图东北方向 (+x, -z)
```

**相机位置计算**:
```javascript
const height = this.zoomLevel / Math.sqrt(2);
this.position.x = this.target.x + height;
this.position.z = this.target.z - height;
this.position.y = height;
```

### 3. Scene 类（场景管理）

**职责**: Three.js场景管理、光照系统、实体渲染

**场景配置**:
- 地图尺寸: 200x200
- 地面颜色: #3d8c40（绿色）
- 背景色: #000000（黑色）
- 光照: 环境光 + 方向光（带阴影）

**功能**:
- 添加/移除实体
- 场景更新（每帧）
- 光照管理
- 阴影配置

### 4. HUD 类（UI系统）

**职责**: 游戏界面渲染、用户交互反馈

**UI组件**:

#### 资源面板（顶部）
- 位置: 顶部居左
- 显示内容:
  - 资源: 肉🍖、木🌲、金🏅、石🪨
  - 人口: 🏠 1/20
  - 当前时代: 黑暗时代（顶部居中）

#### 建筑面板（左下角）
- 位置: HUD左侧面板
- 默认布局: 3行5列（15个格子）
- 可切换布局: 按1/2/3键切换
- 支持空白占位: `type='empty'`
- 建筑类型: residential/military/economy/defense/special/empty

#### 单位信息面板（底部中间）
- 位置: HUD中间面板
- 显示选中单位的详细信息
- 内容: 名称、生命值（带进度条）、属性等

#### 小地图（右下角）
- 位置: HUD右侧面板
- 显示方式: 菱形坐标变换
- 坐标范围: X和Z都在[-100, 100]之间
- 功能:
  - 点击跳转到对应位置
  - 拖拽移动视角
  - 显示实体点（蓝色=玩家，红色=敌人）
  - 显示白色视野框（矩形）

#### Debug面板（右上角）
- 位置: 右上角
- 切换: 按F12键显示/隐藏
- 显示内容:
  - 相机位置
  - 小地图视野
  - 地图范围
  - 建筑面板配置

**HUD API**:

```javascript
// 更新资源显示
hud.updateResourceDisplay();

// 更新人口
hud.updatePopulation(current, max);

// 更新时代
hud.updateAge('封建时代');

// 更新单位信息
hud.updateUnitInfoPanel();

// 切换Debug面板
hud.toggleDebugPanel();

// 更新建筑面板布局
hud.updateBuildingPanelConfig({ 
    rows: 3, 
    cols: 5, 
    totalButtons: 15 
});

// 更新单个按钮
hud.updateBuildingButton(index, {
    icon: '🏠',
    name: '房屋',
    id: 'house',
    type: 'residential'
});

// 设置空白占位
hud.setButtonEmpty(index, true);

// 启用按钮
hud.enableButton(index, {
    icon: '⚔️',
    name: '兵营',
    id: 'barracks',
    type: 'military'
});

// 切换预设
hud.nextPreset();
hud.switchToPreset('default');
```

### 5. InputHandler 类（输入处理）

**职责**: 处理键盘和鼠标输入、射线检测、世界坐标转换

**功能**:
- 鼠标位置追踪
- 射线投射（Raycaster）
- 世界坐标转换
- 拖拽选择框
- 建筑放置预览

**关键方法**:
```javascript
getRaycaster()        // 获取射线投射器
getMousePosition()    // 获取鼠标位置
getWorldPosition()    // 获取世界坐标
getDragSelection()    // 获取拖拽选择框
updateWorldPosition() // 更新世界位置
```

### 6. SelectionManager 类（选择管理）

**职责**: 单位选择、命令下达、选择状态管理

**功能**:
- 单选/多选/框选
- 选择状态管理
- 命令下达（移动、攻击、收集）
- 选择事件通知

**支持的操作**:
- 左键点击: 选择单位/建筑
- Shift+左键: 多选
- 拖拽框选: 批量选择
- 右键点击: 移动/攻击/收集

### 7. Map 类（地图系统）

**职责**: 地图管理、网格系统、地形渲染

**配置**:
- 地图尺寸: 200x200
- 单元格大小: 2x2
- 坐标范围: [-100, 100]
- 中心点: (0, 0)

**功能**:
- 网格系统（Grid）
- 地形渲染（Terrain）
- 地图装饰物
- 碰撞检测

### 8. Systems（游戏系统）

#### MovementSystem（移动系统）
- 单位移动逻辑
- 速度控制
- 碰撞避免

#### CombatSystem（战斗系统）
- 攻击判定
- 伤害计算
- 战斗状态管理

#### Pathfinding（寻路系统）
- A*寻路算法
- 路径优化
- 动态障碍物处理

#### FormationSystem（编队系统）
- 单位编队
- 队形管理
- 编队移动

#### BuildingPlacementSystem（建筑放置）
- 建筑放置预览
- 位置验证
- 建筑创建

#### ResourceGatheringSystem（资源收集）
- 资源收集逻辑
- 收集速度
- 资源更新

---

## 开发命令

### 运行开发服务器
```bash
npm run dev
```
启动Vite开发服务器，支持热模块替换（HMR）

### 构建生产版本
```bash
npm run build
```
构建优化后的生产版本到 `dist/` 目录

### 预览生产版本
```bash
npm run preview
```
预览构建后的生产版本

### 安装依赖
```bash
npm install
```
安装项目依赖

---

## 调试命令

### 键盘快捷键

- **F12**: 切换Debug面板显示/隐藏
- **1**: 切换建筑面板为3行5列
- **2**: 切换建筑面板为4行3列
- **3**: 切换建筑面板为4行4列
- **Q**: 设置兵营为空白占位
- **E**: 启用兵营
- **R**: 重置所有按钮
- **V**: 切换建筑面板预设

### 控制台输出

按快捷键时会在控制台输出相应信息，方便调试。

### Debug面板内容

**相机位置**:
- Position: 相机位置坐标
- Target: 相机目标点坐标
- Zoom: 缩放级别

**小地图视野**:
- 西北角: 视野左上角坐标
- 东北角: 视野右上角坐标
- 东南角: 视野右下角坐标
- 西南角: 视野左下角坐标

**地图范围**:
- X范围: [-100, 100]
- Z范围: [-100, 100]

**建筑面板配置**:
- 行数: 当前行数
- 列数: 当前列数
- 按钮数: 总按钮数
- 空白按钮: 空白按钮数量
- 当前预设: 当前使用的预设名称

---

## 技术实现细节

### 小地图坐标变换

**正向变换**（世界坐标 → 屏幕坐标）:
```javascript
const nx = (x - minX) / (maxX - minX) - 0.5;
const nz = (z - minZ) / (maxZ - minZ) - 0.5;
const screenX = (nx - nz) * width * 0.5 + width / 2;
const screenY = (nx + nz) * height * 0.5 + height / 2;
```

**反向变换**（屏幕坐标 → 世界坐标）:
```javascript
const normX = clickX / width;
const normY = clickY / height;
const normalizedX = normX + normY - 1;
const normalizedZ = normY - normX;
const worldX = minX + (normalizedX + 0.5) * (maxX - minX);
const worldZ = minZ + (normalizedZ + 0.5) * (maxZ - minZ);
```

### 游戏主循环

```javascript
animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // 更新摄像机
    this.camera.update(deltaTime);
    
    // 更新场景
    this.scene.update(deltaTime);
    
    // 更新输入系统
    if (this.inputHandler) {
        this.inputHandler.updateWorldPosition();
        
        // 更新建筑放置预览
        if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
            const worldPos = this.inputHandler.getWorldPosition();
            this.buildingPlacementSystem.updatePreview(worldPos);
        }
    }
    
    // 更新选择系统
    if (this.selectionManager) {
        this.selectionManager.update();
    }
    
    // 更新战斗系统
    if (this.combatSystem) {
        this.combatSystem.update(deltaTime);
    }
    
    // 更新资源收集系统
    if (this.resourceGatheringSystem) {
        this.resourceGatheringSystem.update(deltaTime);
    }
    
    // 更新实体
    this.updateEntities(deltaTime);
    
    // 渲染
    this.renderer.render(this.scene.getScene(), this.camera.getCamera());
}
```

### 建筑面板配置系统

**配置结构**:
```javascript
buildingPanelConfig = {
    rows: 3,
    cols: 5,
    totalButtons: 15,
    buttons: [
        { id: 'house', icon: '🏠', name: '房屋', type: 'residential' },
        { id: '', icon: '', name: '', type: 'empty' },
        // ... 更多按钮
    ]
};
```

**预设系统**:
```javascript
buildingPanelPresets = {
    default: [...],  // 默认建筑列表
    military: [...]  // 军事建筑列表
};
```

**动态布局切换**:
- 使用CSS变量控制网格布局
- 动态计算面板宽度
- 重新渲染按钮

---

## 开发规范

### 代码风格

- 使用ES6+语法
- 类使用大驼峰命名（PascalCase）
- 方法使用小驼峰命名（camelCase）
- 常量使用大写蛇形命名（UPPER_SNAKE_CASE）
- 私有属性使用下划线前缀（_private）

### 文件组织

- 每个类一个文件
- 文件名与类名一致
- 使用相对路径导入
- 按功能模块组织目录

### 注释规范

- 公共API必须有JSDoc注释
- 复杂逻辑需要行内注释
- TODO标记待办事项

### Git提交规范

提交消息格式：
```
<type>: <subject>

<body>

<footer>
```

类型（type）:
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

---

## 性能优化

### 已实现优化

1. **正交摄像机**: 减少计算复杂度
2. **Canvas 2D渲染**: 小地图使用Canvas 2D提高性能
3. **按需渲染**: 按钮按需渲染，支持动态配置
4. **Debug面板**: 按需显示，避免性能损耗

### 计划中的优化

1. **视锥剔除**: 只渲染可见区域
2. **实例化渲染**: 使用InstancedMesh优化地形渲染
3. **对象池**: 管理单位和粒子系统
4. **Web Workers**: 处理复杂计算（寻路、AI）
5. **LOD系统**: 远距离使用低精度模型
6. **资源管理**: 图片压缩、精灵图、模块化加载

---

## 开发进度

### 阶段一：基础架构 ✅
- [x] 搭建项目基础结构和Three.js场景
- [x] 实现摄像机控制和视角系统
- [x] 创建游戏主循环和场景管理
- [x] 设置基本的输入处理系统

### 阶段二：地图系统 ✅
- [x] 实现网格地图系统
- [x] 创建地形渲染系统
- [x] 添加地图边界和碰撞检测
- [x] 实现鼠标地图导航

### 阶段三：实体系统 ✅
- [x] 创建单位基类和建筑基类
- [x] 实现单位放置和渲染（5种单位类型）
- [x] 实现建筑渲染系统（9种建筑类型）
- [x] 实现资源节点系统（4种资源类型）
- [x] 添加单位选择和分组系统

### 阶段四：移动和交互 ✅
- [x] 实现基本的单位移动
- [x] 添加路径规划算法（A*）
- [x] 创建单位编队和队列系统（5种队形）
- [x] 实现右键点击移动和波纹特效
- [x] 实现拉框选择实时可视化

### 阶段五：战斗系统 🚧
- [ ] 创建攻击和伤害系统
- [ ] 实现单位属性和克制关系
- [ ] 添加战斗动画和效果
- [ ] 创建AI基本行为

### 阶段六：经济系统 🚧
- [x] 实现资源收集基础（采集动画）
- [ ] 完成资源运输和存储系统
- [ ] 创建建筑生产和升级系统
- [ ] 添加时代演进机制
- [ ] 实现科技树系统

### 阶段七：UI界面 ✅
- [x] 创建游戏HUD界面
- [x] 实现小地图显示
- [x] 添加建筑菜单和单位面板
- [x] 创建游戏状态显示
- [x] 添加Debug面板

### 阶段八：优化和完善 ⏳
- [ ] 性能优化（视锥剔除、LOD系统）
- [ ] 添加音效和背景音乐
- [ ] 实现多人游戏基础架构
- [ ] 平衡性调整和游戏性优化

---

## 常见问题

### Q: 如何添加新的建筑类型？

A: 在 `HUD.js` 的 `buildingPanelConfig.buttons` 数组中添加新建筑配置：

```javascript
{ 
    id: 'new-building', 
    icon: '🏗️', 
    name: '新建筑', 
    type: 'military' 
}
```

### Q: 如何修改相机控制？

A: 修改 `Camera.js` 中的以下参数：
- `moveSpeed`: 移动速度
- `zoomSpeed`: 缩放速度
- `minZoom/maxZoom`: 缩放范围

### Q: 如何调整地图大小？

A: 修改 `Game.js` 中 `initWorld()` 方法的地图初始化参数：

```javascript
this.map = new GameMap(width, height, cellSize);
```

### Q: 如何添加新的资源类型？

A: 在 `ResourceManager.js` 和 `Game.js` 中添加新的资源类型：

```javascript
this.resources = {
    gold: 0,
    wood: 0,
    food: 0,
    stone: 0,
    newResource: 0  // 新资源类型
};
```

---

## 相关文档

- **feature.md**: 详细功能文档
- **plan.md**: 开发计划和路线图
- **package.json**: 项目依赖和配置

---

## 贡献指南

### 开发环境设置

1. 克隆项目
2. 运行 `npm install` 安装依赖
3. 运行 `npm run dev` 启动开发服务器
4. 在浏览器中打开 `http://localhost:5173`

### 提交代码

1. 创建新分支: `git checkout -b feature/your-feature`
2. 提交更改: `git commit -m 'feat: add your feature'`
3. 推送分支: `git push origin feature/your-feature`
4. 创建Pull Request

### 代码审查

- 确保代码符合项目规范
- 添加必要的注释和文档
- 测试新功能
- 更新相关文档

---

## 许可证

MIT License

---

## 联系方式

- 项目维护者: [待填写]
- 问题反馈: [待填写]
- 项目主页: [待填写]

---

**最后更新**: 2026-04-07
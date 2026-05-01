# 帝国时代2 Web版 (Age of Empires II Web)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.2.0--alpha-orange.svg)](https://github.com/)

一个基于Three.js和Vite构建的《帝国时代2》网页版复刻项目，旨在使用现代Web技术还原经典RTS游戏的体验。

## 在线演示

> 待部署后添加演示链接

## 功能特性

### 已实现功能
- 基础架构: 游戏循环、场景管理、相机系统
- 地图系统: 200x200网格地图，地形渲染
- 实体系统: 单位（5种类型）、建筑（9种类型）、资源节点（4种类型）
- 移动系统: A*寻路算法、编队系统（5种队形）
- 交互系统: 框选、多选、右键移动、鼠标导航
- UI系统: HUD界面、小地图、资源面板、建筑面板、单位信息面板
- 输入系统: 键盘、鼠标、相机控制

### 开发中功能
- 战斗系统: 攻击、伤害、战斗动画
- 经济系统: 资源收集、存储、建筑生产、时代演进
- AI系统: 基础AI行为

## 技术栈

- 渲染引擎: Three.js (^0.160.0)
- 构建工具: Vite (^5.0.0)
- 开发语言: JavaScript (ES Modules)
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
| 左键点击 | 选择单位/建筑 |
| Shift + 左键 | 多选单位 |
| 拖拽框选 | 批量选择 |
| 右键点击 | 移动/攻击/收集 |
| F12 | 显示/隐藏Debug面板 |
| 1/2/3 | 切换建筑面板布局 |
| Q/E/R | 建筑面板测试功能 |

## 项目结构

```
aoe2/
├── src/
│   ├── main.js                     # 应用入口
│   ├── core/                       # 核心系统
│   │   ├── Game.js                 # 游戏主控制器
│   │   ├── Scene.js                # 场景管理器
│   │   └── Camera.js               # 相机控制器
│   ├── world/                      # 世界系统
│   │   ├── Map.js                  # 地图系统
│   │   ├── Terrain.js              # 地形渲染
│   │   └── Grid.js                 # 网格系统
│   ├── entities/                   # 实体系统
│   │   ├── Unit.js                 # 单位基类
│   │   ├── Building.js             # 建筑基类
│   │   └── ResourceManager.js      # 资源管理器
│   ├── systems/                    # 游戏系统
│   │   ├── MovementSystem.js       # 移动系统
│   │   ├── CombatSystem.js         # 战斗系统
│   │   ├── FormationSystem.js      # 编队系统
│   │   ├── Pathfinding.js          # 寻路算法（A*）
│   │   ├── BuildingPlacementSystem.js # 建筑放置
│   │   └── ResourceGatheringSystem.js # 资源收集
│   ├── input/                      # 输入系统
│   │   ├── InputHandler.js         # 输入处理
│   │   └── SelectionManager.js     # 选择管理
│   └── ui/                         # UI系统
│       └── HUD.js                  # 游戏HUD界面
├── index.html                      # HTML入口
├── package.json                    # 项目配置
├── AGENTS.md                       # Agent开发指南
├── feature.md                      # 功能文档
├── plan.md                         # 开发计划
└── roadmap.md                      # 路线图
```

## 开发路线图

### 阶段一：基础架构
- [x] 搭建项目基础结构和Three.js场景
- [x] 实现摄像机控制和视角系统
- [x] 创建游戏主循环和场景管理
- [x] 设置基本的输入处理系统

### 阶段二：地图系统
- [x] 实现网格地图系统
- [x] 创建地形渲染系统
- [x] 添加地图边界和碰撞检测
- [x] 实现鼠标地图导航

### 阶段三：实体系统
- [x] 创建单位基类和建筑基类
- [x] 实现单位放置和渲染
- [x] 实现建筑渲染系统
- [x] 实现资源节点系统
- [x] 添加单位选择和分组系统

### 阶段四：移动和交互
- [x] 实现基本的单位移动
- [x] 添加路径规划算法（A*）
- [x] 创建单位编队和队列系统
- [x] 实现右键点击移动
- [x] 实现拉框选择

### 阶段五：战斗系统
- [ ] 创建攻击和伤害系统
- [ ] 实现单位属性和克制关系
- [ ] 添加战斗动画和效果
- [ ] 创建AI基本行为

### 阶段六：经济系统
- [ ] 完成资源收集系统
- [ ] 完成资源运输和存储系统
- [ ] 创建建筑生产和升级系统
- [ ] 添加时代演进机制
- [ ] 实现科技树系统

### 阶段七：UI界面
- [x] 创建游戏HUD界面
- [x] 实现小地图显示
- [x] 添加建筑菜单和单位面板
- [x] 创建游戏状态显示
- [x] 添加Debug面板

### 阶段八：优化和完善
- [ ] 性能优化（视锥剔除、LOD系统）
- [ ] 添加音效和背景音乐
- [ ] 实现多人游戏基础架构
- [ ] 平衡性调整和游戏性优化

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (git checkout -b feature/AmazingFeature)
3. 提交更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启 Pull Request

### 代码规范
- 使用ES6+语法
- 类名使用大驼峰命名（PascalCase）
- 方法名使用小驼峰命名（camelCase）
- 常量使用大写蛇形命名（UPPER_SNAKE_CASE）

### 提交规范

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

## 许可证

本项目基于 MIT License 开源。

## 致谢

- 灵感来源于经典游戏《帝国时代2》（Age of Empires II）
- 使用 Three.js 强大的3D渲染能力
- 使用 Vite 快速的开发体验

## 联系方式

- 问题反馈: GitHub Issues
- 项目主页: GitHub Repository

---

**注意**: 本项目仅供学习和研究使用，与微软及《帝国时代》系列游戏官方无关。

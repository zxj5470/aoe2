# 帝国时代2 Web版功能文档

## UI系统

### 资源面板
- **位置**: 左上角
- **显示内容**:
  - 资源：肉 🍖、木 🌲、金矿 🏅、石料 🪨
  - 人口：🏠 1/20
  - 当前时代：【黑暗时代】（顶部居中）

### 建筑面板
- **位置**: 左下角
- **默认布局**: 3行5列（15个格子）
- **可切换布局**:
  - 按`1`键：3行5列（默认）
  - 按`2`键：4行3列
  - 按`3`键：4行4列

#### 建筑按钮配置
每个按钮包含以下属性：
- `id`: 建筑ID
- `icon`: 图标（emoji）
- `name`: 建筑名称
- `type`: 建筑类型（residential/military/economy/defense/special/empty）

#### 空白占位功能
- 使用`type='empty'`标识空白按钮
- 空白按钮完全透明，不显示任何内容
- 在网格中占据位置，保持布局完整性
- 调试命令：
  - 按`Q`键：设置兵营为空白
  - 按`E`键：启用兵营
  - 按`R`键：重置所有按钮

#### 建筑列表（15个）
- 第1行：房屋、[空白]、农田、伐木场、采矿场
- 第2行：瞭望塔、马厩、射箭场、城堡、城墙
- 第3行：城门、铁匠铺、市场、码头、教堂

### 单位信息面板
- **位置**: 底部中间
- **功能**: 显示选中单位的详细信息
- **内容**: 名称、生命值（带进度条）、属性等

### 小地图
- **位置**: 右下角
- **显示方式**: 菱形坐标变换
- **坐标范围**: X和Z都在[-100, 100]之间
- **功能**:
  - 点击跳转到对应位置
  - 显示实体点（蓝色=玩家，红色=敌人）
  - 显示白色视野框（矩形，反映实际视野）

### Debug面板
- **位置**: 右上角
- **切换**: 按`F12`键显示/隐藏
- **显示内容**:
  - 相机位置（Position、Target、Zoom）
  - 小地图视野（西北角、东北角、东南角、西南角）
  - 地图范围（X范围、Z范围）
  - 建筑面板配置（行数、列数、按钮数、空白按钮数）

## 相机系统

### 视角配置
- **相机类型**: 正交摄像机（OrthographicCamera）
- **视角方向**: 东南方向45度俯视
- **俯仰角度**: 精确45度
- **固定朝向**: 不支持旋转，只支持平移

### 移动控制
- **键盘控制**:
  - `W`/`S`/`A`/`D` 或方向键：上下左右移动
- **鼠标边缘滚动**: 移动到屏幕边缘触发滚动
- **鼠标拖拽**: 右键拖拽平移
- **滚轮缩放**: 调整视野大小

### 移动方向映射
- 屏幕上方向（W/上边缘）→ 地图西北方向 (-x, -z)
- 屏幕下方向（S/下边缘）→ 地图东南方向 (+x, +z)
- 屏幕左方向（A/左边缘）→ 地图西南方向 (-x, +z)
- 屏幕右方向（D/右边缘）→ 地图东北方向 (+x, -z)

## 场景系统

### 地图配置
- **地图尺寸**: 200x200（坐标范围：[-100, 100]）
- **地图中心**: (0, 0)
- **单元格大小**: 2x2

### 视觉效果
- **背景色**: 黑色（场景外区域）
- **地面颜色**: 绿色（#3d8c40）
- **光照**: 环境光 + 方向光（带阴影）
- **雾效**: 已删除

## HUD API

### 建筑面板管理

#### 更新面板布局
```javascript
hud.updateBuildingPanelConfig({ 
    rows: 3, 
    cols: 5, 
    totalButtons: 15 
});
```

#### 更新单个按钮
```javascript
hud.updateBuildingButton(index, {
    icon: '🏠',
    name: '房屋',
    id: 'house',
    type: 'residential'
});
```

#### 批量更新按钮
```javascript
hud.updateBuildingButtons([
    { index: 0, icon: '🏡', name: '小屋' },
    { index: 1, icon: '🏯', name: '要塞' }
]);
```

#### 设置空白占位
```javascript
hud.setButtonEmpty(index, true); // 设置为空白
hud.setButtonEmpty(index, false); // 取消空白
```

#### 启用按钮
```javascript
hud.enableButton(index, {
    icon: '⚔️',
    name: '兵营',
    id: 'barracks',
    type: 'military'
});
```

#### 批量设置空白
```javascript
hud.setButtonsEmpty([1, 2, 3]);
```

### 获取配置
```javascript
// 获取面板配置
const config = hud.getBuildingPanelConfig();

// 获取按钮配置
const buttonConfig = hud.getBuildingButtonConfig(index);
```

### 其他HUD功能
```javascript
// 更新资源
hud.updateResourceDisplay();

// 更新人口
hud.updatePopulation(current, max);

// 更新时代
hud.updateAge('封建时代');

// 更新单位信息
hud.updateUnitInfoPanel();

// 切换Debug面板
hud.toggleDebugPanel();
```

## 调试命令

### 键盘快捷键
- `F12`: 切换Debug面板显示/隐藏
- `1`: 切换建筑面板为3行5列
- `2`: 切换建筑面板为4行3列
- `3`: 切换建筑面板为4行4列
- `Q`: 设置兵营为空白占位
- `E`: 启用兵营
- `R`: 重置所有按钮

### 控制台输出
按快捷键时会在控制台输出相应信息，方便调试。

## 技术实现

### 相机关键实现
```javascript
// 相机位置计算（东南方向45度俯视）
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

// 反向变换（屏幕坐标 → 世界坐标）
const normX = clickX / width;
const normY = clickY / height;
const normalizedX = normX + normY - 1;
const normalizedZ = normY - normX;
const worldX = minX + (normalizedX + 0.5) * (maxX - minX);
const worldZ = minZ + (normalizedZ + 0.5) * (maxZ - minZ);
```

## 性能优化

- 使用正交摄像机减少计算复杂度
- 小地图使用Canvas 2D渲染，提高性能
- 按钮按需渲染，支持动态配置
- Debug面板按需显示，避免性能损耗

## 未来计划

### 阶段一：基础架构 ✓
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
- [ ] 创建单位基类和建筑基类
- [ ] 实现单位放置和渲染
- [ ] 添加单位选择和分组系统
- [ ] 创建资源收集和管理系统

### 阶段四：移动和交互
- [ ] 实现基本的单位移动
- [ ] 添加路径规划算法（A*）
- [ ] 创建单位编队和队列系统
- [ ] 实现建筑放置系统

### 阶段五：战斗系统
- [ ] 创建攻击和伤害系统
- [ ] 实现单位属性和克制关系
- [ ] 添加战斗动画和效果
- [ ] 创建AI基本行为

### 阶段六：经济系统
- [ ] 实现资源收集（木材、食物、黄金、石材）
- [ ] 创建建筑生产和升级系统
- [ ] 添加时代演进机制
- [ ] 实现科技树系统

### 阶段七：UI界面 ✓
- [x] 创建游戏HUD界面
- [x] 实现小地图显示
- [x] 添加建筑菜单和单位面板
- [x] 创建游戏状态显示

### 阶段八：优化和完善
- [ ] 性能优化（视锥剔除、LOD系统）
- [ ] 添加音效和背景音乐
- [ ] 实现多人游戏基础架构
- [ ] 平衡性调整和游戏性优化

## 版本历史

### v1.0.0 (2026-04-06)
- 初始化项目结构
- 实现基础相机控制
- 创建场景和渲染系统
- 实现UI基础框架

### v1.1.0 (2026-04-06)
- 优化UI布局（资源面板移至顶部）
- 实现三栏布局（建筑、单位信息、小地图）
- 添加Debug面板
- 实现小地图菱形显示和点击跳转

### v1.2.0 (2026-04-06)
- 修复相机45度俯视问题
- 实现建筑面板配置系统
- 添加空白占位功能
- 优化小地图坐标变换
- 删除场景雾效
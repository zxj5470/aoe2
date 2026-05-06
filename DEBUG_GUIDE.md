# 调试接口使用说明

## 概述

为了帮助诊断寻路和资源绕开问题，我们添加了以下调试接口，可以在浏览器控制台中使用。

## 启用调试信息

1. 按 `F12` 打开浏览器开发者工具
2. 切换到 "控制台" (Console) 标签
3. 按 `D` 键显示/隐藏调试信息面板（位于右下角）

## 可用的调试接口

### 1. 打印指定区域内的网格状态

```javascript
gameDebug.printGridArea(x, z, radius)
```

- `x`: 中心世界坐标X（例如：-10）
- `z`: 中心世界坐标Z（例如：10）
- `radius`: 半径（格子数，默认10）

**示例：**
```javascript
// 打印以 (-10, 10) 为中心，半径为 5 的区域
gameDebug.printGridArea(-10, 10, 5)

// 打印以 (0, 0) 为中心，半径为 10 的区域
gameDebug.printGridArea(0, 0, 10)
```

**输出说明：**
- `.` = 空闲格子
- `#` = 被占用的格子
- `R` = 资源格子 (wood/food/gold/stone)
- `B` = 建筑格子
- `U` = 单位格子
- `X` = 中心位置
- `■` = 不可行走的格子（水域等）

### 2. 打印指定位置的格子状态

```javascript
gameDebug.printCell(x, z)
```

- `x`: 世界坐标X
- `z`: 世界坐标Z

**示例：**
```javascript
// 打印位置 (-10, 10) 的格子状态
gameDebug.printCell(-10, 10)

// 打印位置 (0, 0) 的格子状态
gameDebug.printCell(0, 0)
```

**输出包括：**
- 世界坐标和网格索引
- 地形类型
- 是否可行走
- 是否被占用
- 占用的实体信息（如果有）

### 3. 打印所有资源节点的信息

```javascript
gameDebug.printResources()
```

**输出包括：**
- 资源节点总数
- 按类型分组的统计
- 每个资源节点的详细信息：
  - 名称
  - 类型 (wood/food/gold/stone)
  - 位置
  - 占用的格子列表

## 使用示例

### 诊断资源绕开问题

1. 找到一个你想要采集的资源（比如树木或浆果丛）

2. 记录资源的位置（可以通过选择资源看到其坐标）

3. 打印资源周围的网格状态：
```javascript
// 假设资源在位置 (-15, 0)
gameDebug.printGridArea(-15, 0, 5)
```

4. 检查输出：
   - 资源占用的格子是否被标记为 `R`？
   - 资源周围的格子是否都是 `.`（空闲）？
   - 是否有其他格子被错误地占用？

5. 如果资源周围都被占用，可能导致单位无法找到可行的采集位置

6. 打印所有资源节点信息，检查是否有重复占用：
```javascript
gameDebug.printResources()
```

### 检查寻路路径

1. 选择一个单位，让它移动到某个位置

2. 在单位移动过程中，打印当前格子状态：
```javascript
// 假设单位在位置 (0, 0)
gameDebug.printCell(0, 0)
```

3. 检查格子是否被正确标记为占用/空闲

## 获取内部对象

你也可以直接访问游戏内部对象进行更详细的调试：

```javascript
// 获取游戏实例
const game = gameDebug.getGame()

// 获取网格实例
const grid = gameDebug.getGrid()

// 获取碰撞系统实例
const collisionSystem = gameDebug.getCollisionSystem()

// 获取寻路系统实例
const pathfinding = gameDebug.getPathfinding()
```

## 常见问题诊断

### 问题1：单位穿过资源

**症状：** 单位移动时直接穿过资源节点

**诊断步骤：**
1. 打印资源周围的网格状态
2. 检查资源占用的格子是否被标记为 `R`
3. 检查寻路系统是否检测到了这些占用格子

### 问题2：单位无法采集资源

**症状：** 单位停在资源附近但无法采集

**诊断步骤：**
1. 打印资源周围的网格状态
2. 检查资源周围是否有可行的格子
3. 如果所有格子都被占用，可能是资源放置太密集

### 问题3：寻路失败

**症状：** 单位无法找到路径到目标位置

**诊断步骤：**
1. 打印起点和终点的格子状态
2. 检查起点和终点是否都被占用
3. 打印整个路径区域的网格状态，寻找阻挡

## 高级调试

### 手动检查格子占用

```javascript
const grid = gameDebug.getGrid()

// 检查特定格子
const cell = grid.getCell(100, 100) // 网格索引
console.log(cell)

// 或通过世界坐标
const cell2 = grid.getCellAtPosition(0, 0) // 世界坐标
console.log(cell2)
```

### 手动更新网格占用

```javascript
const collisionSystem = gameDebug.getCollisionSystem()

// 强制更新网格占用
collisionSystem.updateGridOccupancy()
```

### 检查寻路缓存

```javascript
const pathfinding = gameDebug.getPathfinding()

// 获取缓存统计
console.log(pathfinding.getCacheStats())

// 清除缓存
pathfinding.clearPathCache()
```

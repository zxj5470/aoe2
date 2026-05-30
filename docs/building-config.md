# 建筑配置参考

## 尺寸维度说明

- **width** - 占地宽度（X轴方向格子数）
- **depth** - 占地纵深（Z轴方向格子数，即我们习惯意义上矩形的"高"）
- **height** - 离地高度（Y轴，建筑物的视觉高度，非占地尺寸）

## 配置文件位置

建筑配置已统一到 `src/config.js` 的 `BUILDING_CONFIG` 对象，其他文件通过引用获取：

- **src/config.js** - `BUILDING_CONFIG`（单一数据源）
- **src/core/Game.js** - `getBuildingWidth/Depth/Height()` 直接读取 `BUILDING_CONFIG`
- **src/entities/BuildingBase.js** - `getDefaultGridSizeX/Z()` 和 `getAppearanceConfig()` 读取 `BUILDING_CONFIG`
- **src/systems/BuildingPlacementSystem.js** - `buildingTypes` 直接引用 `BUILDING_CONFIG`

> 修改建筑尺寸/成本/生命值只需修改 `src/config.js` 一处即可。

## 建筑占地尺寸

| 建筑类型 | 宽度 (width) | 深度 (depth) | 高度 (height) |
|---------|-------------|-------------|--------------|
| House (房屋) | 2 | 2 | 2 |
| Farm (农田) | 3 | 3 | 0.5 |
| Lumber Camp (伐木场) | 2 | 2 | 1.5 |
| Mining Camp (采矿场) | 2 | 2 | 1.5 |
| Barracks (兵营) | 3 | 3 | 3 |
| Stable (马厩) | 3 | 3 | 2.5 |
| Archery Range (射箭场) | 3 | 3 | 2.5 |
| Blacksmith (铁匠铺) | 3 | 3 | 2.5 |
| Market (市场) | 3 | 3 | 2.5 |
| Church (教堂) | 3 | 3 | 4 |
| Watch Tower (瞭望塔) | 2 | 2 | 4 |
| Castle (城堡) | 5 | 5 | 6 |
| Town Center (城镇中心) | 4 | 4 | 4 |

## 配置文件位置

建筑尺寸在以下文件中定义（需保持同步）：

1. **src/core/Game.js** - `getBuildingWidth()`, `getBuildingDepth()`, `getBuildingHeight()` 方法
2. **src/entities/BuildingBase.js** - `getDefaultGridSizeX()`, `getDefaultGridSizeZ()` 方法
3. **src/systems/BuildingPlacementSystem.js** - `buildingTypes` 配置对象

## 建筑成本

| 建筑类型 | 木材 | 食物 | 金矿 | 石矿 |
|---------|------|------|------|------|
| House | 50 | - | - | - |
| Farm | 60 | - | - | - |
| Lumber Camp | 100 | - | - | - |
| Mining Camp | 100 | - | - | - |
| Barracks | 150 | - | - | - |
| Stable | 175 | - | - | - |
| Archery Range | 175 | - | - | - |
| Blacksmith | 175 | - | - | - |
| Market | 175 | - | - | - |
| Church | 175 | - | 100 | - |
| Watch Tower | - | - | - | 100 |
| Castle | - | - | 300 | 600 |
| Town Center | - | - | - | - |

## 生命值

| 建筑类型 | 生命值 |
|---------|--------|
| House | 500 |
| Farm | 200 |
| Lumber Camp | 300 |
| Mining Camp | 300 |
| Barracks | 800 |
| Stable | 700 |
| Archery Range | 700 |
| Blacksmith | 600 |
| Market | 600 |
| Church | 600 |
| Watch Tower | 1000 |
| Castle | 3000 |
| Town Center | 2400 |

> 注意：修改建筑尺寸时需同步更新上述三个配置文件，否则可能导致放置系统、碰撞检测和外观显示不一致。

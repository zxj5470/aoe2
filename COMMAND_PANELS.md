# Command Panels

Source: `src/ui/ActionPanel.js`

The command panel is a 3 x 5 grid. Button hotkeys are matched from an explicit `hotkey` field when present, otherwise from a single-letter visible `icon`, case-insensitive, by `ActionPanel.triggerHotButtonByKey()`. Buttons that still do not have a key, such as Chinese tech icons, receive an automatic unused letter from `PANEL_HOTKEY_ORDER`.

Display rule: the large center text is always the executable hotkey letter when one exists; the small lower label is a command abbreviation capped at 4 characters.

## Panel Routing

- No selection: `empty`
- Single villager: `villager_commands`
- Multiple villagers only: `villager_commands`
- Single player-owned building: `${buildingType}_production`
- Other selection: `empty`

## Common Button Types

- `category` - opens another command panel.
- `nav` - navigation, usually back or close.
- `production` - trains a unit, researches a tech, or runs a production-like command.
- `research` - researches a technology.
- `rally` - enters rally point placement mode.
- `garrison` - enters garrison command mode.
- `cancel` - cancels an under-construction building.
- `empty` - disabled placeholder.

## Static Panels

### `empty`

No buttons.

### `villager_commands`

Shown when selected entities are all villagers.

| Slot | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | A | 建筑 | category | Open `villager_buildings` |
| 2 | B | 军事建筑 | category | Open `villager_military_buildings` |
| 3 | G | 驻扎 | garrison | Select a valid garrison building |

### `villager_buildings`

Regular villager construction panel.

| Slot | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | A | 房屋 | residential | Place `house` |
| 2 |  |  | empty | Disabled |
| 3 | F | 农田 | economy | Place `farm` |
| 4 | R | 伐木场 | economy | Place `lumber_camp` |
| 5 | M | 采矿场 | economy | Place `mining_camp` |
| 6 | W | 城墙 | defense | Place `wall` |
| 7 | G | 城门 | defense | Place `gate` |
| 8 | S | 铁匠铺 | economy | Place `blacksmith` |
| 9 | Mk | 市场 | economy | Hotkey `K`; place `market` |
| 10 | D | 码头 | economy | Place `dock` |
| 11 | Ch | 教堂 | special | Hotkey `H`; place `church` |
| 12 |  |  | empty | Disabled |
| 13 |  |  | empty | Disabled |
| 14 |  |  | empty | Disabled |
| 15 | Esc | 返回 | nav | Press `Esc`; return to the previous command panel |

Note: Huns replace the house button with an empty slot.

### `villager_military_buildings`

Military villager construction panel.

| Slot | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | B | 兵营 | military | Place `barracks` |
| 2 | A | 射箭场 | military | Place `archery_range` |
| 3 | St | 马厩 | military | Hotkey `S`; place `stable` |
| 4 |  |  | empty | Disabled |
| 5 |  |  | empty | Disabled |
| 6 | T | 瞭望塔 | defense | Place `watch_tower` |
| 7 |  |  | empty | Disabled |
| 8 |  |  | empty | Disabled |
| 9 |  |  | empty | Disabled |
| 10 |  |  | empty | Disabled |
| 11 |  |  | empty | Disabled |
| 12 |  |  | empty | Disabled |
| 13 | C | 城堡 | defense | Place `castle` |
| 14 |  |  | empty | Disabled |
| 15 | Esc | 返回 | nav | Press `Esc`; return to the previous command panel |

## Dynamic Building Panels

### Under-Construction Building

Shown for any selected player-owned building while it is under construction.

| Slot | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | X | 取消建造 | cancel | Cancel construction and refund according to construction progress |
| 2-15 |  |  | empty | Disabled |

### `town_center_production`

Shown when selecting a completed town center.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | A | 村民 | production | Queue `villager`, cost `50 food` |
| 2+ | tech icon | Next town center tech | research | Auto-assigned hotkey; queue the next unresearched, unqueued tech for each town center tech line |
| next | ^ | Next age name | age_upgrade | Hotkey `Z`; advance to the next age if current age < 4 |
| optional | U | 取消驻扎 | production | Ungarrison 1 unit when the building supports garrison |
| optional | R | 设置集结点 | rally | Enter rally point placement mode |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

Town center tech lines currently come from `TECH_CONFIG`:

| Line | Techs |
|---|---|
| 村民生存 | 织布机 |
| 城镇瞭望 | 城镇瞭望 |

Age upgrade costs:

| From Age Level | Cost |
|---:|---|
| 1 | `500 food` |
| 2 | `800 food, 200 gold` |
| 3 | `1000 food, 800 gold` |

### Generic Completed Building Production Panel

Shown for completed player-owned buildings that can train units, research techs, set rally points, or ungarrison.

Button generation order:

1. Unit training buttons from `building.buildingFeatures.canTrainUnits`
2. Research buttons from `TECH_CONFIG` for the building
3. `R` rally point button if the building trains/creates units
4. `U` ungarrison button if the building supports garrison
5. `X` close button
6. Empty placeholders until 15 slots

### `barracks_production`

Generated from `BUILDING_TYPES.BARRACKS`.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | S | 士兵 | production | Queue `soldier`, cost `60 food, 20 gold` |
| 2 | K | 骑士 | production | Queue `knight`, cost `60 food, 75 gold` |
| 3+ | tech icon | Next barracks tech per line | research | Auto-assigned hotkey; queue next tech |
| optional | R | 设置集结点 | rally | Enter rally point placement mode |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

Barracks tech lines:

| Line | Techs |
|---|---|
| 步兵升级 | 民兵升级 -> 剑士升级 -> 长剑士升级 |
| 步兵经济 | 补给 |
| 步兵布甲 | 布甲 |
| 反建筑 | 纵火 |

### `archery_range_production`

Generated from `BUILDING_TYPES.ARCHERY_RANGE`.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | A | 弓箭手 | production | Queue `archer`, cost `25 wood, 45 gold` |
| optional | R | 设置集结点 | rally | Enter rally point placement mode |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

No archery range-specific tech is currently defined in `TECH_CONFIG`.

### `stable_production`

Generated from `BUILDING_TYPES.STABLE`.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | Sc | 侦察兵 | production | Hotkey `C`; queue `scout`, cost `80 food` |
| 2+ | tech icon | Next stable tech per line | research | Auto-assigned hotkey; queue next tech |
| optional | R | 设置集结点 | rally | Enter rally point placement mode |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

Stable tech lines:

| Line | Techs |
|---|---|
| 侦察骑兵升级 | 轻骑兵升级 -> 翼骑兵升级 |
| 骑兵生命 | 血统 |
| 骑兵速度 | 畜牧 |

### `blacksmith_production`

Generated from `BUILDING_TYPES.BLACKSMITH`.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1+ | tech icon | Next blacksmith tech per line | research | Auto-assigned hotkey; queue next tech |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

Blacksmith tech lines:

| Line | Techs |
|---|---|
| 近战攻击 | 锻造 -> 铁铸 -> 鼓风炉 |
| 步兵护甲 | 鳞甲 -> 锁子甲 -> 板甲 |
| 骑兵护甲 | 骑兵鳞甲 -> 骑兵锁甲 -> 骑兵板甲 |
| 远程攻击 | 箭羽 -> 锥子箭 -> 护腕 |
| 弓兵护甲 | 弓兵软甲 -> 弓兵皮甲 -> 弓兵环甲 |

### `house_production`

Generated only when the selected house has a valid garrison panel.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| optional | U | 取消驻扎 | production | Ungarrison 1 unit |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

For Khmer, houses can garrison villagers; for other civilizations this panel is not shown.

### `castle_production`

Generated from `BUILDING_TYPES.CASTLE`.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| 1 | U | elite | production | Queue `elite`; current fallback cost is `50 food` and icon is `U` |
| optional | R | 设置集结点 | rally | Enter rally point placement mode |
| optional | U | 取消驻扎 | production | Ungarrison 1 unit |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

Note: `elite` does not yet have a localized name/cost/icon entry in `ActionPanel`.

### `watch_tower_production`

Generated only for garrison-capable command handling.

| Order | Icon | Label | Type | Action |
|---:|---|---|---|---|
| optional | U | 取消驻扎 | production | Ungarrison 1 unit |
| last | X | 关闭 | nav | Hotkey `X`; close production panel |

### Buildings Without Command Panels

These selected completed buildings currently have no generated command panel unless future features add techs, trainable units, rally, or garrison support:

- `farm`
- `lumber_camp`
- `mining_camp`
- `market`
- `church`
- `wall`
- `gate`
- `dock`

## Global Hotkey Behavior

- Any single letter key can trigger the visible button whose explicit `hotkey` or single-letter `icon` matches that letter.
- Multi-character icons now have explicit hotkeys where needed: `Mk` -> `K`, `Ch` -> `H`, `St` -> `S`, `Sc` -> `C`.
- Nav buttons can be triggered by keyboard when they have an explicit hotkey: back is `Esc`, close is `X`.
- Research buttons with non-letter icons receive automatic panel-local hotkeys and show the assigned letter as the large center text.
- `H` centers and selects the town center only if no visible command panel button handled `H` first. In the villager building panel, `H` builds the church.
- `Esc` first cancels rally point placement, then cancels active building placement, then returns to the previous command panel when panel history exists.

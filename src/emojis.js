import { BUILDING_TYPES } from './config.js';

export const BUILDING_EMOJIS = {
    [BUILDING_TYPES.HOUSE]: String.fromCodePoint(0x1F3E0),
    [BUILDING_TYPES.FARM]: String.fromCodePoint(0x1F33E),
    [BUILDING_TYPES.LUMBER_CAMP]: String.fromCodePoint(0x1FAB5),
    [BUILDING_TYPES.MINING_CAMP]: String.fromCodePoint(0x26CF, 0xFE0F),
    [BUILDING_TYPES.BARRACKS]: String.fromCodePoint(0x2694, 0xFE0F),
    [BUILDING_TYPES.STABLE]: String.fromCodePoint(0x1F434),
    [BUILDING_TYPES.ARCHERY_RANGE]: String.fromCodePoint(0x1F3F9),
    [BUILDING_TYPES.CASTLE]: String.fromCodePoint(0x1F3F0),
    [BUILDING_TYPES.MARKET]: String.fromCodePoint(0x1F4B0),
    [BUILDING_TYPES.CHURCH]: String.fromCodePoint(0x26EA),
    [BUILDING_TYPES.BLACKSMITH]: String.fromCodePoint(0x1F528),
    [BUILDING_TYPES.WATCH_TOWER]: String.fromCodePoint(0x1F5FC),
    [BUILDING_TYPES.TOWN_CENTER]: String.fromCodePoint(0x1F3DB, 0xFE0F),
    [BUILDING_TYPES.DOOR]: String.fromCodePoint(0x1F6AA)  // 🚪 door as gate
};

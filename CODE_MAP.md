# CODE_MAP

## Entry Points

- `index.html` - DOM shell, HUD containers, overlay nodes, and the module script tag.
- `src/main.js` - browser entry point that boots the game.
- `src/core/Game.js` - main game controller exposed as `window.game`.

## Core Runtime

- `src/core/Scene.js` - Three.js scene, renderer, and render pipeline glue.
- `src/core/Camera.js` - orthographic camera movement, zoom, and input hooks.
- `src/core/EntityManager.js` - entity creation, registration, removal, and selection helpers.
- `src/core/SystemManager.js` - system construction and update ordering.
- `src/core/EventManager.js` - keyboard, mouse, and delegated gameplay input.

## Entities

- `src/entities/Entity.js` - base entity lifecycle and ownership helpers.
- `src/entities/Unit*.js` - unit behavior, movement, combat, gathering, and animation.
- `src/entities/Building*.js` - building base data, construction, production, collision, garrison, and rally point behavior.
- `src/entities/ResourceNode.js` - natural resources and sheep presentation/state.
- `src/entities/Player.js` - resources, population, civilization bonuses, and researched tech state.
- `src/entities/ResourceManager.js` - resource storage, spending, refunds, and listeners.

## Systems

- `src/systems/BuildingPlacementSystem.js` - building placement, resource cost checks, wall drag placement.
- `src/systems/CombatSystem.js` - centralized combat arbitration for units and defensive buildings.
- `src/systems/ResourceGatheringSystem.js` - gatherer registration, resource collection, and automatic drop-off.
- `src/systems/FogOfWarSystem.js` - visibility, explored state, and fog presentation.
- `src/systems/Pathfinding.js` - A* pathfinding and path cache.
- `src/systems/FormationSystem.js` - multi-unit movement formations.
- `src/systems/CollisionSystem.js` - entity collision and spatial occupancy.

## UI

- `src/ui/HUD.js` - HUD update loop, resource/minimap/action/info panel coordination, global production display, civilization tech widget.
- `src/ui/ActionPanel.js` - command panel presets, build/train/research/garrison/rally commands and hotkeys.
- `src/ui/InfoPanel.js` - selected entity details and selected building production queue cancellation UI.
- `src/ui/ResourceDisplay.js` - top resource and population counters.
- `src/ui/Minimap.js` - minimap rendering and click navigation.
- `src/ui/MapSelectionPanel.js` - start screen map/player/civilization selection.

## Styling

- `src/styles/main.css` - CSS entry file; imports all style modules.
- `src/styles/base.css` - reset, page shell, canvas, and UI layer.
- `src/styles/top-bar.css` - resource bar, population display, age/time display.
- `src/styles/tech-widget.css` - top-right civilization tech tree hover panel.
- `src/styles/production-bar.css` - top-left global production progress display.
- `src/styles/hud-layout.css` - bottom HUD layout and shared panel titles.
- `src/styles/building-panel.css` - build/command buttons and tooltips.
- `src/styles/info-panel.css` - selected entity info and building production queue controls.
- `src/styles/minimap-debug.css` - minimap and debug panel.
- `src/styles/overlays.css` - loading screen, click effect, and selection box.

## Config

- `src/config.js` - building/unit/tech constants, costs, civilization bonuses, i18n names, and gameplay config.
- `src/emojis.js` - building emoji mapping.

## World

- `src/world/Map.js`, `Terrain.js`, `Grid.js`, `SpatialIndex.js` - map data, terrain/grid helpers, and spatial indexing.
- `src/world/MapGenerator.js` - shared map generation helpers.
- `src/world/generators/` - map-specific generator implementations.

## Project Tracking

- `AGENTS.md` - local project workflow, ZenTao status snapshots, current work, and pending verification items.

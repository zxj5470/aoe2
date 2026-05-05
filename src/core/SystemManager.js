import InputHandler from '../input/InputHandler.js';
import Pathfinding from '../systems/Pathfinding.js';
import FormationSystem from '../systems/FormationSystem.js';
import BuildingPlacementSystem from '../systems/BuildingPlacementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import ResourceGatheringSystem from '../systems/ResourceGatheringSystem.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import AISystem from '../systems/AISystem.js';
import SpatialIndex from './SpatialIndex.js';

class SystemManager {
    constructor(game) {
        this.game = game;
        
        this.spatialIndex = null;
        this.formationSystem = null;
        this.combatSystem = null;
        this.aiSystem = null;
        this.inputHandler = null;
        this.pathfinding = null;
        this.buildingPlacementSystem = null;
        this.resourceGatheringSystem = null;
        this.collisionSystem = null;
    }

    initIndependentSystems() {
        this.spatialIndex = new SpatialIndex();
        this.formationSystem = new FormationSystem();
        this.combatSystem = new CombatSystem();
        this.aiSystem = new AISystem(this.game);
    }

    initMapDependentSystems() {
        this.inputHandler = new InputHandler(
            this.game.camera,
            this.game.canvas,
            this.game.map,
            (startX, startY, currentX, currentY) => {
                this.game.updateDragSelectionVisual(startX, startY, currentX, currentY);
            }
        );

        this.pathfinding = new Pathfinding(this.game.map.getGrid());
        this.buildingPlacementSystem = new BuildingPlacementSystem(this.game.map, this.game.scene);
        
        this.resourceGatheringSystem = new ResourceGatheringSystem(
            this.game.map, 
            this.game.resourceManager,
            this.spatialIndex
        );

        this.collisionSystem = new CollisionSystem(this.game.map);
    }

    update(deltaTime) {
        if (this.inputHandler) {
            this.inputHandler.updateWorldPosition();
            
            if (this.buildingPlacementSystem && this.buildingPlacementSystem.isPlacing) {
                const worldPos = this.inputHandler.getWorldPosition();
                this.buildingPlacementSystem.updatePreview(worldPos);
            }
        }

        if (this.game.selectionManager) {
            this.game.selectionManager.update();
        }

        if (this.combatSystem) {
            this.combatSystem.update(deltaTime);
        }

        if (this.aiSystem) {
            this.aiSystem.update(deltaTime);
        }

        if (this.resourceGatheringSystem) {
            this.resourceGatheringSystem.update(deltaTime);
        }
    }

    getSpatialIndex() {
        return this.spatialIndex;
    }

    getFormationSystem() {
        return this.formationSystem;
    }

    getCombatSystem() {
        return this.combatSystem;
    }

    getAISystem() {
        return this.aiSystem;
    }

    getInputHandler() {
        return this.inputHandler;
    }

    getPathfinding() {
        return this.pathfinding;
    }

    getBuildingPlacementSystem() {
        return this.buildingPlacementSystem;
    }

    getResourceGatheringSystem() {
        return this.resourceGatheringSystem;
    }

    getCollisionSystem() {
        return this.collisionSystem;
    }
}

export default SystemManager;

import * as THREE from 'three';

class SelectionManager {
    constructor(formationSystem = null) {
        this.selectedEntities = [];
        this.maxSelection = 24; // 最大选择数量
        this.selectionType = 'unit'; // 'unit' 或 'building'
        
        this.selectionBox = null;
        this.selectionRing = null;
        
        this.formationSystem = formationSystem;
        this.formationType = 'line'; // 默认编队类型
        
        this.listeners = [];
    }

    selectEntity(entity, addToSelection = false) {
        if (!entity || !entity.isAlive) return;
        
        if (!addToSelection) {
            this.deselectAll();
        }
        
        if (!this.selectedEntities.includes(entity)) {
            // 检查是否超过最大选择数量
            if (this.selectedEntities.length >= this.maxSelection) {
                return;
            }
            
            // 检查类型一致性
            if (this.selectedEntities.length > 0) {
                const firstType = this.selectedEntities[0].type;
                if (entity.type !== firstType) {
                    return;
                }
            }
            
            entity.select();
            this.selectedEntities.push(entity);
            this.selectionType = entity.type;
            
            this.notifyListeners('select', entity);
        }
    }

    selectEntities(entities, addToSelection = false) {
        if (!addToSelection) {
            this.deselectAll();
        }
        
        for (const entity of entities) {
            if (entity && entity.isAlive) {
                if (this.selectedEntities.length >= this.maxSelection) {
                    break;
                }
                
                if (!this.selectedEntities.includes(entity)) {
                    entity.select();
                    this.selectedEntities.push(entity);
                }
            }
        }
        
        if (this.selectedEntities.length > 0) {
            this.selectionType = this.selectedEntities[0].type;
        }
        
        this.notifyListeners('selectMultiple', entities);
    }

    deselectEntity(entity) {
        const index = this.selectedEntities.indexOf(entity);
        if (index > -1) {
            entity.deselect();
            this.selectedEntities.splice(index, 1);
            this.notifyListeners('deselect', entity);
        }
    }

    deselectAll() {
        for (const entity of this.selectedEntities) {
            entity.deselect();
        }
        
        const deselectedEntities = [...this.selectedEntities];
        this.selectedEntities = [];
        this.selectionType = 'unit';
        
        this.notifyListeners('deselectAll', deselectedEntities);
    }

    getSelectedEntities() {
        return [...this.selectedEntities];
    }

    getSelectedCount() {
        return this.selectedEntities.length;
    }

    hasSelection() {
        return this.selectedEntities.length > 0;
    }

    getSelectionType() {
        return this.selectionType;
    }

    getSelectionCenter() {
        if (this.selectedEntities.length === 0) {
            return null;
        }
        
        const center = new THREE.Vector3();
        
        for (const entity of this.selectedEntities) {
            center.add(entity.getPosition());
        }
        
        center.divideScalar(this.selectedEntities.length);
        
        return center;
    }

    getSelectionBoundingBox() {
        if (this.selectedEntities.length === 0) {
            return null;
        }
        
        const positions = this.selectedEntities.map(entity => entity.getPosition());
        
        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x));
        const minZ = Math.min(...positions.map(p => p.z));
        const maxZ = Math.max(...positions.map(p => p.z));
        
        return {
            minX,
            maxX,
            minZ,
            maxZ,
            center: new THREE.Vector3(
                (minX + maxX) / 2,
                0,
                (minZ + maxZ) / 2
            )
        };
    }

    issueCommand(command, target, extra = null) {
        for (const entity of this.selectedEntities) {
            if (entity.queueAction) {
                entity.queueAction({
                    type: command,
                    target: target,
                    dropOffPoint: extra // 传递额外参数（如投放点）
                });
            }
        }

        this.notifyListeners('command', { command, target, extra });
    }

    issueMoveCommand(targetPosition) {
        // 如果选择的是单位类型，尝试使用编队系统
        if (this.selectionType === 'unit' && this.formationSystem) {
            const units = this.selectedEntities.filter(entity => entity.type === 'unit');
            
            if (units.length > 1) {
                // 多个单位，使用编队移动
                const formationAssignments = this.formationSystem.createFormation(
                    units,
                    targetPosition,
                    this.formationType
                );
                
                // 为每个单位分配编队位置
                for (const assignment of formationAssignments) {
                    if (assignment.unit.moveTo) {
                        assignment.unit.moveTo(assignment.position);
                    }
                }
                
                this.notifyListeners('move', { targetPosition, formation: this.formationType });
                return;
            }
        }
        
        // 单个单位或无法使用编队，直接移动
        for (const entity of this.selectedEntities) {
            if (entity.moveTo) {
                entity.moveTo(targetPosition);
            }
        }
        
        this.notifyListeners('move', targetPosition);
    }
    
    /**
     * 设置编队类型
     */
    setFormationType(formationType) {
        this.formationType = formationType;
    }
    
    /**
     * 获取当前编队类型
     */
    getFormationType() {
        return this.formationType;
    }

    issueAttackCommand(targetEntity) {
        for (const entity of this.selectedEntities) {
            if (entity.attackEntity) {
                entity.attackEntity(targetEntity);
            }
        }
        
        this.notifyListeners('attack', targetEntity);
    }

    issueStopCommand() {
        for (const entity of this.selectedEntities) {
            if (entity.stop) {
                entity.stop();
            }
        }
        
        this.notifyListeners('stop', null);
    }

    filterByType(type) {
        return this.selectedEntities.filter(entity => entity.type === type);
    }

    filterByOwner(owner) {
        return this.selectedEntities.filter(entity => entity.owner === owner);
    }

    filterByUnitType(unitType) {
        return this.selectedEntities.filter(entity => 
            entity.unitType === unitType
        );
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners(event, data) {
        for (const listener of this.listeners) {
            if (typeof listener === 'function') {
                listener(event, data);
            }
        }
    }

    update() {
        // 移除已死亡的实体
        const deadEntities = this.selectedEntities.filter(entity => !entity.isAlive);
        
        for (const entity of deadEntities) {
            this.deselectEntity(entity);
        }
    }

    reset() {
        this.deselectAll();
        this.selectedEntities = [];
        this.selectionType = 'unit';
    }
}

export default SelectionManager;
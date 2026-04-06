import * as THREE from 'three';

class FormationSystem {
    constructor() {
        this.formations = {
            line: this.createLineFormation.bind(this),
            column: this.createColumnFormation.bind(this),
            square: this.createSquareFormation.bind(this),
            wedge: this.createWedgeFormation.bind(this),
            circle: this.createCircleFormation.bind(this)
        };
    }

    createFormation(units, targetPosition, formationType = 'line') {
        const formationCreator = this.formations[formationType];
        
        if (!formationCreator) {
            console.warn(`Unknown formation type: ${formationType}`);
            return this.createLineFormation(units, targetPosition);
        }
        
        return formationCreator(units, targetPosition);
    }

    createLineFormation(units, targetPosition) {
        const positions = [];
        const spacing = 2;
        const direction = new THREE.Vector3(1, 0, 0);
        
        for (let i = 0; i < units.length; i++) {
            const offset = (i - (units.length - 1) / 2) * spacing;
            const position = targetPosition.clone().add(direction.multiplyScalar(offset));
            positions.push(position);
        }
        
        return this.assignPositions(units, positions);
    }

    createColumnFormation(units, targetPosition) {
        const positions = [];
        const spacing = 2;
        const direction = new THREE.Vector3(0, 0, 1);
        
        for (let i = 0; i < units.length; i++) {
            const offset = (i - (units.length - 1) / 2) * spacing;
            const position = targetPosition.clone().add(direction.multiplyScalar(offset));
            positions.push(position);
        }
        
        return this.assignPositions(units, positions);
    }

    createSquareFormation(units, targetPosition) {
        const positions = [];
        const sideLength = Math.ceil(Math.sqrt(units.length));
        const spacing = 2;
        
        let index = 0;
        for (let row = 0; row < sideLength && index < units.length; row++) {
            for (let col = 0; col < sideLength && index < units.length; col++) {
                const offsetX = (col - (sideLength - 1) / 2) * spacing;
                const offsetZ = (row - (sideLength - 1) / 2) * spacing;
                const position = targetPosition.clone().add(new THREE.Vector3(offsetX, 0, offsetZ));
                positions.push(position);
                index++;
            }
        }
        
        return this.assignPositions(units, positions);
    }

    createWedgeFormation(units, targetPosition) {
        const positions = [];
        const spacing = 2;
        
        positions.push(targetPosition.clone()); // 前锋
        
        let row = 1;
        let index = 1;
        
        while (index < units.length) {
            const rowUnits = Math.min(2 * row, units.length - index);
            const startCol = -rowUnits / 2 + 0.5;
            
            for (let col = 0; col < rowUnits && index < units.length; col++) {
                const offsetX = (startCol + col) * spacing;
                const offsetZ = row * spacing;
                const position = targetPosition.clone().add(new THREE.Vector3(offsetX, 0, offsetZ));
                positions.push(position);
                index++;
            }
            
            row++;
        }
        
        return this.assignPositions(units, positions);
    }

    createCircleFormation(units, targetPosition) {
        const positions = [];
        const radius = Math.max(2, units.length * 0.5);
        
        for (let i = 0; i < units.length; i++) {
            const angle = (i / units.length) * Math.PI * 2;
            const offsetX = Math.cos(angle) * radius;
            const offsetZ = Math.sin(angle) * radius;
            const position = targetPosition.clone().add(new THREE.Vector3(offsetX, 0, offsetZ));
            positions.push(position);
        }
        
        return this.assignPositions(units, positions);
    }

    assignPositions(units, positions) {
        const assignments = [];
        
        // 根据当前位置对单位进行排序，以减少移动距离
        const sortedUnits = [...units].sort((a, b) => {
            const distA = a.position.distanceTo(positions[0]);
            const distB = b.position.distanceTo(positions[0]);
            return distA - distB;
        });
        
        for (let i = 0; i < sortedUnits.length; i++) {
            if (i < positions.length) {
                assignments.push({
                    unit: sortedUnits[i],
                    position: positions[i]
                });
            }
        }
        
        return assignments;
    }

    assignNearestPositions(units, positions) {
        const assignments = [];
        const usedPositions = new Set();
        
        for (const unit of units) {
            let nearestPosition = null;
            let nearestDistance = Infinity;
            let nearestIndex = -1;
            
            for (let i = 0; i < positions.length; i++) {
                if (usedPositions.has(i)) continue;
                
                const distance = unit.position.distanceTo(positions[i]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPosition = positions[i];
                    nearestIndex = i;
                }
            }
            
            if (nearestPosition) {
                assignments.push({
                    unit: unit,
                    position: nearestPosition
                });
                usedPositions.add(nearestIndex);
            }
        }
        
        return assignments;
    }

    applyFormation(units, targetPosition, formationType = 'line') {
        const assignments = this.createFormation(units, targetPosition, formationType);
        
        for (const assignment of assignments) {
            if (assignment.unit.moveTo) {
                assignment.unit.moveTo(assignment.position);
            }
        }
        
        return assignments;
    }

    calculateFormationCenter(units) {
        if (units.length === 0) {
            return new THREE.Vector3();
        }
        
        const center = new THREE.Vector3();
        
        for (const unit of units) {
            center.add(unit.getPosition());
        }
        
        center.divideScalar(units.length);
        
        return center;
    }

    rotateFormation(formationAssignments, center, angle) {
        const rotatedAssignments = [];
        
        for (const assignment of formationAssignments) {
            const relativePosition = assignment.position.clone().sub(center);
            
            // 旋转向量
            const rotatedX = relativePosition.x * Math.cos(angle) - relativePosition.z * Math.sin(angle);
            const rotatedZ = relativePosition.x * Math.sin(angle) + relativePosition.z * Math.cos(angle);
            
            const newPosition = center.clone().add(new THREE.Vector3(rotatedX, 0, rotatedZ));
            
            rotatedAssignments.push({
                unit: assignment.unit,
                position: newPosition
            });
        }
        
        return rotatedAssignments;
    }

    scaleFormation(formationAssignments, center, scale) {
        const scaledAssignments = [];
        
        for (const assignment of formationAssignments) {
            const relativePosition = assignment.position.clone().sub(center);
            relativePosition.multiplyScalar(scale);
            
            const newPosition = center.clone().add(relativePosition);
            
            scaledAssignments.push({
                unit: assignment.unit,
                position: newPosition
            });
        }
        
        return scaledAssignments;
    }

    getFormationTypes() {
        return Object.keys(this.formations);
    }
}

export default FormationSystem;
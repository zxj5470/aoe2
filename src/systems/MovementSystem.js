import * as THREE from 'three';

class MovementSystem {
    constructor(map) {
        this.map = map;
        this.grid = map.getGrid();
    }

    findPath(startX, startZ, endX, endZ, includeDiagonals = true) {
        const startCell = this.grid.getCellAtPosition(startX, startZ);
        const endCell = this.grid.getCellAtPosition(endX, endZ);
        
        if (!startCell || !endCell) {
            return [];
        }
        
        // 使用A*算法寻路
        return this.findAStarPath(startCell, endCell, includeDiagonals);
    }

    findAStarPath(startCell, endCell, includeDiagonals = true) {
        const openSet = [startCell];
        const closedSet = new Set();
        const cameFrom = new Map();
        
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(startCell, 0);
        fScore.set(startCell, this.heuristic(startCell, endCell));
        
        while (openSet.length > 0) {
            // 找到fScore最小的节点
            let current = openSet[0];
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(openSet[i]) < fScore.get(current)) {
                    current = openSet[i];
                }
            }
            
            // 到达目标
            if (current === endCell) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // 从openSet中移除current
            const index = openSet.indexOf(current);
            openSet.splice(index, 1);
            closedSet.add(current);
            
            // 检查所有邻居
            const neighbors = this.grid.getNeighbors(current.x, current.y, includeDiagonals);
            
            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || !neighbor.walkable || neighbor.occupied) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(current) + this.distance(current, neighbor);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    continue;
                }
                
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endCell));
            }
        }
        
        // 没有找到路径
        return [];
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        
        return path;
    }

    heuristic(a, b) {
        // 曼哈顿距离
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    distance(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        
        if (dx === 1 && dy === 1) {
            return 1.414; // 对角线距离
        }
        
        return 1;
    }

    moveUnit(unit, targetPosition, deltaTime) {
        const path = this.findPath(
            unit.position.x,
            unit.position.z,
            targetPosition.x,
            targetPosition.z
        );
        
        if (path.length > 0) {
            this.followPath(unit, path, deltaTime);
            return true;
        }
        
        return false;
    }

    followPath(unit, path, deltaTime) {
        if (path.length === 0) {
            return false;
        }
        
        const targetCell = path[0];
        const targetX = targetCell.x * this.grid.cellSize + this.grid.cellSize / 2;
        const targetZ = targetCell.y * this.grid.cellSize + this.grid.cellSize / 2;
        
        const direction = new THREE.Vector3(targetX - unit.position.x, 0, targetZ - unit.position.z);
        const distance = direction.length();
        
        if (distance < 0.1) {
            // 到达当前目标点，移除并继续下一个
            path.shift();
            return this.followPath(unit, path, deltaTime);
        }
        
        direction.normalize();
        const moveDistance = unit.speed * deltaTime;
        
        if (distance <= moveDistance) {
            unit.setPosition(targetX, unit.position.y, targetZ);
            path.shift();
        } else {
            const newPosition = unit.position.clone().add(direction.multiplyScalar(moveDistance));
            unit.setPosition(newPosition.x, newPosition.y, newPosition.z);
        }
        
        // 旋转朝向目标
        unit.setRotation(Math.atan2(direction.x, direction.z));
        
        return true;
    }

    getClosestWalkablePosition(x, z, maxDistance = 10) {
        for (let distance = 1; distance <= maxDistance; distance++) {
            const cells = this.getCellsAtDistance(x, z, distance);
            
            for (const cell of cells) {
                if (cell.walkable && !cell.occupied) {
                    return {
                        x: cell.x * this.grid.cellSize + this.grid.cellSize / 2,
                        z: cell.y * this.grid.cellSize + this.grid.cellSize / 2
                    };
                }
            }
        }
        
        return null;
    }

    getCellsAtDistance(x, z, distance) {
        const cells = [];
        const cellX = Math.floor(x / this.grid.cellSize);
        const cellY = Math.floor(z / this.grid.cellSize);
        
        for (let dx = -distance; dx <= distance; dx++) {
            for (let dy = -distance; dy <= distance; dy++) {
                if (Math.abs(dx) + Math.abs(dy) === distance) {
                    const cell = this.grid.getCell(cellX + dx, cellY + dy);
                    if (cell) {
                        cells.push(cell);
                    }
                }
            }
        }
        
        return cells;
    }
}

export default MovementSystem;
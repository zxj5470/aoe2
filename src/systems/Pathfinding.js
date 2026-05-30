import * as THREE from 'three';

class Pathfinding {
    constructor(grid) {
        this.grid = grid;
        this.openSet = [];
        this.closedSet = new Set();
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();
        
        this.pathCache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.maxCacheSize = 1000;
        this.cacheTTL = 10000;
    }

    findPath(startX, startZ, endX, endZ, options = {}) {
        const {
            allowDiagonals = true,
            avoidEnemies = false,
            maxIterations = 10000,
            useCache = true
        } = options;

        if (useCache) {
            const cachedPath = this.getCachedPath(startX, startZ, endX, endZ, options);
            if (cachedPath) {
                return cachedPath;
            }
        }

        let startCell = this.grid.getCellAtPosition(startX, startZ);
        let endCell = this.grid.getCellAtPosition(endX, endZ);

        if (!startCell || !endCell) {
            return { path: [], success: false };
        }

        if (!startCell.walkable || startCell.occupied) {
            const nearbyWalkable = this.findNearbyWalkable(startCell, 3);
            if (nearbyWalkable) {
                startCell = nearbyWalkable;
            } else {
                return { path: [], success: false };
            }
        }

        if (!endCell.walkable || endCell.occupied) {
            const nearbyWalkable = this.findNearbyWalkable(endCell, 3);
            if (nearbyWalkable) {
                endCell = nearbyWalkable;
            } else {
                return { path: [], success: false };
            }
        }

        const result = this.findAStarPath(startCell, endCell, allowDiagonals, maxIterations);

        if (result.success && useCache) {
            this.cachePath(startX, startZ, endX, endZ, result, options);
        }

        return result;
    }

    findAStarPath(startCell, endCell, allowDiagonals, maxIterations) {
        this.reset();

        this.openSet.push(startCell);
        this.gScore.set(startCell, 0);
        this.fScore.set(startCell, this.heuristic(startCell, endCell));

        let iterations = 0;

        while (this.openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            let current = this.getLowestFScore();

            if (current === endCell) {
                const path = this.reconstructPath(current);
                return { path, success: true, iterations };
            }

            const index = this.openSet.indexOf(current);
            this.openSet.splice(index, 1);
            this.closedSet.add(current);

            const neighbors = this.grid.getNeighbors(current.x, current.y, allowDiagonals);

            for (const neighbor of neighbors) {
                if (this.closedSet.has(neighbor) || !neighbor.walkable) {
                    continue;
                }

                if (neighbor.occupied && neighbor !== endCell) {
                    continue;
                }

                const tentativeGScore = this.gScore.get(current) + this.getDistance(current, neighbor);

                if (!this.openSet.includes(neighbor)) {
                    this.openSet.push(neighbor);
                } else if (tentativeGScore >= this.gScore.get(neighbor)) {
                    continue;
                }

                this.cameFrom.set(neighbor, current);
                this.gScore.set(neighbor, tentativeGScore);
                this.fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, endCell));
            }
        }

        return { path: [], success: false, iterations };
    }

    getLowestFScore() {
        let lowest = this.openSet[0];
        let lowestScore = this.fScore.get(lowest);

        for (let i = 1; i < this.openSet.length; i++) {
            const current = this.openSet[i];
            const currentScore = this.fScore.get(current);

            if (currentScore < lowestScore) {
                lowest = current;
                lowestScore = currentScore;
            }
        }

        return lowest;
    }

    reconstructPath(current) {
        const path = [current];

        while (this.cameFrom.has(current)) {
            current = this.cameFrom.get(current);
            path.unshift(current);
        }

        return path;
    }

    heuristic(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getDistance(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);

        if (dx === 1 && dy === 1) {
            return 1.414;
        }

        return 1;
    }

    findNearbyWalkable(cell, radius) {
        for (let distance = 1; distance <= radius; distance++) {
            for (let dx = -distance; dx <= distance; dx++) {
                for (let dy = -distance; dy <= distance; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) !== distance) continue;
                    const neighbor = this.grid.getCell(cell.x + dx, cell.y + dy);
                    if (neighbor && neighbor.walkable && !neighbor.occupied) {
                        return neighbor;
                    }
                }
            }
        }
        return null;
    }

    getPathToNearestWalkable(startX, startZ, targetX, targetZ, maxDistance = 10) {
        const startCell = this.grid.getCellAtPosition(startX, startZ);
        const targetCell = this.grid.getCellAtPosition(targetX, targetZ);

        if (!startCell) {
            return { path: [], success: false };
        }

        if (targetCell && targetCell.walkable && !targetCell.occupied) {
            return this.findPath(startX, startZ, targetX, targetZ);
        }

        for (let distance = 1; distance <= maxDistance; distance++) {
            const cells = this.getCellsAtDistance(targetX, targetZ, distance);

            for (const cell of cells) {
                if (cell.walkable && !cell.occupied) {
                    const result = this.findPath(
                        startX,
                        startZ,
                        cell.x * this.grid.cellSize + this.grid.cellSize / 2,
                        cell.y * this.grid.cellSize + this.grid.cellSize / 2
                    );

                    if (result.success) {
                        return result;
                    }
                }
            }
        }

        return { path: [], success: false };
    }

    getCellsAtDistance(x, z, distance) {
        const cells = [];

        // 世界坐标转换到网格索引，需要考虑地图偏移（地图中心在原点）
        const cellX = Math.floor(x / this.grid.cellSize + this.grid.width / 2);
        const cellY = Math.floor(z / this.grid.cellSize + this.grid.height / 2);

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

    reset() {
        this.openSet = [];
        this.closedSet.clear();
        this.cameFrom.clear();
        this.gScore.clear();
        this.fScore.clear();
    }

    smoothPath(path) {
        if (path.length <= 2) {
            return path;
        }

        const smoothedPath = [path[0]];
        let current = path[0];

        for (let i = 1; i < path.length - 1; i++) {
            const next = path[i + 1];

            if (this.hasLineOfSight(current, next)) {
                continue;
            }

            smoothedPath.push(path[i]);
            current = path[i];
        }

        smoothedPath.push(path[path.length - 1]);
        return smoothedPath;
    }

    hasLineOfSight(from, to) {
        const x0 = from.x;
        const y0 = from.y;
        const x1 = to.x;
        const y1 = to.y;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (true) {
            if (x === x1 && y === y1) {
                return true;
            }

            const cell = this.grid.getCell(x, y);
            if (!cell || !cell.walkable || cell.occupied) {
                return false;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    generateCacheKey(startX, startZ, endX, endZ, options = {}) {
        const key = `${Math.floor(startX)},${Math.floor(startZ)}-${Math.floor(endX)},${Math.floor(endZ)}-${options.allowDiagonals ? 'diag' : 'nodiag'}`;
        return key;
    }

    getCachedPath(startX, startZ, endX, endZ, options = {}) {
        const key = this.generateCacheKey(startX, startZ, endX, endZ, options);
        const cached = this.pathCache.get(key);

        if (!cached) {
            this.cacheMisses++;
            return null;
        }

        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.pathCache.delete(key);
            this.cacheMisses++;
            return null;
        }

        this.cacheHits++;
        return { ...cached.data, fromCache: true };
    }

    cachePath(startX, startZ, endX, endZ, pathData, options = {}) {
        const key = this.generateCacheKey(startX, startZ, endX, endZ, options);

        if (this.pathCache.size >= this.maxCacheSize) {
            const oldestKey = this.pathCache.keys().next().value;
            this.pathCache.delete(oldestKey);
        }

        this.pathCache.set(key, {
            data: pathData,
            timestamp: Date.now()
        });
    }

    clearPathCache() {
        this.pathCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    getCacheStats() {
        return {
            size: this.pathCache.size,
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: this.cacheHits + this.cacheMisses > 0 
                ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2) + '%'
                : '0%',
            maxSize: this.maxCacheSize
        };
    }

    invalidateCacheForCell(cellX, cellY) {
        const keysToDelete = [];

        for (const [key, value] of this.pathCache) {
            const [start, end] = key.split('-');
            const [sx, sy] = start.split(',').map(Number);
            const [ex, ey] = end.split('-').map(Number);

            const path = value.data.path;
            for (const cell of path) {
                if (cell.x === cellX && cell.y === cellY) {
                    keysToDelete.push(key);
                    break;
                }
            }
        }

        for (const key of keysToDelete) {
            this.pathCache.delete(key);
        }

        return keysToDelete.length;
    }

    updateDynamicPath(currentPath, currentIndex, unit, avoidCells = []) {
        if (!currentPath || currentPath.length === 0) {
            return currentPath;
        }

        const updatedPath = [];
        const startCell = currentPath[currentIndex] || currentPath[0];
        const targetCell = currentPath[currentPath.length - 1];

        let pathValid = true;
        for (let i = currentIndex; i < currentPath.length; i++) {
            const cell = currentPath[i];
            
            if (!cell.walkable || cell.occupied || avoidCells.includes(cell)) {
                pathValid = false;
                break;
            }
        }

        if (pathValid) {
            return currentPath;
        }

        const startPos = unit.getPosition();
        const endX = targetCell.x * this.grid.cellSize + this.grid.cellSize / 2;
        const endZ = targetCell.y * this.grid.cellSize + this.grid.cellSize / 2;

        const result = this.findPath(startPos.x, startPos.z, endX, endZ);

        if (result.success) {
            return this.smoothPath(result.path);
        }

        return currentPath.slice(0, currentIndex + 1);
    }

    predictPathConflicts(path1, path2, timeWindow = 1000) {
        const conflicts = [];

        if (!path1 || !path2) {
            return conflicts;
        }

        for (let i = 0; i < path1.length; i++) {
            for (let j = 0; j < path2.length; j++) {
                if (path1[i].x === path2[j].x && path1[i].y === path2[j].y) {
                    conflicts.push({
                        cell: path1[i],
                        path1Index: i,
                        path2Index: j
                    });
                }
            }
        }

        return conflicts;
    }

    optimizePathForMovement(path) {
        if (path.length <= 2) {
            return path;
        }

        const optimizedPath = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];

            if (this.hasLineOfSight(prev, next)) {
                continue;
            }

            optimizedPath.push(current);
        }

        optimizedPath.push(path[path.length - 1]);
        return optimizedPath;
    }

    getPathDistance(path) {
        if (!path || path.length < 2) {
            return 0;
        }

        let totalDistance = 0;

        for (let i = 1; i < path.length; i++) {
            totalDistance += this.getDistance(path[i - 1], path[i]);
        }

        return totalDistance;
    }

    estimateTravelTime(path, speed = 5) {
        const distance = this.getPathDistance(path);
        return distance / speed;
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
        // 网格索引转换到世界坐标，需要考虑地图偏移（地图中心在原点）
        const targetX = targetCell.x * this.grid.cellSize + this.grid.cellSize / 2 - this.grid.width * this.grid.cellSize / 2;
        const targetZ = targetCell.y * this.grid.cellSize + this.grid.cellSize / 2 - this.grid.height * this.grid.cellSize / 2;

        const direction = new THREE.Vector3(targetX - unit.position.x, 0, targetZ - unit.position.z);
        const distance = direction.length();

        if (distance < 0.1) {
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
}

export default Pathfinding;

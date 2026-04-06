class Pathfinding {
    constructor(grid) {
        this.grid = grid;
        this.openSet = [];
        this.closedSet = new Set();
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();
        
        // 路径缓存系统
        this.pathCache = new Map();
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.maxCacheSize = 1000; // 最大缓存数量
        this.cacheTTL = 10000; // 缓存生存时间（毫秒）
    }

    findPath(startX, startZ, endX, endZ, options = {}) {
        const {
            allowDiagonals = true,
            avoidEnemies = false,
            maxIterations = 10000,
            useCache = true
        } = options;

        // 尝试从缓存获取路径
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
            // 尝试找到附近的可行走位置
            const nearbyWalkable = this.findNearbyWalkable(startCell, 3);
            if (nearbyWalkable) {
                startCell = nearbyWalkable;
            } else {
                return { path: [], success: false };
            }
        }

        if (!endCell.walkable || endCell.occupied) {
            // 尝试找到目标附近的可行走位置
            const nearbyWalkable = this.findNearbyWalkable(endCell, 3);
            if (nearbyWalkable) {
                endCell = nearbyWalkable;
            } else {
                return { path: [], success: false };
            }
        }

        const result = this.findAStarPath(startCell, endCell, allowDiagonals, maxIterations);

        // 缓存成功的路径
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

            // 找到fScore最小的节点
            let current = this.getLowestFScore();

            // 到达目标
            if (current === endCell) {
                const path = this.reconstructPath(current);
                return { path, success: true, iterations };
            }

            // 从openSet中移除current
            const index = this.openSet.indexOf(current);
            this.openSet.splice(index, 1);
            this.closedSet.add(current);

            // 检查所有邻居
            const neighbors = this.grid.getNeighbors(current.x, current.y, allowDiagonals);

            for (const neighbor of neighbors) {
                if (this.closedSet.has(neighbor) || !neighbor.walkable) {
                    continue;
                }

                // 避免被占用的格子（除非是目标）
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

        // 没有找到路径
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
        // 欧几里得距离
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getDistance(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);

        if (dx === 1 && dy === 1) {
            return 1.414; // 对角线距离
        }

        return 1;
    }

    findNearbyWalkable(cell, radius) {
        for (let distance = 1; distance <= radius; distance++) {
            const neighbors = this.grid.getNeighbors(cell.x, cell.y, true);

            for (const neighbor of neighbors) {
                if (neighbor.walkable && !neighbor.occupied) {
                    return neighbor;
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

        // 在目标附近寻找可行走的位置
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

            // 检查是否可以直接跳到next
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
        // 简单的视线检查（Bresenham算法）
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

    /**
     * 生成缓存键
     */
    generateCacheKey(startX, startZ, endX, endZ, options = {}) {
        const key = `${Math.floor(startX)},${Math.floor(startZ)}-${Math.floor(endX)},${Math.floor(endZ)}-${options.allowDiagonals ? 'diag' : 'nodiag'}`;
        return key;
    }

    /**
     * 从缓存获取路径
     */
    getCachedPath(startX, startZ, endX, endZ, options = {}) {
        const key = this.generateCacheKey(startX, startZ, endX, endZ, options);
        const cached = this.pathCache.get(key);

        if (!cached) {
            this.cacheMisses++;
            return null;
        }

        // 检查缓存是否过期
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.pathCache.delete(key);
            this.cacheMisses++;
            return null;
        }

        this.cacheHits++;
        return { ...cached.data, fromCache: true };
    }

    /**
     * 缓存路径
     */
    cachePath(startX, startZ, endX, endZ, pathData, options = {}) {
        const key = this.generateCacheKey(startX, startZ, endX, endZ, options);

        // 如果缓存已满，删除最旧的条目
        if (this.pathCache.size >= this.maxCacheSize) {
            const oldestKey = this.pathCache.keys().next().value;
            this.pathCache.delete(oldestKey);
        }

        this.pathCache.set(key, {
            data: pathData,
            timestamp: Date.now()
        });
    }

    /**
     * 清除路径缓存
     */
    clearPathCache() {
        this.pathCache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * 获取缓存统计信息
     */
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

    /**
     * 使包含指定单元格的缓存路径失效
     */
    invalidateCacheForCell(cellX, cellY) {
        const keysToDelete = [];

        for (const [key, value] of this.pathCache) {
            const [start, end] = key.split('-');
            const [sx, sy] = start.split(',').map(Number);
            const [ex, ey] = end.split('-').map(Number);

            // 检查路径是否经过这个单元格
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

    /**
     * 动态更新路径（当路径上的单元格状态改变时）
     */
    updateDynamicPath(currentPath, currentIndex, unit, avoidCells = []) {
        if (!currentPath || currentPath.length === 0) {
            return currentPath;
        }

        const updatedPath = [];
        const startCell = currentPath[currentIndex] || currentPath[0];
        const targetCell = currentPath[currentPath.length - 1];

        // 检查剩余路径是否仍然有效
        let pathValid = true;
        for (let i = currentIndex; i < currentPath.length; i++) {
            const cell = currentPath[i];
            
            // 检查单元格是否被占用或不可行走
            if (!cell.walkable || cell.occupied || avoidCells.includes(cell)) {
                pathValid = false;
                break;
            }
        }

        if (pathValid) {
            // 路径仍然有效，无需重新计算
            return currentPath;
        }

        // 路径无效，需要重新计算
        const startPos = unit.getPosition();
        const endX = targetCell.x * this.grid.cellSize + this.grid.cellSize / 2;
        const endZ = targetCell.y * this.grid.cellSize + this.grid.cellSize / 2;

        const result = this.findPath(startPos.x, startPos.z, endX, endZ);

        if (result.success) {
            // 平滑新路径
            return this.smoothPath(result.path);
        }

        // 无法找到新路径，返回部分有效路径
        return currentPath.slice(0, currentIndex + 1);
    }

    /**
     * 预测路径冲突（用于多单位协调）
     */
    predictPathConflicts(path1, path2, timeWindow = 1000) {
        const conflicts = [];

        if (!path1 || !path2) {
            return conflicts;
        }

        // 简化的冲突检测：检查两个路径是否在相同时间经过相同位置
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

    /**
     * 优化路径以减少转向
     */
    optimizePathForMovement(path) {
        if (path.length <= 2) {
            return path;
        }

        const optimizedPath = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];

            // 检查是否可以跳过当前点
            if (this.hasLineOfSight(prev, next)) {
                continue;
            }

            optimizedPath.push(current);
        }

        optimizedPath.push(path[path.length - 1]);
        return optimizedPath;
    }

    /**
     * 获取路径的总距离
     */
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

    /**
     * 估算路径的旅行时间
     */
    estimateTravelTime(path, speed = 5) {
        const distance = this.getPathDistance(path);
        return distance / speed; // 返回秒数
    }
}

export default Pathfinding;
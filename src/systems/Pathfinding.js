class Pathfinding {
    constructor(grid) {
        this.grid = grid;
        this.openSet = [];
        this.closedSet = new Set();
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();
    }

    findPath(startX, startZ, endX, endZ, options = {}) {
        const {
            allowDiagonals = true,
            avoidEnemies = false,
            maxIterations = 10000
        } = options;

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

        return this.findAStarPath(startCell, endCell, allowDiagonals, maxIterations);
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
}

export default Pathfinding;
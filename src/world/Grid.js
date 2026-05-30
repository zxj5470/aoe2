class Grid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cells = [];
        this.initGrid();
    }

    initGrid() {
        // 初始化网格数据
        this.cells = [];
        for (let x = 0; x < this.width; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.cells[x][y] = {
                    x: x,
                    y: y,
                    type: 'grass', // 默认地形类型
                    walkable: true,
                    occupied: false,
                    entity: null,
                    height: 0
                };
            }
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.cells[x][y];
    }

    setCell(x, y, data) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            Object.assign(this.cells[x][y], data);
        }
    }

    getCellAtPosition(worldX, worldZ) {
        // 世界坐标 (-100~100) 转换到网格索引 (0~199)
        const x = Math.floor(worldX / this.cellSize + this.width / 2);
        const y = Math.floor(worldZ / this.cellSize + this.height / 2);
        const cell = this.getCell(x, y);
        return cell;
    }

    isWalkable(x, y) {
        const cell = this.getCell(x, y);
        return cell && cell.walkable && !cell.occupied;
    }

    setOccupied(x, y, occupied, entity = null) {
        const cell = this.getCell(x, y);
        if (cell) {
            cell.occupied = occupied;
            cell.entity = entity;
        }
    }

    getNeighbors(x, y, includeDiagonals = false) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }   // 右
        ];

        if (includeDiagonals) {
            directions.push(
                { dx: -1, dy: -1 },
                { dx: 1, dy: -1 },
                { dx: -1, dy: 1 },
                { dx: 1, dy: 1 }
            );
        }

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const cell = this.getCell(nx, ny);
            if (cell) {
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    clear() {
        this.initGrid();
    }

    getSize() {
        return {
            width: this.width,
            height: this.height,
            cellSize: this.cellSize
        };
    }

    /**
     * 调试接口：打印指定区域的网格状态
     * @param {number} centerX - 中心世界坐标X
     * @param {number} centerZ - 中心世界坐标Z
     * @param {number} radius - 半径（格子数）
     */
    debugPrintArea(centerX, centerZ, radius = 10) {
        const centerCellX = Math.floor(centerX / this.cellSize + this.width / 2);
        const centerCellY = Math.floor(centerZ / this.cellSize + this.height / 2);

        console.log(`\n========== 网格状态调试 ==========`);
        console.log(`中心坐标: (${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`);
        console.log(`中心格子: (${centerCellX}, ${centerCellY})`);
        console.log(`半径: ${radius} 格子`);

        let occupiedCount = 0;
        let resourceCount = 0;
        let buildingCount = 0;
        let unitCount = 0;

        // 打印地图（ASCII 艺术风格）
        console.log(`\n地图图例:`);
        console.log(`  . = 空闲格子`);
        console.log(`  # = 被占用的格子`);
        console.log(`  R = 资源格子 (wood/food/gold/stone)`);
        console.log(`  B = 建筑格子`);
        console.log(`  U = 单位格子`);
        console.log(`  X = 中心位置\n`);

        for (let dy = -radius; dy <= radius; dy++) {
            let line = '';
            for (let dx = -radius; dx <= radius; dx++) {
                const cx = centerCellX + dx;
                const cy = centerCellY + dy;
                const cell = this.getCell(cx, cy);

                if (!cell) {
                    line += ' ';
                } else if (dx === 0 && dy === 0) {
                    line += 'X'; // 中心位置
                } else if (cell.occupied && cell.entity) {
                    if (cell.entity.type === 'resource') {
                        line += 'R';
                        resourceCount++;
                    } else if (cell.entity.type === 'building') {
                        line += 'B';
                        buildingCount++;
                    } else if (cell.entity.type === 'unit') {
                        line += 'U';
                        unitCount++;
                    } else {
                        line += '#';
                    }
                    occupiedCount++;
                } else if (!cell.walkable) {
                    line += '■'; // 不可行走的格子（水域等）
                } else {
                    line += '.';
                }
            }
            console.log(line);
        }

        console.log(`\n统计信息:`);
        console.log(`  占用格子总数: ${occupiedCount}`);
        console.log(`  资源格子: ${resourceCount}`);
        console.log(`  建筑格子: ${buildingCount}`);
        console.log(`  单位格子: ${unitCount}`);
        console.log(`=================================\n`);

        // 打印详细信息
        console.log(`\n占用格子详细信息:`);
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const cx = centerCellX + dx;
                const cy = centerCellY + dy;
                const cell = this.getCell(cx, cy);

                if (cell && cell.occupied && cell.entity) {
                    const worldX = cx * this.cellSize + this.cellSize / 2 - this.width * this.cellSize / 2;
                    const worldZ = cy * this.cellSize + this.cellSize / 2 - this.height * this.cellSize / 2;
                    console.log(`  格子 (${cx}, ${cy}) @ (${worldX.toFixed(1)}, ${worldZ.toFixed(1)}):`);
                    console.log(`    类型: ${cell.entity.type}`);
                    console.log(`    名称: ${cell.entity.name}`);
                    if (cell.entity.resourceType) {
                        console.log(`    资源类型: ${cell.entity.resourceType}`);
                    }
                }
            }
        }
    }

    /**
     * 调试接口：打印指定位置的格子状态
     * @param {number} worldX - 世界坐标X
     * @param {number} worldZ - 世界坐标Z
     */
    debugPrintCell(worldX, worldZ) {
        const cell = this.getCellAtPosition(worldX, worldZ);
        if (!cell) {
            console.log(`位置 (${worldX.toFixed(1)}, ${worldZ.toFixed(1)}) 超出地图范围`);
            return;
        }

        const gridX = Math.floor(worldX / this.cellSize + this.width / 2);
        const gridY = Math.floor(worldZ / this.cellSize + this.height / 2);

        console.log(`\n========== 格子状态 ==========`);
        console.log(`世界坐标: (${worldX.toFixed(1)}, ${worldZ.toFixed(1)})`);
        console.log(`格子索引: (${gridX}, ${gridY})`);
        console.log(`地形类型: ${cell.type}`);
        console.log(`可行走: ${cell.walkable}`);
        console.log(`被占用: ${cell.occupied}`);

        if (cell.entity) {
            console.log(`占用实体:`);
            console.log(`  类型: ${cell.entity.type}`);
            console.log(`  名称: ${cell.entity.name}`);
            if (cell.entity.resourceType) {
                console.log(`  资源类型: ${cell.entity.resourceType}`);
            }
            if (cell.entity.buildingType) {
                console.log(`  建筑类型: ${cell.entity.buildingType}`);
            }
        } else {
            console.log(`占用实体: null`);
        }
        console.log(`=============================\n`);
    }
}

export default Grid;
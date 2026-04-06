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
        const x = Math.floor(worldX / this.cellSize);
        const y = Math.floor(worldZ / this.cellSize);
        return this.getCell(x, y);
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
                { dx: -1, dy: -1 }, // 左上
                { dx: 1, dy: -1 },  // 右上
                { dx: -1, dy: 1 },  // 左下
                { dx: 1, dy: 1 }    // 右下
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
}

export default Grid;
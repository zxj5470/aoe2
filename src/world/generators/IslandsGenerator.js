export function generateIslands(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            data.terrain[x][y] = 'water';
            data.walkable[x][y] = false;
        }
    }

    const islands = [
        { x: width * 0.2, y: height * 0.2, size: 25 },
        { x: width * 0.8, y: height * 0.2, size: 25 },
        { x: width * 0.2, y: height * 0.8, size: 25 },
        { x: width * 0.8, y: height * 0.8, size: 25 },
        { x: width * 0.5, y: height * 0.5, size: 30 }
    ];

    for (const island of islands) {
        ctx.createIsland(data, Math.floor(island.x), Math.floor(island.y), island.size);
    }

    ctx.generateStandardResources(data, width, height, 'low');
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

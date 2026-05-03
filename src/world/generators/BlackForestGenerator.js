export function generateBlackForest(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (Math.random() < 0.7) {
                data.terrain[x][y] = 'forest';
            } else {
                data.terrain[x][y] = 'grassland';
            }
        }
    }

    const clearAreas = [
        { x: width * 0.2, y: height * 0.2, size: 15 },
        { x: width * 0.8, y: height * 0.2, size: 15 },
        { x: width * 0.2, y: height * 0.8, size: 15 },
        { x: width * 0.8, y: height * 0.8, size: 15 },
        { x: width * 0.5, y: height * 0.5, size: 20 }
    ];

    for (const area of clearAreas) {
        ctx.clearArea(data, Math.floor(area.x), Math.floor(area.y), area.size);
    }

    ctx.generateStandardResources(data, width, height, 'high');
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

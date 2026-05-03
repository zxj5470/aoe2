export function generateRiver(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            data.terrain[x][y] = 'grassland';
        }
    }

    ctx.createRiver(data, width, height);
    ctx.generateStandardResources(data, width, height, 'normal');
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

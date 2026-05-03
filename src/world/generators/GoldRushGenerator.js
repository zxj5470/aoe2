export function generateGoldRush(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            data.terrain[x][y] = 'grassland';
        }
    }

    ctx.generateGoldRushResources(data, width, height);
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

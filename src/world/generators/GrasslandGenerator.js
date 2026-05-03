export function generateGrassland(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (Math.random() < 0.1) {
                data.terrain[x][y] = 'flower_field';
            } else {
                data.terrain[x][y] = 'grassland';
            }
        }
    }

    ctx.generateStandardResources(data, width, height, 'normal');
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

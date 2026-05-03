export function generateHighland(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const noise = ctx.noise2D(x * 0.05, y * 0.05);
            if (noise > 0.5) {
                data.terrain[x][y] = 'hill';
                data.heightData[x][y] = noise * 2;
            } else if (noise > 0.3) {
                data.terrain[x][y] = 'upland';
                data.heightData[x][y] = noise;
            } else {
                data.terrain[x][y] = 'grassland';
                data.heightData[x][y] = 0;
            }
        }
    }

    ctx.generateStandardResources(data, width, height, 'normal');
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

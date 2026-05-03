export function generateArena(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            data.terrain[x][y] = 'grassland';
        }
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const arenaRadius = Math.min(width, height) * 0.15;
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (dist < arenaRadius) {
                data.terrain[x][y] = 'arena_center';
            } else if (dist < arenaRadius + 5) {
                data.terrain[x][y] = 'wall';
                data.walkable[x][y] = false;
            }
        }
    }

    ctx.generateStandardResources(data, width, height, 'high');
    ctx.addPlayerStartingPositions(data, width, height, 4, true);

    return data;
}

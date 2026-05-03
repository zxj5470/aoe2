export function generateArabia(ctx, width, height) {
    const data = ctx.createEmptyMap(width, height);
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (Math.random() < 0.3) {
                data.terrain[x][y] = 'sand_dunes';
            } else {
                data.terrain[x][y] = 'desert';
            }
        }
    }

    const oasisCount = 4;
    for (let i = 0; i < oasisCount; i++) {
        const cx = Math.floor(width * (0.2 + i * 0.2));
        const cy = Math.floor(height * (0.3 + (i % 2) * 0.4));
        ctx.addOasis(data, cx, cy, 15);
    }

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const offset = Math.floor(width * 0.4);
    
    data.townCenters = data.townCenters || [];
    data.townCenters.push({
        owner: 'red',
        x: centerX - offset,
        y: centerY
    });
    
    data.townCenters.push({
        owner: 'blue',
        x: centerX + offset,
        y: centerY
    });

    ctx.generateStandardResources(data, width, height, 'normal');
    ctx.generateRandomHeight(data, 0.5, 2.0);
    ctx.addPlayerStartingPositions(data, width, height, 4);

    return data;
}

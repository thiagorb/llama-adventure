import * as map from './map';
import { findSurfaces } from './simulation';
import { context, PIXELS_PER_METER, TILE_SIZE } from './consts';

(async () => {
    const testMap = {
        tiles: {
            rows: 13,
            cols: 9,
            values: new Int8Array([
                1, 1, 1, 1, 1, 1, 1, 1, 1,
                1, 0, 0, 0, 1, 1, 1, 1, 1,
                1, 0, 0, 0, 1, 1, 1, 1, 1,
                1, 0, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 1, 1, 1, 1, 1,
                1, 1, 0, 0, 0, 1, 1, 1, 1,
                1, 1, 0, 0, 0, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1, 1, 1, 1,
            ])
        }
    };

    const rendered = map.render(testMap);
    context.drawImage(rendered, 0, 0);

    const surfaces = findSurfaces(testMap);

    context.fillStyle = 'rgba(128, 0, 128, 0.5)';
    context.scale(TILE_SIZE * PIXELS_PER_METER, TILE_SIZE * PIXELS_PER_METER);
    surfaces[0].forEach(({ row, col }) => {
        context.fillRect(col, row, 1, 1);
    });
})();

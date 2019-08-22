import * as map from './map';
import { findBiggestRegion } from './simulation';
import { PIXELS_PER_METER, TILE_SIZE } from './consts';

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
const context = document.querySelector('canvas').getContext('2d')
context.drawImage(rendered, 0, 0);

const region = findBiggestRegion(testMap);
console.log(region);

context.fillStyle = 'rgba(128, 0, 128, 0.5)';
context.scale(TILE_SIZE * PIXELS_PER_METER, TILE_SIZE * PIXELS_PER_METER);
region.forEach(({ row, col }) => {
    context.fillRect(col, row, 1, 1);
});

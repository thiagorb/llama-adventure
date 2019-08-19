import { PIXELS_PER_METER, TILE_SIZE } from './consts';
import * as matrix from './matrix';
import * as map from './map';

const testMap = map.create(map.randomTiles(), 1);
const canvas = document.querySelector('canvas');
canvas.width = canvas.getClientRects()[0].width;
canvas.height = canvas.getClientRects()[0].height;

const rendered = map.render(testMap);
const context = canvas.getContext('2d');
context.scale(4 / PIXELS_PER_METER, 4 / PIXELS_PER_METER);
context.drawImage(rendered, 0, 0);

const regionsMap = matrix.create(
    map.getRows(testMap),
    map.getCols(testMap),
    (row, col) => map.isSolidCell(testMap, row, col) ? -1 : 0
);

let currentRow = matrix.getRows(regionsMap) - 1;

setInterval(
    () => {
        for (let col = 0; col < matrix.getCols(regionsMap); col++) {
            if (matrix.get(regionsMap, currentRow, col)) {

            }
        }
        simpleRender(regionsMap, canvas);
    },
    1000
);
const simpleRender = (m: matrix.Matrix, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    context.scale(10, 10);
    context.fillStyle = 'red';
    for (let col = 0; col < matrix.getCols(m); col++) {
        for (let row = 0; row < matrix.getRows(m); row++) {
            if (matrix.get(m, row, col) > 0) {
                context.fillRect(col, row, 1, 1);
            }
        }
    }
};

import * as matrix from './matrix';
import * as sprites from './sprites';

import {
    PIXELS_PER_METER, PLAYER_COL_WIDTH,
    PLAYER_ROW_HEIGHT,
    TILE_SIZE
} from './consts';

export const enum TileValue {
    Spike = -1,
    Empty ,
    Ground
}

export interface Map {
    tiles: matrix.Matrix<Int8Array>;
}

export interface Cell {
    row: number;
    col: number;
}

export const create = (tiles: matrix.Matrix<Int8Array>): Map => {
    return { tiles };
};

export const getCols = (map: Map) => matrix.getCols(map.tiles);
export const getRows = (map: Map) => matrix.getRows(map.tiles);
export const getCol = (x: number) => Math.floor(x / TILE_SIZE);
export const getRow = (y: number) => Math.floor(y / TILE_SIZE);

export const collides = (
    levelMap: Map,
    rowTop: number,
    colLeft: number,
    rowHeight: number = PLAYER_ROW_HEIGHT,
    colWidth: number = PLAYER_COL_WIDTH
) => {
    for (let i = 0; i <= rowHeight; i++) {
        for (let j = 0; j <= colWidth; j++) {
            if (isSolidCell(levelMap, rowTop + i, colLeft + j)) {
                return true;
            }
        }
    }
    return false;
};

export const getCellValue = (map: Map, row: number, col: number): TileValue =>
    matrix.get(map.tiles, row, col);

export const getPositionValue = (map: Map, x: number, y: number): TileValue =>
    getCellValue(map, getRow(y), getCol(x));

export const collidesWithVerticalSegment = (map: Map, x: number, y1: number, y2: number, value: TileValue = null) => {
    const col = getCol(x);
    for (let row = getRow(y1); row <= getRow(y2); row++) {
        if ((value === null && isSolidCell(map, row, col)) || value === getCellValue(map, row, col)) {
            return true;
        }
    }

    return false;
};

export const collidesWithHorizontalSegment = (map: Map, y: number, x1: number, x2: number, value: TileValue = null) => {
    const row = getRow(y);
    for (let col = getCol(x1); col <= getCol(x2); col++) {
        if ((value === null && isSolidCell(map, row, col)) || value === getCellValue(map, row, col)) {
            return true;
        }
    }

    return false;
};

export const randomTiles = () => {
    const initialChance = 0.3;
    const birthLimit = 6;
    const deathLimit = 5;
    const numberOfSteps = 5;

    const rows = 100;
    const cols = 300;

    let tiles = matrix.create(Int8Array, rows, cols, () => Math.random() < initialChance ? TileValue.Ground : TileValue.Empty);
    let next = matrix.create(Int8Array, rows, cols, () => TileValue.Empty);

    for (let step = 0; step < numberOfSteps; step++) {
        matrix.iterate(next, (row, col) => {
            let neighborsCount = 0;
            for (let i of [-1, 0, 1]) {
                for (let j of i ? [-3, -2, -1, 0, 1, 2] : [-3, -1, 1, 3]) {
                    const neighborRow = row + i;
                    const neighborCol = col + j;

                    if (!matrix.has(tiles, neighborRow, neighborCol) || matrix.get(tiles, neighborRow, neighborCol)) {
                        neighborsCount++;
                    }
                }
            }

            const nextValue = matrix.get(tiles, row, col)
                ? neighborsCount >= deathLimit
                : neighborsCount > birthLimit;

            matrix.set(next, row, col, nextValue ? TileValue.Ground : TileValue.Empty);
        });

        let temp = tiles;
        tiles = next;
        next = temp;
    }

    return tiles;
};

const isSolidValue = value => value > 0;
export const isSolidPosition = (map: Map, x, y) => isSolidValue(getPositionValue(map, x, y));
export const isSolidCell = (map: Map, row, col) =>
    !matrix.has(map.tiles, row, col) ||
    isSolidValue(getCellValue(map, row, col));

export const setSpike = (map: Map, row, col) => matrix.set(map.tiles, row, col, TileValue.Spike);

const randomizeValue = (e, c) => Math.max(0, Math.min(255, e + Math.random() * c));
const randomizeColor = ({ r, g, b }, c) => ({
    r: randomizeValue(r, c),
    g: randomizeValue(g, c),
    b: randomizeValue(b, c),
});
const brightness = ({ r, g, b }, c) => ({ r: r * c, g: g * c, b: b * c });
const formatColor = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

const simpleRender = (tiles: matrix.Matrix<Int8Array>, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    context.scale(TILE_SIZE * PIXELS_PER_METER, TILE_SIZE * PIXELS_PER_METER);
    for (let col = 0; col < matrix.getCols(tiles); col++) {
        let depth = 2;
        for (let row = 0; row < matrix.getRows(tiles); row++) {
            const tile = matrix.get(tiles, row, col);
            if (tile === TileValue.Ground) {
                if (depth > 0) {
                    context.fillStyle = formatColor(
                        randomizeColor({ r: 120, g: 69, b: 20 }, 10)
                    );
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }, 15));
                }
                context.fillRect(col, row, 1, 1);
                depth++;
            } else if (tile === TileValue.Spike) {
                context.fillStyle = '#69d';
                context.fillRect(col, row, 1, 1);
                sprites.draw(context, sprites.get('spikes'), col, row, 1, 1);
                depth = 0;
            } else {
                context.fillStyle = '#69d';
                context.fillRect(col, row, 1, 1);
                depth = 0;
            }
        }
    }
};

export const renderTiles = (tiles: matrix.Matrix<Int8Array>) => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * matrix.getCols(tiles) * PIXELS_PER_METER;
    canvas.height = TILE_SIZE * matrix.getRows(tiles) * PIXELS_PER_METER;
    simpleRender(tiles, canvas);
    return canvas;
};

export const render = (map: Map) => {
    return renderTiles(map.tiles);
};

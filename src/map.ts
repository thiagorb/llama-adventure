import * as matrix from './matrix';
import { METERS_PER_PIXEL, PIXELS_PER_METER, PLAYER_HEIGHT, PLAYER_WIDTH, TILE_SIZE } from './consts';

export interface Map {
    tiles: matrix.Matrix<Int8Array>;
}

export interface RegionsMap {
    map: matrix.Matrix<Int8Array>;
    biggest: number;
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


const PLAYER_ROW_HEIGHT = getRow(PLAYER_HEIGHT - METERS_PER_PIXEL);
const PLAYER_COL_WIDTH = getCol(PLAYER_WIDTH - METERS_PER_PIXEL);

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

export const getCellValue = (map: Map, row: number, col: number) =>
    matrix.get(map.tiles, row, col);

export const getPositionValue = (map: Map, x: number, y: number) =>
    getCellValue(map, getRow(y), getCol(x));

export const collidesWithVerticalSegment = (map: Map, x: number, y1: number, y2: number) => {
    const col = getCol(x);
    for (let row = getRow(y1); row <= getRow(y2); row++) {
        if (isSolidCell(map, row, col)) {
            return true;
        }
    }

    return false;
};

export const collidesWithHorizontalSegment = (map: Map, y: number, x1: number, x2: number) => {
    const row = getRow(y);
    for (let col = getCol(x1); col <= getCol(x2); col++) {
        if (isSolidCell(map, row, col)) {
            return true;
        }
    }

    return false;
};

export const collidesWithRectangle = (map: Map, left: number, top: number, width: number, height: number) => {
    const right = left + PLAYER_WIDTH - METERS_PER_PIXEL;

    if (collidesWithHorizontalSegment(map, top, left, right)) {
        return true;
    }

    const bottom = top + PLAYER_HEIGHT - METERS_PER_PIXEL;

    if (collidesWithHorizontalSegment(map, bottom, left, right)) {
        return true;
    }

    if (collidesWithVerticalSegment(map, left, top, bottom)) {
        return true;
    }

    return collidesWithVerticalSegment(map, right, top, bottom);
};

export const randomTiles = () => {
    const initialChance = 0.3;
    const birthLimit = 6;
    const deathLimit = 5;
    const numberOfSteps = 5;

    const rows = 100;
    const cols = 300;

    let tiles = matrix.create(Int8Array, rows, cols, () => Math.random() < initialChance ? 1 : 0);
    let next = matrix.create(Int8Array, rows, cols, () => 0);

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

            matrix.set(next, row, col, nextValue ? 1 : 0);
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

export const calculateRegions = (map: Map): RegionsMap => {
    let regions = 0;
    const regionsAreas = {};
    const regionsMap = matrix.create(
        Int8Array,
        getRows(map),
        getCols(map),
        (row, col) => collides(map, row, col) ? -1 : 0
    );

    matrix.iterate(regionsMap, (row, col) => {
        if (matrix.get(regionsMap, row, col)) {
            return;
        }

        regions++;
        const regionId = regions;
        let regionArea = 1;
        const boundary = [{row, col}];
        matrix.set(regionsMap, row, col, regionId);
        while (boundary.length > 0) {
            const current = boundary.pop();
            for (let i of [-1, 0, 1]) {
                for (let j of i ? [0] : [-1, 1]) {
                    const neighborRow = current.row + i;
                    const neighborCol = current.col + j;
                    if (matrix.has(regionsMap, neighborRow, neighborCol) && !matrix.get(regionsMap, neighborRow, neighborCol)) {
                        boundary.push({ row: neighborRow, col: neighborCol });
                        matrix.set(regionsMap, neighborRow, neighborCol, regionId);
                        regionArea++;
                    }
                }
            }
        }
        regionsAreas[regionId] = regionArea;
    });

    return {
        map: regionsMap,
        biggest: parseInt(Object.keys(regionsAreas).sort((a, b) => regionsAreas[b] - regionsAreas[a])[0])
    };
};

const randomizeValue = (e, c) => Math.max(0, Math.min(255, e + Math.random() * c));
const randomizeColor = ({ r, g, b }, c) => ({
    r: randomizeValue(r, c),
    g: randomizeValue(g, c),
    b: randomizeValue(b, c),
});
const brightness = ({ r, g, b }, c) => ({ r: r * c, g: g * c, b: b * c });
const formatColor = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

const complexRender = (map: Map, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        let depth = 10;
        for (let y = 0; y < canvas.height; y++) {
            if (isSolidPosition(map, x / PIXELS_PER_METER, y / PIXELS_PER_METER)) {
                if (depth > 3 + Math.random() + Math.cos(x / 2)) {
                    context.fillStyle = formatColor(
                        randomizeColor(brightness({ r: 120, g: 69, b: 20 }, 1 - 0.05 * Math.cos(x / 10) * Math.sin(x / 20 + y / 10)), 10)
                    );
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }, 15));
                }
                depth++;
            } else {
                depth = 0;
                context.fillStyle = '#69d';
            }
            context.fillRect(x, y, 1, 1);
        }
    }
};

const simpleRender = (map: Map, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    context.scale(TILE_SIZE * PIXELS_PER_METER, TILE_SIZE * PIXELS_PER_METER);
    for (let col = 0; col < getCols(map); col++) {
        let depth = 2;
        for (let row = 0; row < getRows(map); row++) {
            if (isSolidCell(map, row, col)) {
                if (depth > 0) {
                    context.fillStyle = formatColor(
                        randomizeColor({ r: 120, g: 69, b: 20 }, 10)
                    );
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }, 15));
                }
                depth++;
            } else {
                depth = 0;
                context.fillStyle = '#69d';
            }
            context.fillRect(col, row, 1, 1);
        }
    }
};

export const render = (map: Map) => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE * getCols(map) * PIXELS_PER_METER;
    canvas.height = TILE_SIZE * getRows(map) * PIXELS_PER_METER;
    simpleRender(map, canvas);
    return canvas;
};

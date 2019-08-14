const TILE_SIZE = 48;

interface Map {
    tiles: Int8Array;
    rows: number;
    cols: number;
    rendered?: HTMLCanvasElement
};

export const render = (map: Map): HTMLCanvasElement => {
    if (map.rendered) {
        return map.rendered;
    }

    // buffer canvas
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = TILE_SIZE * map.cols;
    mapCanvas.height = TILE_SIZE * map.rows;
    const context = mapCanvas.getContext('2d');

    context.fillStyle = 'black';
    for (let row = 0; row < map.rows; row++) {
        for (let col = 0; col < map.cols; col++) {
            if (getCellValue(map, col, row)) {
                context.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    map.rendered = mapCanvas;
    return mapCanvas;
};

export const createMap = (values: number[][]): Map => {
    const rows = values.length;
    const cols = values[0].length;
    const tiles = new Int8Array(cols * rows);

    values.forEach(
        (row, rowIndex) => row.forEach(
            (cell, cellIndex) => tiles[rowIndex * cols + cellIndex] = cell
        )
    );

    return {
        tiles,
        rows,
        cols
    };
};

export const getCol = (map: Map, x: number) => Math.floor(x / TILE_SIZE);
export const getRow = (map: Map, y: number) => Math.floor(y / TILE_SIZE);

export const getCellValue = (map: Map, col: number, row: number) => {
    return map.tiles[row * map.cols + col];
};

export const getPositionValue = (map: Map, x: number, y: number) => {
    return getCellValue(map, getCol(map, x), getRow(map, y));
};

export const getRendered = render;

export const collidesWithVerticalSegment = (map: Map, x: number, y1: number, y2: number) => {
    const col = getCol(map, x);
    for (let row = getRow(map, y1); row <= getRow(map, y2); row++) {
        if (getCellValue(map, col, row)) {
            return true;
        }
    }

    return false;
};

export const collidesWithHorizontalSegment = (map: Map, y: number, x1: number, x2: number) => {
    const row = getRow(map, y);
    for (let col = getCol(map, x1); col <= getCol(map, x2); col++) {
        if (getCellValue(map, col, row)) {
            return true;
        }
    }

    return false;
};
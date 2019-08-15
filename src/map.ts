interface Map {
    tiles: Int8Array;
    rows: number;
    cols: number;
    rendered?: HTMLCanvasElement;
    tileSize: number;
}

export const render = (map: Map): HTMLCanvasElement => {
    if (map.rendered) {
        return map.rendered;
    }

    // buffer canvas
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = map.tileSize * map.cols;
    mapCanvas.height = map.tileSize * map.rows;
    const context = mapCanvas.getContext('2d');

    context.fillStyle = 'black';
    for (let row = 0; row < map.rows; row++) {
        for (let col = 0; col < map.cols; col++) {
            if (getCellValue(map, col, row)) {
                context.fillRect(col * map.tileSize, row * map.tileSize, map.tileSize, map.tileSize);
            }
        }
    }

    map.rendered = mapCanvas;
    return mapCanvas;
};

export const createMap = (values: number[][], tileSize): Map => {
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
        cols,
        tileSize
    };
};

export const getCol = (map: Map, x: number) => Math.floor(x / map.tileSize);
export const getRow = (map: Map, y: number) => Math.floor(y / map.tileSize);

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

interface Map {
    tiles: Int8Array;
    rows: number;
    cols: number;
    tileSize: number;
}

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

const initializeArray = <T>(length: number, init: (i: number) => T) => {
    const array = new Array(length);
    for (let i = 0; i < length; i++) {
        array[i] = init(i);
    }
    return array;
};

const initializeMatrix = (rows, cols, init) => initializeArray(
    rows,
    row => initializeArray(cols, col => init(row, col))
);

const iterateMatrix = (matrix, callback) => matrix.forEach(
    (row, rowIndex) => row.forEach((value, colIndex) => callback(rowIndex, colIndex, value))
);

export const createRandom = () => {
    const initialChance = 0.3;
    const birthLimit = 6;
    const deathLimit = 4;
    const numberOfSteps = 6;

    const rows = 50;
    const cols = 50;

    let map = initializeMatrix(rows, cols, () => Math.random() < initialChance ? 1 : 0);
    let next = initializeMatrix(rows, cols, () => 0);

    for (let step = 0; step < numberOfSteps; step++) {
        iterateMatrix(next, (row, col) => {
            let neighborsCount = 0;
            //   aaa
            // aaa aaa
            //   aaa

            for (let i of [-1, 0, 1]) {
                for (let j of i ? [-2, -1, 0, 1, 2] : [-3, -1, 1, 3]) {
                    const neighborRow = row + i;
                    const neighborCol = col + j;

                    if (neighborRow < 0 || neighborRow >= rows || neighborCol < 0 || neighborCol >= cols || map[neighborRow][neighborCol]) {
                        neighborsCount++;
                    }
                }
            }

            if (map[row][col]) {
                next[row][col] = neighborsCount >= deathLimit;
            } else {
                next[row][col] = neighborsCount > birthLimit;
            }
        });

        let temp = map;
        map = next;
        next = temp;
    }

    return map;
};

import * as matrix from './matrix';

export interface Map {
    tiles: matrix.Matrix;
    tileSize: number;
}

export interface RegionsMap {
    map: matrix.Matrix;
    biggest: number;
}

export const create = (tiles: matrix.Matrix, tileSize): Map => {
    return { tiles, tileSize };
};

export const getCols = (map: Map) => matrix.getCols(map.tiles);
export const getRows = (map: Map) => matrix.getRows(map.tiles);
export const getCol = (map: Map, x: number) => Math.floor(x / map.tileSize);
export const getRow = (map: Map, y: number) => Math.floor(y / map.tileSize);

export const getCellValue = (map: Map, row: number, col: number) =>
    matrix.get(map.tiles, row, col);

export const getPositionValue = (map: Map, x: number, y: number) =>
    getCellValue(map, getRow(map, y), getCol(map, x));

export const collidesWithVerticalSegment = (map: Map, x: number, y1: number, y2: number) => {
    const col = getCol(map, x);
    for (let row = getRow(map, y1); row <= getRow(map, y2); row++) {
        if (isSolidCell(map, row, col)) {
            return true;
        }
    }

    return false;
};

export const getTileSize = (map: Map) => map.tileSize;

export const collidesWithHorizontalSegment = (map: Map, y: number, x1: number, x2: number) => {
    const row = getRow(map, y);
    for (let col = getCol(map, x1); col <= getCol(map, x2); col++) {
        if (isSolidCell(map, row, col)) {
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

    let tiles = matrix.create(rows, cols, () => Math.random() < initialChance ? 1 : 0);
    let next = matrix.create(rows, cols, () => 0);

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
export const isSolidCell = (map: Map, row, col) => isSolidValue(getCellValue(map, row, col));

export const calculateRegions = (map: Map): RegionsMap => {
    let regions = 0;
    const regionsAreas = {};
    const regionsMap = matrix.create(
        getRows(map),
        getCols(map),
        (row, col) => isSolidCell(map, row, col) ? -1 : 0
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

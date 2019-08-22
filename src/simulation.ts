import {
    HORIZONTAL_ACCELERATION,
    METERS_PER_PIXEL,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    STEPS_PER_SECOND,
    TILE_SIZE
} from './consts';
import * as state from './state';
import * as player from './player';
import * as map from './map';
import * as matrix from './matrix';

interface BoundingBox {
    rowTop: number;
    rowHeight: number;
    colLeft: number;
    colWidth: number;
}

const getBoundingBox = (position: state.Vector2D): BoundingBox => {
    const rowTop = map.getRow(position.y);
    const colLeft = map.getCol(position.x);
    return {
        rowTop,
        rowHeight: map.getRow(position.y + PLAYER_HEIGHT - METERS_PER_PIXEL) - rowTop,
        colLeft,
        colWidth: map.getCol(position.x + PLAYER_WIDTH - METERS_PER_PIXEL) - colLeft,
    }
};

const getCellBoundingBox = (rowTop: number, colLeft: number): BoundingBox => {
    return {
        rowTop,
        rowHeight: map.getRow(PLAYER_HEIGHT - METERS_PER_PIXEL),
        colLeft,
        colWidth: map.getCol(PLAYER_WIDTH - METERS_PER_PIXEL),
    }
};

const boxEquals = (b1: BoundingBox, b2: BoundingBox) =>
    b1.rowTop === b2.rowTop
    && b1.rowHeight === b2.rowHeight
    && b1.colLeft === b2.colLeft
    && b1.colWidth === b2.colWidth;

const boxKey = (box: BoundingBox) => [
    box.rowTop,
    box.rowHeight,
    box.colLeft,
    box.colWidth,
].join(',');

interface FoundMovementsPath {
    box: BoundingBox;
    sequence: Map<string, FoundMovementsPath>;
}

export const simulateMovements = (): Array<Array<BoundingBox>> => {
    const foundMovements = new Map<string, FoundMovementsPath>();
    const REACTION_TIME = 0.3 * STEPS_PER_SECOND;

    let current: state.Player = state.createPlayer();
    let next: state.Player = state.createPlayer();
    const MAX_SIMULATION_TIME = 5 * STEPS_PER_SECOND; //seconds
    const MAX_UP_DELAY = Math.sqrt(2 * TILE_SIZE / HORIZONTAL_ACCELERATION);
    const keys = {
        ArrowUp: false,
        ArrowRight: false,
        ArrowDown: false,
        ArrowLeft: false,
    };

    for (let startPressingRight = 0; startPressingRight < MAX_SIMULATION_TIME + REACTION_TIME; startPressingRight += REACTION_TIME) {
        for (let stopPressingRight = MAX_SIMULATION_TIME + REACTION_TIME; stopPressingRight >= startPressingRight; stopPressingRight -= REACTION_TIME) {
            for (let startPressingLeft = stopPressingRight; startPressingLeft < MAX_SIMULATION_TIME + REACTION_TIME; startPressingLeft += REACTION_TIME) {
                for (let stopPressingLeft = startPressingLeft; stopPressingLeft < MAX_SIMULATION_TIME + REACTION_TIME; stopPressingLeft += REACTION_TIME) {
                    for (let startPressingUp = 0; startPressingUp <= MAX_UP_DELAY + REACTION_TIME; startPressingUp += REACTION_TIME) {
                        for (let timePressingUp = 1; timePressingUp <= player.LONG_JUMP_EFFECT_TIME * 2; timePressingUp *= 2) {
                            current.position.x = 0;
                            current.position.y = 0;
                            current.touchingFloor = true;
                            current.speed.x = 0;
                            current.speed.y = 0;

                            const positions: Array<BoundingBox> = [];
                            let lastBox = getBoundingBox(current.position);
                            for (let t = 0; t < MAX_SIMULATION_TIME && (t <= startPressingUp + 1 || current.position.y < 0); t++) {
                                keys.ArrowUp = t >= startPressingUp && t < startPressingUp + timePressingUp;
                                keys.ArrowRight = t >= startPressingRight && t < stopPressingRight;
                                keys.ArrowLeft = t >= startPressingLeft && t < stopPressingLeft;
                                current.touchingFloor = current.position.y >= 0;
                                player.update(keys, current, next);
                                const temp = current;
                                current = next;
                                next = temp;

                                const currentBox = getBoundingBox(current.position);
                                if (!boxEquals(currentBox, lastBox)) {
                                    positions.push(currentBox);
                                    lastBox = currentBox;
                                }
                            }

                            let movementPath: Map<string, FoundMovementsPath> = foundMovements;
                            for (let box of positions) {
                                const key = boxKey(box);
                                if (!movementPath.has(key)) {
                                    movementPath.set(key, {box, sequence: new Map<string, FoundMovementsPath>()});
                                }
                                movementPath = movementPath.get(key).sequence;
                            }
                        }
                    }
                }
            }
        }
    }

    const movements = [];
    const transformMovements = (sequence: Map<string, FoundMovementsPath>, currentPath: Array<BoundingBox>) => {
        for (let branch of sequence.values()) {
            const nextPath = currentPath.concat(branch.box);
            movements.push(nextPath);
            movements.push(
                nextPath.map(box => ({
                    rowTop: box.rowTop,
                    rowHeight: box.rowHeight,
                    colLeft: 1 - box.colLeft - box.colWidth,
                    colWidth: box.colWidth
                }))
            );
            transformMovements(branch.sequence, nextPath);
        }
    };
    transformMovements(foundMovements, []);

    console.log(foundMovements);

    return movements;
};

const collides = (levelMap: map.Map, box: BoundingBox) => {
    for (let row = 0; row <= box.rowHeight; row++) {
        for (let col = 0; col <= box.colWidth; col++) {
            if (map.isSolidCell(levelMap, box.rowTop + row, box.colLeft + col)) {
                return true;
            }
        }
    }
    return false;
};

export const findBiggestRegion = (levelMap: map.Map) => {
    const possibleMovements: Array<Array<BoundingBox>> = [
        [getBoundingBox({x: TILE_SIZE, y: 0})],
        [getBoundingBox({x: -TILE_SIZE, y: 0})],
        [getBoundingBox({x: 0, y: -TILE_SIZE}), getBoundingBox({x: TILE_SIZE, y: -TILE_SIZE})],
        [getBoundingBox({x: 0, y: -TILE_SIZE}), getBoundingBox({x: -TILE_SIZE, y: -TILE_SIZE})],
        ...simulateMovements(),
    ];

    let regionsCount = 0;
    const REGION_SOLID = -1;
    const REGION_EMPTY = -2;
    const REGION_UNKNOWN = 0;
    const regionsMap = matrix.create(
        Int16Array,
        map.getRows(levelMap),
        map.getCols(levelMap),
        (row, col) => collides(levelMap, getCellBoundingBox(row, col)) ? REGION_SOLID : REGION_EMPTY
    );

    for (let col = 0; col < matrix.getCols(regionsMap); col++) {
        let previousCollided = false;
        for (let row = matrix.getRows(regionsMap) - 1; row >= 0; row--) {
            const collided = collides(levelMap, getCellBoundingBox(row, col));
            if (!collided && previousCollided) {
                matrix.set(regionsMap, row, col, REGION_UNKNOWN);
            }
            previousCollided = collided;
        }
    }

    for (let currentRow = matrix.getRows(regionsMap) - 1; currentRow >= 0; currentRow--) {
        for (let col = 0; col < matrix.getCols(regionsMap); col++) {
            if (matrix.get(regionsMap, currentRow, col) === REGION_UNKNOWN) {
                regionsCount++;
                const regionId = regionsCount;
                const boundary = [{row: currentRow, col}];
                matrix.set(regionsMap, currentRow, col, regionId);
                while (boundary.length > 0) {
                    const current = boundary.pop();
                    for (let possibleMovement of possibleMovements) {
                        for (let position of possibleMovement) {
                            const neighborRow = current.row + position.rowTop;
                            const neighborCol = current.col + position.colLeft;
                            if (!matrix.has(regionsMap, neighborRow, neighborCol)) {
                                break;
                            }
                            const neighborValue = matrix.get(regionsMap, neighborRow, neighborCol);
                            if (neighborValue === REGION_SOLID) {
                                break;
                            }

                            const neighborBox = {
                                rowTop: neighborRow,
                                rowHeight: position.rowHeight,
                                colLeft: neighborCol,
                                colWidth: position.colWidth,
                            };
                            if (collides(levelMap, neighborBox)) {
                                break;
                            }

                            if (neighborValue === REGION_EMPTY) {
                                continue;
                            }

                            if (neighborValue === regionId) {
                                continue;
                            }

                            if (neighborValue > 0) {
                                matrix.replace(regionsMap, neighborValue, regionId);
                                continue;
                            }

                            matrix.set(regionsMap, neighborRow, neighborCol, regionId);
                            boundary.push({row: neighborRow, col: neighborCol});
                        }
                    }
                }
            }
        }
    }

    const regionsSize = {};
    let biggest = 0;

    matrix.iterate(regionsMap, (row, col, value) => {
        if (value > 0) {
            regionsSize[value] = (regionsSize[value] || 0) + 1;
            if (biggest === 0 || regionsSize[value] > regionsSize[biggest]) {
                biggest = value;
            }
        }
    });

    const region = [];
    matrix.iterate(regionsMap, (row, col, value) => {
        if (value === biggest) {
            region.push({row, col});
        }
    });
    return region;
};

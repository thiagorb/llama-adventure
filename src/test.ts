import { METERS_PER_PIXEL, PIXELS_PER_METER, PLAYER_HEIGHT, PLAYER_WIDTH, TILE_SIZE } from './consts';
import * as matrix from './matrix';
import * as map from './map';

const collides = (levelMap: map.Map, left: number, top: number) =>
    map.collidesWithRectangle(levelMap, left, top, PLAYER_WIDTH, PLAYER_HEIGHT);

const regionColors = [
    'Red',
    'Purple',
    'Green',
    'Yellow',
    'Orange',
    'Blue',
    'Brown',
    'AliceBlue',
    'AntiqueWhite',
    'Aqua',
    'Aquamarine',
    'Azure',
    'Beige',
    'Bisque',
    'Black',
    'BlanchedAlmond',
    'BlueViolet',
    'BurlyWood',
    'CadetBlue',
    'Chartreuse',
    'Chocolate',
    'Coral',
    'CornflowerBlue',
    'Cornsilk',
    'Crimson',
    'Cyan',
    'DarkBlue',
    'DarkCyan',
    'DarkGoldenRod',
    'DarkGray',
    'DarkGrey',
    'DarkGreen',
    'DarkKhaki',
    'DarkMagenta',
    'DarkOliveGreen',
    'DarkOrange',
    'DarkOrchid',
    'DarkRed',
    'DarkSalmon',
    'DarkSeaGreen',
    'DarkSlateBlue',
    'DarkSlateGray',
    'DarkSlateGrey',
    'DarkTurquoise',
    'DarkViolet',
    'DeepPink',
    'DeepSkyBlue',
    'DimGray',
    'DimGrey',
    'DodgerBlue',
    'FireBrick',
    'FloralWhite',
    'ForestGreen',
    'Fuchsia',
    'Gainsboro',
    'GhostWhite',
    'Gold',
    'GoldenRod',
    'Gray',
    'Grey',
    'GreenYellow',
    'HoneyDew',
    'HotPink',
    'IndianRed',
    'Indigo',
    'Ivory',
    'Khaki',
    'Lavender',
    'LavenderBlush',
    'LawnGreen',
    'LemonChiffon',
    'LightBlue',
    'LightCoral',
    'LightCyan',
    'LightGoldenRodYellow',
    'LightGray',
    'LightGrey',
    'LightGreen',
    'LightPink',
    'LightSalmon',
    'LightSeaGreen',
    'LightSkyBlue',
    'LightSlateGray',
    'LightSlateGrey',
    'LightSteelBlue',
    'LightYellow',
    'Lime',
    'LimeGreen',
    'Linen',
    'Magenta',
    'Maroon',
    'MediumAquaMarine',
    'MediumBlue',
    'MediumOrchid',
    'MediumPurple',
    'MediumSeaGreen',
    'MediumSlateBlue',
    'MediumSpringGreen',
    'MediumTurquoise',
    'MediumVioletRed',
    'MidnightBlue',
    'MintCream',
    'MistyRose',
    'Moccasin',
    'NavajoWhite',
    'Navy',
    'OldLace',
    'Olive',
    'OliveDrab',
    'OrangeRed',
    'Orchid',
    'PaleGoldenRod',
    'PaleGreen',
    'PaleTurquoise',
    'PaleVioletRed',
    'PapayaWhip',
    'PeachPuff',
    'Peru',
    'Pink',
    'Plum',
    'PowderBlue',
    'RebeccaPurple',
    'RosyBrown',
    'RoyalBlue',
    'SaddleBrown',
    'Salmon',
    'SandyBrown',
    'SeaGreen',
    'SeaShell',
    'Sienna',
    'Silver',
    'SkyBlue',
    'SlateBlue',
    'SlateGray',
    'SlateGrey',
    'Snow',
    'SpringGreen',
    'SteelBlue',
    'Tan',
    'Teal',
    'Thistle',
    'Tomato',
    'Turquoise',
    'Violet',
    'Wheat',
    'White',
    'WhiteSmoke',
    'YellowGreen',
];

const possibleMovements = [
    [{ row: 0, col: 1 }],
    [{ row: 0, col: -1 }],
    [{ row: -1, col: 0 }, { row: -1, col: 1 }],
    [{ row: -2, col: 0 }, { row: -2, col: 1 }],
    [{ row: -3, col: 0 }, { row: -3, col: 1 }],
    [{ row: -4, col: 0 }, { row: -4, col: 1 }],
    [{ row: -5, col: 0 }, { row: -5, col: 1 }],
    [{ row: -6, col: 0 }, { row: -6, col: 1 }],
    [{ row: -7, col: 0 }, { row: -7, col: 1 }],
    [{ row: -1, col: 0 }, { row: -1, col: -1 }],
    [{ row: -2, col: 0 }, { row: -2, col: -1 }],
    [{ row: -3, col: 0 }, { row: -3, col: -1 }],
    [{ row: -4, col: 0 }, { row: -4, col: -1 }],
    [{ row: -5, col: 0 }, { row: -5, col: -1 }],
    [{ row: -6, col: 0 }, { row: -6, col: -1 }],
    [{ row: -7, col: 0 }, { row: -7, col: -1 }],
];

const findRegions = () => {
    let regionsCount = 0;
    const testMap = map.create(map.randomTiles());
    const canvas = document.querySelector('canvas');
    canvas.width = canvas.getClientRects()[0].width;
    canvas.height = canvas.getClientRects()[0].height;

    const REGION_SOLID = -1;
    const REGION_EMPTY = -2;
    const REGION_UNKNOWN = 0;
    const regionsMap = matrix.create(
        Int16Array,
        map.getRows(testMap),
        map.getCols(testMap),
        (row, col) => map.isSolidCell(testMap, row, col) ? REGION_SOLID : REGION_EMPTY
    );


    for (let col = 0; col < matrix.getCols(regionsMap); col++) {
        let previousCollided = false;
        for (let row = matrix.getRows(regionsMap) - 1; row >= 0; row--) {
            const collided = collides(testMap, col * TILE_SIZE, row * TILE_SIZE);
            if (!collided && previousCollided) {
                matrix.set(regionsMap, row, col, REGION_UNKNOWN);
            }
            previousCollided = collided;
        }
    }

    let currentRow = matrix.getRows(regionsMap) - 1;

    const interval = setInterval(
        () => {
            if (currentRow < 0) {
                clearInterval(interval);
                return;
            }
            console.log(currentRow, regionsCount);
            for (let col = 0; col < matrix.getCols(regionsMap); col++) {
                if (matrix.get(regionsMap, currentRow, col) === REGION_UNKNOWN) {
                    regionsCount++;
                    const regionId = regionsCount;
                    const boundary = [{ row: currentRow, col }];
                    matrix.set(regionsMap, currentRow, col, regionId);
                    while (boundary.length > 0) {
                        if (boundary.length > 100) {
                            throw new Error();
                        }
                        const current = boundary.pop();
                        for (let possibleMovement of possibleMovements) {
                            for (let position of possibleMovement) {
                                const neighborRow = current.row + position.row;
                                const neighborCol = current.col + position.col;
                                if (!matrix.has(regionsMap, neighborRow, neighborCol)) {
                                    continue;
                                }
                                const neighborValue = matrix.get(regionsMap, neighborRow, neighborCol);
                                if (neighborValue === REGION_SOLID) {
                                    break;
                                }

                                if (neighborValue === REGION_EMPTY) {
                                    continue;
                                }

                                if (neighborValue === regionId) {
                                    continue;
                                }

                                if (neighborValue > 0) {
                                    for (let row = matrix.getRows(regionsMap) - 1; row >= 0; row--) {
                                        for (let col = 0; col < matrix.getCols(regionsMap); col++) {
                                            if (matrix.get(regionsMap, row, col) === neighborValue) {
                                                matrix.set(regionsMap, row, col, regionId);
                                            }
                                        }
                                    }
                                    continue;
                                }

                                matrix.set(regionsMap, neighborRow, neighborCol, regionId);
                                boundary.push({ row: neighborRow, col: neighborCol });
                            }
                        }
                    }
                }
            }

            currentRow--;

            simpleRender(regionsMap, canvas);
        },
        500
    );
    const rendered = map.render(testMap);

    const simpleRender = (m: matrix.Matrix<Int16Array>, canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d');

        context.save();
        context.scale(4 / PIXELS_PER_METER, 4 / PIXELS_PER_METER);
        context.drawImage(rendered, 0, 0);

        context.scale(10, 10);
        for (let col = 0; col < matrix.getCols(m); col++) {
            for (let row = 0; row < matrix.getRows(m); row++) {
                let value = matrix.get(m, row, col);

                if (value >= 0) {
                    context.fillStyle = regionColors[value];
                    context.fillRect(col, row, 1, 1);
                }
            }
        }
        context.restore();
    };
};

findRegions();

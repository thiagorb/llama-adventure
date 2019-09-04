import * as game from './game';
import * as sprites from './sprites';
import * as map from './map';
import * as matrix from './matrix';
import { TILE_SIZE } from './consts';

(async () => {
    await sprites.initialize();

    const levelMap = map.create({
        rows: 13,
        cols: 9,
        values: new Int8Array([
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 1, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
        ])
    });

    const door1 = {
        position: {
            x: 6 * TILE_SIZE,
            y: 3 * TILE_SIZE,
        },
        other: null
    };
    const door2 = {
        position: {
            x: 6 * TILE_SIZE,
            y: 10 * TILE_SIZE,
        },
        other: door1
    };
    door1.other = door2;

    const g: game.Game = game.create({
        map: levelMap,
        items: [],
        player: { x: 2, y: 2 },
        regions: {
            map: matrix.create(Int8Array, 0, 0, () => 0),
            biggest: 0
        },
        doors: [door1, door2],
        surfaces: [],
        goal: { x: 50, y: 50 },
    });

    game.start(g);
})();

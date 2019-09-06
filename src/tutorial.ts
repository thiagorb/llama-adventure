import * as map from './map';
import * as matrix from './matrix';
import * as level from './level';
import * as game from './game';
import { METERS_PER_PIXEL, PLAYER_HEIGHT, TILE_SIZE } from './consts';
import { cachedInstance } from './utils';

export const getLevel = cachedInstance((): level.Level => {
    const WIDTH = 200;
    const HEIGHT = 32;
    const CEIL = Math.round(HEIGHT / 4);
    const FLOOR = Math.round(HEIGHT * 3 / 4);

    const ground = (row, col) => row < CEIL || row >= FLOOR || col < 1 || col >= WIDTH - 1;

    const tiles = matrix.create(
        Int8Array,
        HEIGHT,
        WIDTH,
        (row, col) => ground(row, col) ? map.TileValue.Ground : map.TileValue.Empty,
    );

    const iterate = (from: number, to: number, callback) => {
        for (let i = from; i <= to; i++) {
            callback(i);
        }
    };

    matrix.set(tiles, 23, 29, map.TileValue.Ground);
    iterate(20, 23, i => matrix.set(tiles, i, 48, map.TileValue.Ground));
    iterate(0, 7, i => {
        matrix.set(tiles, 23, 97 - i, map.TileValue.Ground);
        matrix.set(tiles, 23, 103 + i, map.TileValue.Ground);
    });
    iterate(0, 3, i => {
        matrix.set(tiles, 22, 97 - i, map.TileValue.Ground);
        matrix.set(tiles, 22, 103 + i, map.TileValue.Ground);
    });
    iterate(98, 102, i => matrix.set(tiles, 23, i, map.TileValue.Spike));
    iterate(8, 23, i => matrix.set(tiles, i, 137, map.TileValue.Ground));

    const tutorialMap = map.create(tiles);
    const playerY = TILE_SIZE * HEIGHT * 3 / 4 - PLAYER_HEIGHT;

    const other = { position: { x: 120, y: playerY - 2 * METERS_PER_PIXEL }, other: null };
    const door = { position: { x: 100, y: playerY - 2 * METERS_PER_PIXEL }, other };
    other.other = door;

    return {
        map: tutorialMap,
        surfaces: null,
        regions: null,
        player: { x: 5, y: playerY },
        goal: { x: WIDTH * TILE_SIZE - 10, y: playerY - METERS_PER_PIXEL },
        doors: [door, other],
        items: [
            level.createItem(level.ItemType.Corn, 52, playerY),
            level.createItem(level.ItemType.Pepper, 60, playerY),
            level.createItem(level.ItemType.Cactus, 68, playerY),
        ],
    };
});

export const createGame = () => {
    const tutorialGame = game.create(getLevel());
    const context = tutorialGame.renderedMap.getContext('2d');
    context.fillStyle = 'white';
    context.resetTransform();
    context.fillText('← OR "A" TO MOVE LEFT', 20, 140);
    context.fillText('→ OR "D" TO MOVE RIGHT', 20, 155);
    context.fillText('CONTINUE TO THE RIGHT →', 20, 180);
    context.fillText('↑ OR "W" TO JUMP', 250, 180);
    context.fillText('HOLD ↑ OR "W" TO JUMP HIGHER', 400, 180);
    context.fillText('COLLECT YOUR ITEMS', 600, 150);
    context.fillText('AND BRING THEM BACK HOME', 600, 170);
    context.fillText('AVOID SPIKES!', 970, 190);
    context.fillText('STAY IN FRONT OF THE DOOR...', 1150, 190);
    context.fillText('AND IT WILL TAKE YOU SOMEWHERE ELSE', 1400, 190);
    context.fillText('YOU CAME BACK HOME!', 1720, 150);

    return tutorialGame;
};

import * as game from './game';
import * as sprites from './sprites';
import * as state from './state';
import * as map from './map';
import { deepCopy } from './utils';

(async () => {
    await sprites.initialize();

    const levelMap = map.create({
        rows: 13,
        cols: 9,
        values: new Int8Array([
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 1, 0, 0, 0, 1,
            1, 0, 0, 0, 1, 0, 0, 0, 1,
            1, 1, 0, 0, 1, 0, 0, 1, 1,
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

    const renderedMap = map.render(levelMap);
    const gameState = state.create();
    gameState.player.position = { x: 2, y: 2 };
    gameState.goal.position = { x: 50, y: 50 };

    const g: game.Game = {
        states: { current: gameState, next: deepCopy(gameState) },
        map: levelMap,
        renderedMap,
        finished: false,
        score: 0,
        items: [],
    };

    game.start(g);
})();

import * as game from './game';
import * as sprites from './sprites';
import * as home from './home';
import * as worker from './worker';

if (typeof document !== 'undefined') {
    (async () => {
        const spritesInit = sprites.initialize();
        worker.getSimulatedMovements();

        home.start(async () => {
            await spritesInit;
            const g = await game.create(document.querySelector('canvas'));
            game.start(g);
        });
    })();
} else {
    worker.work();
}

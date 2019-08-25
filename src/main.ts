import * as game from './game';
import * as sprites from './sprites';
import * as home from './home';

if (typeof document !== 'undefined') {
    const worker = new Worker(document.querySelector('script').src);
    worker.addEventListener('message', (msg) => {

    });

    (async () => {
        const spritesInit = sprites.initialize();
        home.start(async () => {
            await spritesInit;
            const g = await game.create(document.querySelector('canvas'));
            game.start(g);
        });
    })();
} else {
    self.addEventListener('message', (msg) => {
    });
}

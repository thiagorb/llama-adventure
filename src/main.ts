import * as game from './game';
import * as sprites from './sprites';

(async () => {
    await sprites.initialize();

    const g = await game.create(document.querySelector('canvas'));
    game.start(g);
})();

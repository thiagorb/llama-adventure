import * as sprites from './sprites';
import * as home from './home';
import * as worker from './worker';
import * as sound from './sound';
import * as game from './game';
import * as level from './level';
import * as loading from './loading';

(async () => {
    if (typeof document !== 'undefined') {
        sprites.initialize();
        worker.initialize();
        worker.startSimulatedMovements();

        const container = document.getElementById('container');

        const enableSound = () => {
            sound.getAudio().resume();
            container.removeEventListener('click', enableSound);
            container.removeEventListener('touchend', enableSound);
        };
        container.addEventListener('click', enableSound);
        container.addEventListener('touchend', enableSound);

        const id = parseInt(location.hash.replace('#', ''));
        if (Number.isNaN(id) || id < 0 || id > level.MAX_LEVEL_ID) {
            home.start();
        } else {
            game.start(game.create(await loading.start(worker.createLevel(id))));
        }
    } else {
        worker.work();
    }
})();

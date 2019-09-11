import * as sprites from './sprites';
import * as home from './home';
import * as worker from './worker';
import * as sound from './sound';

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
        home.start();
    } else {
        worker.work();
    }
})();

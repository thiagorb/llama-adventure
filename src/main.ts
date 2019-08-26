import * as sprites from './sprites';
import * as home from './home';
import * as worker from './worker';
import * as sound from './sound';

if (typeof document !== 'undefined') {
    worker.initialize();
    (async () => {
        sprites.initialize();
        worker.getSimulatedMovements();
        home.start();
    })();

    const container = document.getElementById('container');

    const enableSound = () => {
        sound.getAudio().resume();
        container.removeEventListener('click', enableSound);
        container.removeEventListener('touchend', enableSound);
    };
    container.addEventListener('click', enableSound);
    container.addEventListener('touchend', enableSound);
} else {
    worker.work();
}

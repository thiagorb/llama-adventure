import * as sprites from './sprites';
import * as home from './home';
import * as worker from './worker';
import * as sound from './sound';

if (typeof document !== 'undefined') {
    (async () => {
        sprites.initialize();
        worker.getSimulatedMovements();
        home.start();
    })();

    const enableSound = () => {
        console.log(sound.getAudio().resume());
        document.getElementById('container').removeEventListener('click', enableSound);
        document.getElementById('container').removeEventListener('touchend', enableSound);
    };
    document.getElementById('container').addEventListener('click', enableSound);
    document.getElementById('container').addEventListener('touchend', enableSound);
} else {
    worker.work();
}

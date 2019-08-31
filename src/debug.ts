import * as game from './game';
import { MILLISECONDS_PER_STEP, STEPS_PER_SECOND } from './consts';

export const start = (debugGame) => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    const renderTarget = { canvas, context };
    let debug;

    if (window['debug']) {
        debug = window['debug'];
    } else {
        debug = {
            follow: false,
            zoom: 1
        };

        window['debug'] = debug;
    }

    let sps = 0;
    let fps = 0;
    let frameCount = 0;
    let stepCount = 0;
    let secondInterval = setInterval(() => {
        fps = frameCount;
        sps = stepCount;
        stepCount = 0;
        frameCount = 0;
    }, 1000);

    const scale = () => {
        if (debug.zoom) {
            context.scale(debug.zoom, debug.zoom);
        }
        game.scaleWorld(context);
    };

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();

        if (debug.follow) {
            game.centerScreen(context);
            scale();
            game.centerPlayer(debugGame, context);
        } else {
            scale();
        }

        game.renderWorld(debugGame, context);
        context.restore();

        context.font = '10px sans-serif';
        context.fillStyle = 'white';
        context.fillText(`SCORE: ${debugGame.score}`, 5, 10);
        context.fillText(sps.toString(), 5, 20);
        context.fillText(fps.toString(), 5, 30);

        frameCount++;
    };

    let stepsSinceBeginning = 0;
    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        const steps = Math.min(STEPS_PER_SECOND, currentStep - stepsSinceBeginning);
        game.step(debugGame, steps);
        stepCount += steps;
        stepsSinceBeginning = currentStep;
        render();
        if (debugGame.finished) {
            clearInterval(secondInterval);
        } else {
            window.requestAnimationFrame(loop);
        }
    };

    loop(0);
};

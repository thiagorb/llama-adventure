import { canvas, context, SCREEN_WIDTH } from './consts';
import * as transitions from './transitions';
import * as sprites from './sprites';

export const start = async (promise: Promise<any>, previousRender = null) => {
    let finished = false;

    const dots = ['', '.', '..', '...'];

    const render = (timestamp) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';

        const dot = dots[Math.floor(timestamp / 500) % dots.length];
        context.textAlign = 'left';
        context.fillText(`LOADING${dot}`, 135, 110);
        const llama = sprites.get('llama');
        const llamaFrame = Math.floor(timestamp / 300) % llama.frames;
        sprites.draw(context, llama, (SCREEN_WIDTH - llama.width) / 2, 125, llama.width, llama.height, llamaFrame);
    };

    const loop = (timestamp) => {
        if (finished) {
            return;
        }

        render(timestamp);

        requestAnimationFrame(loop);
    };

    if (previousRender) {
        await transitions.fade({ render: previousRender, from: 0, to: 1, time: 500 });
    }
    await sprites.initialize();
    await transitions.fade({ render, from: 1, to: 0, time: 500 });
    requestAnimationFrame(loop);
    const result = await promise;
    finished = true;
    await transitions.fade({ render, from: 0, to: 1, time: 500 });
    return result;
};

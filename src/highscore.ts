import * as ui from './ui';
import * as transitions from './transitions';
import { BUTTON_HEIGHT, canvas, context } from './consts';

export const start = (background, nextScreen) => {
    let finished = false;

    const highscore = [
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
        {
            name: 'THIAGO',
            world: 992023,
            time: 250,
            score: 3000,
        },
    ];

    const render = (timestamp) => {
        background(timestamp);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('HIGH SCORE', 160, 5);
        context.textAlign = 'left';
        context.fillText('NAME', 36, 30);
        context.fillText('WORLD #', 112, 30);
        context.fillText('TIME', 182, 30);
        context.fillText('SCORE', 232, 30);

        for (let i = 0; i < 10; i++) {
            const {
                name = '---',
                world = '---',
                time = '---',
                score = '---',
            } = highscore[i] || {};
            context.fillText(name, 36, 45 + i * 15);
            context.fillText(world as string, 112, 45 + i * 15);
            context.fillText(time as string, 182, 45 + i * 15);
            context.fillText(score as string, 232, 45 + i * 15);
        }

        ui.drawButton(okayButton);
    };

    const okayButton = ui.createButton('OKAY', 135, 205, 50, BUTTON_HEIGHT);
    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        await transitions.fade({ time: 300, from: 0.5, to: 0, render: background });
        nextScreen();
    });

    const loop = (timestamp) => {
        if (finished) {
            return;
        }

        render(timestamp);

        requestAnimationFrame(loop);
    };

    transitions.fade({ time: 300, from: 0, to: 0.5, render: background }).then(loop);
};

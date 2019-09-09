import * as ui from './ui';
import * as transitions from './transitions';
import * as game from './game';
import * as level from './level';
import * as home from './home';
import { BUTTON_HEIGHT, canvas, context } from './consts';
import * as loading from './loading';
import * as worker from './worker';

export const start = (background) => {
    let finished = false;

    const keyboard: Array<{ button: ui.Button, listener: ui.Listener }> = [];
    let levelId = 0;
    const addChar = (number) => {
        const next = levelId * 10 + number;
        if (next <= level.MAX_LEVEL_ID) {
            levelId = next;
        }
    };
    const removeChar = () => levelId = Math.floor(levelId / 10);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (/^[0-9]$/.test(event.key)) {
            addChar(parseInt(event.key));
        } if (event.key === 'Backspace') {
            removeChar();
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    for (let i = 0; i <= 9; i++) {
        const key = i;
        const button = ui.createButton(<any>key, 25 + i * 25, 125, 20, BUTTON_HEIGHT);
        keyboard.push({ button, listener: ui.createListener(button, () => addChar(key)) });
    }

    const backspace = ui.createButton('←', 275, 125, 20, BUTTON_HEIGHT);
    keyboard.push({ button: backspace, listener: ui.createListener(backspace, removeChar) });

    const render = (timestamp) => {
        background(timestamp);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('SELECT WORLD', 160, 15);
        context.textAlign = 'left';

        context.textAlign = 'left';
        context.fillText(`ENTER THE WORLD NUMBER: ${levelId}_`, 70, 105);
        keyboard.forEach(({ button }) => ui.drawButton(button));
        ui.drawButton(okayButton);
    };

    const okayButton = ui.createButton('OKAY', 135, 205, 50, BUTTON_HEIGHT);
    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        keyboard.forEach(({ listener }) => listener.remove());
        document.removeEventListener('keydown', handleKeyDown);
        game.start(await loading.start(worker.createLevel(levelId).then(game.create), render));
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

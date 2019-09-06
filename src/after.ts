import * as ui from './ui';
import * as transitions from './transitions';
import * as home from './home';
import * as game from './game';
import { Status } from './game';
import { BUTTON_HEIGHT, canvas, context } from './consts';

export const start = ({ lastGame, renderGame }: { lastGame: game.Game, renderGame: () => void }) => {
    const LEFT = 70;
    const TOP = 60;
    const BUTTON_X = LEFT;
    const BUTTON_Y = TOP + 80;
    const BUTTON_WIDTH = 45;
    let finished = false;

    const render = () => {
        renderGame();
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.textBaseline = 'top';
        context.fillStyle = 'white';
        if (lastGame.status === Status.Won) {
            context.fillText('CONGRATULATIONS!', LEFT, TOP);
            context.fillText('YOU ARRIVED HOME SAFELY AND', LEFT, TOP + 30);
            context.fillText('BROUGHT YOUR ITEMS BACK.', LEFT, TOP + 50);
        } else {
            context.fillText('OUCH!', LEFT, TOP);
            context.fillText("UNFORTUNATELY YOU DIDN'T", LEFT, TOP + 30);
            context.fillText("MANAGE TO REACH YOUR HOME.", LEFT, TOP + 50);
        }

        ui.drawButton(okayButton);
    };

    const okayButton = ui.createButton('OKAY', BUTTON_X, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT)
    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        await transitions.fade({ time: 500, from: 0.5, to: 1, render: renderGame });
        home.start({ lastGame });
    });

    const loop = () => {
        if (finished) {
            return;
        }

        render();

        requestAnimationFrame(loop);
    };

    loop();
};

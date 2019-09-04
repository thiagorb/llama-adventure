import * as ui from './ui';
import * as transitions from './transitions';
import * as home from './home';
import * as game from './game';
import { Status } from './game';
import { canvas } from './consts';

export const start = ({ lastGame, renderGame }: { lastGame: game.Game, renderGame: () => void }) => {
    const LEFT = 70;
    const TOP = 60;
    const BUTTON_X = LEFT;
    const BUTTON_Y = TOP + 80;
    const BUTTON_WIDTH = 45;
    const BUTTON_HEIGHT = 20;
    let finished = false;
    const render = () => {
        const context = canvas.getContext('2d');

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

        ui.drawButton(context, 'OKAY', BUTTON_X, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT);
    };

    const checkClick = async (x, y) => {
        if (x >= BUTTON_X && x < BUTTON_X + BUTTON_WIDTH && y >= BUTTON_Y && y < BUTTON_Y + BUTTON_HEIGHT) {
            finished = true;
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchend', handleTouchEnd);
            await transitions.fade({ time: 500, from: 0.5, to: 1, render: renderGame });
            home.start({ lastGame, renderGame });
        }
    };

    const handleClick = ui.mapClickCoordinates(checkClick);
    const handleTouchEnd = ui.mapTouchCoordinates(checkClick);

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchend', handleTouchEnd);

    const loop = () => {
        if (finished) {
            return;
        }

        render();

        requestAnimationFrame(loop);
    };

    loop();
};
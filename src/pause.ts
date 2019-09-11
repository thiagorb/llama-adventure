import * as ui from './ui';
import { BUTTON_HEIGHT, canvas, context } from './consts';
import * as transitions from './transitions';
import * as after from './after';
import * as game from './game';

export const start = ({ pausedGame, gameLoop, renderGame }: { pausedGame: game.Game, gameLoop: (n: number) => void, renderGame: () => void }) => {
    let finished = false;
    const continueButton = ui.createButton('CONTINUE', 80, 140, 75, BUTTON_HEIGHT);
    const exitButton = ui.createButton('EXIT GAME', 165, 140, 75, BUTTON_HEIGHT);

    const render = () => {
        renderGame();
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('GAME PAUSED', 160, 115);

        ui.drawButton(continueButton);
        ui.drawButton(exitButton);
    };

    const finish = () => {
        finished = true;
        continueListener.remove();
        exitListener.remove();
        return transitions.fade({ time: 500, from: 0.5, to: 0, render: renderGame });
    };

    const continueListener = ui.createListener(continueButton, () => finish().then(gameLoop));

    const exitListener = ui.createListener(exitButton, async () => {
        await finish();
        await transitions.fade({ render: renderGame, from: 0, to: 0.5, time: 2000 });
        after.start({ lastGame: pausedGame, renderGame });
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

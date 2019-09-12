import * as ui from './ui';
import * as transitions from './transitions';
import * as game from './game';
import * as score from './score';
import * as home from './home';
import * as tutorial from './tutorial';
import { BUTTON_HEIGHT, canvas, context, SCREEN_HEIGHT, SCREEN_WIDTH } from './consts';

export const start = ({ lastGame, renderGame }: { lastGame: game.Game, renderGame: () => void }) => {
    const LEFT = 70;
    const TOP = 60;
    const shareInput = document.querySelector('#share') as HTMLInputElement;
    let finished = false;

    const isTutorial = lastGame.level.id === tutorial.LEVEL_ID;
    const okayButton = ui.createButton('OKAY', LEFT, TOP + 80, 48, BUTTON_HEIGHT);
    const shareButton = ui.createButton('SHARE THIS LEVEL', LEFT + 58, TOP + 80, 115, BUTTON_HEIGHT);

    let shared = false;
    const shareClickHandler = () => {
        shareInput.value = `${location.origin}${location.pathname}${location.search}#${lastGame.level.id}`;
        shareInput.select();
        document.execCommand('copy');
        setTimeout(() => shared = false, 3000);
        shared = true;
    };
    if (!isTutorial) {
        shareInput.classList.add('is-visible');
        shareInput.value = location.href;
        shareInput.style.left = `${100 * shareButton.x / SCREEN_WIDTH}%`;
        shareInput.style.width = `${100 * shareButton.width / SCREEN_WIDTH}%`;
        shareInput.style.top = `${100 * shareButton.y / SCREEN_HEIGHT}%`;
        shareInput.style.height = `${100 * shareButton.height / SCREEN_HEIGHT}%`;
        shareInput.addEventListener('click', shareClickHandler);
        shareInput.addEventListener('touchend', shareClickHandler);
    }

    const render = () => {
        renderGame();
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.textAlign = 'left';
        if (lastGame.status === game.Status.Won) {
            context.fillText('CONGRATULATIONS!', LEFT, TOP);
            context.fillText('YOU ARRIVED HOME SAFELY AND', LEFT, TOP + 30);
            context.fillText('BROUGHT YOUR ITEMS BACK.', LEFT, TOP + 50);
        } else {
            context.fillText('OUCH!', LEFT, TOP);
            context.fillText("YOU DIDN'T MANAGE", LEFT, TOP + 30);
            context.fillText("TO COME BACK HOME.", LEFT, TOP + 50);
        }

        if (shared) {
            context.fillText("COPIED TO CLIPBOARD", LEFT, TOP + 105);
        }

        ui.drawButton(okayButton);
        if (!isTutorial) {
            ui.drawButton(shareButton);
        }
    };

    const okayListener = ui.createListener(okayButton, async () => {
        finished = true;
        okayListener.remove();
        shareInput.classList.remove('is-visible');
        shareInput.removeEventListener('click', shareClickHandler);
        shareInput.removeEventListener('touchend', shareClickHandler);
        if (isTutorial) {
            await transitions.fade({ time: 500, from: 0.5, to: 1, render: renderGame });
            home.start();
        } else {
            await transitions.fade({ time: 500, from: 0.5, to: 0, render: renderGame });
            score.start({ lastGame, renderGame });
        }
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

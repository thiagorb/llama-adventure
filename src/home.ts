import * as transitions from './transitions';
import * as game from './game';
import * as debug from './debug';
import * as sprites from './sprites';
import * as worker from './worker';
import * as ui from './ui';
import { canvas, context } from './consts';

export const start = ({ lastGame, renderGame }: { lastGame: game.Game, renderGame: () => void } = { lastGame: undefined, renderGame: undefined }) => {
    const OPTIONS_Y = 100;
    const OPTIONS_HEIGHT = 20;
    const REPLAY_GAME = 'REPLAY GAME';
    const START_GAME = 'START GAME';
    const options = [START_GAME];
    if (lastGame) {
        options.unshift(REPLAY_GAME);
    }
    let finished = false;

    const mapOption = callback => (x, y) => callback(Math.floor((y - OPTIONS_Y) / OPTIONS_HEIGHT));

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.textBaseline = 'top';
        context.fillStyle = 'white';
        context.fillText('LLAMA ADVENTURE', 110, 50);
        for (let i = options.length - 1; i >=0; i--) {
            ui.drawButton(context, options[i], 100, OPTIONS_Y + OPTIONS_HEIGHT * i, 120, OPTIONS_HEIGHT);
        }
    };

    const handleOptionClick = async (option) => {
        if (option < 0 || option >= options.length) {
            return;
        }

        finished = true;
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchend', handleTouchEnd);

        const startGame = async (levelPromise) => {
            const [level] = await Promise.all([
                levelPromise,
                transitions.fade({ render, from: 0, to: 1, time: 500 }),
                sprites.initialize()
            ]);

            const newGame = game.create(level);
            if (process.env.NODE_ENV === 'production') {
                game.start(newGame);
            } else {
                debug.start(newGame);
            }
        };

        if (options[option] === START_GAME) {
            startGame(worker.createLevel());
        } else if (options[option] === REPLAY_GAME) {
            startGame(lastGame.level);
        }
    };

    const handleClick = ui.mapClickCoordinates(mapOption(handleOptionClick));
    const handleTouchEnd = ui.mapTouchCoordinates(mapOption(handleOptionClick));
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

import * as transitions from './transitions';
import * as game from './game';
import * as sprites from './sprites';
import * as worker from './worker';
import * as ui from './ui';
import { BUTTON_HEIGHT, canvas, context } from './consts';
import * as tutorial from './tutorial';
import * as debug from './debug';

export const start = ({ lastGame }: { lastGame: game.Game } = { lastGame: undefined }) => {
    let finished = false;

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.textBaseline = 'top';
        context.fillStyle = 'white';
        context.fillText('LLAMA ADVENTURE', 120, 50);
        buttons.forEach(({ button }) => ui.drawButton(button));
    };

    const startGame = async (gamePromise: Promise<game.Game>) => {
        finished = true;
        buttons.forEach(({ listener }) => listener.remove());
        const [newGame] = await Promise.all([
            gamePromise,
            transitions.fade({ render, from: 0, to: 1, time: 500 }),
            sprites.initialize()
        ]);

        if (process.env.NODE_ENV === 'production') {
            game.start(newGame);
        } else {
            debug.start(newGame);
        }
    };

    const buttonsData = [
        { label: 'TUTORIAL', handler: () => startGame(Promise.resolve(tutorial.createGame())) },
        { label: 'PLAY GAME', handler: () => startGame(worker.createLevel().then(game.create)) },
    ];

    if (lastGame && lastGame.level !== tutorial.getLevel()) {
        buttonsData.unshift({ label: 'REPLAY GAME', handler: () => startGame(Promise.resolve(game.create(lastGame.level))) });
    }

    const buttons = buttonsData.map((buttonData, index) => {
        const button = ui.createButton(buttonData.label, 120, 100 + index * 30, 100, BUTTON_HEIGHT);
        return ({
            button,
            listener: ui.createListener(button, buttonData.handler),
        })
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

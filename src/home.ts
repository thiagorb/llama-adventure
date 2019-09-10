import * as game from './game';
import * as worker from './worker';
import * as ui from './ui';
import { BUTTON_HEIGHT, canvas, context, DEFAULT_FONT, SCREEN_HEIGHT, SCREEN_WIDTH } from './consts';
import * as tutorial from './tutorial';
import * as loading from './loading';
import * as debug from './debug';
import * as map from './map';
import * as random from './random';
import * as level from './level';
import * as highscore from './highscore';
import * as select from './select';
import * as transitions from './transitions';

export const start = ({ lastGame }: { lastGame: game.Game } = { lastGame: undefined }) => {
    let finished = false;

    const randomizer = random.create(Math.floor(Math.random() * (level.MAX_LEVEL_ID + 1)));
    const background = map.renderTiles(map.randomTiles(randomizer), randomizer);
    const speed = 30;
    let mapX = -background.width / 2;
    let mapY = -background.height / 2;
    let direction = Math.random() * Math.PI * 2;
    let mapSpeedX = speed * Math.cos(direction);
    let mapSpeedY = speed * Math.sin(direction);
    let previousTimestamp = null;

    const renderBackground = timestamp => {
        const elapsedSeconds = previousTimestamp === null ? 0 : (timestamp - previousTimestamp) / 1000;
        previousTimestamp = timestamp;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(mapX, mapY);
        context.drawImage(background, 0, 0);
        context.restore();
        mapX += mapSpeedX * elapsedSeconds;
        mapY += mapSpeedY * elapsedSeconds;
        if (mapX + mapSpeedX > 0 || mapX + mapSpeedX < -background.width + SCREEN_WIDTH) {
            mapSpeedX = -mapSpeedX;
        }
        if (mapY + mapSpeedY > 0 || mapY + mapSpeedY < -background.height + SCREEN_HEIGHT) {
            mapSpeedY = -mapSpeedY;
        }
    };

    const render = (timestamp) => {
        renderBackground(timestamp);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.font = '16px/20px sans-serif';
        context.fillText('LLAMA ADVENTURE', 160, 50);
        context.font = DEFAULT_FONT;
        context.textAlign = 'right';
        context.fillText('CREATED BY THIAGO ROMÃO BARCALA', SCREEN_WIDTH - 10, SCREEN_HEIGHT - 15);
        buttons.forEach(({ button }) => ui.drawButton(button));
    };

    const finish = () => {
        finished = true;
        buttons.forEach(({ listener }) => listener.remove());
    };

    const startGame = async (gamePromise: Promise<game.Game>) => {
        finish();
        const newGame = await loading.start(gamePromise, render);

        if (process.env.NODE_ENV === 'production') {
            game.start(newGame);
        } else {
            debug.start(newGame);
        }
    };

    const buttonsData = [
        { label: 'PLAY GAME', handler: () => startGame(worker.createLevel(Math.random() * level.MAX_LEVEL_ID).then(game.create)) },
        {
            label: 'SELECT WORLD',
            handler: () => {
                finish();
                select.start(renderBackground);
            }
        },
        { label: 'TUTORIAL', handler: () => startGame(Promise.resolve(tutorial.createGame())) },
        {
            label: 'HIGH SCORE',
            handler: async () => {
                finished = true;
                await transitions.fade({ render: renderBackground, from: 0.5, to: 0, time: 500 });
                highscore.start(renderBackground, () => {
                    finished = false;
                    fadeIn();
                });
            },
        },
    ];

    if (lastGame) {
        buttonsData.unshift({ label: 'REPLAY GAME', handler: () => startGame(Promise.resolve(game.create(lastGame.level))) });
    }

    const buttons = buttonsData.map((buttonData, index) => {
        const button = ui.createButton(buttonData.label, 110, 80 + index * 25, 100, BUTTON_HEIGHT);
        return ({
            button,
            listener: ui.createListener(button, buttonData.handler),
        })
    });

    const loop = (timestamp) => {
        if (finished) {
            return;
        }

        render(timestamp);

        requestAnimationFrame(loop);
    };


    const fadeIn = () => {
        transitions.fade({ time: 300, from: 0, to: 0.5, render: renderBackground }).then(loop);
    };

    fadeIn();
};

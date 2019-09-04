import * as game from './game';
import { Status } from './game';
import * as matrix from './matrix';
import { canvas, context, TILE_SIZE } from './consts';
import * as transitions from './transitions';

export const start = async (debugGame: game.Game) => {

    const debug = {
        follow: true,
        zoom: 1, //0.10655,
        highlightSurfaces: {},
        highlightRegions: {},
        game: debugGame
    };

    window['debug'] = debug;

    let sps = 0;
    let fps = 0;
    let frameCount = 0;
    let stepCount = 0;
    let secondInterval = setInterval(() => {
        fps = frameCount;
        sps = stepCount;
        stepCount = 0;
        frameCount = 0;
    }, 1000);

    const scale = () => {
        if (debug.zoom) {
            context.scale(debug.zoom, debug.zoom);
        }
        game.scaleWorld();
    };

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();

        if (debug.follow) {
            game.centerScreen();
            scale();
            game.centerPlayer(debugGame);
        } else {
            scale();
        }

        game.renderWorld(debugGame);

        for (let surface of Object.keys(debug.highlightSurfaces)) {
            context.fillStyle = debug.highlightSurfaces[surface];
            for (let cell of debugGame.level.surfaces[surface]) {
                context.fillRect(
                    cell.col * TILE_SIZE,
                    cell.row * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }

        if (Object.keys(debug.highlightRegions).length > 0) {
            matrix.iterate(debug.game.level.regions.map, (row, col, value) => {
                const color = debug.highlightRegions[value];
                if (color) {
                    context.fillStyle = color;
                    context.fillRect(
                        col * TILE_SIZE,
                        row * TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            });
        }

        context.restore();

        context.font = '10px sans-serif';
        context.fillStyle = 'white';
        context.fillText(`SCORE: ${debugGame.score}`, 5, 10);
        context.fillText(sps.toString(), 5, 20);
        context.fillText(fps.toString(), 5, 30);


        frameCount++;
    };

    const step = (_: game.Game, steps: number) => {
        stepCount += steps;
        game.step(debugGame, steps);
        if (secondInterval != null && debugGame.status !== Status.Playing) {
            clearInterval(secondInterval);
            secondInterval = null;
        }
    };

    await transitions.fade({ render, from: 1, to: 0, time: 500 });
    const loop = game.loopFactory(debugGame, step, render);
    loop(0);
};

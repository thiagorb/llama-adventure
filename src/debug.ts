import * as game from './game';
import * as matrix from './matrix';
import { MILLISECONDS_PER_STEP, STEPS_PER_SECOND, TILE_SIZE } from './consts';

export const start = (debugGame: game.Game) => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    debugGame.level.surfaces.forEach((surface, index) => {
        const { row, col } = surface[0];
    });

    const debug = {
        follow: false,
        zoom: 0.10655,
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
        game.scaleWorld(context);
    };

    const render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();

        if (debug.follow) {
            game.centerScreen(context);
            scale();
            game.centerPlayer(debugGame, context);
        } else {
            scale();
        }

        game.renderWorld(debugGame, context);

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

    let stepsSinceBeginning = 0;
    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        const steps = Math.min(STEPS_PER_SECOND, currentStep - stepsSinceBeginning);
        game.step(debugGame, steps);
        stepCount += steps;
        stepsSinceBeginning = currentStep;
        render();
        if (debugGame.finished) {
            clearInterval(secondInterval);
        } else {
            window.requestAnimationFrame(loop);
        }
    };

    loop(0);
};

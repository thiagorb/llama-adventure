import {
    PIXELS_PER_METER,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    STEPS_PER_SECOND,
    TILE_SIZE
} from './consts';
import * as player from './player';
import * as physics from './physics';
import * as map from './map';
import * as state from './state';
import * as matrix from './matrix';
import * as simulation from './simulation';
import { deepCopy } from './utils';

const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;

const render = (game: Game) => {
    const context = game.canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    context.clearRect(0, 0, game.canvas.width, game.canvas.height);

    context.save();
    context.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    context.scale(PIXELS_PER_METER, PIXELS_PER_METER);
    context.translate(
        -game.states.current.player.position.x - PLAYER_WIDTH / 2,
        -game.states.current.player.position.y - PLAYER_HEIGHT / 2
    );

    context.save();
    context.scale(1 / PIXELS_PER_METER, 1 / PIXELS_PER_METER);
    context.drawImage(game.renderedMap, 0, 0);
    context.restore();

    player.render(context, game.states.current);

    context.fillStyle = 'yellow';
    context.fillRect(game.states.current.goal.position.x, game.states.current.goal.position.y, PLAYER_WIDTH, PLAYER_HEIGHT);




    ///DEBUUUUG
    if (debugRegion) {
        let playerCol = map.getCol(game.states.current.player.position.x);
        let playerRow = map.getRow(game.states.current.player.position.y);
        for (let i = 0; i < debugRegion.length; i++) {
            const { row, col } = debugRegion[i];
            if (playerCol === col && playerRow === row) {
                debugRegion[i].passed = true;
            }

            if (debugRegion[i].passed) {
                context.fillStyle = 'rgba(128, 0, 128, 0.25)';
            } else {
                context.fillStyle = 'rgba(128, 0, 128, 0.5)';
            }

            context.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    ///DEBUUUUG




    context.restore();

    context.font = '10px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(game.sps.toString(), 5, 10);
    context.fillText(game.fps.toString(), 5, 20);
    context.fillText(game.states.current.player.position.x.toFixed(), 5, 30);
    context.fillText(game.states.current.player.position.y.toFixed(), 30, 30);
    context.fillText(game.states.current.goal.position.x.toFixed(), 5, 40);
    context.fillText(game.states.current.goal.position.y.toFixed(), 30, 40);


    ///DEBUUUUG
    if (debugRegion) {
        context.fillText(debugRegion.length.toString(), 5, 50);
    }
    ///DEBUUUUG

    if (game.finished) {
        game.fadingOut = Math.min(300, game.fadingOut + 1);
        context.fillStyle = `rgba(0, 0, 0, ${game.fadingOut / 300})`;
        context.fillRect(0, 0, game.canvas.width, game.canvas.height);
    }
};

const distance2 = (p1: state.Vector2D, p2: state.Vector2D) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    return dx * dx + dy * dy;
};

const reachedGoal = (state: state.State) =>
    distance2(state.player.position, state.goal.position) < PLAYER_HEIGHT * PLAYER_HEIGHT;

const step = (game: Game, steps: number) => {
    for (let i = 0; i < steps; i++) {
        game.stepCount++;
        if (!game.finished) {
            physics.step(game.levelMap, game.states);
        }
        let temp = game.states.next;
        game.states.current = game.states.next;
        game.states.next = temp;
        if (reachedGoal(game.states.current)) {
            game.finished = true;
        }
    }
};

const loopFactory = (game: Game) => {
    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        step(game, currentStep - game.stepsSinceBeginning);
        game.stepsSinceBeginning = currentStep;
        render(game);
        game.frameCount++;
        window.requestAnimationFrame(loop);
    };

    return loop;
};

const findPosition = (levelMap: map.Map, regions: map.RegionsMap) => {
    for (let i = 0; i < 100; i++) {
        const row = Math.floor(Math.random() * map.getRows(levelMap));
        const col = Math.floor(Math.random() * map.getCols(levelMap));
        if (matrix.get(regions.map, row, col) !== regions.biggest) {
            continue;
        }
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (map.collidesWithHorizontalSegment(levelMap, y, x, x + PLAYER_WIDTH)) {
            continue;
        }

        if (map.collidesWithVerticalSegment(levelMap, x, y, y + PLAYER_HEIGHT)) {
            continue;
        }

        return { x, y };
    }
    throw new Error('Unable to find position');
};

export interface Game {
    canvas: HTMLCanvasElement;
    states: state.States;
    stepsSinceBeginning: number;
    stepCount: number;
    frameCount: number;
    fps: number;
    sps: number;
    levelMap: map.Map;
    renderedMap: CanvasImageSource;
    secondInterval: number;
    finished: boolean;
    fadingOut: number;
}

let debugRegion;
const randomizePositions = (levelMap, playerPosition, goalPosition) => {
    const biggestRegion = simulation.findBiggestRegion(levelMap);
    debugRegion = biggestRegion;
    console.log(biggestRegion);
    for (let attempt = 0; attempt < 100; attempt++) {
        const player = biggestRegion[Math.floor(Math.random() * biggestRegion.length)];
        const goal = biggestRegion[Math.floor(Math.random() * biggestRegion.length)];
        const dy = player.row - goal.row;
        const dx = player.col - goal.col;
        const distance2 = dy * dy + dx * dx;
        if (distance2 > 400) {
            playerPosition.x = player.col * TILE_SIZE;
            playerPosition.y = player.row * TILE_SIZE;
            goalPosition.x = goal.col * TILE_SIZE;
            goalPosition.y = goal.row * TILE_SIZE;
            console.log(distance2, goalPosition, playerPosition);
            return;
        }
    }
    throw new Error('Unable to find positions');
};

export const create = async (canvas: HTMLCanvasElement): Promise<Game> => {
    const states: state.States = {
        current: state.create(),
        next: null,
    };

    const levelMap = map.create(map.randomTiles());
    const renderedMap = map.render(levelMap);
    //const regions = map.calculateRegions(levelMap);
    //states.current.player.position = findPosition(levelMap, regions);
    //states.current.goal.position = findPosition(levelMap, regions);
    randomizePositions(levelMap, states.current.player.position, states.current.goal.position);
    states.next = deepCopy(states.current);

    return {
        canvas,
        states,
        stepsSinceBeginning: 0,
        stepCount: 0,
        frameCount: 0,
        fps: 0,
        sps: 0,
        levelMap,
        renderedMap,
        secondInterval: null,
        finished: false,
        fadingOut: 0,
    }
};

export const start = (game: Game) => {
    game.secondInterval = setInterval(() => {
        game.fps = game.frameCount;
        game.sps = game.stepCount;
        game.stepCount = 0;
        game.frameCount = 0;
    }, 1000);

    const loop = loopFactory(game);
    loop(0);
};

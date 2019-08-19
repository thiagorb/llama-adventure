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

    context.restore();

    context.font = '10px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(game.sps.toString(), 5, 10);
    context.fillText(game.fps.toString(), 5, 20);
    context.fillText(game.states.current.player.position.x.toFixed(), 5, 30);
    context.fillText(game.states.current.player.position.y.toFixed(), 30, 30);
    context.fillText(game.states.current.goal.position.x.toFixed(), 5, 40);
    context.fillText(game.states.current.goal.position.y.toFixed(), 30, 40);

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

export const create = async (canvas: HTMLCanvasElement): Promise<Game> => {
    const states: state.States = {
        current: state.create(),
        next: null,
    };

    const levelMap = map.create(map.randomTiles());
    const renderedMap = map.render(levelMap);
    const regions = map.calculateRegions(levelMap);
    states.current.player.position = findPosition(levelMap, regions);
    states.current.goal.position = findPosition(levelMap, regions);
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

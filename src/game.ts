import {
    METERS_PER_PIXEL, MILLISECONDS_PER_STEP,
    PIXELS_PER_METER,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    STEPS_PER_SECOND
} from './consts';
import * as player from './player';
import * as physics from './physics';
import * as map from './map';
import * as state from './state';
import * as sprites from './sprites';
import * as sound from './sound';
import * as transitions from './transitions';
import * as home from './home';
import * as worker from './worker';
import * as level from './level';
import { deepCopy } from './utils';

interface RenderTarget {
    canvas: {
        width: number,
        height: number,
    },
    context: CanvasRenderingContext2D;
}

export const renderWorld = (game: Game, context: CanvasRenderingContext2D) => {
    context.save();
    context.scale(1 / PIXELS_PER_METER, 1 / PIXELS_PER_METER);
    context.drawImage(game.renderedMap, 0, 0);
    context.restore();

    for (let item of game.items) {
        if (!item.collected) {
            sprites.draw(context, sprites.get(item.sprite), item.position.x, item.position.y, item.width, item.height);
        }
    }

    player.render(context, game.states.current);

    const house = sprites.get('house');
    sprites.draw(context, house, game.states.current.goal.position.x, game.states.current.goal.position.y, house.width * METERS_PER_PIXEL, house.height * METERS_PER_PIXEL);
};

export const centerScreen = (context: CanvasRenderingContext2D) => {
    context.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
};

export const scaleWorld = (context: CanvasRenderingContext2D) => {
    context.scale(PIXELS_PER_METER, PIXELS_PER_METER);
};

export const centerPlayer = (game: Game, context: CanvasRenderingContext2D) => {
    context.translate(
        -game.states.current.player.position.x - PLAYER_WIDTH / 2,
        -game.states.current.player.position.y - PLAYER_HEIGHT / 2
    );
};

export const render = (game: Game, target: RenderTarget) => {
    const context = target.context;

    context.clearRect(0, 0, target.canvas.width, target.canvas.height);

    context.save();
    centerScreen(context);
    scaleWorld(context);
    centerPlayer(game, context);
    renderWorld(game, context);
    context.restore();

    context.font = '10px sans-serif';
    context.fillStyle = 'white';
    context.fillText(`SCORE: ${game.score}`, 5, 10);
};

const distance2 = (p1: state.Vector2D, p2: state.Vector2D) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    return dx * dx + dy * dy;
};

const reachedGoal = (state: state.State) =>
    distance2(state.player.position, state.goal.position) < PLAYER_HEIGHT * PLAYER_HEIGHT;

const checkItemsCollection = (game: Game) => {
    const items = game.items;
    const playerPosition = game.states.current.player.position;
    const minX = playerPosition.x - 2 * PLAYER_WIDTH;
    const maxX = playerPosition.x + 2 * PLAYER_WIDTH;
    let minStartIndex = 0;
    let maxStartIndex = items.length - 1;
    while (minStartIndex < maxStartIndex) {
        const middle = Math.floor((minStartIndex + maxStartIndex + 1) / 2);
        if (items[middle].position.x > maxX) {
            maxStartIndex = middle - 1;
            continue;
        }

        minStartIndex = middle;
        if (items[middle].position.x === maxX) {
            break;
        }
    }

    for (let i = minStartIndex; i >= 0 && i < items.length && items[i].position.x >= minX; i--) {
        const item = items[i];
        if (item.collected) {
            continue;
        }

        if (item.position.x + item.width < playerPosition.x) {
            continue;
        }

        if (item.position.x > playerPosition.x + PLAYER_WIDTH) {
            continue;
        }

        if (item.position.y + item.height < playerPosition.y) {
            continue;
        }

        if (item.position.y > playerPosition.y + PLAYER_HEIGHT) {
            continue;
        }

        sound.playCollectSound();
        item.collected = true;
        game.score += item.score;
    }
};

export const step = (game: Game, steps: number) => {
    for (let i = 0; i < steps; i++) {
        if (!game.finished) {
            checkItemsCollection(game);
            physics.step(game.map, game.states);
            if (game.states.current.player.speed.y >= 0 && game.states.next.player.speed.y < 0) {
                sound.playJumpSound();
            }
        }
        let temp = game.states.next;
        game.states.next = game.states.current;
        game.states.current = temp;
        if (reachedGoal(game.states.current)) {
            game.finished = true;
            transitions.fadeOut().then(() => home.start());
        }
    }
};

const loopFactory = (game: Game) => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    const renderTarget = { canvas, context };
    let stepsSinceBeginning = 0;

    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        step(game, Math.min(STEPS_PER_SECOND, currentStep - stepsSinceBeginning));
        stepsSinceBeginning = currentStep;
        render(game, renderTarget);
        if (!game.finished) {
            window.requestAnimationFrame(loop);
        }
    };

    return loop;
};

export interface Game {
    states: state.States;
    score: number;
    map: map.Map;
    renderedMap: CanvasImageSource;
    finished: boolean;
    items: Array<level.Item>;
}

export const create = async (): Promise<Game> => {
    const current = state.create();
    const level = await worker.createLevel();
    current.player.position = level.player;
    current.goal.position = level.goal;

    return {
        states: {
            current,
            next: deepCopy(current)
        },
        score: 0,
        map: level.map,
        renderedMap: map.render(level.map),
        finished: false,
        items: level.items,
    };
};

export const start = (game: Game) => {
    const loop = loopFactory(game);
    loop(0);
};

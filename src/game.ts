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
import * as collision from './collision';
import * as map from './map';
import * as state from './state';
import * as sprites from './sprites';
import * as sound from './sound';
import * as transitions from './transitions';
import * as home from './home';
import * as level from './level';
import * as tunnel from './tunnel';
import { deepCopy } from './utils';
import { getKeys } from './keys';

export const renderWorld = (game: Game, context: CanvasRenderingContext2D) => {
    context.save();
    context.scale(1 / PIXELS_PER_METER, 1 / PIXELS_PER_METER);
    context.drawImage(game.renderedMap, 0, 0);
    context.restore();

    for (let i = game.collectedItems.length - 1; i >= 0; i--) {
        if (!game.collectedItems[i]) {
            const item = game.level.items[i];
            sprites.draw(context, sprites.get(item.sprite), item.position.x, item.position.y, item.width, item.height);
        }
    }

    tunnel.render(context, game);
    player.render(context, game.states.current);
    tunnel.renderFade(context, game);

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

export const render = (game: Game) => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);

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
    const items = game.level.items;
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
        if (game.collectedItems[i]) {
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
        game.collectedItems[i] = true;
        game.score += item.score;
    }
};

const lockedKeys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
};

export const step = (game: Game, steps: number) => {
    for (let i = 0; i < steps; i++) {
        if (!game.finished) {
            checkItemsCollection(game);
            tunnel.step(game);
            player.update(game.playerLocked ? lockedKeys : getKeys(), game.states.current.player, game.states.next.player);
            collision.playerGroundCollision(game.level.map, game.states.next.player);
            if (collision.playerSpikeCollision(game.level.map, game.states.next.player)) {
                game.finished = true;
                transitions.fadeOut().then(() => home.start());
            }

            if (game.states.current.player.speed.y >= 0 && game.states.next.player.speed.y < 0) {
                sound.playJumpSound();
            }
        }
        let temp = game.states.next;
        game.states.next = game.states.current;
        game.states.current = temp;
        if (reachedGoal(game.states.current)) {
            game.finished = true;
            transitions.fadeOut(() => render(game)).then(() => home.start());
        }
    }
};

const loopFactory = (game: Game) => {
    let stepsSinceBeginning = 0;

    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        step(game, Math.min(STEPS_PER_SECOND, currentStep - stepsSinceBeginning));
        stepsSinceBeginning = currentStep;
        render(game);
        if (!game.finished) {
            window.requestAnimationFrame(loop);
        }
    };

    return loop;
};

export interface Game {
    readonly states: state.States;
    readonly level: level.Level;
    readonly renderedMap: CanvasImageSource;
    readonly collectedItems: Array<boolean>;
    score: number;
    finished: boolean;
    tunnel: tunnel.Tunnel;
    playerLocked: boolean;
}

export const create = (level: level.Level): Game => {
    const current = state.create();
    current.player.position = level.player;
    current.goal.position = level.goal;

    return {
        states: {
            current,
            next: deepCopy(current)
        },
        level,
        renderedMap: map.render(level.map),
        collectedItems: level.items.map(() => false),
        score: 0,
        finished: false,
        tunnel: null,
        playerLocked: false,
    };
};

export const start = (game: Game) => {
    const loop = loopFactory(game);
    loop(0);
};

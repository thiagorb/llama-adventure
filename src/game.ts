import {
    canvas,
    context,
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
import * as after from './after';
import * as level from './level';
import * as tunnel from './tunnel';
import * as tutorial from './tutorial';
import * as pause from './pause';
import { deepCopy } from './utils';
import { getKeys } from './keys';

export const renderWorld = (game: Game) => {
    context.save();
    context.scale(1 / PIXELS_PER_METER, 1 / PIXELS_PER_METER);
    context.drawImage(game.renderedMap, 0, 0);
    context.restore();

    tunnel.render(game);

    const house = sprites.get('house');
    sprites.draw(context, house, game.level.goal.x, game.level.goal.y, house.width * METERS_PER_PIXEL, house.height * METERS_PER_PIXEL);

    for (let i = game.collectedItems.length - 1; i >= 0; i--) {
        if (!game.collectedItems[i]) {
            const item = game.level.items[i];
            sprites.draw(context, sprites.get(item.sprite), item.position.x, item.position.y, item.width, item.height);
        }
    }

    player.render(game.player.current, game.sombrero && (!game.tunnel || game.tunnel.state === tunnel.State.Closing || game.tunnel.state === tunnel.State.Opening));

    tunnel.renderFade(game);
};

export const centerScreen = () => {
    context.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
};

export const scaleWorld = () => {
    context.scale(PIXELS_PER_METER, PIXELS_PER_METER);
};

export const centerPlayer = (game: Game) => {
    context.translate(
        -game.player.current.position.x - PLAYER_WIDTH / 2,
        -game.player.current.position.y - PLAYER_HEIGHT / 2
    );
};

export const renderText = (game: Game) => {
    context.fillStyle = 'white';
    context.textAlign = 'left';
    context.fillText(`SCORE: ${game.score}`, 5, 5);
    context.fillText(`TIME: ${Math.floor(game.time)}`, 5, 15);
    context.textAlign = 'right';
    context.fillText(game.level.id === tutorial.LEVEL_ID ? 'TUTORIAL' : `WORLD #${game.level.id}`, 315, 5);
};

export const render = (game: Game) => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    centerScreen();
    scaleWorld();
    centerPlayer(game);
    renderWorld(game);
    context.restore();
    renderText(game);
};

const distance2 = (p1: state.Vector2D, p2: state.Vector2D) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    return dx * dx + dy * dy;
};

const reachedGoal = (game: Game) =>
    distance2(game.player.current.position, game.level.goal) < PLAYER_HEIGHT * PLAYER_HEIGHT;

const checkItemsCollection = (game: Game) => {
    const items = game.level.items;
    const playerPosition = game.player.current.position;
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

        sound.play('collect');
        game.collectedItems[i] = true;
        game.score += item.score;
        if (item.sprite === 'sombrero') {
            game.sombrero = true;
        }
    }
};

const lockedKeys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false,
};

export const step = (game: Game, steps: number) => {
    for (let i = 0; i < steps; i++) {
        checkItemsCollection(game);
        tunnel.step(game);
        player.update(game.playerLocked ? lockedKeys : getKeys(), game.player.current, game.player.next);
        collision.playerGroundCollision(game.level.map, game.player.next);
        if (game.status !== Status.Lost && collision.playerSpikeCollision(game.level.map, game.player.next)) {
            game.status = Status.Lost;
            sound.play('lose');
        }

        if (game.player.current.speed.y >= 0 && game.player.next.speed.y < 0) {
            sound.play('jump');
        }

        let temp = game.player.next;
        game.player.next = game.player.current;
        game.player.current = temp;

        if (game.status !== Status.Won && reachedGoal(game)) {
            game.status = Status.Won;
            sound.play('win');
        }
    }

    game.time += steps / STEPS_PER_SECOND;
};

export const createAnimationFrame = (game: Game, stepFunction: typeof step, renderFunction: typeof render) => {
    let stepsSinceBeginning = 0;

    return (timestamp: number) => {
        if (game.status === Status.Playing) {
            const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
            stepFunction(game, Math.min(STEPS_PER_SECOND, currentStep - stepsSinceBeginning));
            stepsSinceBeginning = currentStep;
        }
        renderFunction(game);
    };
};

export const loopFactory = (game: Game, animationFrame: ReturnType<typeof createAnimationFrame>, renderFunction: typeof render) => {
    let previousEscape = false;
    const loop = (timestamp: number) => {
        animationFrame(timestamp);
        if (previousEscape && !getKeys().Escape) {
            const render = () => renderFunction(game);
            transitions.fade({ render, from: 0, to: 0.5, time: 500 })
                .then(() => pause.start({ pausedGame: game, gameLoop: loop, renderGame: () => renderFunction(game) }));
        } else if (game.status === Status.Playing) {
            window.requestAnimationFrame(loop);
        } else {
            document.body.classList.remove('is-playing');
            const render = () => renderFunction(game);
            transitions.fade({ render, from: 0, to: 0.5, time: 2000 })
                .then(() => after.start({ lastGame: game, renderGame: render }));
        }
        previousEscape = getKeys().Escape;
    };

    return loop;
};

export const enum Status {
    Playing,
    Won,
    Lost
}

export interface Game {
    readonly player: state.PlayerStates;
    readonly level: level.Level;
    readonly renderedMap: HTMLCanvasElement;
    readonly collectedItems: Array<boolean>;
    score: number;
    status: Status;
    tunnel: tunnel.Tunnel;
    playerLocked: boolean;
    sombrero: boolean;
    time: number;
}

export const create = (level: level.Level): Game => {
    const current = state.createPlayer();
    current.position = deepCopy(level.player);

    return {
        player: {
            current,
            next: deepCopy(current)
        },
        level,
        renderedMap: map.render(level.map, deepCopy(level.randomizer)),
        collectedItems: level.items.map(() => false),
        score: 0,
        status: Status.Playing,
        tunnel: null,
        playerLocked: false,
        sombrero: false,
        time: 0,
    };
};

export const start = async (game: Game, stepFunction = step, renderFunction = render) => {
    document.body.classList.add('is-playing');
    const animationFrame = createAnimationFrame(game, stepFunction, renderFunction);
    const loop = loopFactory(game, animationFrame, renderFunction);
    await transitions.fade({ render: animationFrame, from: 1, to: 0, time: 2000 }).then(loop);
};

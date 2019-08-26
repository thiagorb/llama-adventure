import {
    METERS_PER_PIXEL,
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
import * as sprites from './sprites';
import * as sound from './sound';
import * as transitions from './transitions';
import * as home from './home';
import { deepCopy } from './utils';

const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;

const render = (game: Game) => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    context.clearRect(0, 0, canvas.width, canvas.height);

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

    for (let item of game.items) {
        if (!item.collected) {
            sprites.draw(context, item.sprite, item.position.x, item.position.y, item.width, item.height);
        }
    }

    player.render(context, game.states.current);

    context.fillStyle = 'yellow';
    context.fillRect(game.states.current.goal.position.x, game.states.current.goal.position.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    context.restore();

    context.font = '10px sans-serif';
    context.fillStyle = 'white';
    context.fillText(`SCORE: ${game.score}`, 5, 10);

    if (process.env.NODE_ENV !== 'production') {
        context.fillText(game.sps.toString(), 5, 20);
        context.fillText(game.fps.toString(), 5, 30);
    }
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

    for (let i = minStartIndex; i >= 0 && items[i].position.x >= minX; i--) {
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

const step = (game: Game, steps: number) => {
    for (let i = 0; i < steps; i++) {
        game.stepCount++;
        if (!game.finished) {
            checkItemsCollection(game);
            physics.step(game.levelMap, game.states);
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
    const loop = (timestamp: number) => {
        const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
        step(game, currentStep - game.stepsSinceBeginning);
        game.stepsSinceBeginning = currentStep;
        render(game);
        game.frameCount++;
        if (!game.finished) {
            window.requestAnimationFrame(loop);
        }
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

export interface Item extends state.Object {
    sprite: sprites.Sprite;
    collected: boolean;
    width: number;
    height: number;
    score: number;
}

export interface Game {
    states: state.States;
    stepsSinceBeginning: number;
    stepCount: number;
    frameCount: number;
    fps: number;
    sps: number;
    score: number;
    levelMap: map.Map;
    region: Array<map.Cell>
    renderedMap: CanvasImageSource;
    secondInterval: number;
    finished: boolean;
    items: Array<Item>;
}

const randomizePositions = (region: Array<map.Cell>, playerPosition: state.Vector2D, goalPosition: state.Vector2D) => {
    const cols = region.map(r => r.col).sort();
    const medianCol = cols[Math.ceil(cols.length / 2)];
    const leftRegion = region.filter(({ col }) => col < medianCol);
    const rightRegion = region.filter(({ col }) => col >= medianCol);
    const playerLeft = Math.random() < 0.5;
    const playerRegion = playerLeft ? leftRegion : rightRegion;
    const goalRegion = playerLeft ? rightRegion: leftRegion;

    let best = null;
    for (let attempt = 0; attempt < 10; attempt++) {
        const player = playerRegion[Math.floor(Math.random() * playerRegion.length)];
        const goal = goalRegion[Math.floor(Math.random() * goalRegion.length)];
        const dy = player.row - goal.row;
        const dx = player.col - goal.col;
        const distance2 = dy * dy + dx * dx;
        console.log(Math.sqrt(distance2));
        if (best === null || distance2 > best.distance2) {
            best = { player, goal, distance2 };
        }
    }

    playerPosition.x = best.player.col * TILE_SIZE;
    playerPosition.y = best.player.row * TILE_SIZE;
    goalPosition.x = best.goal.col * TILE_SIZE;
    goalPosition.y = best.goal.row * TILE_SIZE;
};

const randomizeItems = (region: Array<map.Cell>): Array<Item> => {
    const items: Array<Item> = [];
    const ITEMS_COUNT = 50;
    const step = region.length / ITEMS_COUNT;
    const itemsPrototypes: Array<{ sprite: sprites.SpriteCode, score: number }>  = [
        {
            sprite: 'corn',
            score: 10,
        },
        {
            sprite: 'pepper',
            score: 20,
        },
        {
            sprite: 'cactus',
            score: 50,
        },
    ];

    for (let i = 0; i < ITEMS_COUNT; i++) {
        const cell = region[Math.floor(i * step)];
        const itemType = itemsPrototypes[i % 3];
        const sprite = sprites.get(itemType.sprite);
        items.push({
            position: {
                x: cell.col * TILE_SIZE,
                y: cell.row * TILE_SIZE
            },
            score: itemType.score,
            sprite,
            collected: false,
            width: sprite.width * METERS_PER_PIXEL,
            height: sprite.height * METERS_PER_PIXEL,
        });
    }
    return items.sort((a, b) => a.position.x - b.position.x);
};

export const create = async (): Promise<Game> => {
    const states: state.States = {
        current: state.create(),
        next: null,
    };

    console.log(new Date(), 'before map create');
    const levelMap = map.create(map.randomTiles());
    console.log(new Date(), 'before map render');
    const renderedMap = map.render(levelMap);
    console.log(new Date(), 'before find biggest');
    const region = await simulation.findBiggestRegion(levelMap);
    console.log(new Date(), 'before randomize positions');
    randomizePositions(region, states.current.player.position, states.current.goal.position);
    const items: Array<Item> = randomizeItems(region);
    states.next = deepCopy(states.current);

    return {
        states,
        stepsSinceBeginning: 0,
        stepCount: 0,
        frameCount: 0,
        fps: 0,
        sps: 0,
        score: 0,
        levelMap,
        region,
        renderedMap,
        secondInterval: null,
        finished: false,
        items,
    };
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

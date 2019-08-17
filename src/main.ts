import { keys } from "./keys";
import * as map from './map';
import { drawSprite, loadSprite } from "./sprites";
import {
    METERS_PER_PIXEL,
    METERS_PER_SECOND,
    METERS_PER_SECOND_PER_SECOND,
    PIXELS_PER_METER,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    STEPS_PER_SECOND,
    TILE_SIZE
} from './consts';
import { getCellValue } from "./map";
import * as matrix from "./matrix";


const randomizeValue = (e, c) => Math.max(0, Math.min(255, e + Math.random() * c));
const randomizeColor = ({ r, g, b }, c) => ({
    r: randomizeValue(r, c),
    g: randomizeValue(g, c),
    b: randomizeValue(b, c),
});
const brightness = ({ r, g, b }, c) => ({ r: r * c, g: g * c, b: b * c });
const formatColor = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

const complexRender = (mapCanvas, context) => {
    for (let x = 0; x < mapCanvas.width; x++) {
        let depth = 10;
        for (let y = 0; y < mapCanvas.height; y++) {
            if (map.isSolidPosition(levelMap, x / PIXELS_PER_METER, y / PIXELS_PER_METER)) {
                if (depth > 3 + Math.random() + Math.cos(x / 2)) {
                    context.fillStyle = formatColor(
                        randomizeColor(brightness({ r: 120, g: 69, b: 20 }, 1 - 0.05 * Math.cos(x / 10) * Math.sin(x / 20 + y / 10)), 10)
                    );
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }, 15));
                }
                depth++;
            } else {
                depth = 0;
                context.fillStyle = '#69d';
            }
            context.fillRect(x, y, 1, 1);
        }
    }
};

const simpleRender = (mapCanvas, context) => {
    context.scale(TILE_SIZE * PIXELS_PER_METER, TILE_SIZE * PIXELS_PER_METER);
    for (let col = 0; col < map.getCols(levelMap); col++) {
        let depth = 2;
        for (let row = 0; row < map.getRows(levelMap); row++) {
            if (map.isSolidCell(levelMap, row, col)) {
                if (depth > 0) {
                    context.fillStyle = formatColor(
                        randomizeColor({ r: 120, g: 69, b: 20 }, 10)
                    );
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }, 15));
                }
                depth++;
            } else {
                depth = 0;
                context.fillStyle = '#69d';
            }
            context.fillRect(col, row, 1, 1);
        }
    }
};

const renderMap = () => {
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = map.getTileSize(levelMap) * map.getCols(levelMap) * PIXELS_PER_METER;
    mapCanvas.height = map.getTileSize(levelMap) * map.getRows(levelMap) * PIXELS_PER_METER;
    const context = mapCanvas.getContext('2d');
    simpleRender(mapCanvas, context);
    return mapCanvas;
};

const offscreen = document.createElement('canvas');
offscreen.width = 320;
offscreen.height = 240;
const canvas = document.getElementsByTagName('canvas')[0];


let levelMap: map.Map;
let renderedMap;

const makeState = () => ({
    player: {
        position: {
            x: 0,
            y: 0,
        },
        speed: {
            x: 0,
            y: 0,
        },
        left: true,
        jumping: 0,
    },
    goal: {
        position: {
            x: 0,
            y: 0,
        },
    }
});

const states = {
    current: makeState(),
    next: null,
};

const renderPlayer = (context: CanvasRenderingContext2D) => {
    context.save();
    context.translate(states.current.player.position.x, states.current.player.position.y);
    if (states.current.player.left) {
        context.translate(PLAYER_WIDTH, 0);
        context.scale(-1, 1);
    }

    drawSprite(
        context,
        playerSprite,
        0,
        0,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        stepsSinceBeginning * 4 / STEPS_PER_SECOND
    );
    context.restore();
};

const render = () => {
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    context.scale(PIXELS_PER_METER, PIXELS_PER_METER);
    context.translate(
        -states.current.player.position.x - PLAYER_WIDTH / 2,
        -states.current.player.position.y - PLAYER_HEIGHT / 2
    );

    context.save();
    context.scale(1 / PIXELS_PER_METER, 1 / PIXELS_PER_METER);
    context.drawImage(renderedMap, 0, 0);
    context.restore();

    renderPlayer(context);

    context.fillStyle = 'yellow';
    context.fillRect(states.current.goal.position.x, states.current.goal.position.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    context.restore();

    context.font = '10px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(sps.toString(), 5, 10);
    context.fillText(fps.toString(), 5, 20);
    context.fillText(states.current.player.position.x.toFixed(), 5, 30);
    context.fillText(states.current.player.position.y.toFixed(), 30, 30);
    context.fillText(states.current.goal.position.x.toFixed(), 5, 40);
    context.fillText(states.current.goal.position.y.toFixed(), 30, 40);
};

let playerSprite = null;

const playerStep = () => {
    const MAX_HORIZONTAL_SPEED = 6 * METERS_PER_SECOND;
    const HORIZONTAL_ACCELERATION = 20 * METERS_PER_SECOND_PER_SECOND;
    const JUMP_POWER = 7 * METERS_PER_SECOND;
    const GRAVITY = 20 * METERS_PER_SECOND_PER_SECOND;
    const TERMINAL_VELOCITY = 8 * METERS_PER_SECOND;

    const current = states.current.player;
    const next = states.next.player;

    next.position.x = current.position.x + current.speed.x;
    next.position.y = current.position.y + current.speed.y;

    if (keys.ArrowLeft) {
        next.speed.x = Math.max(current.speed.x - HORIZONTAL_ACCELERATION, -MAX_HORIZONTAL_SPEED);
        next.left = true;
    } else if (keys.ArrowRight) {
        next.speed.x = Math.min(current.speed.x + HORIZONTAL_ACCELERATION, MAX_HORIZONTAL_SPEED);
        next.left = false;
    } else if (current.speed.x < 0) {
        next.speed.x = Math.min(0, current.speed.x + HORIZONTAL_ACCELERATION);
    } else {
        next.speed.x = Math.max(0, current.speed.x - HORIZONTAL_ACCELERATION);
    }

    const top = next.position.y;
    const left = next.position.x;
    const right = left + PLAYER_WIDTH - METERS_PER_PIXEL;
    const bottom = top + PLAYER_HEIGHT - METERS_PER_PIXEL;
    const nextTop = top + next.speed.y;
    const nextLeft = left + next.speed.x;
    const nextRight = nextLeft + PLAYER_WIDTH;
    const nextBottom = nextTop + PLAYER_HEIGHT;

    if (!keys.ArrowUp) {
        next.jumping = 0;
    } else {
        if (next.jumping > 0.2 * STEPS_PER_SECOND) {
            next.speed.y = -JUMP_POWER;
        }
    }

    if (next.jumping) {
        next.jumping--;
    }

    if (map.collidesWithHorizontalSegment(levelMap, nextBottom, left, right)) {
        if (keys.ArrowUp) {
            next.jumping = STEPS_PER_SECOND * 0.7;
            next.speed.y = -JUMP_POWER;
        } else {
            next.speed.y = 0;
        }
    } else {
        const longJump = STEPS_PER_SECOND * next.jumping;
        next.speed.y += GRAVITY / (Math.max(1, longJump * longJump * longJump));
        if (next.speed.y > TERMINAL_VELOCITY) {
            next.speed.y = TERMINAL_VELOCITY;
        }
    }

    if (next.speed.y < 0 && map.collidesWithHorizontalSegment(levelMap, nextTop, left, right)) {
        next.speed.y = 0;
        next.jumping = 0;
    }

    if (next.speed.x > 0 && map.collidesWithVerticalSegment(levelMap, nextRight, top, bottom)) {
        next.speed.x = 0;
    }

    if (next.speed.x < 0 && map.collidesWithVerticalSegment(levelMap, nextLeft, top, bottom)) {
        next.speed.x = 0;
    }
};

const step = (steps: number) => {
    for (let i = 0; i < steps; i++) {
        stepCount++;
        playerStep();
        let temp = states.next;
        states.current = states.next;
        states.next = temp;
    }
};

let stepCount = 0;
let frameCount = 0;
let fps = 0;
let sps = 0;
let stepsSinceBeginning = 0;
const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;
const loop = (timestamp) => {
    const currentStep = Math.floor(timestamp / MILLISECONDS_PER_STEP);
    step(currentStep - stepsSinceBeginning);
    stepsSinceBeginning = currentStep;
    render();
    frameCount++;
    window.requestAnimationFrame(loop);
};

setInterval(() => {
    fps = frameCount;
    sps = stepCount;
    stepCount = 0;
    frameCount = 0;
}, 1000);

const findPosition = (regions: map.RegionsMap) => {
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

const deepCopy = obj => {
    if (obj.constructor !== Object) {
        return obj;
    }

    const copy = {};
    Object.keys(obj).forEach(k => copy[k] = deepCopy(obj[k]));
    return copy;
};

(async () => {
    playerSprite = await loadSprite('llama');
    levelMap = map.create(map.randomTiles(), TILE_SIZE);
    renderedMap = renderMap();
    const regions = map.calculateRegions(levelMap);
    states.current.player.position = findPosition(regions);
    states.current.goal.position = findPosition(regions);
    states.next = deepCopy(states.current);
    loop(0);
})();

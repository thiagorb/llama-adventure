import { keys } from "./keys";
import {
    collidesWithHorizontalSegment,
    collidesWithVerticalSegment,
    createMap,
    createRandom, getCellValue, getPositionValue
} from './map';
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

const renderMap = () => {
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = map.tileSize * map.cols * PIXELS_PER_METER;
    mapCanvas.height = map.tileSize * map.rows * PIXELS_PER_METER;
    const context = mapCanvas.getContext('2d');

    const randomizeValue = e => Math.max(0, Math.min(255, e + Math.random() * 15));
    const randomizeColor = ({ r, g, b }) => ({
        r: randomizeValue(r),
        g: randomizeValue(g),
        b: randomizeValue(b),
    });
    const formatColor = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

    for (let x = 0; x < mapCanvas.width; x++) {
        let depth = 10;
        for (let y = 0; y < mapCanvas.height; y++) {
            if (getPositionValue(map, x / PIXELS_PER_METER, y / PIXELS_PER_METER)) {
                if (depth > 2 + Math.random() + Math.cos(x / 2)) {
                    context.fillStyle = formatColor(randomizeColor({ r: 120, g: 69, b: 20 }));
                } else {
                    context.fillStyle = formatColor(randomizeColor({ r: 51, g: 137, b: 49 }));
                }
                depth++;
            } else {
                depth = 0;
                context.fillStyle = '#69d';
            }
            context.fillRect(x, y, 2, 2);
        }
    }

    map.rendered = mapCanvas;
    return mapCanvas;
};

const offscreen = document.createElement('canvas');
offscreen.width = 320;
offscreen.height = 240;
const canvas = document.getElementsByTagName('canvas')[0];


let map;
let renderedMap;

const makeState = () => ({
    player: {
        position: {
            x: 10,
            y: 10,
        },
        speed: {
            x: 0,
            y: 0,
        },
        left: true,
        jumping: 0,
    },
});

const states = {
    current: makeState(),
    next: makeState(),
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

    context.restore();

    context.font = '20px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(sps.toString(), 20, 80);
    context.fillText(fps.toString(), 20, 100);
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

    if (collidesWithHorizontalSegment(map, nextBottom, left, right)) {
        if (keys.ArrowUp) {
            next.jumping = STEPS_PER_SECOND / 2;
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

    if (next.speed.y < 0 && collidesWithHorizontalSegment(map, nextTop, left, right)) {
        next.speed.y = 0;
        next.jumping = 0;
    }

    if (next.speed.x > 0 && collidesWithVerticalSegment(map, nextRight, top, bottom)) {
        next.speed.x = 0;
    }

    if (next.speed.x < 0 && collidesWithVerticalSegment(map, nextLeft, top, bottom)) {
        next.speed.x = 0;
    }
};

const step = (steps: number) => {
    for (let i = 0; i < steps; i++) {
        stepCount++;
        let temp = states.next;
        states.current = states.next;
        states.next = temp;
        playerStep();
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

(async () => {
    playerSprite = await loadSprite('llama');
    map = createMap(createRandom(), TILE_SIZE);
    renderedMap = renderMap();
    loop(0);
})();

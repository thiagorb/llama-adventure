import { keys } from "./keys";
import { createMap, getRendered, collidesWithHorizontalSegment, collidesWithVerticalSegment } from './map';
import {drawSprite, loadSprite} from "./sprites";

const offscreen = document.createElement('canvas');
offscreen.width = 320;
offscreen.height = 240;
const canvas = document.getElementsByTagName('canvas')[0];

const METERS = 12;
const STEPS_PER_SECOND = 120;
const METERS_PER_SECOND = METERS / STEPS_PER_SECOND;
const METERS_PER_SECOND_PER_SECOND = METERS_PER_SECOND / STEPS_PER_SECOND;
const TILE_SIZE = 2 * METERS;
const PLAYER_WIDTH = METERS;
const PLAYER_HEIGHT = 1.5 * METERS;

const map = createMap(
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    TILE_SIZE
);

const makeState = () => ({
    player: {
        position: {
            x: 100,
            y: 100,
        },
        speed: {
            x: 0,
            y: 0,
        },
        left: true,
    },
});

const states = {
    current: makeState(),
    next: makeState(),
};

const render = () => {
    const context = canvas.getContext('2d');
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(getRendered(map), 0, 0);

    context.save();
    context.translate(states.current.player.position.x, states.current.player.position.y);
    if (states.current.player.left) {
        context.translate(playerSprite.width, 0);
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

    context.font = '20px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(sps.toString(), 20, 80);
    context.fillText(fps.toString(), 20, 100);
};

let playerSprite = null;

const playerStep = () => {
    const MAX_HORIZONTAL_SPEED = 3 * METERS_PER_SECOND;
    const HORIZONTAL_ACCELERATION = 6 * METERS_PER_SECOND_PER_SECOND;
    const JUMP_POWER = 8 * METERS_PER_SECOND;
    const GRAVITY = 7 * METERS_PER_SECOND_PER_SECOND;
    const TERMINAL_VELOCITY = 10 * METERS_PER_SECOND;

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
    const right = left + playerSprite.width - 1;
    const bottom = top + playerSprite.height - 1;
    const nextTop = top + next.speed.y;
    const nextLeft = left + next.speed.x;
    const nextRight = nextLeft + playerSprite.width;
    const nextBottom = nextTop + playerSprite.height;

    if (collidesWithHorizontalSegment(map, nextBottom, left, right)) {
        if (keys.ArrowUp) {
            next.speed.y = -JUMP_POWER;
        } else {
            next.speed.y = 0;
        }
    } else {
        next.speed.y += GRAVITY;
        if (next.speed.y > TERMINAL_VELOCITY) {
            next.speed.y = TERMINAL_VELOCITY;
        }
    }

    if (next.speed.x > 0 && collidesWithVerticalSegment(map, nextRight, top, bottom)) {
        next.speed.x = 0;
    }

    if (next.speed.x < 0 && collidesWithVerticalSegment(map, nextLeft, top, bottom)) {
        next.speed.x = 0;
    }

    if (next.speed.y < 0 && collidesWithHorizontalSegment(map, nextTop, left, right)) {
        next.speed.y = 0;
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
    loop(0);
})();

import { keys } from "./keys";
import { createMap, getRendered, collidesWithHorizontalSegment, collidesWithVerticalSegment } from './map';

const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d');
let running = true;

const map = createMap([
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
]);

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
    },
});

const states = {
    current: makeState(),
    next: makeState(),
};

const render = () => {
    context.clearRect(0, 0, 800, 600);
    context.drawImage(getRendered(map), 0, 0);

    context.fillStyle = 'red';
    context.fillRect(states.current.player.position.x, states.current.player.position.y, 20, 20);

    context.font = '100px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(stepCount.toString(), 20, 80);
    stepCount = 0;
};

const STEPS_PER_SECOND = 360;

const playerStep = () => {
    const current = states.current.player;
    const next = states.next.player;

    next.position.x = current.position.x + current.speed.x;
    next.position.y = current.position.y + current.speed.y;

    const MAX_HORIZONTAL_SPEED = 300 / STEPS_PER_SECOND;
    const HORIZONTAL_ACCELERATION = 1200 / STEPS_PER_SECOND / STEPS_PER_SECOND;
    if (keys.ArrowLeft) {
        next.speed.x = Math.max(current.speed.x - HORIZONTAL_ACCELERATION, -MAX_HORIZONTAL_SPEED);
    } else if (keys.ArrowRight) {
        next.speed.x = Math.min(current.speed.x + HORIZONTAL_ACCELERATION, MAX_HORIZONTAL_SPEED);
    } else if (current.speed.x < 0) {
        next.speed.x = Math.min(0, current.speed.x + HORIZONTAL_ACCELERATION);
    } else {
        next.speed.x = Math.max(0, current.speed.x - HORIZONTAL_ACCELERATION);
    }

    /*
    const playerLeftTile1 = Math.floor((next.position.x - 1) / TILE_SIZE);
    const playerLeftTile2 = Math.floor((next.position.x + 1) / TILE_SIZE);
    const playerRightTile1 = Math.floor((next.position.x + 19) / TILE_SIZE);
    const playerRightTile2 = Math.floor((next.position.x + 23) / TILE_SIZE);
    const playerTopTile1 = Math.floor((next.position.y - 1) / TILE_SIZE);
    const playerTopTile2 = Math.floor(next.position.y / TILE_SIZE);
    const playerBottomTile1 = Math.floor((next.position.y + 19) / TILE_SIZE);
    const playerBottomTile2 = Math.floor((next.position.y + 23) / TILE_SIZE);
    */
    const top = next.position.y;
    const left = next.position.x;
    const right = left + 19;
    const bottom = top + 19;
    const nextTop = next.position.y + next.speed.y;
    const nextLeft = next.position.x + next.speed.x;
    const nextRight = nextLeft + 20;
    const nextBottom = nextTop + 20;

    if (collidesWithHorizontalSegment(map, nextBottom, left, right)) {
        if (keys.ArrowUp) {
            const JUMP_POWER = 700 / STEPS_PER_SECOND;
            next.speed.y = -JUMP_POWER;
        } else {
            next.speed.y = 0;
        }
    } else {
        const GRAVITY = 2000 / STEPS_PER_SECOND / STEPS_PER_SECOND;
        const MAX_SPEED = 500 / STEPS_PER_SECOND;
        next.speed.y += GRAVITY;
        if (next.speed.y > MAX_SPEED) {
            next.speed.y = MAX_SPEED;
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
let stepsSinceBeginning = 0;
const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;
const loop = (timestamp) => {
    const currentStep = timestamp / MILLISECONDS_PER_STEP;
    step(currentStep - stepsSinceBeginning);
    stepsSinceBeginning = currentStep;
    render();
    window.requestAnimationFrame(loop);
};

loop(0);
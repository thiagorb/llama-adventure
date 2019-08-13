import { keys } from "./keys";

const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d');
const TILE_SIZE = 48;
let running = true;

const map = [
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
].map(row => new Int8Array(row));

const renderedMap = (() => {
    // buffer canvas
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = TILE_SIZE * map[0].length;
    mapCanvas.height = TILE_SIZE * map.length;
    const context = mapCanvas.getContext('2d');

    context.fillStyle = 'black';
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j]) {
                context.fillRect(j * TILE_SIZE, i * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    return mapCanvas;
})();

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
    context.drawImage(renderedMap, 0, 0);

    context.fillStyle = 'red';
    context.fillRect(states.current.player.position.x, states.current.player.position.y, 20, 20);

    context.font = '100px sans-serif';
    context.fillStyle = 'blue';
    context.fillText(stepCount.toString(), 20, 80);
    stepCount = 0;
};

const STEPS_PER_SECOND = 240;

const playerStep = () => {
    const current = states.current.player;
    const next = states.next.player;

    next.position.x = current.position.x + current.speed.x;
    next.position.y = current.position.y + current.speed.y;

    const HORIZONTAL_SPEED = 300;
    if (keys.ArrowLeft) {
        next.speed.x = -HORIZONTAL_SPEED / STEPS_PER_SECOND;
    } else if (keys.ArrowRight) {
        next.speed.x = HORIZONTAL_SPEED / STEPS_PER_SECOND;
    } else {
        next.speed.x = 0;
    }

    const playerLeftTile1 = Math.floor((next.position.x - 1) / TILE_SIZE);
    const playerLeftTile2 = Math.floor((next.position.x + 1) / TILE_SIZE);
    const playerRightTile1 = Math.floor((next.position.x + 19) / TILE_SIZE);
    const playerRightTile2 = Math.floor((next.position.x + 23) / TILE_SIZE);
    const playerTopTile1 = Math.floor((next.position.y - 1) / TILE_SIZE);
    const playerTopTile2 = Math.floor(next.position.y / TILE_SIZE);
    const playerBottomTile1 = Math.floor((next.position.y + 19) / TILE_SIZE);
    const playerBottomTile2 = Math.floor((next.position.y + 23) / TILE_SIZE);
    let touchingGround = false;

    for (let i = playerLeftTile2; i <= playerRightTile1; i++) {
        if (map[playerBottomTile2][i]) {
            touchingGround = true;
            next.position.y = next.position.y | 0;
            break;
        }
    }

    if (touchingGround) {
        if (keys.ArrowUp) {
            const JUMP_POWER = 700;
            next.speed.y = -JUMP_POWER / STEPS_PER_SECOND;
        } else {
            next.speed.y = 0;
        }
    } else {
        const GRAVITY = 2000;
        const MAX_SPEED = 500 / STEPS_PER_SECOND;
        next.speed.y += GRAVITY / STEPS_PER_SECOND / STEPS_PER_SECOND;
        if (next.speed.y > MAX_SPEED) {
            next.speed.y = MAX_SPEED;
        }
    }

    if (next.speed.x > 0) {
        for (let i = playerTopTile2; i <= playerBottomTile1; i++) {
            if (map[i][playerRightTile2]) {
                next.speed.x = 0;
                break;
            }
        }
    }

    if (next.speed.x < 0) {
        for (let i = playerTopTile2; i <= playerBottomTile1; i++) {
            if (map[i][playerLeftTile1]) {
                next.speed.x = 0;
                break;
            }
        }
    }

    if (next.speed.y < 0) {
        for (let i = playerLeftTile2; i <= playerRightTile1; i++) {
            if (map[playerTopTile1][i]) {
                next.speed.y = 0;
                break;
            }
        }
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
let previous = null;
const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;
const loop = (timestamp) => {
    const steps = Math.max(timestamp ? (timestamp - previous) / MILLISECONDS_PER_STEP : 1, 1);
    step(steps);
    previous = timestamp;
    render();
    window.requestAnimationFrame(loop);
};

loop(previous);
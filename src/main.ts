import * as map from './map';
import {
    PIXELS_PER_METER,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    STEPS_PER_SECOND,
    TILE_SIZE
} from './consts';
import * as matrix from "./matrix";
import * as physics from "./physics";
import * as player from "./player";
import * as state from "./state";

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

const canvas = document.getElementsByTagName('canvas')[0];

let levelMap: map.Map;
let renderedMap: CanvasImageSource;

const states: state.States = {
    current: state.create(),
    next: null,
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

    player.render(context, states.current);

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

const step = (steps: number) => {
    for (let i = 0; i < steps; i++) {
        stepCount++;
        physics.step(levelMap, states);
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
    await player.init();
    levelMap = map.create(map.randomTiles(), TILE_SIZE);
    renderedMap = renderMap();
    const regions = map.calculateRegions(levelMap);
    states.current.player.position = findPosition(regions);
    states.current.goal.position = findPosition(regions);
    states.next = deepCopy(states.current);
    loop(0);
})();

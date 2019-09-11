import { cachedInstance } from './utils';

export interface Sprite {
    readonly width: number;
    readonly height: number;
    readonly frames: number;
    readonly position: number;
}

const sprites = {
    llama: {
        width: 12,
        height: 18,
        frames: 3,
        position: 0,
    },
    corn: {
        width: 9,
        height: 20,
        frames: 1,
        position: 4,
    },
    pepper: {
        width: 9,
        height: 20,
        frames: 1,
        position: 7,
    },
    cactus: {
        width: 14,
        height: 24,
        frames: 1,
        position: 3,
    },
    house: {
        width: 20,
        height: 19,
        frames: 1,
        position: 6,
    },
    spikes: {
        width: 10,
        height: 10,
        frames: 1,
        position: 8,
    },
    door: {
        width: 16,
        height: 20,
        frames: 2,
        position: 5,
    }
};

let image: HTMLImageElement = null;

export type SpriteCode = keyof typeof sprites;

export const draw = (context: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, width = sprite.width, height = sprite.height, frame = 0) => {
    context.drawImage(
        image,
        0,
        25 * ((frame | 0) % sprite.frames + sprite.position),
        sprite.width,
        sprite.height,
        x,
        y,
        width,
        height
    );
};

export const get = (code: SpriteCode): Sprite => sprites[code];

export const getFrames = (code: SpriteCode) => sprites[code].frames;

export const initialize = cachedInstance(() => new Promise(resolve => {
    image = new Image();
    image.onload = () => resolve(image);
    image.src = require('../sprites/sprites.png');
}));

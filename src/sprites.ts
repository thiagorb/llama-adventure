import llama from '../sprites/llama.png';
import corn from '../sprites/corn.png';
import pepper from '../sprites/pepper.png';
import cactus from '../sprites/cactus.png';
import house from '../sprites/house.png';
import spikes from '../sprites/spikes.png';
import { cachedInstance } from './utils';

export interface Sprite {
    readonly url: string;
    readonly image: HTMLImageElement;
    readonly width: number;
    readonly height: number;
    readonly frames: number;
}

const sprites = {
    llama: {
        url: llama,
        width: 12,
        height: 18,
        frames: 3,
        image: null,
    },
    corn: {
        url: corn,
        width: 9,
        height: 20,
        frames: 1,
        image: null,
    },
    pepper: {
        url: pepper,
        width: 9,
        height: 20,
        frames: 1,
        image: null,
    },
    cactus: {
        url: cactus,
        width: 14,
        height: 24,
        frames: 1,
        image: null,
    },
    house: {
        url: house,
        width: 20,
        height: 19,
        frames: 1,
        image: null,
    },
    spikes: {
        url: spikes,
        width: 10,
        height: 10,
        frames: 1,
        image: null,
    }
};

export type SpriteCode = keyof typeof sprites;

const load = (code: SpriteCode): Promise<HTMLImageElement> => new Promise(resolve => {
    const sprite = sprites[code];
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = sprite.url;
});

export const draw = (context: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, width = sprite.width, height = sprite.height, frame = 0) => {
    context.drawImage(
        sprite.image,
        0,
        sprite.height * ((frame | 0) % sprite.frames),
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

export const initialize = cachedInstance(async (): Promise<void> => {
    const promises = [];
    for (let code in sprites) {
        promises.push(load(code as SpriteCode).then(s => sprites[code].image = s));
    }
    await Promise.all(promises);
});

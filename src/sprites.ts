import llama from '../sprites/llama.png';
import corn from '../sprites/corn.png';
import pepper from '../sprites/pepper.png';
import cactus from '../sprites/cactus.png';

export interface Sprite {
    image: HTMLImageElement;
    width: number;
    height: number;
    frames: number;
}

const spritesDefinitions = {
    llama: {
        url: llama,
        width: 12,
        height: 18,
        frames: 3
    },
    corn: {
        url: corn,
        width: 9,
        height: 20,
        frames: 1
    },
    pepper: {
        url: pepper,
        width: 9,
        height: 20,
        frames: 1
    },
    cactus: {
        url: cactus,
        width: 14,
        height: 24,
        frames: 1
    }
};

type SpriteCode = keyof typeof spritesDefinitions;

let sprites = {};

const load = (code: SpriteCode): Promise<Sprite> => new Promise(resolve => {
    const sprite = spritesDefinitions[code];
    const image = new Image();
    image.onload = () => resolve({ ...sprite, image });
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

export const getFrames = (code: SpriteCode) => spritesDefinitions[code].frames;

export const initialize = async (): Promise<void> => {
    const promises = [];
    for (let code in spritesDefinitions) {
        promises.push(load(code as SpriteCode).then(s => sprites[code] = s));
    }
    await Promise.all(promises);
};

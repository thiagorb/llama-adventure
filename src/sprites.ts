const sprites = {
    llama: {
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAA2CAYAAADzlHgsAAABx0lEQVRIS2NkIBEwkqieAacGL3Xe/8LczAyLz31gRGZj1QBSsKTRlOH5m08MpZNvMiCz8dqwoFOdgcfQiuHL+WMMCeU3Gbbd/MyI30lcDAy99eoMxU13GN5+/UtYw7r55gypOWcYZq6PYwhxm09Yg5fGP4akSckMTE+vMQQlniROAyjYoyLNGWLqTxOnwdZIjkFWXZIhv+scOIjhng41EvqPHIlfv/5mADkJqwaQ4ilTAxiYmRBa4uJWM6S7STEoiDAxMHD/YZCUZWRIqHvOwAhSPH16AMOXA4cYPv5gZRDi/M2QPvclQjHIDO4/DLIysmBnMU7x5/7PKKjMoPvrD8NlNhaMpGWj8x0sBtKwbPlJSFoC2eKgJwPXhKwZpAFmOtzTIFv0uOXBNsAUw+hQzx8MLP9lwKbnbPyKCCU9FZn/2uy/GSSkxBlePHvBYK3ylWHWVUGGNO33DEfvcDNc/cnGcOnOE1QN6B4AKQAZBBNH0UBsRhrNQMghBSoIRjPQcM1ApvYKDKcPPmCA0bAMhMyH5wfknIWcw4jOcaM10GgNNMxqIJIzkHugEsPO9fcY/CL0GDatuASu00AZCJmPUgOh5zpsdRwAIwQ+5O1dhAgAAAAASUVORK5CYII=',
        width: 12,
        height: 18,
        frames: 3
    }
};

export const loadSprite = (code: keyof typeof sprites): Promise<Sprite> => new Promise(resolve => {
    const sprite = sprites[code];
    const image = new Image();
    image.onload = () => resolve({ ...sprite, image });
    image.src = sprite.url;
});

interface Sprite {
    image: HTMLImageElement;
    width: number;
    height: number;
    frames: number;
}

export const drawSprite = (context: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, width = sprite.width, height = sprite.height, frame = 0) => {
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
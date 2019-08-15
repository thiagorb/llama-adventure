export interface Keys {
    readonly ArrowUp: boolean;
    readonly ArrowRight: boolean;
    readonly ArrowDown: boolean;
    readonly ArrowLeft: boolean;
}

const state = {
    ArrowUp: false,
    ArrowRight: false,
    ArrowDown: false,
    ArrowLeft: false,
};

const keyMap = {
    ArrowUp: 'ArrowUp',
    ArrowLeft: 'ArrowLeft',
    ArrowDown: 'ArrowDown',
    ArrowRight: 'ArrowRight',
    w: 'ArrowUp',
    a: 'ArrowLeft',
    s: 'ArrowDown',
    d: 'ArrowRight',
};

document.addEventListener('keydown', event => {
    if (keyMap[event.key]) {
        state[keyMap[event.key]] = true;
    }
});

document.addEventListener('keyup', event => {
    if (keyMap[event.key]) {
        state[keyMap[event.key]] = false;
    }
});

export const keys: Keys = state;

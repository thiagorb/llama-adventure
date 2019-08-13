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

document.addEventListener('keydown', event => {
    if (event.key in state) {
        state[event.key] = true;
    }
});

document.addEventListener('keyup', event => {
    if (event.key in state) {
        state[event.key] = false;
    }
});

export const keys: Keys = state;
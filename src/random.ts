export interface Randomizer {
    a: number;
    b: number;
    c: number;
    d: number;
}

export const create = (seed: number): Randomizer => ({
    a: seed,
    b: seed,
    c: seed,
    d: seed,
});

export const get = (state: Randomizer)  => {
    state.a >>>= 0;
    state.b >>>= 0;
    state.c >>>= 0;
    state.d >>>= 0;

    let t = (state.a + state.b) | 0;
    state.a = state.b ^ state.b >>> 9;
    state.b = state.c + (state.c << 3) | 0;
    state.c = (state.c << 21 | state.c >>> 11);
    state.d = state.d + 1 | 0;
    t = t + state.d | 0;
    state.c = state.c + t | 0;
    return (t >>> 0) / 4294967296;
};

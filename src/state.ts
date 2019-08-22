export interface Vector2D {
    x: number;
    y: number;
}

export interface Object {
    position: Vector2D;
}

export interface Player extends Object{
    speed: Vector2D;
    left: boolean;
    jumping: number;
    touchingFloor: boolean;
    touchingCeiling: boolean;
    frame: number;
}

export interface State {
    player: Player;
    goal: Object;
}

export interface States {
    current: State;
    next: State;
}

export const createVector = () => ({ x: 0, y: 0 });

export const createPlayer = () => ({
    position: createVector(),
    speed: createVector(),
    left: false,
    jumping: 0,
    touchingFloor: false,
    touchingCeiling: false,
    frame: 0,
});

export const create = (): State => ({
    player: createPlayer(),
    goal: {
        position: createVector(),
    },
});

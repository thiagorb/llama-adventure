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

export const create = (): State => ({
    player: {
        position: {
            x: 0,
            y: 0,
        },
        speed: {
            x: 0,
            y: 0,
        },
        left: true,
        jumping: 0,
        touchingFloor: true,
        touchingCeiling: true,
        frame: 0,
    },
    goal: {
        position: {
            x: 0,
            y: 0,
        },
    },
});

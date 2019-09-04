import * as sprites from './sprites';

export interface Vector2D {
    x: number;
    y: number;
}

export interface Object {
    position: Vector2D;
}

export interface Player extends Object {
    speed: Vector2D;
    left: boolean;
    jumping: number;
    touchingFloor: boolean;
    touchingCeiling: boolean;
    frame: number;
}

export interface PlayerStates {
    current: Player;
    next: Player;
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

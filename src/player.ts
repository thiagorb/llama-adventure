import {
    METERS_PER_SECOND,
    METERS_PER_SECOND_PER_SECOND,
    STEPS_PER_SECOND
} from "./consts";
import { keys } from "./keys";

export const update = (states) => {
    const current = states.current.player;
    const next = states.next.player;

    const MAX_HORIZONTAL_SPEED = 6 * METERS_PER_SECOND;
    const HORIZONTAL_ACCELERATION = 20 * METERS_PER_SECOND_PER_SECOND;
    const JUMP_POWER = 7 * METERS_PER_SECOND;
    const GRAVITY = 20 * METERS_PER_SECOND_PER_SECOND;
    const TERMINAL_VELOCITY = 8 * METERS_PER_SECOND;

    if (keys.ArrowLeft) {
        next.speed.x = Math.max(current.speed.x - HORIZONTAL_ACCELERATION, -MAX_HORIZONTAL_SPEED);
        next.left = true;
    } else if (keys.ArrowRight) {
        next.speed.x = Math.min(current.speed.x + HORIZONTAL_ACCELERATION, MAX_HORIZONTAL_SPEED);
        next.left = false;
    } else if (current.speed.x < 0) {
        next.speed.x = Math.min(0, current.speed.x + HORIZONTAL_ACCELERATION);
    } else {
        next.speed.x = Math.max(0, current.speed.x - HORIZONTAL_ACCELERATION);
    }

    if (current.jumping) {
        next.jumping = keys.ArrowUp ? current.jumping - 1 : 0;
    }

    if (keys.ArrowUp && current.jumping > 0.2 * STEPS_PER_SECOND) {
        next.speed.y = -JUMP_POWER;
    }

    if (current.touchingFloor) {
        if (keys.ArrowUp) {
            next.jumping = STEPS_PER_SECOND * 0.7;
            next.speed.y = -JUMP_POWER;
        }
    } else {
        const longJump = STEPS_PER_SECOND * current.jumping;
        next.speed.y = Math.min(
            TERMINAL_VELOCITY,
            current.speed.y + GRAVITY / (Math.max(1, longJump * longJump * longJump))
        );
    }
};

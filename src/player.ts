import {
    context,
    HORIZONTAL_ACCELERATION,
    METERS_PER_SECOND,
    METERS_PER_SECOND_PER_SECOND,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    STEPS_PER_SECOND
} from './consts';
import * as sprites from './sprites';
import * as state from './state';
import { Keys } from './keys';

export const LONG_JUMP_EFFECT_TIME = STEPS_PER_SECOND * 0.7;

const calculateJumping = (keys: Keys, state: state.Player): number => {
    if (state.touchingCeiling) {
        return 0;
    }

    if (state.touchingFloor && keys.ArrowUp) {
        return LONG_JUMP_EFFECT_TIME;
    }

    if (state.jumping) {
        return keys.ArrowUp ? state.jumping - 1 : 0;
    }

    return 0;
};

export const update = (keys: Keys, current: state.Player, next: state.Player) => {
    const MAX_HORIZONTAL_SPEED = 6 * METERS_PER_SECOND;
    const JUMP_POWER = 7 * METERS_PER_SECOND;
    const GRAVITY = 20 * METERS_PER_SECOND_PER_SECOND;
    const TERMINAL_VELOCITY = 8 * METERS_PER_SECOND;

    next.position.x = current.position.x + current.speed.x;
    next.position.y = current.position.y + current.speed.y;

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

    if (keys.ArrowUp && current.jumping > 0.2 * STEPS_PER_SECOND) {
        next.speed.y = -JUMP_POWER;
    }

    if (current.touchingFloor) {
        if (keys.ArrowUp) {
            next.speed.y = -JUMP_POWER;
        }
    } else {
        const longJump = STEPS_PER_SECOND * current.jumping;
        next.speed.y = Math.min(
            TERMINAL_VELOCITY,
            current.speed.y + GRAVITY / (Math.max(1, longJump * longJump * longJump))
        );
    }

    next.jumping = calculateJumping(keys, current);

    next.frame = (current.frame + 4 / STEPS_PER_SECOND) % sprites.getFrames('llama');
};

export const render = (player: state.Player) => {
    context.save();
    context.translate(player.position.x, player.position.y);
    if (player.left) {
        context.translate(PLAYER_WIDTH, 0);
        context.scale(-1, 1);
    }

    sprites.draw(context, sprites.get('llama'), 0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, player.frame);
    context.restore();
};

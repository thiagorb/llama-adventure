import {
    context,
    DOOR_HEIGHT,
    DOOR_WIDTH,
    METERS_PER_PIXEL,
    PLAYER_HEIGHT,
    PLAYER_WIDTH,
    STEPS_PER_SECOND
} from './consts';
import * as game from './game';
import * as level from './level';

const enum State {
    Opening,
    Entering,
    Leaving,
    Closing,
}
const OPEN_TIME = Math.floor(1 * STEPS_PER_SECOND);
const ENTER_TIME = Math.floor(1 * STEPS_PER_SECOND);

export interface Tunnel {
    door: level.Door,
    state: State,
    transitionTime: number,
}

const create = (door: level.Door) => ({
    door,
    state: State.Opening,
    transitionTime: OPEN_TIME,
});

export const step = (game: game.Game) => {
    const playerPosition = game.player.current.position;
    let playerInDoor: level.Door = null;
    for (let door of game.level.doors) {
        if (door.position.x + DOOR_WIDTH < playerPosition.x + PLAYER_WIDTH) {
            continue;
        }

        if (door.position.x > playerPosition.x) {
            continue;
        }

        if (door.position.y + DOOR_HEIGHT < playerPosition.y + PLAYER_HEIGHT) {
            continue;
        }

        if (door.position.y > playerPosition.y) {
            continue;
        }

        playerInDoor = door;
    }

    if (playerInDoor && (!game.tunnel || playerInDoor !== game.tunnel.door)) {
        game.tunnel = create(playerInDoor);
        return;
    }

    if (!game.tunnel) {
        return;
    }

    game.tunnel.transitionTime = Math.max(0, game.tunnel.transitionTime - 1);

    if (!playerInDoor && game.tunnel.state !== State.Closing) {
        game.tunnel.state = State.Closing;
        game.tunnel.transitionTime = OPEN_TIME - game.tunnel.transitionTime;
    }

    if (game.tunnel.transitionTime === 0) {
        switch (game.tunnel.state) {
            case State.Opening:
                game.tunnel.state = State.Entering;
                game.playerLocked = true;
                game.tunnel.transitionTime = ENTER_TIME;
                break;
            case State.Entering:
                playerPosition.x = game.tunnel.door.other.position.x + (DOOR_WIDTH - PLAYER_WIDTH) / 2;
                playerPosition.y = game.tunnel.door.other.position.y + DOOR_HEIGHT - PLAYER_HEIGHT - METERS_PER_PIXEL;
                game.tunnel.door = game.tunnel.door.other;
                game.tunnel.state = State.Leaving;
                game.tunnel.transitionTime = ENTER_TIME;
                break;
            case State.Leaving:
                game.tunnel.state = State.Closing;
                game.tunnel.transitionTime = OPEN_TIME;
                game.playerLocked = false;
                break;
            case State.Closing:
                game.tunnel = null;
                break;
        }
    }
};

export const render = (game: game.Game) => {
    for (let door of game.level.doors) {
        context.save();
        context.translate(door.position.x, door.position.y);
        context.scale(DOOR_WIDTH, DOOR_HEIGHT);
        let scale = 1;
        if (game.tunnel && game.tunnel.door === door) {
            context.fillStyle = 'black';
            context.fillRect(0, 0, 1, 1);
            const state = game.tunnel.state;
            if (state === State.Entering || state === State.Leaving) {
                scale = -1;
            } else {
                scale = Math.cos(Math.PI * game.tunnel.transitionTime / OPEN_TIME);
                if (state === State.Opening) {
                    scale *= -1;
                }
            }
        }
        context.fillStyle = 'brown';
        context.fillRect(0, 0, scale, 1);
        context.restore();
    }
};

export const renderFade = (game: game.Game) => {
    if (!game.tunnel || game.tunnel.state === State.Opening || game.tunnel.state === State.Closing) {
        return;
    }

    let alpha = game.tunnel.transitionTime / ENTER_TIME;
    if (game.tunnel.state === State.Entering) {
        alpha = 1 - alpha;
    }
    context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    context.fillRect(game.tunnel.door.position.x, game.tunnel.door.position.y, DOOR_WIDTH, DOOR_HEIGHT);
};

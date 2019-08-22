import * as player from './player';
import * as state from './state';
import { playerMapCollision } from './collision';
import { keys } from './keys';

const update = player.update;
const detectCollision = (levelMap, states) => playerMapCollision(levelMap, states.next.player);

export const step = (levelMap, states: state.States) => {
    update(keys, states.current.player, states.next.player);
    detectCollision(levelMap, states);
};

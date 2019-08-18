import * as player from './player';
import { playerMapCollision } from "./collision";

interface Vector2D {
    x: number;
    y: number;
}

type Accessor<T> = (state) => T;

const addTo = (position: Accessor<Vector2D>, speed: Accessor<Vector2D>) => states => {
    position(states.next).x = position(states.current).x + speed(states.current).x;
    position(states.next).y = position(states.current).y + speed(states.current).y;
};

const movePlayer = addTo(state => state.player.position, state => state.player.speed);

const move = movePlayer;
const update = player.update;
const detectCollision = (levelMap, states) => playerMapCollision(levelMap, states.next.player);

export const step = (levelMap, states) => {
    move(states);
    update(states);
    detectCollision(levelMap, states);
};

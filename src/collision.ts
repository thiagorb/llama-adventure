import { METERS_PER_PIXEL, PLAYER_HEIGHT, PLAYER_WIDTH, SPIKE_GAP } from './consts';
import * as map from './map';
import * as state from './state';

export const playerGroundCollision = (levelMap: map.Map, player: state.Player) => {
    const top = player.position.y;
    const left = player.position.x;
    const right = left + PLAYER_WIDTH - METERS_PER_PIXEL;
    const bottom = top + PLAYER_HEIGHT - METERS_PER_PIXEL;
    const nextTop = top + player.speed.y;
    const nextLeft = left + player.speed.x;
    const nextRight = nextLeft + PLAYER_WIDTH;
    const nextBottom = nextTop + PLAYER_HEIGHT;

    player.touchingFloor = map.collidesWithHorizontalSegment(levelMap, nextBottom, left, right);
    player.touchingCeiling = map.collidesWithHorizontalSegment(levelMap, nextTop, left, right);

    if ((player.touchingFloor && player.speed.y > 0) || (player.touchingCeiling && player.speed.y < 0)) {
        player.speed.y = 0;
    }

    if (player.speed.x > 0 && map.collidesWithVerticalSegment(levelMap, nextRight, top, bottom)) {
        player.speed.x = 0;
    }

    if (player.speed.x < 0 && map.collidesWithVerticalSegment(levelMap, nextLeft, top, bottom)) {
        player.speed.x = 0;
    }
};

export const playerSpikeCollision = (levelMap: map.Map, player: state.Player) => {
    return map.collidesWithHorizontalSegment(
        levelMap,
        player.position.y + PLAYER_HEIGHT - SPIKE_GAP,
        player.position.x + SPIKE_GAP,
        player.position.x + PLAYER_WIDTH - 2 * SPIKE_GAP,
        map.TileValue.Spike
    );
};

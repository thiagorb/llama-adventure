import * as map from './map';

export const PIXELS_PER_METER = 12;
export const METERS_PER_PIXEL = 1 / PIXELS_PER_METER;
export const STEPS_PER_SECOND = 120;
export const METERS_PER_SECOND = 1 / STEPS_PER_SECOND;
export const METERS_PER_SECOND_PER_SECOND = METERS_PER_SECOND / STEPS_PER_SECOND;
export const TILE_SIZE = 10 / 12;
export const PLAYER_WIDTH = 1;
export const PLAYER_HEIGHT = 1.5;
export const DOOR_WIDTH = PLAYER_WIDTH * 1.2;
export const DOOR_HEIGHT = TILE_SIZE * 2;
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 240;
export const HORIZONTAL_ACCELERATION = 20 * METERS_PER_SECOND_PER_SECOND;
export const MILLISECONDS_PER_STEP = 1000 / STEPS_PER_SECOND;
export const PLAYER_ROW_HEIGHT = map.getRow(PLAYER_HEIGHT - METERS_PER_PIXEL);
export const PLAYER_COL_WIDTH = map.getCol(PLAYER_WIDTH - METERS_PER_PIXEL);
export const SPIKE_GAP = 2 * METERS_PER_PIXEL;

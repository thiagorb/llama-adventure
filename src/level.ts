import { METERS_PER_PIXEL, TILE_SIZE } from './consts';
import * as map from './map';
import * as matrix from './matrix';
import * as sprites from './sprites';
import * as simulation from './simulation';
import * as state from './state';

export interface Level {
    map: map.Map;
    items: Array<Item>;
    player: state.Vector2D;
    goal: state.Vector2D;
}

export interface Item extends state.Object {
    sprite: sprites.SpriteCode;
    collected: boolean;
    width: number;
    height: number;
    score: number;
}

const randomizePositions = (region: Array<map.Cell>) => {
    const cols = region.map(r => r.col).sort();
    const medianCol = cols[Math.ceil(cols.length / 2)];
    const leftRegion = region.filter(({ col }) => col < medianCol);
    const rightRegion = region.filter(({ col }) => col >= medianCol);
    const playerLeft = Math.random() < 0.5;
    const playerRegion = playerLeft ? leftRegion : rightRegion;
    const goalRegion = playerLeft ? rightRegion: leftRegion;

    let best = null;
    for (let attempt = 0; attempt < 10; attempt++) {
        const player = playerRegion[Math.floor(Math.random() * playerRegion.length)];
        const goal = goalRegion[Math.floor(Math.random() * goalRegion.length)];
        const dy = player.row - goal.row;
        const dx = player.col - goal.col;
        const distance2 = dy * dy + dx * dx;
        console.log(Math.sqrt(distance2));
        if (best === null || distance2 > best.distance2) {
            best = { player, goal, distance2 };
        }
    }

    return {
        player: {
            x: best.player.col * TILE_SIZE,
            y: best.player.row * TILE_SIZE,
        },
        goal: {
            x: best.goal.col * TILE_SIZE,
            y: best.goal.row * TILE_SIZE,
        }
    };
};

const randomizeItems = (region: Array<map.Cell>): Array<Item> => {
    const items: Array<Item> = [];
    const ITEMS_COUNT = 50;
    const step = region.length / ITEMS_COUNT;
    const itemsPrototypes: Array<{ sprite: sprites.SpriteCode, score: number }>  = [
        {
            sprite: 'corn',
            score: 10,
        },
        {
            sprite: 'pepper',
            score: 20,
        },
        {
            sprite: 'cactus',
            score: 50,
        },
    ];

    for (let i = 0; i < ITEMS_COUNT; i++) {
        const cell = region[Math.floor(i * step)];
        const itemType = itemsPrototypes[i % 3];
        const sprite = sprites.get(itemType.sprite);
        items.push({
            position: {
                x: cell.col * TILE_SIZE,
                y: cell.row * TILE_SIZE
            },
            score: itemType.score,
            sprite: itemType.sprite,
            collected: false,
            width: sprite.width * METERS_PER_PIXEL,
            height: sprite.height * METERS_PER_PIXEL,
        });
    }
    return items.sort((a, b) => a.position.x - b.position.x);
};

export const create = async (): Promise<Level> => {
    console.log(new Date(), 'before map create');
    const levelMap = map.create(map.randomTiles());
    console.log(new Date(), 'before find biggest');
    const surfaces = await simulation.findSurfaces(levelMap);
    const regions = map.calculateRegions(levelMap);

    surfaces.forEach((surface, index) => {
        const { row, col } = surface[0];
        console.log(`surface ${index} has ${surface.length} tiles and is in the region ${matrix.get(regions.map, row, col) }`);
    });

    console.log(new Date(), 'before randomize positions');
    const surface = surfaces[surfaces.length - 1];

    return {
        map: levelMap,
        items: randomizeItems(surface),
        ...randomizePositions(surface)
    };
};

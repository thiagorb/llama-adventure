import { METERS_PER_PIXEL, PLAYER_COL_WIDTH, PLAYER_ROW_HEIGHT, TILE_SIZE } from './consts';
import * as map from './map';
import * as matrix from './matrix';
import * as sprites from './sprites';
import * as simulation from './simulation';
import * as state from './state';

export interface Tunnel {
    readonly entrance: state.Vector2D;
    readonly exit: state.Vector2D;
}

export interface Door {
    readonly position: state.Vector2D;
    readonly other: Door;
}

export interface RegionsMap {
    map: matrix.Matrix<Int8Array>;
    biggest: number;
}

type Surface = Array<map.Cell>;

export interface Level {
    readonly map: map.Map;
    readonly items: Array<Item>;
    readonly player: state.Vector2D;
    readonly goal: state.Vector2D;
    readonly surfaces: Array<Surface>;
    readonly regions: RegionsMap;
    readonly doors: Array<Door>;
}

export interface Item extends state.Object {
    readonly sprite: sprites.SpriteCode;
    readonly width: number;
    readonly height: number;
    readonly score: number;
}

const randomCell = (surface: Surface): map.Cell => surface[Math.floor(Math.random() * surface.length)];
const cellPosition = (cell: map.Cell): state.Vector2D => ({
    x: cell.col * TILE_SIZE,
    y: cell.row * TILE_SIZE,
});

const randomizePositions = (surface: Surface): Tunnel => {
    const cols = surface.map(r => r.col).sort();
    const medianCol = cols[Math.ceil(cols.length / 2)];
    const leftSide = surface.filter(({ col }) => col < medianCol);
    const rightSide = surface.filter(({ col }) => col >= medianCol);
    const entranceLeft = Math.random() < 0.5;
    const entranceSide = entranceLeft ? leftSide : rightSide;
    const exitSide = entranceLeft ? rightSide: leftSide;

    let best = null;
    for (let attempt = 0; attempt < 10; attempt++) {
        const entrance = randomCell(entranceSide);
        const exit = randomCell(exitSide);
        const dy = entrance.row - exit.row;
        const dx = entrance.col - exit.col;
        const distance2 = dy * dy + dx * dx;
        if (best === null || distance2 > best.distance2) {
            best = { entrance, exit, distance2 };
        }
    }

    return {
        entrance: cellPosition(best.entrance),
        exit: cellPosition(best.exit),
    };
};

export const createItem = (type: ItemType, x: number, y: number): Item => {
    const itemType = itemsPrototypes[type];
    const sprite = sprites.get(itemType.sprite);

    return {
        position: { x, y },
        score: itemType.score,
        sprite: itemType.sprite,
        width: sprite.width * METERS_PER_PIXEL,
        height: sprite.height * METERS_PER_PIXEL,
    };
};

const itemsPrototypes: Array<{ sprite: sprites.SpriteCode, score: number }> = [
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

export const enum ItemType {
    Corn,
    Pepper,
    Cactus
}

const randomizeItems = (surface: Surface): Array<Item> => {
    const items: Array<Item> = [];

    for (let i = 0; i < surface.length; i += 5) {
        const cell = surface[Math.floor(i)];
        const type = Math.floor(Math.pow(Math.random(), 3) * 3);
        items.push(createItem(type, cell.col * TILE_SIZE, cell.row * TILE_SIZE));
    }
    return items.sort((a, b) => a.position.x - b.position.x);
};

export const calculateRegions = (levelMap: map.Map): RegionsMap => {
    let regions = 0;
    const regionsAreas = {};
    const regionsMap = matrix.create(
        Int8Array,
        map.getRows(levelMap),
        map.getCols(levelMap),
        (row, col) => map.collides(levelMap, row, col) ? -1 : 0
    );

    matrix.iterate(regionsMap, (row, col) => {
        if (matrix.get(regionsMap, row, col)) {
            return;
        }

        regions++;
        const regionId = regions;
        let regionArea = 1;
        const boundary = [{row, col}];
        matrix.set(regionsMap, row, col, regionId);
        while (boundary.length > 0) {
            const current = boundary.pop();
            for (let i of [-1, 0, 1]) {
                for (let j of i ? [0] : [-1, 1]) {
                    const neighborRow = current.row + i;
                    const neighborCol = current.col + j;
                    if (matrix.has(regionsMap, neighborRow, neighborCol) && !matrix.get(regionsMap, neighborRow, neighborCol)) {
                        boundary.push({ row: neighborRow, col: neighborCol });
                        matrix.set(regionsMap, neighborRow, neighborCol, regionId);
                        regionArea++;
                    }
                }
            }
        }
        regionsAreas[regionId] = regionArea;
    });

    return {
        map: regionsMap,
        biggest: parseInt(Object.keys(regionsAreas).sort((a, b) => regionsAreas[b] - regionsAreas[a])[0])
    };
};

export const create = async (): Promise<Level> => {
    const MIN_SURFACE_SIZE = 100;
    const levelMap = map.create(map.randomTiles());
    const surfaces = await simulation.findSurfaces(levelMap);
    const regions = calculateRegions(levelMap);

    const acceptedSurfaces = surfaces.filter(surface => surface.length >= MIN_SURFACE_SIZE);
    const surfaceByRegion = new Map<number, Array<Surface>>();
    acceptedSurfaces.forEach(surface => {
        const { row, col } = surface[0];
        const region = matrix.get(regions.map, row, col);
        if (!surfaceByRegion.has(region)) {
            surfaceByRegion.set(region, []);
        }
        surfaceByRegion.get(region).push(surface);
    });

    const edges: Array<Tunnel> = [];

    for (let [region, surfaces] of surfaceByRegion) {
        for (let surface of surfaces) {
            edges.push(randomizePositions(surface));
        }
    }

    const player = edges[0].entrance;
    const goal = edges[edges.length - 1].exit;
    goal.y += METERS_PER_PIXEL;
    const combinedSurface = acceptedSurfaces.reduce((acc, e) => acc.concat(e));
    const doors: Array<Door> = [];
    for (let i = 0; i < edges.length - 1; i++) {
        const current = edges[i];
        const next = edges[i + 1];
        const door1 = { position: current.exit, other: null };
        const door2 = { position: next.entrance, other: door1 };
        door1.other = door2;
        doors.push(door1, door2);
    }

    for (let surface of surfaces.filter(s => s.length < MIN_SURFACE_SIZE)) {
        for (let cell of surface) {
            const row = cell.row + PLAYER_ROW_HEIGHT + 1;
            for (let i = PLAYER_COL_WIDTH; i >= 0; i--) {
                const col = cell.col + i;
                if (map.isSolidCell(levelMap, row, col)) {
                    map.setSpike(levelMap, row - 1, col);
                }
            }
        }
    }

    return {
        map: levelMap,
        items: randomizeItems(combinedSurface),
        surfaces,
        regions,
        player,
        goal,
        doors,
    };
};

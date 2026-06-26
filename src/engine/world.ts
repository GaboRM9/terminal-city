import type { GameState, Position, ServiceType, Tile, ZoneType } from './types';
import { BUILDINGS } from '../data/buildings';

// ─────────────────────────────────────────────
//  World creation and tile manipulation
// ─────────────────────────────────────────────

function makeTile(x: number, y: number): Tile {
  return {
    x,
    y,
    type: 'empty',
    zoneLevel: 0,
    population: 0,
    coverage: {},
    variant: '.',
    damaged: false,
    hasRoadAccess: false,
    pollution: 0,
    densityCap: 3,
    trafficLoad: 0,
  };
}

export function createWorld(width: number, height: number): GameState['tiles'] {
  const tiles: Tile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push(makeTile(x, y));
    }
  }
  return tiles;
}

export function getTile(state: GameState, x: number, y: number): Tile | undefined {
  if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) return undefined;
  return state.tiles[y * state.worldWidth + x];
}

export function setTile(state: GameState, x: number, y: number, patch: Partial<Tile>): GameState {
  if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) return state;
  const idx = y * state.worldWidth + x;
  const current = state.tiles[idx];
  const updated = { ...current, ...patch };
  const tiles = [...state.tiles];
  tiles[idx] = updated;
  return { ...state, tiles };
}

/** Returns the display char for a tile based on its type and zone level */
export function getTileChar(tile: Tile): string {
  const building = BUILDINGS.find((b) => b.type === tile.type);
  if (building) return building.char;
  return tile.variant;
}

/** Place a zone type on a tile, clearing previous population if type changes */
export function zoneTile(
  state: GameState,
  x: number,
  y: number,
  zone: ZoneType,
  densityCap?: 1 | 2 | 3,
): GameState {
  const tile = getTile(state, x, y);
  if (!tile) return state;

  const building = BUILDINGS.find((b) => b.type === zone);
  const char = building?.char ?? '.';

  const patch: Partial<Tile> = {
    type: zone,
    zoneLevel: zone === 'empty' ? 0 : 1,
    population: zone === tile.type ? tile.population : 0,
    variant: char,
    damaged: false,
  };
  if (densityCap !== undefined) patch.densityCap = densityCap;
  return setTile(state, x, y, patch);
}

/** Trace a road from (x1,y1) to (x2,y2) in a straight L-shaped path */
export function traceRoad(
  state: GameState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): GameState {
  let current = state;

  const roadCost = BUILDINGS.find((b) => b.type === 'road')?.cost ?? 10;
  const steps = Math.abs(x2 - x1) + Math.abs(y2 - y1);
  const totalCost = steps * roadCost;

  if (current.economy.balance < totalCost) {
    return current; // not enough funds — caller should emit error
  }

  // Horizontal first, then vertical
  const stepX = x2 > x1 ? 1 : -1;
  for (let x = x1; x !== x2; x += stepX) {
    current = zoneTile(current, x, y1, 'road');
  }
  const stepY = y2 > y1 ? 1 : -1;
  for (let y = y1; y !== y2 + stepY; y += stepY) {
    current = zoneTile(current, x2, y, 'road');
  }

  current = {
    ...current,
    economy: {
      ...current.economy,
      balance: current.economy.balance - totalCost,
    },
    hasInfrastructure: true,
  };

  return recalculateRoadAccess(current);
}

/** BFS to mark tiles adjacent to roads */
export function recalculateRoadAccess(state: GameState): GameState {
  const tiles = state.tiles.map((t) => ({ ...t, hasRoadAccess: false }));

  for (const tile of tiles) {
    if (tile.type === 'road' || tile.type === 'avenue' || tile.type === 'highway') {
      const neighbors = getNeighbors(state, tile.x, tile.y);
      for (const n of neighbors) {
        const idx = n.y * state.worldWidth + n.x;
        tiles[idx] = { ...tiles[idx], hasRoadAccess: true };
      }
      const selfIdx = tile.y * state.worldWidth + tile.x;
      tiles[selfIdx] = { ...tiles[selfIdx], hasRoadAccess: true };
    }
  }

  return { ...state, tiles };
}

/** Get orthogonal neighbors (no diagonals) */
export function getNeighbors(state: GameState, x: number, y: number): Tile[] {
  const offsets: Position[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];
  return offsets
    .map(({ x: dx, y: dy }) => getTile(state, x + dx, y + dy))
    .filter((t): t is Tile => t !== undefined);
}

/** Get all tiles within a Chebyshev radius (square) */
export function getTilesInRadius(state: GameState, cx: number, cy: number, radius: number): Tile[] {
  const result: Tile[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const tile = getTile(state, cx + dx, cy + dy);
      if (tile) result.push(tile);
    }
  }
  return result;
}

/** Demolish a tile, restoring it to empty and refunding 40% of cost */
export function demolishTile(state: GameState, x: number, y: number): GameState {
  const tile = getTile(state, x, y);
  if (!tile || tile.type === 'empty') return state;

  const building = BUILDINGS.find((b) => b.type === tile.type);
  const refund = building ? Math.floor(building.cost * 0.4) : 0;

  let next = zoneTile(state, x, y, 'empty');
  next = {
    ...next,
    economy: {
      ...next.economy,
      balance: next.economy.balance + refund,
    },
  };
  return recalculateRoadAccess(next);
}

/** Count tiles of a given type on the map */
export function countTilesOfType(state: GameState, type: ZoneType): number {
  return state.tiles.filter((t) => t.type === type).length;
}

/** Get all tiles of a given type */
export function getTilesOfType(state: GameState, type: ZoneType): Tile[] {
  return state.tiles.filter((t) => t.type === type);
}

/** Compute total population across all tiles */
export function computeTotalPopulation(state: GameState): number {
  return state.tiles.reduce((sum, t) => sum + t.population, 0);
}

/** Update service coverage for all tiles based on service buildings */
export function computeServiceCoverage(state: GameState): GameState {
  // Reset coverage
  let tiles = state.tiles.map((t) => ({ ...t, coverage: {} as Tile['coverage'] }));

  const serviceBuildings = BUILDINGS.filter((b) => b.service !== undefined);

  for (const tile of tiles) {
    const building = serviceBuildings.find((b) => b.type === tile.type);
    if (!building?.service) continue;

    const { type: serviceType, radius } = building.service;
    const budget = state.economy.serviceBudgets.find((b) => b.service === serviceType);

    // Budget below threshold reduces radius
    const effectiveRadius =
      budget && budget.allocation < 100 ? Math.floor(radius * (budget.allocation / 100)) : radius;

    for (let dy = -effectiveRadius; dy <= effectiveRadius; dy++) {
      for (let dx = -effectiveRadius; dx <= effectiveRadius; dx++) {
        const tx = tile.x + dx;
        const ty = tile.y + dy;
        if (tx < 0 || ty < 0 || tx >= state.worldWidth || ty >= state.worldHeight) continue;
        const idx = ty * state.worldWidth + tx;
        tiles[idx] = {
          ...tiles[idx],
          coverage: { ...tiles[idx].coverage, [serviceType as ServiceType]: true },
        };
      }
    }
  }

  return { ...state, tiles };
}

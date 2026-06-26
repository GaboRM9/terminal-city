import type { Tile } from '../engine/types';

// ─────────────────────────────────────────────
//  Pixel car simulation — pure logic, no rendering
// ─────────────────────────────────────────────

export const TILE_SIZE = 24;
export const RULER_W   = 22;
export const RULER_H   = 14;
export const CAR_COUNT = 10;

export interface PixelCar {
  readonly id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Progress 0→1 from fromXY to toXY */
  t: number;
  /** Direction components of last move */
  dx: number;
  dy: number;
  color: string;
  /** Progress units added per animation frame */
  speed: number;
}

const CAR_COLORS = [
  '#00ff41', '#ffb000', '#4488ff', '#ff6600',
  '#ff2200', '#00ddff', '#ff44cc', '#aaee44',
  '#dd88ff', '#ff8844',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isRoadTile(t: Tile | undefined): boolean {
  return t?.type === 'road' || t?.type === 'avenue' || t?.type === 'highway';
}

function roadNeighbors(
  x: number, y: number,
  tiles: Tile[], W: number, H: number,
): Array<{ x: number; y: number }> {
  return [
    { x: x + 1, y }, { x: x - 1, y },
    { x, y: y + 1 }, { x, y: y - 1 },
  ].filter(
    (p) => p.x >= 0 && p.y >= 0 && p.x < W && p.y < H
      && isRoadTile(tiles[p.y * W + p.x]),
  );
}

export function initCars(tiles: Tile[], W: number, H: number): PixelCar[] {
  const roads = tiles.filter((t) => isRoadTile(t));
  if (roads.length < 2) return [];

  const count = Math.min(CAR_COUNT, Math.max(1, Math.floor(roads.length * 0.25)));
  const cars: PixelCar[] = [];
  const usedKeys = new Set<string>();

  for (let i = 0; i < count; i++) {
    const available = roads.filter((r) => !usedKeys.has(`${r.x},${r.y}`));
    if (available.length === 0) break;

    const start = pick(available);
    usedKeys.add(`${start.x},${start.y}`);

    const neighbors = roadNeighbors(start.x, start.y, tiles, W, H);
    if (neighbors.length === 0) continue;

    const target = pick(neighbors);

    const congestion = tiles[start.y * W + start.x]?.trafficLoad ?? 0;
    const baseSpeed = start.type === 'highway' ? 0.06 : start.type === 'avenue' ? 0.045 : 0.036;
    const congestionFactor = congestion >= 95 ? 0.05 : congestion >= 80 ? 0.4 : 1.0;

    cars.push({
      id: i,
      fromX: start.x, fromY: start.y,
      toX: target.x,  toY: target.y,
      t: Math.random(),
      dx: target.x - start.x,
      dy: target.y - start.y,
      color: CAR_COLORS[i % CAR_COLORS.length],
      speed: (baseSpeed + Math.random() * 0.020) * congestionFactor,
    });
  }

  return cars;
}

/** Advance cars one animation frame */
export function updateCars(
  cars: PixelCar[],
  tiles: Tile[],
  W: number, H: number,
): PixelCar[] {
  return cars.map((car) => {
    const newT = car.t + car.speed;
    if (newT < 1) return { ...car, t: newT };

    // Arrived at toXY — pick the next tile
    const here = { x: car.toX, y: car.toY };
    const neighbors = roadNeighbors(here.x, here.y, tiles, W, H);

    // Prefer not reversing; prefer continuing straight
    const notBack = neighbors.filter((r) => !(r.x === car.fromX && r.y === car.fromY));
    const straight = notBack.find(
      (r) => r.x - here.x === car.dx && r.y - here.y === car.dy,
    );

    let target: { x: number; y: number };
    if (straight && Math.random() > 0.28) {
      target = straight;
    } else if (notBack.length > 0) {
      target = pick(notBack);
    } else if (neighbors.length > 0) {
      target = pick(neighbors); // U-turn
    } else {
      target = here; // stuck on isolated tile
    }

    return {
      ...car,
      fromX: here.x, fromY: here.y,
      toX:   target.x, toY: target.y,
      dx: target.x - here.x,
      dy: target.y - here.y,
      t: newT - 1, // carry over excess progress
    };
  });
}

/** Respawn any cars that ended up on a non-road tile (after demolish etc.) */
export function respawnStuckCars(
  cars: PixelCar[],
  tiles: Tile[],
  W: number, H: number,
): PixelCar[] {
  const roads = tiles.filter((t) => isRoadTile(t));
  if (roads.length < 2) return [];

  return cars.map((car) => {
    const onTile = tiles[car.toY * W + car.toX];
    if (isRoadTile(onTile)) return car;

    // Respawn on a random road
    const start = pick(roads);
    const neighbors = roadNeighbors(start.x, start.y, tiles, W, H);
    if (neighbors.length === 0) return car;
    const target = pick(neighbors);

    return {
      ...car,
      fromX: start.x, fromY: start.y,
      toX:   target.x, toY: target.y,
      dx: target.x - start.x,
      dy: target.y - start.y,
      t: 0,
    };
  });
}

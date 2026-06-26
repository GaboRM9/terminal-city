import type { GameState, ZoneType } from './types';

// ─────────────────────────────────────────────
//  Traffic simulation — pure computation
// ─────────────────────────────────────────────

/** Road capacity in raw load units per tick */
const ROAD_CAPACITY: Partial<Record<ZoneType, number>> = {
  road:    20,
  avenue:  60,
  highway: 200,
};

/** Traffic load generated per population unit by zone type */
const ZONE_TRAFFIC_GEN: Partial<Record<ZoneType, number>> = {
  residential: 0.12,
  commercial:  0.0,  // commercial attracts traffic (handled via zoneLevel)
  industrial:  0.0,
};

/** Additional load attracted per zoneLevel by non-residential zones */
const ZONE_LEVEL_TRAFFIC: Partial<Record<ZoneType, number>> = {
  commercial: 1.2,
  industrial: 0.8,
};

/** Low-density generates more traffic per person (each drives separately) */
const DENSITY_TRAFFIC_MULT: Record<number, number> = { 1: 1.5, 2: 1.0, 3: 0.65 };

function isRoad(type: ZoneType): boolean {
  return type === 'road' || type === 'avenue' || type === 'highway';
}

/**
 * Recompute trafficLoad for every road tile.
 * Algorithm:
 *   1. Each zone tile generates raw load units pushed to orthogonal road neighbors.
 *   2. One diffusion pass distributes 30% of each road tile's load to road neighbors.
 *   3. Normalize to 0-100 using road capacity.
 */
export function computeTraffic(state: GameState): GameState {
  const { worldWidth: W, worldHeight: H, tiles } = state;
  const raw = new Float32Array(W * H);

  for (const tile of tiles) {
    const genPerPop = ZONE_TRAFFIC_GEN[tile.type];
    const genPerLevel = ZONE_LEVEL_TRAFFIC[tile.type];
    if (genPerPop === undefined && genPerLevel === undefined) continue;

    const densityMult = DENSITY_TRAFFIC_MULT[tile.densityCap ?? 3] ?? 1.0;
    const load =
      (genPerPop ?? 0) * tile.population * densityMult +
      (genPerLevel ?? 0) * tile.zoneLevel;

    if (load === 0) continue;

    // Push to orthogonal road neighbors
    let roadCount = 0;
    const adjacents: number[] = [];
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const nx = tile.x + dx;
      const ny = tile.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = tiles[ny * W + nx];
      if (n && isRoad(n.type)) { adjacents.push(ny * W + nx); roadCount++; }
    }
    if (roadCount === 0) continue;
    const perRoad = load / roadCount;
    for (const idx of adjacents) raw[idx] += perRoad;
  }

  // Diffusion pass — 30% of each road tile's load spreads to road neighbors
  const diffused = new Float32Array(raw);
  for (const tile of tiles) {
    if (!isRoad(tile.type)) continue;
    const idx = tile.y * W + tile.x;
    const roadNeighbors: number[] = [];
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const nx = tile.x + dx;
      const ny = tile.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = tiles[ny * W + nx];
      if (n && isRoad(n.type)) roadNeighbors.push(ny * W + nx);
    }
    if (roadNeighbors.length === 0) continue;
    const share = raw[idx] * 0.3;
    diffused[idx] -= share;
    const perNeighbor = share / roadNeighbors.length;
    for (const nIdx of roadNeighbors) diffused[nIdx] += perNeighbor;
  }

  // Apply congestion to tiles
  const newTiles = tiles.map((t) => {
    const cap = ROAD_CAPACITY[t.type];
    if (!cap) return t.trafficLoad !== 0 ? { ...t, trafficLoad: 0 } : t;
    const load = Math.max(0, diffused[t.y * W + t.x]);
    const congestion = Math.round(Math.min(100, (load / cap) * 100));
    return congestion !== t.trafficLoad ? { ...t, trafficLoad: congestion } : t;
  });

  // City-wide average (over road tiles)
  const roadTiles = newTiles.filter((t) => isRoad(t.type));
  const avgTrafficLoad = roadTiles.length === 0
    ? 0
    : Math.round(roadTiles.reduce((s, t) => s + t.trafficLoad, 0) / roadTiles.length);

  return { ...state, tiles: newTiles, avgTrafficLoad };
}

/** Congestion label for display */
export function trafficLabel(load: number): string {
  if (load < 30) return 'Fluido';
  if (load < 60) return 'Moderado';
  if (load < 80) return 'Congestionado';
  if (load < 95) return 'Colapso parcial';
  return 'COLAPSO TOTAL';
}

/** Color for congestion level */
export function trafficColor(load: number): string {
  if (load < 30) return '#00ff41';
  if (load < 60) return '#ffb000';
  if (load < 80) return '#ff6600';
  return '#ff2200';
}

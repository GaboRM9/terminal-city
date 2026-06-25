import type { GameState, ZoneType } from './types';

// ─────────────────────────────────────────────
//  Pollution engine — pure computation
// ─────────────────────────────────────────────

/** Emission: [base amount, radius] per building type */
const EMITTERS: Partial<Record<ZoneType, [number, number]>> = {
  industrial:    [35, 4],
  power_plant:   [50, 5],
  foundry:       [60, 4],
  iron_mine:     [25, 3],
};

/** Reducers: [amount reduced, radius] per building type */
const REDUCERS: Partial<Record<ZoneType, [number, number]>> = {
  park:        [20, 3],
  waste_plant: [40, 5],
};

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

/**
 * Recompute pollution for every tile in one pass.
 * Returns a new state with pollution values set on all tiles.
 */
export function computePollution(state: GameState): GameState {
  const { worldWidth, worldHeight } = state;
  const pollution = new Float32Array(worldWidth * worldHeight); // starts at 0

  // Add emissions
  for (const tile of state.tiles) {
    const emission = EMITTERS[tile.type];
    if (!emission) continue;
    const [base, radius] = emission;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = tile.x + dx;
        const ty = tile.y + dy;
        if (tx < 0 || ty < 0 || tx >= worldWidth || ty >= worldHeight) continue;
        const dist = chebyshev(tile.x, tile.y, tx, ty);
        const contribution = base * Math.max(0, 1 - dist / radius);
        pollution[ty * worldWidth + tx] += contribution;
      }
    }
  }

  // Subtract reductions
  for (const tile of state.tiles) {
    const reduction = REDUCERS[tile.type];
    if (!reduction) continue;
    const [base, radius] = reduction;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = tile.x + dx;
        const ty = tile.y + dy;
        if (tx < 0 || ty < 0 || tx >= worldWidth || ty >= worldHeight) continue;
        const dist = chebyshev(tile.x, tile.y, tx, ty);
        const contribution = base * Math.max(0, 1 - dist / radius);
        pollution[ty * worldWidth + tx] -= contribution;
      }
    }
  }

  // Apply to tiles
  const tiles = state.tiles.map((t) => {
    const idx = t.y * worldWidth + t.x;
    const raw = Math.round(Math.max(0, Math.min(100, pollution[idx])));
    return raw !== t.pollution ? { ...t, pollution: raw } : t;
  });

  // City-wide average (only over non-empty tiles to avoid dilution)
  const builtTiles = tiles.filter((t) => t.type !== 'empty' && t.type !== 'water');
  const avgPollution = builtTiles.length === 0
    ? 0
    : Math.round(builtTiles.reduce((s, t) => s + t.pollution, 0) / builtTiles.length);

  return { ...state, tiles, avgPollution };
}

/** Happiness penalty from pollution for a single tile */
export function pollutionHappinessPenalty(pollution: number, hasHealth: boolean): number {
  if (pollution <= 30) return 0;
  const raw = (pollution - 30) * 0.5;
  return hasHealth ? raw * 0.5 : raw; // hospital halves impact
}

/** Population cap multiplier from pollution (1.0 = no effect, 0.5 = half capacity) */
export function pollutionPopCapMultiplier(pollution: number): number {
  if (pollution <= 40) return 1;
  return Math.max(0.4, 1 - (pollution - 40) / 120);
}

/** Returns average pollution of the city (0-100) */
export function getCityPollutionLevel(state: GameState): number {
  return state.avgPollution;
}

/** Get a human-readable label for a pollution level */
export function pollutionLabel(level: number): string {
  if (level < 10) return 'Limpio';
  if (level < 30) return 'Leve';
  if (level < 50) return 'Moderado';
  if (level < 70) return 'Alto';
  if (level < 90) return 'Severo';
  return 'Crítico';
}

/** Get color for a pollution level */
export function pollutionColor(level: number): string {
  if (level < 10) return '#00ff41';
  if (level < 30) return '#88cc00';
  if (level < 50) return '#ffb000';
  if (level < 70) return '#ff6600';
  return '#ff2200';
}

/** Nearest polluting tile to a given position (for smog event targeting) */
export function getMostPollutedTile(state: GameState): { x: number; y: number; pollution: number } | null {
  let best = null as { x: number; y: number; pollution: number } | null;
  for (const t of state.tiles) {
    if (t.type === 'residential' || t.type === 'commercial') {
      if (!best || t.pollution > best.pollution) {
        best = { x: t.x, y: t.y, pollution: t.pollution };
      }
    }
  }
  return best;
}

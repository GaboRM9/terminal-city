import type { GameState, ServiceType, Tile } from './types';
import { computeServiceCoverage } from './world';

// ─────────────────────────────────────────────
//  Service coverage and effects
// ─────────────────────────────────────────────

/** Returns the fraction of residential/commercial tiles covered by a service */
export function serviceCoverageRatio(state: GameState, service: ServiceType): number {
  const inhabited = state.tiles.filter(
    (t) => (t.type === 'residential' || t.type === 'commercial') && t.population > 0,
  );
  if (inhabited.length === 0) return 1;
  const covered = inhabited.filter((t) => t.coverage[service]);
  return covered.length / inhabited.length;
}

/** Returns all services available on a tile */
export function tileServices(tile: Tile): ServiceType[] {
  return (Object.keys(tile.coverage) as ServiceType[]).filter((s) => tile.coverage[s]);
}

/** Number of services covered on a tile (max 6) */
export function tileServiceScore(tile: Tile): number {
  const services: ServiceType[] = ['water', 'electricity', 'garbage', 'police', 'fire', 'education'];
  return services.filter((s) => tile.coverage[s]).length;
}

/** Whether a tile has the minimum services to attract residents */
export function hasMiniumumServices(tile: Tile): boolean {
  return !!(tile.coverage.water && tile.coverage.electricity);
}

/** Recalculate coverage and return updated state — call once per tick */
export function refreshCoverage(state: GameState): GameState {
  return computeServiceCoverage(state);
}

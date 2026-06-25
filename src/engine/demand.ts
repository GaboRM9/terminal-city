import type { GameState, RCIDemand } from './types';
import { serviceCoverageRatio } from './services';

// ─────────────────────────────────────────────
//  RCI Demand calculation — pure function
//  Demand (0-100) drives growth rate and advises the player
// ─────────────────────────────────────────────

export function calculateRCIDemand(state: GameState): RCIDemand {
  const { tiles, economy, happiness, productionChains } = state;

  const resTiles  = tiles.filter((t) => t.type === 'residential');
  const comTiles  = tiles.filter((t) => t.type === 'commercial');
  const indTiles  = tiles.filter((t) => t.type === 'industrial');

  const resPop = resTiles.reduce((s, t) => s + t.population, 0);

  // ── R demand ────────────────────────────────────────────────────
  // High when: jobs available, services covered, happy, low taxes
  const totalJobCapacity = (comTiles.length + indTiles.length) * 30;
  const jobRatio = resPop > 0 ? Math.min(totalJobCapacity / (resPop + 1), 1.4) : 1;

  const electricityCoverage = serviceCoverageRatio(state, 'electricity');
  const waterCoverage       = serviceCoverageRatio(state, 'water');
  const serviceFactor = (electricityCoverage + waterCoverage) / 2;

  // Tax penalty: neutral at 12%, -4% per point above
  const taxPenalty = Math.max(0.1, 1 - Math.max(0, economy.taxRate - 12) * 0.04);

  const happinessFactor = (happiness + 20) / 120; // 0.17 → 1.0

  const r = clamp(Math.round(
    100 * Math.min(jobRatio, 1) * serviceFactor * taxPenalty * happinessFactor,
  ));

  // ── C demand ────────────────────────────────────────────────────
  // High when: many residents (customers), not already oversaturated
  const customersPerShop = comTiles.length > 0 ? resPop / comTiles.length : resPop;
  const comSaturation   = 1 - Math.min(comTiles.length / Math.max(resPop / 15, 1), 1);
  const c = clamp(Math.round(
    comSaturation * Math.min(customersPerShop / 25, 1) * 100 * happinessFactor,
  ));

  // ── I demand ────────────────────────────────────────────────────
  // High when: production chains are active and not yet oversupplied
  const productionBonus = productionChains.some((pc) => pc.satisfied) ? 1.3 : 0.7;
  const indSaturation   = 1 - Math.min(indTiles.length / Math.max(comTiles.length + 1, 2), 1);
  const commercialActive = comTiles.length > 0 ? 1 : 0.25;
  const i = clamp(Math.round(
    indSaturation * productionBonus * 70 * commercialActive,
  ));

  return { r, c, i };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Returns a short advisory string for the given demand level */
export function demandLabel(n: number): string {
  if (n >= 80) return 'alta';
  if (n >= 50) return 'media';
  if (n >= 20) return 'baja';
  return 'nula';
}

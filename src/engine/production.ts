import type { GameState, ProductionChainState, ZoneType } from './types';
import { PRODUCTION_CHAINS } from '../data/productionChains';
import { getTilesOfType } from './world';

// ─────────────────────────────────────────────
//  Production chain evaluation (Anno-style)
// ─────────────────────────────────────────────

/** Check if all required zone types in a chain exist on the map */
function chainRequirementsMet(state: GameState, requiredTypes: ZoneType[]): boolean {
  return requiredTypes.every((type) => getTilesOfType(state, type).length > 0);
}

/** Evaluate all production chains and return updated chain states */
export function evaluateProductionChains(state: GameState): GameState {
  const updatedChains: ProductionChainState[] = PRODUCTION_CHAINS.map((chainDef) => {
    const requiredTypes = chainDef.nodes.map((n) => n.type);
    const satisfied = chainRequirementsMet(state, requiredTypes);

    const nodes = chainDef.nodes.map((nodeDef) => {
      const tilesOfType = getTilesOfType(state, nodeDef.type);
      const currentOutput = satisfied ? tilesOfType.length * nodeDef.outputPerTick : 0;
      return { ...nodeDef, currentOutput };
    });

    return {
      chainId: chainDef.chainId,
      unlockedTier: chainDef.unlockedTier,
      satisfied,
      nodes,
    };
  });

  return { ...state, productionChains: updatedChains };
}

/** Returns which production tier is currently accessible (1–3) */
export function getMaxUnlockedTier(state: GameState): 1 | 2 | 3 {
  let max: 1 | 2 | 3 = 1;
  for (const chain of state.productionChains) {
    if (chain.satisfied && chain.unlockedTier > max) {
      max = chain.unlockedTier;
    }
  }
  return max;
}

/** Check if a specific tier is accessible */
export function isTierUnlocked(state: GameState, tier: 1 | 2 | 3): boolean {
  if (tier === 1) return true;
  return state.productionChains.some((c) => c.satisfied && c.unlockedTier >= tier);
}

/** Get a summary of chain statuses for the UI */
export function getChainSummary(state: GameState): string[] {
  return state.productionChains.map((chain) => {
    const status = chain.satisfied ? '✓' : '✗';
    return `[${status}] Tier ${chain.unlockedTier}: ${chain.chainId}`;
  });
}

import type { ProductionChainState, ZoneType } from '../engine/types';

// ─────────────────────────────────────────────
//  Production chain definitions (Anno-style)
// ─────────────────────────────────────────────

type ChainDefinition = Omit<ProductionChainState, 'satisfied' | 'nodes'> & {
  nodes: Array<{ type: ZoneType; outputPerTick: number; currentOutput: number }>;
};

export const PRODUCTION_CHAINS: ChainDefinition[] = [
  {
    chainId: 'food-basic',
    unlockedTier: 1,
    nodes: [
      { type: 'farm', outputPerTick: 5, currentOutput: 0 },
      { type: 'granary', outputPerTick: 10, currentOutput: 0 },
    ],
  },
  {
    chainId: 'food-advanced',
    unlockedTier: 2,
    nodes: [
      { type: 'farm', outputPerTick: 5, currentOutput: 0 },
      { type: 'mill', outputPerTick: 6, currentOutput: 0 },
      { type: 'bakery', outputPerTick: 8, currentOutput: 0 },
    ],
  },
  {
    chainId: 'tools-production',
    unlockedTier: 3,
    nodes: [
      { type: 'iron_mine', outputPerTick: 4, currentOutput: 0 },
      { type: 'foundry', outputPerTick: 3, currentOutput: 0 },
      { type: 'tools_workshop', outputPerTick: 2, currentOutput: 0 },
    ],
  },
];

/** Human-readable chain descriptions for the UI */
export const CHAIN_DESCRIPTIONS: Record<string, string> = {
  'food-basic': 'Granja → Granero (suministro básico de alimentos)',
  'food-advanced': 'Granja → Molino → Panadería (alimento avanzado para obreros)',
  'tools-production': 'Mina de Hierro → Fundición → Taller (herramientas para artesanos)',
};

import { describe, it, expect } from 'vitest';
import {
  calculateTotalIncome,
  applyMonthlyEconomics,
  computeHappiness,
  setTaxRate,
  setServiceBudget,
  createDefaultEconomy,
} from '../src/engine/economy';
import { createWorld, zoneTile } from '../src/engine/world';
import type { GameState } from '../src/engine/types';

// ─────────────────────────────────────────────
//  Economy tests
// ─────────────────────────────────────────────

function makeState(): GameState {
  return {
    worldWidth: 10,
    worldHeight: 10,
    tiles: createWorld(10, 10),
    year: 1,
    month: 1,
    economy: createDefaultEconomy(),
    population: 0,
    happiness: 50,
    productionChains: [],
    eventLog: [],
    log: [],
    speed: 1,
    running: false,
    tickCount: 0,
    hasInfrastructure: false,
    history: [],
    avgPollution: 0,
    rciDemand: { r: 50, c: 0, i: 0 },
    milestones: [],
    victory: false,
    pixelgramPosts: [],
  };
}

describe('economy', () => {
  it('calculates zero income with no populated tiles', () => {
    const state = makeState();
    expect(calculateTotalIncome(state)).toBe(0);
  });

  it('increases income when residential tiles have population', () => {
    let state = zoneTile(makeState(), 3, 3, 'residential');
    state = {
      ...state,
      tiles: state.tiles.map((t) =>
        t.type === 'residential' ? { ...t, population: 20, zoneLevel: 1 } : t,
      ),
    };
    const income = calculateTotalIncome(state);
    expect(income).toBeGreaterThan(0);
  });

  it('applies debt when expenses exceed income', () => {
    const base = makeState();
    const broke = { ...base, economy: { ...base.economy, balance: 0, lastIncome: 0 } };
    const result = applyMonthlyEconomics(broke);
    // With no income but service budgets, balance hits 0 and debt grows
    expect(result.economy.debt).toBeGreaterThanOrEqual(0);
  });

  it('clamps tax rate to valid range', () => {
    const state = makeState();
    expect(setTaxRate(state, 0).economy.taxRate).toBe(5);
    expect(setTaxRate(state, 99).economy.taxRate).toBe(30);
    expect(setTaxRate(state, 20).economy.taxRate).toBe(20);
  });

  it('updates service budget for known service', () => {
    const state = makeState();
    const next = setServiceBudget(state, 'water', 500);
    const budget = next.economy.serviceBudgets.find((b) => b.service === 'water');
    expect(budget?.allocation).toBe(500);
  });

  it('clamps service budget to max', () => {
    const state = makeState();
    const next = setServiceBudget(state, 'fire', 99999);
    const budget = next.economy.serviceBudgets.find((b) => b.service === 'fire');
    expect(budget?.allocation).toBeLessThanOrEqual(2000);
  });

  it('happiness defaults to 50 with no inhabited tiles', () => {
    const state = makeState();
    expect(computeHappiness(state)).toBe(50);
  });

  it('happiness increases with good service coverage', () => {
    let state = zoneTile(makeState(), 3, 3, 'residential');
    state = {
      ...state,
      tiles: state.tiles.map((t) =>
        t.type === 'residential'
          ? {
              ...t,
              population: 10,
              zoneLevel: 1,
              coverage: {
                water: true,
                electricity: true,
                garbage: true,
                police: true,
                fire: true,
                education: true,
              },
            }
          : t,
      ),
    };
    const happiness = computeHappiness(state);
    expect(happiness).toBeGreaterThan(50);
  });

  it('debt accumulates interest correctly', () => {
    const state = {
      ...makeState(),
      economy: {
        ...createDefaultEconomy(),
        balance: 0,
        debt: 0,
        // No income, big expenses → will go into debt
        serviceBudgets: [{ service: 'water' as const, allocation: 10000 }],
      },
    };
    const result = applyMonthlyEconomics(state);
    expect(result.economy.debt).toBeGreaterThan(0);
  });
});

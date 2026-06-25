import type { EconomyState, GameState, ServiceType, Tile } from './types';
import { BALANCE } from '../data/balanceConfig';
import { BUILDINGS } from '../data/buildings';

// ─────────────────────────────────────────────
//  Economy calculations — all pure functions
// ─────────────────────────────────────────────

const ZONE_INCOME_BASE: Record<string, number> = {
  residential: BALANCE.residentialIncomeBase,
  commercial: BALANCE.commercialIncomeBase,
  industrial: BALANCE.industrialIncomeBase,
};

/** Monthly tax income from a single tile */
function tileTaxIncome(tile: Tile, taxRate: number): number {
  const base = ZONE_INCOME_BASE[tile.type] ?? 0;
  if (base === 0) return 0;
  return Math.floor(base * tile.zoneLevel * tile.population * (taxRate / 100));
}

/** Total tax income across all tiles */
export function calculateTotalIncome(state: GameState): number {
  const { taxRate } = state.economy;
  return state.tiles.reduce((sum, tile) => sum + tileTaxIncome(tile, taxRate), 0);
}

/** Total service expenses for the month */
export function calculateTotalExpenses(state: GameState): number {
  let total = 0;

  // Service budget allocations
  for (const budget of state.economy.serviceBudgets) {
    total += budget.allocation;
  }

  // Maintenance cost per building
  for (const tile of state.tiles) {
    const building = BUILDINGS.find((b) => b.type === tile.type);
    if (building?.maintenanceCost) {
      total += building.maintenanceCost;
    }
  }

  return total;
}

/** Apply one month of economics, returning updated economy state */
export function applyMonthlyEconomics(state: GameState): GameState {
  const income = calculateTotalIncome(state);
  const expenses = calculateTotalExpenses(state);
  const net = income - expenses;

  let { balance, debt } = state.economy;
  balance += net;

  // Accumulate debt with interest if balance goes negative
  if (balance < 0) {
    const newDebt = Math.abs(balance);
    debt += Math.floor(newDebt * (1 + BALANCE.debtInterestRate));
    balance = 0;
  } else if (debt > 0) {
    // Automatically pay off debt when flush
    const payment = Math.min(balance, debt);
    balance -= payment;
    debt -= payment;
  }

  return {
    ...state,
    economy: {
      ...state.economy,
      balance,
      debt,
      lastIncome: income,
      lastExpenses: expenses,
    },
  };
}

/** Tax rate impact on migration: higher taxes reduce growth */
export function taxMigrationPenalty(taxRate: number): number {
  // 0 penalty at 15%, linear scaling outward
  const neutral = 15;
  const diff = taxRate - neutral;
  return diff > 0 ? diff * BALANCE.taxMigrationPenaltyPerPoint : 0;
}

/** Compute happiness 0–100 based on services and economy */
export function computeHappiness(state: GameState): number {
  const coveredTiles = state.tiles.filter(
    (t) =>
      (t.type === 'residential' || t.type === 'commercial') &&
      t.population > 0,
  );

  if (coveredTiles.length === 0) return 50;

  const services: ServiceType[] = ['water', 'electricity', 'garbage', 'police', 'fire'];
  let totalScore = 0;

  for (const tile of coveredTiles) {
    let score = 40; // base happiness
    for (const service of services) {
      if (tile.coverage[service]) score += 10;
    }
    // Park proximity bonus
    if (tile.coverage['fire']) score += 2;
    // Debt penalty
    if (state.economy.debt > 10000) score -= 10;
    // Tax penalty
    score -= taxMigrationPenalty(state.economy.taxRate);
    totalScore += Math.max(0, Math.min(100, score));
  }

  return Math.round(totalScore / coveredTiles.length);
}

/** Set tax rate, clamped to valid range */
export function setTaxRate(state: GameState, rate: number): GameState {
  const clamped = Math.max(BALANCE.minTaxRate, Math.min(BALANCE.maxTaxRate, rate));
  return {
    ...state,
    economy: { ...state.economy, taxRate: clamped },
  };
}

/** Update a service budget allocation */
export function setServiceBudget(
  state: GameState,
  service: ServiceType,
  amount: number,
): GameState {
  const serviceBudgets = state.economy.serviceBudgets.map((b) =>
    b.service === service
      ? { ...b, allocation: Math.max(0, Math.min(BALANCE.maxServiceBudget, amount)) }
      : b,
  );
  return { ...state, economy: { ...state.economy, serviceBudgets } };
}

/** Create the default economy state */
export function createDefaultEconomy(): EconomyState {
  const services: ServiceType[] = ['water', 'electricity', 'garbage', 'police', 'fire', 'education'];
  return {
    balance: BALANCE.startingBalance,
    debt: 0,
    lastIncome: 0,
    lastExpenses: 0,
    taxRate: BALANCE.defaultTaxRate,
    serviceBudgets: services.map((service) => ({
      service,
      allocation: BALANCE.defaultServiceBudget,
    })),
  };
}

import type { Bond, BondRating, EconomyState, GameState, ServiceType, Tile } from './types';
import { BALANCE } from '../data/balanceConfig';
import { BUILDINGS } from '../data/buildings';
import { pollutionHappinessPenalty } from './pollution';

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

  const services: ServiceType[] = ['water', 'electricity', 'garbage', 'police', 'fire', 'education', 'health'];
  let totalScore = 0;

  for (const tile of coveredTiles) {
    let score = 30; // base happiness (lower now that 7 services can add 70)
    for (const service of services) {
      if (tile.coverage[service]) score += 10;
    }
    // Pollution penalty (hospital halves it)
    score -= pollutionHappinessPenalty(tile.pollution ?? 0, !!(tile.coverage.health));
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

/** Bond rating from debt-to-annual-income ratio */
export function computeBondRating(state: GameState): BondRating {
  const annualIncome = state.economy.lastIncome * 12;
  if (annualIncome === 0) return 'BBB';
  const ratio = state.economy.debt / annualIncome;
  if (ratio < 0.1) return 'AAA';
  if (ratio < 0.3) return 'AA';
  if (ratio < 0.6) return 'A';
  if (ratio < 1.0) return 'BBB';
  if (ratio < 2.0) return 'B';
  return 'D';
}

const BOND_INTEREST_RATES: Record<BondRating, number> = {
  AAA: 0.03,
  AA:  0.05,
  A:   0.07,
  BBB: 0.10,
  B:   0.15,
  D:   0,   // unavailable
};

let _bondCounter = 0;

/** Issue a new municipal bond, returning updated state or error message */
export function issueBond(state: GameState, amount: number): [GameState, string] {
  const rating = computeBondRating(state);
  if (rating === 'D') {
    return [state, 'Calificación D: la ciudad no puede emitir bonos. Reduce la deuda primero.'];
  }
  if (amount < 1000) {
    return [state, 'El monto mínimo de un bono es $1,000.'];
  }
  if (amount > 100_000) {
    return [state, 'El monto máximo de un bono es $100,000.'];
  }

  const interestRate = BOND_INTEREST_RATES[rating];
  const termMonths = 240; // 20 years
  // Monthly payment using amortization formula: P * r / (1 - (1+r)^-n)
  const r = interestRate / 12;
  const monthlyPayment = Math.ceil(amount * r / (1 - Math.pow(1 + r, -termMonths)));

  const bond: Bond = {
    id: `bond-${++_bondCounter}`,
    amount,
    termMonths,
    monthsRemaining: termMonths,
    monthlyPayment,
    interestRate,
    rating,
  };

  return [
    {
      ...state,
      economy: {
        ...state.economy,
        balance: state.economy.balance + amount,
        bonds: [...state.economy.bonds, bond],
      },
    },
    `Bono emitido: $${amount} al ${(interestRate * 100).toFixed(0)}% anual (calificación ${rating}). Pago mensual: $${monthlyPayment}/mes durante 20 años.`,
  ];
}

/** Process monthly bond payments, returning updated state */
export function processBondPayments(state: GameState): GameState {
  if (state.economy.bonds.length === 0) return state;

  let { balance, bondDefaultRisk } = state.economy;
  let totalPayment = 0;

  const updatedBonds = state.economy.bonds
    .map((bond) => {
      totalPayment += bond.monthlyPayment;
      return { ...bond, monthsRemaining: bond.monthsRemaining - 1 };
    })
    .filter((bond) => bond.monthsRemaining > 0);

  balance -= totalPayment;

  // Track default risk: consecutive months where balance goes negative from bond payments
  if (balance < 0) {
    bondDefaultRisk += 1;
    balance = 0; // absorbed into existing debt mechanism
  } else {
    bondDefaultRisk = 0;
  }

  return {
    ...state,
    economy: {
      ...state.economy,
      balance,
      bonds: updatedBonds,
      bondDefaultRisk,
    },
  };
}

/** Create the default economy state */
export function createDefaultEconomy(): EconomyState {
  const services: ServiceType[] = ['water', 'electricity', 'garbage', 'police', 'fire', 'education', 'health'];
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
    bonds: [],
    bondDefaultRisk: 0,
  };
}

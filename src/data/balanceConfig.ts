// ─────────────────────────────────────────────
//  Balance configuration — tweak to adjust game feel
// ─────────────────────────────────────────────

export const BALANCE = {
  // Economy
  startingBalance: 12_000,
  defaultTaxRate: 15,
  minTaxRate: 5,
  maxTaxRate: 30,
  defaultServiceBudget: 200,
  maxServiceBudget: 2000,
  debtInterestRate: 0.03,

  // Tax migration penalty (happiness points lost per % above neutral 15%)
  taxMigrationPenaltyPerPoint: 0.5,

  // Income per tile per zone level per resident
  residentialIncomeBase: 2,
  commercialIncomeBase: 4,
  industrialIncomeBase: 3,

  // Population
  populationPerZoneLevel: 50,
  basePopGrowth: 8,
  emigrationRate: 0.05,

  // Events
  fireEventProbability: 0.04,
  crimeEventProbability: 0.05,
  migrationBoomHappiness: 80,
  migrationBoomProbability: 0.15,
  recessionMinYear: 5,
  recessionCheckInterval: 120, // ticks (~10 years)
  recessionProbability: 0.08,
  waterDiscoveryProbability: 0.01,
  diseaseOutbreakProbability: 0.03,
  crimePenaltyHappiness: 5,

  // Limits
  maxLogEntries: 200,
} as const;

import type { GameState, LogEntry } from './types';
import { refreshCoverage } from './services';
import { applyMonthlyEconomics, computeHappiness, processBondPayments } from './economy';
import { computePollution, pollutionPopCapMultiplier } from './pollution';
import { evaluateProductionChains, isTierUnlocked } from './production';
import { generateEvents } from './events';
import { computeTotalPopulation } from './world';
import { generatePixelgramPosts, MAX_PIXELGRAM_POSTS } from './pixelgram';
import { calculateRCIDemand } from './demand';
import { checkMilestones } from './milestones';
import { BALANCE } from '../data/balanceConfig';

// ─────────────────────────────────────────────
//  Tick engine — pure function (GameState) → GameState
// ─────────────────────────────────────────────

let _logCounter = 0;

function makeLog(
  year: number,
  month: number,
  message: string,
  severity: LogEntry['severity'] = 'info',
  source: LogEntry['source'] = 'game',
): LogEntry {
  return {
    id: `log-${++_logCounter}`,
    timestamp: `Año ${year}, Mes ${String(month).padStart(2, '0')}`,
    message,
    severity,
    source,
  };
}

/** Advance month/year counter */
function advanceTime(state: GameState): GameState {
  const month = state.month >= 12 ? 1 : state.month + 1;
  const year = state.month >= 12 ? state.year + 1 : state.year;
  return { ...state, month, year };
}

/** Grow or shrink population based on services, happiness, and tier */
function updatePopulation(state: GameState): GameState {
  const maxTier = isTierUnlocked(state, 3) ? 3 : isTierUnlocked(state, 2) ? 2 : 1;
  const migrationBoost = state.eventLog.some(
    (e) => e.year === state.year && e.month === state.month && e.message.includes('Migración'),
  );

  let tiles = [...state.tiles];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];

    if (tile.type === 'residential' || tile.type === 'commercial' || tile.type === 'industrial') {
      if (!tile.hasRoadAccess) continue;

      const serviceScore =
        (tile.coverage.water ? 1 : 0) +
        (tile.coverage.electricity ? 1 : 0) +
        (tile.coverage.garbage ? 1 : 0) +
        (tile.coverage.police ? 1 : 0) +
        (tile.coverage.fire ? 1 : 0) +
        (tile.coverage.education ? 1 : 0) +
        (tile.coverage.health ? 1 : 0);

      // Without health (hospital) coverage, residential zones can't exceed level 2
      const hasHealthCoverage = !!(tile.coverage.health);
      const effectiveMaxTier = (tile.type === 'residential' && !hasHealthCoverage)
        ? Math.min(maxTier, 2)
        : maxTier;

      // Density cap set by player; high-density residential also needs clean air + all services
      const cap = tile.densityCap ?? 3;
      const highDensityMet =
        cap < 3 ||
        tile.type !== 'residential' ||
        ((tile.pollution ?? 0) < 30 && serviceScore >= 7);
      const effectiveMaxLevel = highDensityMet
        ? Math.min(effectiveMaxTier, cap)
        : Math.min(effectiveMaxTier, cap, 2);

      const pollutionCapMult = pollutionPopCapMultiplier(tile.pollution ?? 0);
      const maxPop = Math.floor(tile.zoneLevel * BALANCE.populationPerZoneLevel * pollutionCapMult);
      const canGrow = tile.zoneLevel < effectiveMaxLevel && tile.zoneLevel < 3 && serviceScore >= 3 && (tile.pollution ?? 0) < 80;

      // Demand multiplier: high demand = faster growth, low = slower
      const demand = state.rciDemand;
      const tileDemand =
        tile.type === 'commercial' ? demand.c
        : tile.type === 'industrial' ? demand.i
        : demand.r;
      const demandFactor = Math.max(0.1, tileDemand / 100);

      let growth = 0;
      if (serviceScore >= 2) {
        growth = Math.floor(
          BALANCE.basePopGrowth * (serviceScore / 7) * (state.happiness / 100) * demandFactor,
        );
        if (migrationBoost) growth = Math.floor(growth * 1.5);
      } else if (serviceScore === 0) {
        // Emigration
        growth = -Math.floor(tile.population * BALANCE.emigrationRate);
      }

      const newPop = Math.max(0, Math.min(maxPop, tile.population + growth));

      // Zone level up if population saturated and tier allows
      let newLevel = tile.zoneLevel as 0 | 1 | 2 | 3;
      if (canGrow && newPop >= maxPop && newPop > 0) {
        newLevel = (tile.zoneLevel + 1) as 1 | 2 | 3;
      }

      if (tile.damaged) {
        tiles[i] = { ...tile, population: Math.floor(newPop * 0.5), zoneLevel: newLevel };
      } else {
        tiles[i] = { ...tile, population: newPop, zoneLevel: newLevel };
      }
    }
  }

  return { ...state, tiles };
}

/** Update variant chars for all tiles based on zone level and density cap */
function refreshVariants(state: GameState): GameState {
  // Level-0 residential: show density cap as a subtle dot variant
  const emptyDotByCap: Record<number, string> = { 1: '·', 2: '∙', 3: '.' };
  const resChars: Record<number, string> = { 1: '░', 2: '▒', 3: '█' };
  const tiles = state.tiles.map((t) => {
    if (t.type === 'residential') {
      if (t.zoneLevel === 0) return { ...t, variant: emptyDotByCap[t.densityCap ?? 3] ?? '.' };
      return { ...t, variant: resChars[t.zoneLevel] ?? '░' };
    }
    return t;
  });
  return { ...state, tiles };
}

/**
 * Run one full simulation tick (one in-game month).
 * Pure function: returns a new GameState, never mutates input.
 */
export function tick(state: GameState): GameState {
  let next = state;

  // 1. Advance time
  next = advanceTime(next);

  // 2. Recalculate service coverage
  next = refreshCoverage(next);

  // 2b. Recompute pollution (uses updated tile types)
  next = computePollution(next);

  // 3. Evaluate production chains
  next = evaluateProductionChains(next);

  // 3b. Recalculate RCI demand (uses updated coverage + chains)
  next = { ...next, rciDemand: calculateRCIDemand(next) };

  // 4. Update population (RCI growth/shrinkage)
  next = updatePopulation(next);

  // 5. Compute happiness
  const happiness = computeHappiness(next);
  next = { ...next, happiness };

  // 6. Apply monthly economics
  next = applyMonthlyEconomics(next);
  next = processBondPayments(next);

  // 7. Compute total population
  const population = computeTotalPopulation(next);
  next = { ...next, population };

  // 8. Generate random events
  const [withEvents, newEvents] = generateEvents(next);
  next = withEvents;

  // 9. Build log entries
  const newLogs: LogEntry[] = [];

  // Monthly summary
  newLogs.push(
    makeLog(
      next.year,
      next.month,
      `Ingresos: $${next.economy.lastIncome} | Gastos: $${next.economy.lastExpenses} | Balance: $${next.economy.balance}`,
      'info',
    ),
  );

  if (next.economy.debt > 0) {
    newLogs.push(
      makeLog(next.year, next.month, `Deuda acumulada: $${next.economy.debt}`, 'warning'),
    );
  }

  for (const evt of newEvents) {
    newLogs.push(
      makeLog(evt.year, evt.month, evt.message, evt.severity),
    );
  }

  // 10. Update variants (density chars)
  next = refreshVariants(next);

  // 11. Generate Pixelgram citizen posts (2-4 per tick, more during events)
  const postCount = newEvents.length > 0 ? 4 : 2;
  const newPosts = generatePixelgramPosts(next, postCount);

  next = {
    ...next,
    eventLog: [...next.eventLog, ...newEvents],
    log: [...next.log, ...newLogs].slice(-BALANCE.maxLogEntries),
    pixelgramPosts: [...newPosts, ...next.pixelgramPosts].slice(0, MAX_PIXELGRAM_POSTS),
    tickCount: next.tickCount + 1,
  };

  // 12. Check milestones (may add bonus balance + posts + log entries)
  next = checkMilestones(next);

  // 13. Append history snapshot (keep last 24 months)
  const snapshot = {
    month: next.month,
    year: next.year,
    population: next.population,
    balance: next.economy.balance,
    happiness: next.happiness,
    income: next.economy.lastIncome,
    expenses: next.economy.lastExpenses,
    rDemand: next.rciDemand.r,
    cDemand: next.rciDemand.c,
    iDemand: next.rciDemand.i,
  };
  next = { ...next, history: [...next.history, snapshot].slice(-24) };

  return next;
}

/** Run multiple ticks at once (e.g., skip 12 = 1 year) */
export function tickN(state: GameState, n: number): GameState {
  let current = state;
  for (let i = 0; i < n; i++) {
    current = tick(current);
  }
  return current;
}

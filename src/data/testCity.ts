import type { Bond, GameState, Tile, ZoneType } from '../engine/types';
import {
  createWorld, zoneTile, recalculateRoadAccess,
  computeServiceCoverage, computeTotalPopulation,
} from '../engine/world';
import { createDefaultEconomy } from '../engine/economy';
import { createInitialMilestones } from './milestoneDefs';
import { computePollution } from '../engine/pollution';
import { computeTraffic } from '../engine/traffic';

// ─────────────────────────────────────────────
//  Shared helpers
// ─────────────────────────────────────────────

const W = 40;

function hLine(s: GameState, y: number, x1: number, x2: number, t: ZoneType): GameState {
  for (let x = x1; x <= x2; x++) s = zoneTile(s, x, y, t);
  return s;
}

function vLine(s: GameState, x: number, y1: number, y2: number, t: ZoneType): GameState {
  for (let y = y1; y <= y2; y++) s = zoneTile(s, x, y, t);
  return s;
}

function patchTile(s: GameState, x: number, y: number, p: Partial<Tile>): GameState {
  const idx = y * W + x;
  const tiles = [...s.tiles];
  tiles[idx] = { ...tiles[idx], ...p };
  return { ...s, tiles };
}

function fillZone(
  s: GameState,
  x1: number, y1: number, x2: number, y2: number,
  type: ZoneType, level: 1 | 2 | 3, pop: number, cap: 1 | 2 | 3,
): GameState {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (s.tiles[y * W + x].type !== 'empty') continue;
      s = zoneTile(s, x, y, type, cap);
      s = patchTile(s, x, y, { zoneLevel: level, population: pop });
    }
  }
  return s;
}

function place(s: GameState, x: number, y: number, type: ZoneType): GameState {
  if (s.tiles[y * W + x].type !== 'empty') return s;
  return zoneTile(s, x, y, type);
}

function finalise(s: GameState, fallbackPop: number, happiness: number): GameState {
  s = recalculateRoadAccess(s);
  s = computeServiceCoverage(s);
  s = computePollution(s);
  s = computeTraffic(s);
  const totalPop = computeTotalPopulation(s);
  const avgPol = Math.round(
    s.tiles.reduce((a, t) => a + (t.pollution ?? 0), 0) / s.tiles.length,
  );
  const roadTiles = s.tiles.filter(
    (t) => t.type === 'road' || t.type === 'avenue' || t.type === 'highway',
  );
  const avgTraffic = roadTiles.length
    ? Math.round(roadTiles.reduce((a, t) => a + (t.trafficLoad ?? 0), 0) / roadTiles.length)
    : 0;
  return {
    ...s,
    population: totalPop > 0 ? totalPop : fallbackPop,
    happiness,
    avgPollution: avgPol,
    avgTrafficLoad: avgTraffic,
  };
}

function baseState(overrides: Partial<GameState>): GameState {
  return {
    worldWidth: W,
    worldHeight: 20,
    tiles: createWorld(W, 20),
    year: 1,
    month: 1,
    economy: createDefaultEconomy(),
    population: 0,
    happiness: 60,
    productionChains: [],
    eventLog: [],
    pixelgramPosts: [],
    rciDemand: { r: 40, c: 40, i: 40 },
    milestones: createInitialMilestones(),
    victory: false,
    log: [],
    speed: 'pause',
    running: false,
    tickCount: 0,
    hasInfrastructure: true,
    history: [],
    avgPollution: 0,
    avgTrafficLoad: 0,
    districts: [],
    ...overrides,
  };
}

function doneMilestones(ids: string[], year: number, month: number) {
  return createInitialMilestones().map((m) =>
    ids.includes(m.id)
      ? { ...m, completed: true, completedYear: year, completedMonth: month }
      : m,
  );
}

// ─────────────────────────────────────────────
//  SEED 1 — "La Ciudad Balanceada"
//  Mid-game general-purpose city.
//  Año 6, Pop ~430, $38 500, Felicidad 68 %
// ─────────────────────────────────────────────

export function createSeed1(): GameState {
  let s = baseState({
    year: 6, month: 3, tickCount: 72,
    economy: {
      ...createDefaultEconomy(),
      balance: 38_500, debt: 4_000,
      lastIncome: 3_200, lastExpenses: 2_050,
      taxRate: 15,
      serviceBudgets: [
        { service: 'water',       allocation: 350 },
        { service: 'electricity', allocation: 350 },
        { service: 'garbage',     allocation: 250 },
        { service: 'police',      allocation: 300 },
        { service: 'fire',        allocation: 300 },
        { service: 'education',   allocation: 250 },
        { service: 'health',      allocation: 250 },
      ],
      bonds: [],
      bondDefaultRisk: 0,
    },
    rciDemand: { r: 25, c: 55, i: 40 },
    milestones: doneMilestones(
      ['first_road','first_residents','lights_on','first_business',
       'first_tier2','hundred_residents','safe_city'], 3, 6,
    ),
    log: [{
      id: 'seed-1',
      timestamp: 'Año 6, Mes 03',
      message: 'SEED 1 — La Ciudad Balanceada. Pop ~430, $38 500, Felicidad 68 %.',
      severity: 'info', source: 'system',
    }],
  });

  s = hLine(s, 0, 0, 39, 'highway');
  s = hLine(s, 8, 0, 39, 'avenue');
  s = hLine(s, 15, 0, 39, 'avenue');
  s = vLine(s,  0, 0, 19, 'avenue');
  s = vLine(s, 14, 0, 19, 'avenue');
  s = vLine(s, 28, 0, 19, 'avenue');
  s = vLine(s, 39, 0, 19, 'avenue');
  s = vLine(s,  7,  1,  7, 'road'); s = vLine(s,  7,  9, 14, 'road'); s = vLine(s,  7, 16, 19, 'road');
  s = vLine(s, 21,  1,  7, 'road'); s = vLine(s, 21,  9, 14, 'road'); s = vLine(s, 21, 16, 19, 'road');
  s = vLine(s, 34,  1,  7, 'road'); s = vLine(s, 34,  9, 14, 'road'); s = vLine(s, 34, 16, 19, 'road');
  s = hLine(s,  4,  1, 13, 'road'); s = hLine(s,  4, 15, 27, 'road'); s = hLine(s,  4, 29, 38, 'road');
  s = hLine(s, 11,  1, 13, 'road'); s = hLine(s, 11, 15, 27, 'road'); s = hLine(s, 11, 29, 38, 'road');
  s = hLine(s, 18,  1, 13, 'road'); s = hLine(s, 18, 15, 27, 'road'); s = hLine(s, 18, 29, 38, 'road');

  // North – residential + parks + services
  s = fillZone(s,  1, 1,  6, 3, 'residential', 3, 18, 3);
  s = fillZone(s,  8, 1, 13, 3, 'residential', 3, 18, 3);
  s = fillZone(s,  1, 5,  6, 7, 'residential', 2,  8, 2);
  s = fillZone(s,  8, 5, 13, 7, 'residential', 2,  8, 2);
  s = fillZone(s, 15, 1, 20, 3, 'residential', 3, 15, 3);
  s = fillZone(s, 22, 1, 27, 3, 'residential', 2,  8, 2);
  for (let x = 15; x <= 20; x++) { s = place(s, x, 5, 'park'); s = place(s, x, 6, 'park'); s = place(s, x, 7, 'park'); }
  s = fillZone(s, 22, 5, 27, 7, 'commercial', 1, 5, 1);
  s = fillZone(s, 29, 1, 33, 3, 'residential', 2, 8, 2);
  s = fillZone(s, 29, 5, 33, 7, 'residential', 1, 3, 1);
  s = place(s, 35, 1, 'hospital');     s = place(s, 36, 1, 'hospital');
  s = place(s, 37, 1, 'school');       s = place(s, 38, 1, 'university');
  s = place(s, 35, 2, 'fire_station'); s = place(s, 36, 2, 'police_station');
  s = place(s, 35, 3, 'water_pump');   s = place(s, 36, 3, 'power_plant');
  s = place(s, 37, 3, 'waste_plant');  s = place(s, 37, 2, 'park'); s = place(s, 38, 2, 'park'); s = place(s, 38, 3, 'park');
  s = place(s,  1, 3, 'fire_station'); s = place(s, 13, 3, 'police_station');
  s = place(s, 20, 2, 'school');       s = place(s, 13, 6, 'hospital');

  // Mid – commercial + industrial
  s = fillZone(s,  1,  9,  6, 10, 'commercial', 3, 18, 3);
  s = fillZone(s,  8,  9, 13, 10, 'commercial', 3, 18, 3);
  s = fillZone(s,  1, 12,  6, 14, 'commercial', 2,  8, 2);
  s = fillZone(s,  8, 12, 13, 14, 'commercial', 2,  8, 2);
  s = fillZone(s, 15,  9, 20, 14, 'industrial', 1, 2, 1);
  s = fillZone(s, 22,  9, 27, 14, 'industrial', 2, 4, 2);
  s = fillZone(s, 29,  9, 33, 14, 'industrial', 2, 4, 2);
  s = fillZone(s, 35,  9, 38, 10, 'industrial', 3, 6, 3);
  s = place(s, 35, 12, 'police_station'); s = place(s, 36, 12, 'fire_station');
  s = place(s, 37, 12, 'waste_plant');    s = place(s, 36, 13, 'power_plant');
  s = place(s, 37, 13, 'water_pump');     s = place(s, 38, 13, 'hospital');

  // South – production chain + heavy industry
  s = fillZone(s, 1, 16, 6, 17, 'farm', 1, 0, 1);
  s = place(s, 1, 19, 'granary');  s = place(s, 2, 19, 'mill');
  s = place(s, 3, 19, 'bakery');   s = place(s, 4, 19, 'iron_mine');
  s = place(s, 5, 19, 'foundry');  s = place(s, 6, 19, 'tools_workshop');
  s = fillZone(s,  8, 16, 13, 19, 'industrial', 1, 2, 1);
  s = fillZone(s, 15, 16, 20, 19, 'industrial', 2, 4, 2);
  s = fillZone(s, 22, 16, 27, 19, 'industrial', 2, 4, 2);
  s = fillZone(s, 29, 16, 33, 19, 'industrial', 3, 6, 3);
  s = place(s, 35, 16, 'power_plant'); s = place(s, 36, 16, 'power_plant');
  s = place(s, 37, 16, 'water_pump');  s = place(s, 38, 16, 'water_pump');
  s = place(s, 35, 17, 'waste_plant'); s = place(s, 36, 17, 'iron_mine');
  s = place(s, 37, 17, 'foundry');     s = place(s, 38, 17, 'tools_workshop');
  s = fillZone(s, 35, 19, 38, 19, 'industrial', 3, 5, 3);

  return finalise(s, 430, 68);
}

// ─────────────────────────────────────────────
//  SEED 2 — "El Cinturón Industrial"
//  Ciudad fabril con crisis de contaminación.
//  Año 9, Pop ~250, $82 000, Felicidad 38 %
// ─────────────────────────────────────────────

export function createSeed2(): GameState {
  let s = baseState({
    year: 9, month: 7, tickCount: 108,
    economy: {
      ...createDefaultEconomy(),
      balance: 82_000, debt: 0,
      lastIncome: 5_400, lastExpenses: 1_100,
      taxRate: 20,
      serviceBudgets: [
        { service: 'water',       allocation: 200 },
        { service: 'electricity', allocation: 200 },
        { service: 'garbage',     allocation: 100 },
        { service: 'police',      allocation: 150 },
        { service: 'fire',        allocation: 150 },
        { service: 'education',   allocation: 80  },
        { service: 'health',      allocation: 80  },
      ],
      bonds: [],
      bondDefaultRisk: 0,
    },
    rciDemand: { r: 60, c: 70, i: 10 },
    milestones: doneMilestones(
      ['first_road','first_residents','lights_on','first_business',
       'first_tier2','hundred_residents','production_chain'], 4, 2,
    ),
    log: [{
      id: 'seed-2',
      timestamp: 'Año 9, Mes 07',
      message: 'SEED 2 — El Cinturón Industrial. Economía fuerte, contaminación crítica. ¡Faltan parques y plantas de residuos!',
      severity: 'warning', source: 'system',
    }],
  });

  // Minimal road skeleton
  s = hLine(s, 0, 0, 39, 'highway');
  s = vLine(s,  0, 0, 19, 'avenue');
  s = vLine(s, 39, 0, 19, 'avenue');
  s = hLine(s, 19, 0, 39, 'avenue');
  for (let x = 4; x <= 35; x += 4) s = vLine(s, x, 1, 18, 'road');
  for (let y = 4; y <= 16; y += 4) s = hLine(s, y, 1, 38, 'road');

  // Small residential NW corner
  s = fillZone(s, 1, 1, 3, 3, 'residential', 2,  8, 2);
  s = fillZone(s, 1, 5, 3, 7, 'residential', 1,  4, 1);

  // Minimal commercial strip
  s = fillZone(s, 1, 9, 3, 11, 'commercial', 2, 6, 2);

  // Skeleton services (bare minimum)
  s = place(s, 1,  2, 'fire_station');
  s = place(s, 2,  2, 'police_station');
  s = place(s, 3,  2, 'water_pump');
  s = place(s, 1,  6, 'power_plant');
  s = place(s, 2,  6, 'power_plant');

  // HEAVY INDUSTRIAL — saturates the map
  s = fillZone(s,  5,  1, 38,  3, 'industrial', 3, 6, 3);
  s = fillZone(s,  5,  5, 38,  7, 'industrial', 3, 6, 3);
  s = fillZone(s,  5,  9, 38, 11, 'industrial', 2, 4, 2);
  s = fillZone(s,  1, 13, 38, 15, 'industrial', 3, 6, 3);
  s = fillZone(s,  1, 17, 38, 18, 'industrial', 2, 4, 2);

  // Production chain embedded in industrial belt
  s = place(s, 5, 9, 'farm');        s = place(s, 6, 9, 'farm');
  s = place(s, 7, 9, 'farm');        s = place(s, 5, 10, 'granary');
  s = place(s, 6, 10, 'iron_mine');  s = place(s, 7, 10, 'foundry');
  s = place(s, 8, 10, 'tools_workshop');

  // Only 3 power/water plants — not enough for the whole city
  s = place(s, 20,  2, 'power_plant');
  s = place(s, 20,  6, 'power_plant');
  s = place(s, 20, 14, 'power_plant');
  s = place(s, 38, 14, 'water_pump');
  s = place(s, 20, 10, 'waste_plant'); // Just 1 waste plant — nowhere near enough

  return finalise(s, 250, 38);
}

// ─────────────────────────────────────────────
//  SEED 3 — "La Metrópolis Congestionada"
//  Ciudad densa sin avenidas ni autopistas.
//  Año 10, Pop ~520, $22 000, Felicidad 52 %
// ─────────────────────────────────────────────

export function createSeed3(): GameState {
  let s = baseState({
    year: 10, month: 11, tickCount: 131,
    economy: {
      ...createDefaultEconomy(),
      balance: 22_000, debt: 12_000,
      lastIncome: 4_800, lastExpenses: 3_600,
      taxRate: 17,
      serviceBudgets: [
        { service: 'water',       allocation: 300 },
        { service: 'electricity', allocation: 300 },
        { service: 'garbage',     allocation: 200 },
        { service: 'police',      allocation: 280 },
        { service: 'fire',        allocation: 280 },
        { service: 'education',   allocation: 220 },
        { service: 'health',      allocation: 220 },
      ],
      bonds: [],
      bondDefaultRisk: 0,
    },
    rciDemand: { r: 15, c: 25, i: 50 },
    milestones: doneMilestones(
      ['first_road','first_residents','lights_on','first_business',
       'first_tier2','hundred_residents','safe_city','tier3_district'], 5, 2,
    ),
    log: [{
      id: 'seed-3',
      timestamp: 'Año 10, Mes 11',
      message: 'SEED 3 — La Metrópolis Congestionada. Solo carreteras locales — avenidas y autopistas brillan por su ausencia. ¡El tráfico es un infierno!',
      severity: 'warning', source: 'system',
    }],
  });

  // ONLY basic roads — tight 3-tile grid → maximum congestion
  for (let x = 0; x <= 39; x += 3) s = vLine(s, x, 0, 19, 'road');
  for (let y = 0; y <= 19; y += 3) s = hLine(s, y, 0, 39, 'road');

  // Dense residential — low density cap generates more traffic per capita
  s = fillZone(s,  1,  1, 38,  2, 'residential', 3, 12, 1);
  s = fillZone(s,  1,  4, 38,  5, 'residential', 3, 12, 1);
  s = fillZone(s,  1,  7, 23,  8, 'residential', 2,  8, 1);
  s = fillZone(s, 25,  7, 38,  8, 'commercial',  2,  8, 1);
  s = fillZone(s,  1, 10, 38, 11, 'commercial',  3, 14, 1);
  s = fillZone(s,  1, 13, 17, 14, 'commercial',  2,  8, 1);
  s = fillZone(s, 19, 13, 38, 14, 'industrial',  2,  5, 1);
  s = fillZone(s,  1, 16, 38, 17, 'industrial',  2,  5, 1);

  // Services sprinkled in available spots
  s = place(s,  2,  1, 'hospital');     s = place(s,  5,  1, 'hospital');
  s = place(s, 11,  1, 'school');       s = place(s, 17,  1, 'university');
  s = place(s, 23,  1, 'fire_station'); s = place(s, 29,  1, 'police_station');
  s = place(s, 35,  1, 'water_pump');   s = place(s, 38,  1, 'power_plant');
  s = place(s,  2,  4, 'fire_station'); s = place(s,  5,  4, 'police_station');
  s = place(s, 11,  4, 'school');       s = place(s, 35,  4, 'hospital');
  s = place(s, 38,  4, 'power_plant');
  s = place(s,  2,  7, 'park');         s = place(s,  5,  7, 'park');
  s = place(s, 38, 10, 'waste_plant');  s = place(s, 35, 10, 'waste_plant');
  s = place(s,  2, 13, 'water_pump');   s = place(s,  5, 13, 'power_plant');
  s = place(s, 38, 13, 'police_station'); s = place(s, 35, 13, 'fire_station');
  s = place(s,  2, 16, 'waste_plant');  s = place(s, 38, 16, 'waste_plant');
  s = place(s, 38, 17, 'water_pump');   s = place(s, 35, 17, 'power_plant');

  return finalise(s, 520, 52);
}

// ─────────────────────────────────────────────
//  SEED 4 — "La Crisis Fiscal"
//  Ciudad al borde de la quiebra. Bonos activos,
//  presupuestos recortados, edificios abandonados.
//  Año 14, Pop ~140, $1 800, Deuda $78 000, Felicidad 32 %
// ─────────────────────────────────────────────

export function createSeed4(): GameState {
  const bond1: Bond = {
    id: 'bond-crisis-1',
    amount: 50_000,
    termMonths: 240,
    monthsRemaining: 192,
    monthlyPayment: 400,
    interestRate: 0.12,
    rating: 'B',
  };
  const bond2: Bond = {
    id: 'bond-crisis-2',
    amount: 30_000,
    termMonths: 120,
    monthsRemaining: 88,
    monthlyPayment: 350,
    interestRate: 0.15,
    rating: 'D',
  };

  let s = baseState({
    year: 14, month: 4, tickCount: 172,
    economy: {
      ...createDefaultEconomy(),
      balance: 1_800, debt: 78_000,
      lastIncome: 1_350, lastExpenses: 2_800,
      taxRate: 28,
      serviceBudgets: [
        { service: 'water',       allocation: 60  },
        { service: 'electricity', allocation: 60  },
        { service: 'garbage',     allocation: 50  },
        { service: 'police',      allocation: 70  },
        { service: 'fire',        allocation: 70  },
        { service: 'education',   allocation: 50  },
        { service: 'health',      allocation: 50  },
      ],
      bonds: [bond1, bond2],
      bondDefaultRisk: 4,
    },
    rciDemand: { r: 80, c: 65, i: 55 },
    milestones: doneMilestones(
      ['first_road','first_residents','lights_on','first_business',
       'first_tier2','hundred_residents','safe_city','production_chain'], 4, 1,
    ),
    log: [{
      id: 'seed-4',
      timestamp: 'Año 14, Mes 04',
      message: 'SEED 4 — La Crisis Fiscal. Pago bonos: $750/mes. Ingresos: $1 350/mes. Sin acción, bancarrota en 3 meses.',
      severity: 'critical', source: 'system',
    }],
  });

  // Sparse road skeleton — less built than in prime years
  s = hLine(s, 0, 0, 39, 'highway');
  s = hLine(s, 9, 0, 39, 'avenue');
  s = vLine(s,  0, 0, 19, 'avenue');
  s = vLine(s, 19, 0, 19, 'avenue');
  s = vLine(s, 39, 0, 19, 'avenue');
  s = vLine(s,  9,  1,  8, 'road'); s = vLine(s,  9, 10, 19, 'road');
  s = vLine(s, 29,  1,  8, 'road'); s = vLine(s, 29, 10, 19, 'road');
  s = hLine(s,  5,  1, 18, 'road'); s = hLine(s,  5, 20, 38, 'road');
  s = hLine(s, 14,  1, 18, 'road'); s = hLine(s, 14, 20, 38, 'road');

  // Residential — mostly level 1 (people fled), a few level 2 remnants
  s = fillZone(s,  1, 1,  8,  4, 'residential', 1, 3, 2);
  s = fillZone(s, 10, 1, 18,  4, 'residential', 2, 6, 2);
  s = fillZone(s,  1, 6,  8,  8, 'residential', 1, 2, 1);
  s = fillZone(s, 10, 6, 18,  8, 'residential', 1, 3, 1);
  s = fillZone(s, 20, 1, 28,  4, 'residential', 1, 3, 2);
  s = fillZone(s, 30, 1, 38,  4, 'residential', 2, 5, 2);
  s = fillZone(s, 20, 6, 28,  8, 'residential', 1, 2, 1);
  s = fillZone(s, 30, 6, 38,  8, 'residential', 1, 3, 1);

  // Mark some tiles as damaged (abandoned)
  const damaged: Array<[number, number]> = [[3,3],[4,3],[5,3],[11,7],[12,7],[25,2],[26,2],[35,7],[36,7]];
  for (const [x, y] of damaged) {
    s = patchTile(s, x, y, { damaged: true });
  }

  // Commercial — mostly low-level, bleeding out
  s = fillZone(s,  1, 10, 18, 13, 'commercial', 1, 3, 1);
  s = fillZone(s, 20, 10, 38, 13, 'commercial', 1, 3, 1);

  // Industrial — small, barely running
  s = fillZone(s,  1, 15, 18, 18, 'industrial', 1, 2, 1);
  s = fillZone(s, 20, 15, 38, 18, 'industrial', 1, 2, 1);

  // Underfunded skeleton services — no waste plant at all
  s = place(s,  1,  2, 'fire_station');
  s = place(s,  1,  7, 'police_station');
  s = place(s, 18,  2, 'hospital');
  s = place(s, 18,  7, 'school');
  s = place(s, 20,  2, 'water_pump');
  s = place(s, 20,  7, 'power_plant');

  return finalise(s, 140, 32);
}

// ─────────────────────────────────────────────
//  SEED 5 — "Casi la Victoria"
//  Ciudad verde y bien planificada.
//  Un tick = victoria (city_charter).
//  Año 10, Pop ~510, $26 500, Felicidad 78 %
// ─────────────────────────────────────────────

export function createSeed5(): GameState {
  let s = baseState({
    year: 10, month: 1, tickCount: 120,
    economy: {
      ...createDefaultEconomy(),
      balance: 26_500, debt: 0,
      lastIncome: 4_100, lastExpenses: 2_200,
      taxRate: 14,
      serviceBudgets: [
        { service: 'water',       allocation: 500 },
        { service: 'electricity', allocation: 500 },
        { service: 'garbage',     allocation: 400 },
        { service: 'police',      allocation: 450 },
        { service: 'fire',        allocation: 450 },
        { service: 'education',   allocation: 400 },
        { service: 'health',      allocation: 400 },
      ],
      bonds: [],
      bondDefaultRisk: 0,
    },
    rciDemand: { r: 10, c: 35, i: 60 },
    milestones: doneMilestones(
      ['first_road','first_residents','lights_on','first_business',
       'first_tier2','hundred_residents','safe_city','tier3_district',
       'traffic_master','production_chain'], 6, 8,
    ),
    log: [{
      id: 'seed-5',
      timestamp: 'Año 10, Mes 01',
      message: 'SEED 5 — Casi la Victoria. Pop ~510, Felicidad 78 %, $26 500. Condición: 500 hab + 75 % felicidad + $25 000. ¡Pulsa Tick y gana!',
      severity: 'info', source: 'system',
    }],
  });

  // Well-planned road network
  s = hLine(s,  0, 0, 39, 'highway');
  s = hLine(s,  7, 0, 39, 'avenue');
  s = hLine(s, 14, 0, 39, 'avenue');
  s = vLine(s,  0, 0, 19, 'avenue');
  s = vLine(s, 13, 0, 19, 'avenue');
  s = vLine(s, 26, 0, 19, 'avenue');
  s = vLine(s, 39, 0, 19, 'avenue');
  s = vLine(s,  6,  1,  6, 'road'); s = vLine(s,  6,  8, 13, 'road'); s = vLine(s,  6, 15, 19, 'road');
  s = vLine(s, 19,  1,  6, 'road'); s = vLine(s, 19,  8, 13, 'road'); s = vLine(s, 19, 15, 19, 'road');
  s = vLine(s, 32,  1,  6, 'road'); s = vLine(s, 32,  8, 13, 'road'); s = vLine(s, 32, 15, 19, 'road');
  s = hLine(s,  3,  1, 12, 'road'); s = hLine(s,  3, 14, 25, 'road'); s = hLine(s,  3, 27, 38, 'road');
  s = hLine(s, 10,  1, 12, 'road'); s = hLine(s, 10, 14, 25, 'road'); s = hLine(s, 10, 27, 38, 'road');
  s = hLine(s, 17,  1, 12, 'road'); s = hLine(s, 17, 14, 25, 'road'); s = hLine(s, 17, 27, 38, 'road');

  // North – high-density residential + generous parks
  s = fillZone(s,  1, 1,  5,  2, 'residential', 3, 20, 3);
  s = fillZone(s,  7, 1, 12,  2, 'residential', 3, 20, 3);
  s = fillZone(s,  1, 4,  5,  6, 'residential', 3, 18, 3);
  s = fillZone(s,  7, 4, 12,  6, 'residential', 2,  9, 2);
  // Parks interspersed NW
  s = place(s, 3, 1, 'park'); s = place(s, 4, 1, 'park');
  s = place(s, 3, 2, 'park'); s = place(s, 4, 2, 'park');
  // NC residential + large park strip
  s = fillZone(s, 14,  1, 18,  2, 'residential', 3, 18, 3);
  s = fillZone(s, 20,  1, 25,  2, 'residential', 3, 18, 3);
  for (let x = 14; x <= 25; x++) s = place(s, x, 4, 'park');
  for (let x = 14; x <= 25; x++) s = place(s, x, 5, 'park');
  for (let x = 14; x <= 25; x++) s = place(s, x, 6, 'park');
  // NE residential + corner parks
  s = fillZone(s, 27, 1, 31,  2, 'residential', 3, 20, 3);
  s = fillZone(s, 33, 1, 38,  2, 'residential', 2,  9, 2);
  s = fillZone(s, 27, 4, 31,  6, 'residential', 2,  9, 2);
  for (const [x, y] of [[33,4],[34,4],[33,5],[34,5],[33,6],[34,6],[35,6],[36,6]]) s = place(s, x, y, 'park');

  // Service ring (fully funded, radius boosted by budget)
  s = place(s,  1, 1, 'hospital');      s = place(s,  2, 1, 'hospital');
  s = place(s, 11, 1, 'school');        s = place(s, 12, 1, 'university');
  s = place(s, 37, 1, 'hospital');      s = place(s, 38, 1, 'school');
  s = place(s,  1, 4, 'fire_station'); s = place(s,  2, 4, 'police_station');
  s = place(s, 11, 4, 'fire_station'); s = place(s, 12, 4, 'police_station');
  s = place(s, 37, 4, 'fire_station'); s = place(s, 38, 4, 'police_station');

  // Mid – rich commercial + clean industrial (waste plants inline)
  s = fillZone(s,  1,  8,  5,  9, 'commercial', 3, 18, 3);
  s = fillZone(s,  7,  8, 12,  9, 'commercial', 3, 18, 3);
  s = fillZone(s,  1, 11,  5, 13, 'commercial', 2,  8, 2);
  s = fillZone(s,  7, 11, 12, 13, 'commercial', 2,  8, 2);
  s = fillZone(s, 14,  8, 18, 13, 'commercial', 3, 15, 3);
  s = fillZone(s, 20,  8, 25, 13, 'commercial', 2,  8, 2);
  s = fillZone(s, 27,  8, 31,  9, 'industrial', 2, 5, 2);
  s = place(s, 27, 11, 'waste_plant'); s = place(s, 28, 11, 'waste_plant');
  s = fillZone(s, 29, 11, 31, 13, 'industrial', 2, 5, 2);
  s = fillZone(s, 33,  8, 38, 13, 'industrial', 2, 4, 2);
  s = place(s, 33,  9, 'waste_plant'); s = place(s, 38,  9, 'waste_plant');
  // Utilities
  s = place(s,  1, 8, 'power_plant'); s = place(s,  2, 8, 'power_plant');
  s = place(s,  1, 9, 'water_pump');  s = place(s,  2, 9, 'water_pump');
  s = place(s, 12, 8, 'power_plant'); s = place(s, 12, 9, 'water_pump');
  s = place(s, 38, 8, 'power_plant'); s = place(s, 37, 8, 'water_pump');

  // South – production chain + parks + clean industrial
  s = fillZone(s, 1, 15, 5, 16, 'farm', 1, 0, 1);
  s = place(s, 1, 18, 'granary'); s = place(s, 2, 18, 'mill');
  s = place(s, 3, 18, 'bakery');  s = place(s, 4, 18, 'iron_mine');
  s = place(s, 5, 18, 'foundry'); s = place(s, 6, 18, 'tools_workshop');
  for (let x = 1; x <= 6; x++) s = place(s, x, 19, 'park');

  s = fillZone(s,  7, 15, 12, 19, 'industrial', 2, 4, 2);
  s = place(s, 9, 15, 'waste_plant'); s = place(s, 10, 15, 'waste_plant');

  for (let x = 14; x <= 38; x++) s = place(s, x, 15, 'park');  // green belt

  s = fillZone(s, 14, 16, 25, 19, 'industrial', 2, 4, 2);
  s = place(s, 14, 16, 'waste_plant'); s = place(s, 20, 16, 'waste_plant');
  s = fillZone(s, 27, 16, 38, 19, 'industrial', 3, 6, 3);
  s = place(s, 27, 16, 'waste_plant'); s = place(s, 33, 16, 'waste_plant');
  s = place(s, 38, 15, 'power_plant'); s = place(s, 38, 16, 'water_pump');

  return finalise(s, 510, 78);
}

// ─────────────────────────────────────────────
//  Export map — used by the `seed` command
// ─────────────────────────────────────────────

export const SEED_FACTORIES: Record<number, () => GameState> = {
  1: createSeed1,
  2: createSeed2,
  3: createSeed3,
  4: createSeed4,
  5: createSeed5,
};

export const SEED_LABELS: Record<number, string> = {
  1: '#1  La Ciudad Balanceada      — Año 6,  ~430 hab, $38 500, 68 % felicidad',
  2: '#2  El Cinturón Industrial    — Año 9,  ~250 hab, $82 000, 38 % (contaminación crítica)',
  3: '#3  La Metrópolis Congestionada — Año 10, ~520 hab, $22 000, 52 % (tráfico colapsado)',
  4: '#4  La Crisis Fiscal          — Año 14, ~140 hab, $1 800,  32 % (quiebra inminente)',
  5: '#5  Casi la Victoria          — Año 10, ~510 hab, $26 500, 78 % (1 tick = ganar)',
};

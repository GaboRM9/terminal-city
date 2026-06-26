import type { GameState, Tile, ZoneType } from '../engine/types';
import {
  createWorld, zoneTile, recalculateRoadAccess,
  computeServiceCoverage, computeTotalPopulation,
} from '../engine/world';
import { createDefaultEconomy } from '../engine/economy';
import { createInitialMilestones } from './milestoneDefs';
import { computePollution } from '../engine/pollution';
import { computeTraffic } from '../engine/traffic';

// ─────────────────────────────────────────────
//  Seed city — mid-game state for QA / demo
//
//  Layout (40×20):
//
//  y=0  HIGHWAY ═══════════════════════════════
//  y=1..7   North: residential + parks + services
//  y=8  AVENUE  ───────────────────────────────
//  y=9..14  Mid: commercial core + industrial
//  y=15 AVENUE  ───────────────────────────────
//  y=16..19 South: production chains + heavy industry
//
//  Vertical avenues: x=0, x=14, x=28, x=39
//  Interior roads:   x=7, x=21, x=34 (vert)
//                    y=4, y=11, y=18 (horiz)
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

function setTileProps(s: GameState, x: number, y: number, props: Partial<Tile>): GameState {
  const idx = y * W + x;
  const tiles = [...s.tiles];
  tiles[idx] = { ...tiles[idx], ...props };
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
      s = setTileProps(s, x, y, { zoneLevel: level, population: pop });
    }
  }
  return s;
}

function place(s: GameState, x: number, y: number, type: ZoneType): GameState {
  if (s.tiles[y * W + x].type !== 'empty') return s;
  return zoneTile(s, x, y, type);
}

export function createTestCity(): GameState {
  let s: GameState = {
    worldWidth: W,
    worldHeight: 20,
    tiles: createWorld(W, 20),
    year: 6,
    month: 3,
    economy: {
      ...createDefaultEconomy(),
      balance: 38_500,
      debt: 4_000,
      lastIncome: 3_200,
      lastExpenses: 2_050,
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
    population: 0,
    happiness: 68,
    productionChains: [],
    eventLog: [],
    pixelgramPosts: [],
    rciDemand: { r: 25, c: 55, i: 40 },
    milestones: createInitialMilestones().map((m) =>
      ['first_road', 'first_residents', 'lights_on', 'first_business',
        'first_tier2', 'hundred_residents', 'safe_city'].includes(m.id)
        ? { ...m, completed: true, completedYear: 3, completedMonth: 6 }
        : m,
    ),
    victory: false,
    log: [{
      id: 'seed-0',
      timestamp: 'Año 6, Mes 03',
      message: 'Ciudad semilla cargada — Año 6, ~430 hab, $38,500 balance. ¡A construir!',
      severity: 'info',
      source: 'system',
    }],
    speed: 'pause',
    running: false,
    tickCount: 72,
    hasInfrastructure: true,
    history: [],
    avgPollution: 0,
    avgTrafficLoad: 0,
    districts: [],
  };

  // ── Road skeleton ────────────────────────────

  // Top highway
  s = hLine(s, 0, 0, 39, 'highway');

  // Horizontal avenues (zone dividers)
  s = hLine(s, 8,  0, 39, 'avenue');
  s = hLine(s, 15, 0, 39, 'avenue');

  // Vertical avenues (column dividers)
  s = vLine(s,  0, 0, 19, 'avenue');
  s = vLine(s, 14, 0, 19, 'avenue');
  s = vLine(s, 28, 0, 19, 'avenue');
  s = vLine(s, 39, 0, 19, 'avenue');

  // Interior vertical roads
  s = vLine(s,  7,  1,  7, 'road');
  s = vLine(s,  7,  9, 14, 'road');
  s = vLine(s,  7, 16, 19, 'road');
  s = vLine(s, 21,  1,  7, 'road');
  s = vLine(s, 21,  9, 14, 'road');
  s = vLine(s, 21, 16, 19, 'road');
  s = vLine(s, 34,  1,  7, 'road');
  s = vLine(s, 34,  9, 14, 'road');
  s = vLine(s, 34, 16, 19, 'road');

  // Interior horizontal cross streets
  s = hLine(s,  4,  1, 13, 'road');
  s = hLine(s,  4, 15, 27, 'road');
  s = hLine(s,  4, 29, 38, 'road');
  s = hLine(s, 11,  1, 13, 'road');
  s = hLine(s, 11, 15, 27, 'road');
  s = hLine(s, 11, 29, 38, 'road');
  s = hLine(s, 18,  1, 13, 'road');
  s = hLine(s, 18, 15, 27, 'road');
  s = hLine(s, 18, 29, 38, 'road');

  // ── North zone (y=1..7): residential + services ──

  // NW: high-density towers + medium apartments
  s = fillZone(s,  1, 1,  6, 3, 'residential', 3, 18, 3);
  s = fillZone(s,  8, 1, 13, 3, 'residential', 3, 18, 3);
  s = fillZone(s,  1, 5,  6, 7, 'residential', 2,  8, 2);
  s = fillZone(s,  8, 5, 13, 7, 'residential', 2,  8, 2);

  // NC: high residential top + park strip + small commercial
  s = fillZone(s, 15, 1, 20, 3, 'residential', 3, 15, 3);
  s = fillZone(s, 22, 1, 27, 3, 'residential', 2,  8, 2);
  for (let x = 15; x <= 20; x++) { s = place(s, x, 5, 'park'); s = place(s, x, 6, 'park'); s = place(s, x, 7, 'park'); }
  s = fillZone(s, 22, 5, 27, 7, 'commercial', 1, 5, 1);

  // NE: medium residential + service hub on far-right strip
  s = fillZone(s, 29, 1, 33, 3, 'residential', 2, 8, 2);
  s = fillZone(s, 29, 5, 33, 7, 'residential', 1, 3, 1);

  // Service hub (x=35..38, y=1..7)
  s = place(s, 35, 1, 'hospital');
  s = place(s, 36, 1, 'hospital');
  s = place(s, 37, 1, 'school');
  s = place(s, 38, 1, 'university');
  s = place(s, 35, 2, 'fire_station');
  s = place(s, 36, 2, 'police_station');
  s = place(s, 37, 2, 'park');
  s = place(s, 38, 2, 'park');
  s = place(s, 35, 3, 'water_pump');
  s = place(s, 36, 3, 'power_plant');
  s = place(s, 37, 3, 'waste_plant');
  s = place(s, 38, 3, 'park');
  s = place(s, 35, 5, 'park');
  s = place(s, 36, 5, 'park');
  s = place(s, 37, 6, 'park');
  s = place(s, 38, 6, 'park');

  // Extra services for NW coverage
  s = place(s,  1, 3, 'fire_station');
  s = place(s, 13, 3, 'police_station');
  s = place(s, 20, 2, 'school');
  s = place(s, 13, 6, 'hospital');

  // ── Middle zone (y=9..14): commercial + industrial ──

  // W: commercial core (high-density stores + offices)
  s = fillZone(s,  1,  9,  6, 10, 'commercial', 3, 18, 3);
  s = fillZone(s,  8,  9, 13, 10, 'commercial', 3, 18, 3);
  s = fillZone(s,  1, 12,  6, 14, 'commercial', 2,  8, 2);
  s = fillZone(s,  8, 12, 13, 14, 'commercial', 2,  8, 2);

  // C: light-to-medium industrial
  s = fillZone(s, 15,  9, 20, 14, 'industrial', 1, 2, 1);
  s = fillZone(s, 22,  9, 27, 14, 'industrial', 2, 4, 2);

  // E: heavier industrial + services
  s = fillZone(s, 29,  9, 33, 14, 'industrial', 2, 4, 2);
  s = fillZone(s, 35,  9, 38, 10, 'industrial', 3, 6, 3);
  s = place(s, 35, 12, 'police_station');
  s = place(s, 36, 12, 'fire_station');
  s = place(s, 37, 12, 'waste_plant');
  s = place(s, 38, 12, 'park');
  s = place(s, 35, 13, 'park');
  s = place(s, 36, 13, 'power_plant');
  s = place(s, 37, 13, 'water_pump');
  s = place(s, 38, 13, 'hospital');

  // ── South zone (y=16..19): production + heavy industry ──

  // SW: farm + production chain
  s = fillZone(s, 1, 16, 6, 17, 'farm', 1, 0, 1);
  s = place(s, 1, 19, 'granary');
  s = place(s, 2, 19, 'mill');
  s = place(s, 3, 19, 'bakery');
  s = place(s, 4, 19, 'iron_mine');
  s = place(s, 5, 19, 'foundry');
  s = place(s, 6, 19, 'tools_workshop');
  s = fillZone(s,  8, 16, 13, 19, 'industrial', 1, 2, 1);

  // SC: medium industrial
  s = fillZone(s, 15, 16, 20, 19, 'industrial', 2, 4, 2);
  s = fillZone(s, 22, 16, 27, 19, 'industrial', 2, 4, 2);

  // SE: heavy industrial + utility cluster
  s = fillZone(s, 29, 16, 33, 19, 'industrial', 3, 6, 3);
  s = place(s, 35, 16, 'power_plant');
  s = place(s, 36, 16, 'power_plant');
  s = place(s, 37, 16, 'water_pump');
  s = place(s, 38, 16, 'water_pump');
  s = place(s, 35, 17, 'waste_plant');
  s = place(s, 36, 17, 'iron_mine');
  s = place(s, 37, 17, 'foundry');
  s = place(s, 38, 17, 'tools_workshop');
  s = fillZone(s, 35, 19, 38, 19, 'industrial', 3, 5, 3);

  // ── Recalculate derived state ─────────────────

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

  return { ...s, population: totalPop, avgPollution: avgPol, avgTrafficLoad: avgTraffic };
}

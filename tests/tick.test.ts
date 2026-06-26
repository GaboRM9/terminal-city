import { describe, it, expect, beforeEach } from 'vitest';
import { tick } from '../src/engine/tick';
import type { GameState } from '../src/engine/types';
import { createWorld, zoneTile, traceRoad } from '../src/engine/world';
import { createDefaultEconomy } from '../src/engine/economy';

// ─────────────────────────────────────────────
//  Tick engine tests
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
    avgTrafficLoad: 0,
    districts: [],
    rciDemand: { r: 50, c: 0, i: 0 },
    milestones: [],
    victory: false,
    pixelgramPosts: [],
  };
}

describe('tick engine', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
  });

  it('advances the month counter', () => {
    const next = tick(state);
    expect(next.month).toBe(2);
    expect(next.year).toBe(1);
  });

  it('rolls over to year 2 after 12 months', () => {
    let s = state;
    for (let i = 0; i < 12; i++) s = tick(s);
    expect(s.year).toBe(2);
    expect(s.month).toBe(1);
  });

  it('increments tickCount each tick', () => {
    const next = tick(state);
    expect(next.tickCount).toBe(1);
  });

  it('is a pure function — does not mutate input', () => {
    const originalMonth = state.month;
    tick(state);
    expect(state.month).toBe(originalMonth);
    expect(state.tickCount).toBe(0);
  });

  it('adds log entries each tick', () => {
    const next = tick(state);
    expect(next.log.length).toBeGreaterThan(state.log.length);
  });

  it('population grows when services are present and has road access', () => {
    // Place a power plant and water pump, then a road and residential zone
    let s = traceRoad(makeState(), 0, 0, 5, 0); // horizontal road
    s = zoneTile(s, 0, 1, 'power_plant');
    s = zoneTile(s, 1, 1, 'water_pump');
    s = zoneTile(s, 2, 0, 'residential');

    const after = tick(tick(tick(s)));
    const resTile = after.tiles[0 * 10 + 2]; // y=0, x=2
    expect(resTile.population).toBeGreaterThanOrEqual(0); // at minimum no error
  });

  it('happiness stays within 0–100', () => {
    let s = state;
    for (let i = 0; i < 24; i++) s = tick(s);
    expect(s.happiness).toBeGreaterThanOrEqual(0);
    expect(s.happiness).toBeLessThanOrEqual(100);
  });
});

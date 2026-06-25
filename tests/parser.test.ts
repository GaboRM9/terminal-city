import { describe, it, expect } from 'vitest';
import { parseCommand, parseIntArg, parseCoords } from '../src/commands/parser';
import { executeCommand } from '../src/commands/executor';
import { createWorld, zoneTile } from '../src/engine/world';
import { createDefaultEconomy } from '../src/engine/economy';
import type { GameState } from '../src/engine/types';

// ─────────────────────────────────────────────
//  Parser and command executor tests
// ─────────────────────────────────────────────

function makeState(): GameState {
  return {
    worldWidth: 20,
    worldHeight: 20,
    tiles: createWorld(20, 20),
    year: 1,
    month: 1,
    economy: { ...createDefaultEconomy(), balance: 100_000 },
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

describe('parseCommand', () => {
  it('parses a simple command', () => {
    const result = parseCommand('zone 3 7 residential');
    expect(result.name).toBe('zone');
    expect(result.args).toEqual(['3', '7', 'residential']);
  });

  it('parses two-word commands', () => {
    expect(parseCommand('next turn').name).toBe('next turn');
    expect(parseCommand('view stats').name).toBe('view stats');
    expect(parseCommand('view map').name).toBe('view map');
  });

  it('returns empty name for blank input', () => {
    expect(parseCommand('   ').name).toBe('');
  });

  it('lowercases the command name', () => {
    expect(parseCommand('ZONE 1 2 residential').name).toBe('zone');
  });

  it('trims extra whitespace', () => {
    const result = parseCommand('  road  1  2  5  2  ');
    expect(result.name).toBe('road');
    expect(result.args).toEqual(['1', '2', '5', '2']);
  });
});

describe('parseIntArg', () => {
  it('parses valid integers', () => {
    expect(parseIntArg('5')).toBe(5);
    expect(parseIntArg('0')).toBe(0);
  });

  it('returns null for non-numeric', () => {
    expect(parseIntArg('abc')).toBeNull();
    expect(parseIntArg('')).toBeNull();
  });
});

describe('parseCoords', () => {
  it('parses valid coords within bounds', () => {
    expect(parseCoords('3', '4', 10, 10)).toEqual({ x: 3, y: 4 });
  });

  it('returns null for out-of-bounds coords', () => {
    expect(parseCoords('15', '4', 10, 10)).toBeNull();
    expect(parseCoords('3', '15', 10, 10)).toBeNull();
  });

  it('returns null for negative coords', () => {
    expect(parseCoords('-1', '4', 10, 10)).toBeNull();
  });
});

describe('executeCommand', () => {
  it('returns error for unknown command', () => {
    const [, result] = executeCommand('foobar', makeState());
    expect(result.success).toBe(false);
    expect(result.message).toContain('Comando desconocido');
  });

  it('zones a tile successfully', () => {
    const [next, result] = executeCommand('zone 5 5 residential', makeState());
    expect(result.success).toBe(true);
    expect(next.tiles[5 * 20 + 5].type).toBe('residential');
  });

  it('fails to zone with insufficient funds', () => {
    const poor = { ...makeState(), economy: { ...createDefaultEconomy(), balance: 0 } };
    const [, result] = executeCommand('zone 5 5 residential', poor);
    expect(result.success).toBe(false);
  });

  it('changes tax rate', () => {
    const [next, result] = executeCommand('tax 20', makeState());
    expect(result.success).toBe(true);
    expect(next.economy.taxRate).toBe(20);
  });

  it('rejects invalid tax rate', () => {
    const [, result] = executeCommand('tax 99', makeState());
    expect(result.success).toBe(false);
  });

  it('help command returns command list', () => {
    const [, result] = executeCommand('help', makeState());
    expect(result.success).toBe(true);
    expect(result.message).toContain('zone');
    expect(result.message).toContain('road');
  });

  it('next turn advances the month', () => {
    const [next] = executeCommand('next turn', makeState());
    expect(next.month).toBe(2);
  });

  it('demolish returns tile to empty', () => {
    let s = makeState();
    s = zoneTile(s, 3, 3, 'residential');
    const [next, result] = executeCommand('demolish 3 3', s);
    expect(result.success).toBe(true);
    expect(next.tiles[3 * 20 + 3].type).toBe('empty');
  });
});

import { create } from 'zustand';
import type { GameState, LogEntry, ServiceType, SimulationSpeed, ZoneType } from '../engine/types';
import { createWorld, demolishTile, recalculateRoadAccess, traceRoad, zoneTile } from '../engine/world';
import { tick } from '../engine/tick';
import { createDefaultEconomy, setServiceBudget, setTaxRate } from '../engine/economy';
import { BALANCE } from '../data/balanceConfig';
import { BUILDINGS } from '../data/buildings';
import { createInitialMilestones } from '../data/milestoneDefs';

// ─────────────────────────────────────────────
//  Zustand store — global game state + actions
// ─────────────────────────────────────────────

const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 20;
const MAX_UNDO_HISTORY = 10;
const AUTOSAVE_INTERVAL = 12; // ticks
const SAVE_KEY_PREFIX = 'terminal-city-save-';

function createInitialState(): GameState {
  return {
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    tiles: createWorld(WORLD_WIDTH, WORLD_HEIGHT),
    year: 1,
    month: 1,
    economy: createDefaultEconomy(),
    population: 0,
    happiness: 50,
    productionChains: [],
    eventLog: [],
    pixelgramPosts: [],
    rciDemand: { r: 50, c: 0, i: 0 },
    milestones: createInitialMilestones(),
    victory: false,
    log: [
      {
        id: 'log-0',
        timestamp: 'Año 1, Mes 01',
        message: 'Terminal City v0.1 iniciado. Escribe "help" para ver los comandos disponibles.',
        severity: 'info',
        source: 'system',
      },
    ],
    speed: 1,
    running: false,
    tickCount: 0,
    hasInfrastructure: false,
    history: [],
    avgPollution: 0,
  };
}

export interface SaveSlotMeta {
  slot: number;
  isEmpty: boolean;
  year?: number;
  month?: number;
  population?: number;
  balance?: number;
}

export type DensityTool =
  | 'residential-low' | 'residential-medium' | 'residential-high'
  | 'commercial-low' | 'commercial-medium' | 'commercial-high'
  | 'industrial-light' | 'industrial-medium' | 'industrial-heavy';

export type BuildTool = ZoneType | 'road' | 'demolish' | DensityTool;

const DENSITY_TOOL_MAP: Record<DensityTool, { zone: ZoneType; cap: 1 | 2 | 3 }> = {
  'residential-low':    { zone: 'residential', cap: 1 },
  'residential-medium': { zone: 'residential', cap: 2 },
  'residential-high':   { zone: 'residential', cap: 3 },
  'commercial-low':     { zone: 'commercial',  cap: 1 },
  'commercial-medium':  { zone: 'commercial',  cap: 2 },
  'commercial-high':    { zone: 'commercial',  cap: 3 },
  'industrial-light':   { zone: 'industrial',  cap: 1 },
  'industrial-medium':  { zone: 'industrial',  cap: 2 },
  'industrial-heavy':   { zone: 'industrial',  cap: 3 },
};

function parseDensityTool(tool: BuildTool): { zone: ZoneType; cap: 1 | 2 | 3 } | null {
  return DENSITY_TOOL_MAP[tool as DensityTool] ?? null;
}

interface GameStore {
  state: GameState;
  actionHistory: GameState[];

  // Build mode UI state (not part of game state)
  buildTool: BuildTool | null;
  roadStart: { x: number; y: number } | null;

  // Panel toggle: pixelgram | livestats | charts
  showLivestats: boolean;
  showCharts: boolean;
  toggleLivestats: () => void;
  toggleCharts: () => void;

  // Simulation control
  startSimulation: () => void;
  pauseSimulation: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  advanceTick: () => void;

  // Map actions
  zoneAt: (x: number, y: number, zone: ZoneType) => void;
  buildRoad: (x1: number, y1: number, x2: number, y2: number) => void;
  demolishAt: (x: number, y: number) => void;

  // Build mode actions
  selectBuildTool: (tool: BuildTool | null) => void;
  handleTileClick: (x: number, y: number) => void;

  // Economy actions
  changeTaxRate: (rate: number) => void;
  changeServiceBudget: (service: ServiceType, amount: number) => void;

  // Log
  addLog: (message: string, severity?: LogEntry['severity'], source?: LogEntry['source']) => void;

  // Undo
  undo: () => void;

  // Persistence
  saveGame: (slot?: number) => void;
  loadGame: (slot?: number) => boolean;
  getSavesMeta: () => SaveSlotMeta[];
  resetGame: () => void;
}

let _tickInterval: ReturnType<typeof setInterval> | null = null;

function performTick(state: GameState): GameState {
  const next = tick(state);
  if (next.tickCount % AUTOSAVE_INTERVAL === 0) {
    try {
      localStorage.setItem(`${SAVE_KEY_PREFIX}0`, JSON.stringify(next));
    } catch { /* quota exceeded — ignore */ }
  }
  return next;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  actionHistory: [],
  buildTool: null,
  roadStart: null,
  showLivestats: false,
  showCharts: false,
  toggleLivestats: () => set((s) => ({ showLivestats: !s.showLivestats, showCharts: false })),
  toggleCharts: () => set((s) => ({ showCharts: !s.showCharts, showLivestats: false })),

  startSimulation: () => {
    const { state } = get();
    if (state.running) return;

    const speedMs: Record<string, number> = { 1: 3000, 2: 1500, 3: 750 };
    const ms = speedMs[String(state.speed)] ?? 3000;

    _tickInterval = setInterval(() => {
      set((s) => ({ state: performTick(s.state) }));
    }, ms);

    set((s) => ({ state: { ...s.state, running: true } }));
  },

  pauseSimulation: () => {
    if (_tickInterval) {
      clearInterval(_tickInterval);
      _tickInterval = null;
    }
    set((s) => ({ state: { ...s.state, running: false, speed: 'pause' } }));
  },

  setSpeed: (speed: SimulationSpeed) => {
    if (_tickInterval) {
      clearInterval(_tickInterval);
      _tickInterval = null;
    }

    if (speed === 'pause') {
      set((s) => ({ state: { ...s.state, speed: 'pause', running: false } }));
      return;
    }

    const speedMs: Record<string, number> = { 1: 3000, 2: 1500, 3: 750 };
    const ms = speedMs[String(speed)] ?? 3000;

    _tickInterval = setInterval(() => {
      set((s) => ({ state: performTick(s.state) }));
    }, ms);

    set((s) => ({ state: { ...s.state, speed, running: true } }));
  },

  advanceTick: () => {
    set((s) => ({ state: performTick(s.state) }));
  },

  zoneAt: (x, y, zone) => {
    const { state } = get();
    const def = BUILDINGS.find((b) => b.type === zone);
    if (def && state.economy.balance < def.cost) {
      get().addLog(`Fondos insuficientes. Necesitas $${def.cost}.`, 'warning', 'command');
      return;
    }

    let next = zoneTile(state, x, y, zone);
    if (def && zone !== 'empty') {
      next = {
        ...next,
        economy: { ...next.economy, balance: next.economy.balance - def.cost },
      };
    }
    next = recalculateRoadAccess(next);
    set((s) => ({
      state: next,
      actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
    }));
  },

  buildRoad: (x1, y1, x2, y2) => {
    const { state } = get();
    set((s) => ({
      state: traceRoad(s.state, x1, y1, x2, y2),
      actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
    }));
  },

  demolishAt: (x, y) => {
    const { state } = get();
    set((s) => ({
      state: demolishTile(s.state, x, y),
      actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
    }));
  },

  selectBuildTool: (tool) => {
    set({ buildTool: tool, roadStart: null });
    if (tool) {
      get().addLog(
        tool === 'road'
          ? 'Herramienta: Carretera. Haz click en el punto de inicio.'
          : tool === 'demolish'
          ? 'Herramienta: Demoler. Haz click en el tile a demoler.'
          : `Herramienta: ${tool}. Haz click en el mapa para construir.`,
        'info',
        'system',
      );
    }
  },

  handleTileClick: (x, y) => {
    const { buildTool, roadStart, state } = get();
    if (!buildTool) return;

    if (buildTool === 'demolish') {
      const tile = state.tiles[y * state.worldWidth + x];
      if (tile?.type === 'empty') {
        get().addLog(`No hay nada que demoler en (${x},${y}).`, 'warning', 'system');
        return;
      }
      set((s) => ({
        state: demolishTile(s.state, x, y),
        actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
      }));
      get().addLog(`Demolido: (${x},${y}).`, 'info', 'system');
      return;
    }

    if (buildTool === 'road') {
      if (!roadStart) {
        set({ roadStart: { x, y } });
        get().addLog(`Inicio de carretera en (${x},${y}). Haz click en el destino.`, 'info', 'system');
      } else {
        const steps = Math.abs(x - roadStart.x) + Math.abs(y - roadStart.y);
        const cost = steps * 10;
        if (state.economy.balance < cost) {
          get().addLog(`Fondos insuficientes. Necesitas $${cost}.`, 'warning', 'system');
          set({ roadStart: null });
          return;
        }
        set((s) => ({
          state: traceRoad(s.state, roadStart.x, roadStart.y, x, y),
          actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
          roadStart: null,
        }));
        get().addLog(`Carretera trazada de (${roadStart.x},${roadStart.y}) a (${x},${y}). -$${cost}`, 'info', 'system');
      }
      return;
    }

    // Zone or building placement (with optional density variant)
    const densityInfo = parseDensityTool(buildTool);
    const effectiveZone = densityInfo ? densityInfo.zone : (buildTool as ZoneType);
    const densityCap = densityInfo?.cap;
    const building = BUILDINGS.find((b) => b.type === effectiveZone);
    const cost = building?.cost ?? 0;
    if (cost > 0 && state.economy.balance < cost) {
      get().addLog(`Fondos insuficientes. Necesitas $${cost}.`, 'warning', 'system');
      return;
    }

    let next = zoneTile(state, x, y, effectiveZone, densityCap);
    if (cost > 0) {
      next = { ...next, economy: { ...next.economy, balance: next.economy.balance - cost } };
    }
    next = recalculateRoadAccess(next);
    set((s) => ({
      state: next,
      actionHistory: [state, ...s.actionHistory].slice(0, MAX_UNDO_HISTORY),
    }));
    get().addLog(
      `${building?.name ?? effectiveZone} construido en (${x},${y}).${cost > 0 ? ` -$${cost}` : ''}${densityCap ? ` (densidad cap: ${densityCap})` : ''}`,
      'info',
      'system',
    );
  },

  changeTaxRate: (rate) => {
    set((s) => ({ state: setTaxRate(s.state, rate) }));
  },

  changeServiceBudget: (service, amount) => {
    set((s) => ({ state: setServiceBudget(s.state, service, amount) }));
  },

  addLog: (message, severity = 'info', source = 'system') => {
    const { state } = get();
    const entry: LogEntry = {
      id: `log-ui-${Date.now()}`,
      timestamp: `Año ${state.year}, Mes ${String(state.month).padStart(2, '0')}`,
      message,
      severity,
      source,
    };
    set((s) => ({
      state: {
        ...s.state,
        log: [...s.state.log, entry].slice(-BALANCE.maxLogEntries),
      },
    }));
  },

  undo: () => {
    const { actionHistory } = get();
    if (actionHistory.length === 0) {
      get().addLog('No hay acciones para deshacer.', 'warning', 'system');
      return;
    }
    const [prev, ...rest] = actionHistory;
    set({ state: prev, actionHistory: rest });
    get().addLog('Acción deshecha.', 'info', 'system');
  },

  saveGame: (slot = 0) => {
    const { state } = get();
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      get().addLog(`Partida guardada en ranura ${slot}.`, 'info', 'system');
    } catch {
      get().addLog('Error al guardar la partida.', 'warning', 'system');
    }
  },

  loadGame: (slot = 0) => {
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        get().addLog(`Ranura ${slot} está vacía.`, 'warning', 'system');
        return false;
      }
      const loaded = JSON.parse(raw) as GameState;
      set({ state: { ...loaded, running: false }, actionHistory: [] });
      get().addLog(`Partida cargada desde ranura ${slot}.`, 'info', 'system');
      return true;
    } catch {
      get().addLog('Error al cargar la partida. Archivo corrupto.', 'warning', 'system');
      return false;
    }
  },

  getSavesMeta: (): SaveSlotMeta[] => {
    return [0, 1, 2].map((slot) => {
      try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
        if (!raw) return { slot, isEmpty: true };
        const s = JSON.parse(raw) as GameState;
        return {
          slot,
          isEmpty: false,
          year: s.year,
          month: s.month,
          population: s.population,
          balance: s.economy.balance,
        };
      } catch {
        return { slot, isEmpty: true };
      }
    });
  },

  resetGame: () => {
    if (_tickInterval) {
      clearInterval(_tickInterval);
      _tickInterval = null;
    }
    set({ state: createInitialState(), actionHistory: [] });
  },
}));

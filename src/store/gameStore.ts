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
  };
}

const SAVE_KEY = 'terminal-city-save';

export type BuildTool = ZoneType | 'road' | 'demolish';

interface GameStore {
  state: GameState;

  // Build mode UI state (not part of game state)
  buildTool: BuildTool | null;
  roadStart: { x: number; y: number } | null;

  // Pixelgram / livestats toggle
  showLivestats: boolean;
  toggleLivestats: () => void;

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

  // Persistence
  saveGame: () => void;
  loadGame: () => boolean;
  resetGame: () => void;
}

let _tickInterval: ReturnType<typeof setInterval> | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  buildTool: null,
  roadStart: null,
  showLivestats: false,
  toggleLivestats: () => set((s) => ({ showLivestats: !s.showLivestats })),

  startSimulation: () => {
    const { state } = get();
    if (state.running) return;

    const speedMs: Record<string, number> = { 1: 3000, 2: 1500, 3: 750 };
    const ms = speedMs[String(state.speed)] ?? 3000;

    _tickInterval = setInterval(() => {
      set((s) => ({ state: tick(s.state) }));
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
      set((s) => ({ state: tick(s.state) }));
    }, ms);

    set((s) => ({ state: { ...s.state, speed, running: true } }));
  },

  advanceTick: () => {
    set((s) => ({ state: tick(s.state) }));
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
    set({ state: next });
  },

  buildRoad: (x1, y1, x2, y2) => {
    set((s) => ({ state: traceRoad(s.state, x1, y1, x2, y2) }));
  },

  demolishAt: (x, y) => {
    set((s) => ({ state: demolishTile(s.state, x, y) }));
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
      set((s) => ({ state: demolishTile(s.state, x, y) }));
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
        set((s) => ({ state: traceRoad(s.state, roadStart.x, roadStart.y, x, y), roadStart: null }));
        get().addLog(`Carretera trazada de (${roadStart.x},${roadStart.y}) a (${x},${y}). -$${cost}`, 'info', 'system');
      }
      return;
    }

    // Zone or building placement
    const building = BUILDINGS.find((b) => b.type === buildTool);
    const cost = building?.cost ?? 0;
    if (cost > 0 && state.economy.balance < cost) {
      get().addLog(`Fondos insuficientes. Necesitas $${cost}.`, 'warning', 'system');
      return;
    }

    let next = zoneTile(state, x, y, buildTool as ZoneType);
    if (cost > 0) {
      next = { ...next, economy: { ...next.economy, balance: next.economy.balance - cost } };
    }
    next = recalculateRoadAccess(next);
    set({ state: next });
    get().addLog(
      `${building?.name ?? buildTool} construido en (${x},${y}).${cost > 0 ? ` -$${cost}` : ''}`,
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

  saveGame: () => {
    const { state } = get();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      get().addLog('Partida guardada exitosamente.', 'info', 'system');
    } catch {
      get().addLog('Error al guardar la partida.', 'warning', 'system');
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const loaded = JSON.parse(raw) as GameState;
      set({ state: { ...loaded, running: false } });
      get().addLog('Partida cargada exitosamente.', 'info', 'system');
      return true;
    } catch {
      get().addLog('Error al cargar la partida. Archivo corrupto.', 'warning', 'system');
      return false;
    }
  },

  resetGame: () => {
    if (_tickInterval) {
      clearInterval(_tickInterval);
      _tickInterval = null;
    }
    set({ state: createInitialState() });
  },
}));

import type { GameEvent, GameState, Position } from './types';
import { BALANCE } from '../data/balanceConfig';

// ─────────────────────────────────────────────
//  Random event generation
// ─────────────────────────────────────────────

let _eventCounter = 0;

function makeEvent(
  year: number,
  month: number,
  message: string,
  severity: GameEvent['severity'],
  position?: Position,
): GameEvent {
  return {
    id: `evt-${++_eventCounter}`,
    year,
    month,
    message,
    severity,
    position,
  };
}

/** Fire event in industrial zone not covered by fire service */
function tryFireEvent(state: GameState): GameEvent | null {
  if (Math.random() > BALANCE.fireEventProbability) return null;

  const unprotected = state.tiles.filter(
    (t) => t.type === 'industrial' && !t.coverage.fire && t.zoneLevel > 0,
  );
  if (unprotected.length === 0) return null;

  const target = unprotected[Math.floor(Math.random() * unprotected.length)];
  return makeEvent(
    state.year,
    state.month,
    `¡INCENDIO! Zona industrial en (${target.x},${target.y}) sin cobertura de bomberos. Daños registrados.`,
    'critical',
    { x: target.x, y: target.y },
  );
}

/** Crime wave in zones without police */
function tryCrimeEvent(state: GameState): GameEvent | null {
  if (Math.random() > BALANCE.crimeEventProbability) return null;

  const unprotected = state.tiles.filter(
    (t) =>
      (t.type === 'residential' || t.type === 'commercial') &&
      !t.coverage.police &&
      t.population > 0,
  );
  if (unprotected.length === 0) return null;

  return makeEvent(
    state.year,
    state.month,
    `Ola de crímenes reportada en zonas sin cobertura policial. Felicidad reducida.`,
    'warning',
  );
}

/** Mass migration if happiness is very high */
function tryMigrationEvent(state: GameState): GameEvent | null {
  if (state.happiness < BALANCE.migrationBoomHappiness) return null;
  if (Math.random() > BALANCE.migrationBoomProbability) return null;

  return makeEvent(
    state.year,
    state.month,
    `¡Migración masiva! La alta felicidad (${state.happiness}%) atrae nuevos residentes.`,
    'info',
  );
}

/** Economic recession roughly every ~10 years */
function tryRecessionEvent(state: GameState): GameEvent | null {
  // Recession probability increases every year past year 5
  const yearsIn = state.year - 1;
  if (yearsIn < BALANCE.recessionMinYear) return null;
  if (state.tickCount % BALANCE.recessionCheckInterval !== 0) return null;
  if (Math.random() > BALANCE.recessionProbability) return null;

  return makeEvent(
    state.year,
    state.month,
    `Recesión económica. Los ingresos fiscales caerán un 30% el próximo mes.`,
    'critical',
  );
}

/** Disease outbreak when health coverage is critically low and population exists */
function tryDiseaseOutbreakEvent(state: GameState): GameEvent | null {
  if (Math.random() > BALANCE.diseaseOutbreakProbability) return null;

  const inhabited = state.tiles.filter(
    (t) => (t.type === 'residential' || t.type === 'commercial') && t.population > 0,
  );
  if (inhabited.length === 0) return null;

  const uncovered = inhabited.filter((t) => !t.coverage.health);
  const ratio = uncovered.length / inhabited.length;
  if (ratio < 0.6) return null; // only triggers when 60%+ of zones lack health coverage

  return makeEvent(
    state.year,
    state.month,
    `¡Brote de enfermedad! El ${Math.round(ratio * 100)}% de la ciudad carece de cobertura sanitaria. Construye un hospital.`,
    'critical',
  );
}

/** Underground water discovery */
function tryWaterDiscoveryEvent(state: GameState): GameEvent | null {
  if (Math.random() > BALANCE.waterDiscoveryProbability) return null;

  const emptyTiles = state.tiles.filter((t) => t.type === 'empty');
  if (emptyTiles.length === 0) return null;

  const target = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  return makeEvent(
    state.year,
    state.month,
    `¡Descubrimiento! Agua subterránea hallada en (${target.x},${target.y}). Construye una bomba de agua allí.`,
    'info',
    { x: target.x, y: target.y },
  );
}

/** Apply disease outbreak: reduce population by 5% across all unprotected residential tiles */
export function applyDiseaseOutbreak(state: GameState): GameState {
  const tiles = state.tiles.map((t) => {
    if ((t.type === 'residential' || t.type === 'commercial') && t.population > 0 && !t.coverage.health) {
      return { ...t, population: Math.max(0, Math.floor(t.population * 0.95)) };
    }
    return t;
  });
  return { ...state, tiles };
}

/** Apply damage to tiles from a fire event */
export function applyFireDamage(state: GameState, position: Position): GameState {
  const idx = position.y * state.worldWidth + position.x;
  if (idx < 0 || idx >= state.tiles.length) return state;

  const tiles = [...state.tiles];
  tiles[idx] = {
    ...tiles[idx],
    damaged: true,
    population: Math.floor(tiles[idx].population * 0.5),
    zoneLevel: Math.max(0, tiles[idx].zoneLevel - 1) as 0 | 1 | 2 | 3,
  };
  return { ...state, tiles };
}

/** Apply happiness penalty from crime */
export function applyCrimePenalty(state: GameState): GameState {
  return { ...state, happiness: Math.max(0, state.happiness - BALANCE.crimePenaltyHappiness) };
}

/** Apply migration boom: grow population faster next tick */
export function applyMigrationBoom(state: GameState): GameState {
  // Will be amplified in the tick engine's population step
  return state; // marker — the event presence in log triggers amplification
}

/** Apply recession: reduce balance */
export function applyRecession(state: GameState): GameState {
  const penalty = Math.floor(state.economy.lastIncome * 0.3);
  return {
    ...state,
    economy: {
      ...state.economy,
      balance: Math.max(0, state.economy.balance - penalty),
    },
  };
}

/** Traffic jam when average road congestion exceeds 80% */
function tryTrafficJamEvent(state: GameState): GameEvent | null {
  if ((state.avgTrafficLoad ?? 0) < 80) return null;
  if (state.tickCount % 6 !== 0) return null;

  return makeEvent(
    state.year,
    state.month,
    `¡Colapso de tráfico! Congestión promedio: ${state.avgTrafficLoad}%. Construye avenidas o autopistas para aumentar la capacidad vial.`,
    'warning',
  );
}

/** Smog warning when city-wide average pollution exceeds threshold */
function trySmogWarningEvent(state: GameState): GameEvent | null {
  if (state.avgPollution < 60) return null;
  // Only fire once every 6 months to avoid spam
  if (state.tickCount % 6 !== 0) return null;

  return makeEvent(
    state.year,
    state.month,
    `¡Alerta de smog! Contaminación promedio: ${state.avgPollution}/100. La salud de los ciudadanos está en riesgo. Construye parques o una planta de residuos.`,
    'critical',
  );
}

/** Apply smog: happiness penalty citywide */
export function applySmogWarning(state: GameState): GameState {
  return { ...state, happiness: Math.max(0, state.happiness - 10) };
}

/** Bond default crisis: 3+ months of negative cashflow while bonds are active */
function tryBondDefaultEvent(state: GameState): GameEvent | null {
  if (state.economy.bonds.length === 0) return null;
  if (state.economy.bondDefaultRisk < 3) return null;

  return makeEvent(
    state.year,
    state.month,
    `¡CRISIS DE BONOS! La ciudad lleva ${state.economy.bondDefaultRisk} meses sin poder cubrir los pagos. Calificación crediticia en riesgo.`,
    'critical',
  );
}

/** Apply bond default: happiness crash and debt spike */
export function applyBondDefault(state: GameState): GameState {
  return {
    ...state,
    happiness: Math.max(0, state.happiness - 15),
    economy: {
      ...state.economy,
      debt: state.economy.debt + Math.floor(state.economy.bonds.reduce((s, b) => s + b.amount * 0.1, 0)),
      bondDefaultRisk: 0,
    },
  };
}

/** Generate all random events for this tick */
export function generateEvents(state: GameState): [GameState, GameEvent[]] {
  const events: GameEvent[] = [];
  let next = state;

  const fireEvt = tryFireEvent(next);
  if (fireEvt) {
    events.push(fireEvt);
    if (fireEvt.position) next = applyFireDamage(next, fireEvt.position);
  }

  const crimeEvt = tryCrimeEvent(next);
  if (crimeEvt) {
    events.push(crimeEvt);
    next = applyCrimePenalty(next);
  }

  const migrationEvt = tryMigrationEvent(next);
  if (migrationEvt) {
    events.push(migrationEvt);
  }

  const recessionEvt = tryRecessionEvent(next);
  if (recessionEvt) {
    events.push(recessionEvt);
    next = applyRecession(next);
  }

  const waterEvt = tryWaterDiscoveryEvent(next);
  if (waterEvt) {
    events.push(waterEvt);
  }

  const diseaseEvt = tryDiseaseOutbreakEvent(next);
  if (diseaseEvt) {
    events.push(diseaseEvt);
    next = applyDiseaseOutbreak(next);
  }

  const bondEvt = tryBondDefaultEvent(next);
  if (bondEvt) {
    events.push(bondEvt);
    next = applyBondDefault(next);
  }

  const smogEvt = trySmogWarningEvent(next);
  if (smogEvt) {
    events.push(smogEvt);
    next = applySmogWarning(next);
  }

  const trafficEvt = tryTrafficJamEvent(next);
  if (trafficEvt) events.push(trafficEvt);

  return [next, events];
}

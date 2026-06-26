import type { CommandDefinition, GameState, ServiceType, ZoneType } from '../engine/types';
import { parseCoords, parseIntArg } from './parser';
import { zoneTile, demolishTile, traceRoad, recalculateRoadAccess, setTile, getTile } from '../engine/world';
import { setTaxRate, setServiceBudget, issueBond, computeBondRating } from '../engine/economy';
import { pollutionLabel } from '../engine/pollution';
import { trafficLabel } from '../engine/traffic';
import {
  createDistrict, renameDistrict, deleteDistrict, findDistrictByName, isZoneBanned,
} from '../engine/districts';
import { tick } from '../engine/tick';
import { BUILDINGS } from '../data/buildings';
import { TILE_LEGEND } from '../renderer/asciiMap';
import { CHAIN_DESCRIPTIONS } from '../data/productionChains';
import { formatMilestoneList } from '../engine/milestones';
import { demandLabel } from '../engine/demand';
import { createTestCity } from '../data/testCity';

// ─────────────────────────────────────────────
//  Command registry — add new commands here
// ─────────────────────────────────────────────

function ok(message: string): ReturnType<CommandDefinition['execute']>[1] {
  return { success: true, message, severity: 'info' };
}

function err(message: string): ReturnType<CommandDefinition['execute']>[1] {
  return { success: false, message, severity: 'warning' };
}

const VALID_ZONES = new Set<ZoneType>([
  'residential', 'commercial', 'industrial', 'farm', 'park', 'empty',
]);

const VALID_BUILDINGS = new Set<ZoneType>([
  'fire_station', 'police_station', 'power_plant', 'water_pump',
  'hospital', 'school', 'university', 'waste_plant',
  'granary', 'mill', 'bakery', 'iron_mine', 'foundry', 'tools_workshop',
]);

// Density alias: "residential-low" → { zone: 'residential', cap: 1 }
const DENSITY_ALIAS_MAP: Record<string, { zone: ZoneType; cap: 1 | 2 | 3 }> = {
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

export const COMMANDS: CommandDefinition[] = [
  // ── zone <x> <y> <type[-density]> ──
  {
    name: 'zone',
    aliases: ['z'],
    description: 'Zonifica un tile del mapa',
    usage: 'zone <x> <y> <tipo[-densidad]>  ej: zone 5 3 residential-high',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 3) return [state, err('Uso: zone <x> <y> <tipo>')];

      const coords = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      if (!coords) return [state, err(`Coordenadas inválidas: ${args[0]},${args[1]}`)];

      const raw = args[2].toLowerCase();
      const densityAlias = DENSITY_ALIAS_MAP[raw];
      const zoneType = densityAlias ? densityAlias.zone : (raw as ZoneType);
      const densityCap = densityAlias?.cap;

      if (!VALID_ZONES.has(zoneType)) {
        return [state, err(`Tipo de zona inválido: "${raw}". Usa: ${[...VALID_ZONES].join(', ')} (o con sufijo -low/-medium/-high)`)];
      }

      // Check district ban
      const tileIdx = coords.y * state.worldWidth + coords.x;
      if (isZoneBanned(state, tileIdx, zoneType)) {
        return [state, err(`La zona "${zoneType}" está prohibida en este distrito.`)];
      }

      const building = BUILDINGS.find((b) => b.type === zoneType);
      const cost = building?.cost ?? 0;
      if (state.economy.balance < cost) {
        return [state, err(`Fondos insuficientes. Necesitas $${cost}, tienes $${state.economy.balance}.`)];
      }

      let next = zoneTile(state, coords.x, coords.y, zoneType, densityCap);
      if (cost > 0) {
        next = { ...next, economy: { ...next.economy, balance: next.economy.balance - cost } };
      }
      next = recalculateRoadAccess(next);
      const densityNote = densityCap ? ` [densidad: ${densityCap === 1 ? 'baja' : densityCap === 2 ? 'media' : 'alta'}]` : '';
      return [next, ok(`Zona "${zoneType}" establecida en (${coords.x},${coords.y}). -$${cost}${densityNote}`)];
    },
  },

  // ── density <x> <y> <low|medium|high> ──
  {
    name: 'density',
    aliases: ['den'],
    description: 'Cambia el cap de densidad de una zona existente sin rezonificar',
    usage: 'density <x> <y> <low|medium|high>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 3) return [state, err('Uso: density <x> <y> <low|medium|high>')];

      const coords = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      if (!coords) return [state, err(`Coordenadas inválidas: ${args[0]},${args[1]}`)];

      const tile = getTile(state, coords.x, coords.y);
      if (!tile) return [state, err('Coordenadas fuera del mapa')];
      if (!VALID_ZONES.has(tile.type) || tile.type === 'empty' || tile.type === 'farm' || tile.type === 'park') {
        return [state, err(`Solo puedes cambiar la densidad de zonas residenciales, comerciales o industriales. Tipo actual: ${tile.type}`)];
      }

      const capMap: Record<string, 1 | 2 | 3> = { low: 1, medium: 2, high: 3, baja: 1, media: 2, alta: 3 };
      const cap = capMap[args[2].toLowerCase()];
      if (!cap) return [state, err('Densidad inválida. Usa: low, medium o high (o baja, media, alta)')];

      const next = setTile(state, coords.x, coords.y, { densityCap: cap });
      const labels: Record<number, string> = { 1: 'baja', 2: 'media', 3: 'alta' };
      return [next, ok(`Densidad de (${coords.x},${coords.y}) establecida en ${labels[cap]}.`)];
    },
  },

  // ── road <x1> <y1> <x2> <y2> ──
  {
    name: 'road',
    aliases: ['r'],
    description: 'Traza una carretera entre dos puntos',
    usage: 'road <x1> <y1> <x2> <y2>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 4) return [state, err('Uso: road <x1> <y1> <x2> <y2>')];

      const c1 = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      const c2 = parseCoords(args[2], args[3], state.worldWidth, state.worldHeight);
      if (!c1 || !c2) return [state, err('Coordenadas inválidas')];

      const steps = Math.abs(c2.x - c1.x) + Math.abs(c2.y - c1.y);
      const costPerTile = BUILDINGS.find((b) => b.type === 'road')?.cost ?? 10;
      const total = steps * costPerTile;

      if (state.economy.balance < total) {
        return [state, err(`Fondos insuficientes. Necesitas $${total}.`)];
      }

      const next = traceRoad(state, c1.x, c1.y, c2.x, c2.y);
      return [next, ok(`Carretera trazada de (${c1.x},${c1.y}) a (${c2.x},${c2.y}). -$${total}`)];
    },
  },

  // ── avenue <x1> <y1> <x2> <y2> ──
  {
    name: 'avenue',
    aliases: ['av', 'avenida'],
    description: 'Traza una avenida (3× capacidad, $30/tile)',
    usage: 'avenue <x1> <y1> <x2> <y2>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 4) return [state, err('Uso: avenue <x1> <y1> <x2> <y2>')];
      const c1 = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      const c2 = parseCoords(args[2], args[3], state.worldWidth, state.worldHeight);
      if (!c1 || !c2) return [state, err('Coordenadas inválidas')];

      const steps = Math.abs(c2.x - c1.x) + Math.abs(c2.y - c1.y);
      const costPerTile = 30;
      const total = steps * costPerTile;
      if (state.economy.balance < total) {
        return [state, err(`Fondos insuficientes. Necesitas $${total}.`)];
      }

      let next = state;
      const stepX = c2.x > c1.x ? 1 : c2.x < c1.x ? -1 : 0;
      for (let x = c1.x; x !== c2.x + stepX; x += stepX || 1) {
        next = zoneTile(next, x, c1.y, 'avenue');
        if (x === c2.x) break;
      }
      const stepY = c2.y > c1.y ? 1 : c2.y < c1.y ? -1 : 0;
      for (let y = c1.y; y !== c2.y + stepY; y += stepY || 1) {
        next = zoneTile(next, c2.x, y, 'avenue');
        if (y === c2.y) break;
      }
      next = { ...next, economy: { ...next.economy, balance: next.economy.balance - total }, hasInfrastructure: true };
      next = recalculateRoadAccess(next);
      return [next, ok(`Avenida trazada de (${c1.x},${c1.y}) a (${c2.x},${c2.y}). -$${total}`)];
    },
  },

  // ── highway <x1> <y1> <x2> <y2> ──
  {
    name: 'highway',
    aliases: ['hw', 'autopista'],
    description: 'Traza una autopista (10× capacidad, $80/tile, mínimo 3 tiles)',
    usage: 'highway <x1> <y1> <x2> <y2>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 4) return [state, err('Uso: highway <x1> <y1> <x2> <y2>')];
      const c1 = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      const c2 = parseCoords(args[2], args[3], state.worldWidth, state.worldHeight);
      if (!c1 || !c2) return [state, err('Coordenadas inválidas')];

      const steps = Math.abs(c2.x - c1.x) + Math.abs(c2.y - c1.y);
      if (steps < 3) return [state, err('La autopista requiere mínimo 3 tiles de longitud.')];

      const costPerTile = 80;
      const total = steps * costPerTile;
      if (state.economy.balance < total) {
        return [state, err(`Fondos insuficientes. Necesitas $${total}.`)];
      }

      let next = state;
      const stepX = c2.x > c1.x ? 1 : c2.x < c1.x ? -1 : 0;
      for (let x = c1.x; x !== c2.x + stepX; x += stepX || 1) {
        next = zoneTile(next, x, c1.y, 'highway');
        if (x === c2.x) break;
      }
      const stepY = c2.y > c1.y ? 1 : c2.y < c1.y ? -1 : 0;
      for (let y = c1.y; y !== c2.y + stepY; y += stepY || 1) {
        next = zoneTile(next, c2.x, y, 'highway');
        if (y === c2.y) break;
      }
      next = { ...next, economy: { ...next.economy, balance: next.economy.balance - total }, hasInfrastructure: true };
      next = recalculateRoadAccess(next);
      return [next, ok(`Autopista trazada de (${c1.x},${c1.y}) a (${c2.x},${c2.y}). -$${total}`)];
    },
  },

  // ── build <x> <y> <building> ──
  {
    name: 'build',
    aliases: ['b'],
    description: 'Construye un edificio específico',
    usage: 'build <x> <y> <tipo>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 3) return [state, err('Uso: build <x> <y> <tipo>')];

      const coords = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      if (!coords) return [state, err(`Coordenadas inválidas: ${args[0]},${args[1]}`)];

      const buildingType = args[2].toLowerCase() as ZoneType;
      if (!VALID_BUILDINGS.has(buildingType)) {
        return [state, err(`Edificio inválido: "${buildingType}". Usa: ${[...VALID_BUILDINGS].join(', ')}`)];
      }

      const building = BUILDINGS.find((b) => b.type === buildingType);
      if (!building) return [state, err(`Edificio desconocido: "${buildingType}"`)];

      if (state.economy.balance < building.cost) {
        return [state, err(`Fondos insuficientes. Necesitas $${building.cost}.`)];
      }

      let next = zoneTile(state, coords.x, coords.y, buildingType);
      next = {
        ...next,
        economy: { ...next.economy, balance: next.economy.balance - building.cost },
      };
      next = recalculateRoadAccess(next);
      return [next, ok(`${building.name} construido en (${coords.x},${coords.y}). -$${building.cost}`)];
    },
  },

  // ── demolish <x> <y> ──
  {
    name: 'demolish',
    aliases: ['d', 'demo'],
    description: 'Derriba una estructura (recuperas 40% del costo)',
    usage: 'demolish <x> <y>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: demolish <x> <y>')];

      const coords = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      if (!coords) return [state, err('Coordenadas inválidas')];

      const tile = state.tiles[coords.y * state.worldWidth + coords.x];
      if (!tile || tile.type === 'empty') {
        return [state, err(`No hay nada que demoler en (${coords.x},${coords.y}).`)];
      }

      const next = demolishTile(state, coords.x, coords.y);
      return [next, ok(`Demolición completada en (${coords.x},${coords.y}).`)];
    },
  },

  // ── tax <rate> ──
  {
    name: 'tax',
    aliases: ['t'],
    description: 'Cambia la tasa de impuestos (5–30%)',
    usage: 'tax <porcentaje>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: tax <5-30>')];
      const rate = parseIntArg(args[0]);
      if (rate === null || rate < 5 || rate > 30) {
        return [state, err('La tasa debe estar entre 5 y 30.')];
      }
      const next = setTaxRate(state, rate);
      return [next, ok(`Impuesto fijado al ${rate}%.`)];
    },
  },

  // ── budget <servicio> <monto> ──
  {
    name: 'budget',
    aliases: ['bud'],
    description: 'Asigna presupuesto mensual a un servicio',
    usage: 'budget <agua|electricidad|basura|policia|bomberos|educacion> <monto>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: budget <servicio> <monto>')];

      const serviceMap: Record<string, ServiceType> = {
        agua: 'water',
        electricidad: 'electricity',
        basura: 'garbage',
        policia: 'police',
        bomberos: 'fire',
        educacion: 'education',
      };

      const service = serviceMap[args[0].toLowerCase()];
      if (!service) {
        return [state, err(`Servicio inválido. Opciones: ${Object.keys(serviceMap).join(', ')}`)];
      }

      const amount = parseIntArg(args[1]);
      if (amount === null || amount < 0) {
        return [state, err('El monto debe ser un número positivo.')];
      }

      const next = setServiceBudget(state, service, amount);
      return [next, ok(`Presupuesto de ${args[0]} fijado en $${amount}/mes.`)];
    },
  },

  // ── view stats ──
  {
    name: 'view stats',
    aliases: ['stats'],
    description: 'Muestra estadísticas detalladas de la ciudad',
    usage: 'view stats',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const chains = state.productionChains
        .map((c) => `  [${c.satisfied ? '✓' : '✗'}] ${CHAIN_DESCRIPTIONS[c.chainId] ?? c.chainId}`)
        .join('\n');

      const budgets = state.economy.serviceBudgets
        .map((b) => `  ${b.service}: $${b.allocation}/mes`)
        .join('\n');

      const { rciDemand: d } = state;
      const rating = computeBondRating(state);
      const bondPayments = state.economy.bonds.reduce((s, b) => s + b.monthlyPayment, 0);

      const msg = [
        `=== ESTADÍSTICAS DE LA CIUDAD ===`,
        `Año ${state.year}, Mes ${state.month}`,
        `Población: ${state.population}`,
        `Felicidad: ${state.happiness}%`,
        `Balance: $${state.economy.balance}`,
        `Deuda: $${state.economy.debt}`,
        `Impuesto: ${state.economy.taxRate}%`,
        `Ingresos (último mes): $${state.economy.lastIncome}`,
        `Gastos (último mes): $${state.economy.lastExpenses}`,
        `Bonos activos: ${state.economy.bonds.length} (pago mensual: $${bondPayments})`,
        `Calificación crediticia: ${rating}`,
        `Contaminación promedio: ${state.avgPollution}/100 — ${pollutionLabel(state.avgPollution)}`,
        `--- Demanda RCI ---`,
        `  R (residencial): ${d.r}% — ${demandLabel(d.r)}`,
        `  C (comercial):   ${d.c}% — ${demandLabel(d.c)}`,
        `  I (industrial):  ${d.i}% — ${demandLabel(d.i)}`,
        `--- Cadenas de Producción ---`,
        chains || '  (ninguna)',
        `--- Presupuestos ---`,
        budgets,
      ].join('\n');

      return [state, ok(msg)];
    },
  },

  // ── view map ──
  {
    name: 'view map',
    aliases: ['map'],
    description: 'Re-renderiza el mapa (útil para refrescar la vista)',
    usage: 'view map',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, ok('Mapa actualizado.')];
    },
  },

  // ── next turn ──
  {
    name: 'next turn',
    aliases: ['nt', 'next'],
    description: 'Avanza un mes manualmente',
    usage: 'next turn',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const next = tick(state);
      return [next, ok(`Avanzado al Año ${next.year}, Mes ${next.month}.`)];
    },
  },

  // ── speed <1|2|3|pause> ──
  {
    name: 'speed',
    aliases: ['sp'],
    description: 'Cambia la velocidad de simulación',
    usage: 'speed <1|2|3|pause>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: speed <1|2|3|pause>')];
      const val = args[0].toLowerCase();
      if (val !== '1' && val !== '2' && val !== '3' && val !== 'pause') {
        return [state, err('Velocidad inválida. Usa: 1, 2, 3 o pause')];
      }
      const speed = val === 'pause' ? 'pause' : (parseInt(val, 10) as 1 | 2 | 3);
      return [{ ...state, speed }, ok(`Velocidad fijada a: ${val}`)];
    },
  },

  // ── undo ──
  {
    name: 'undo',
    aliases: ['u'],
    description: 'Deshace la última acción de construcción (hasta 10 niveles)',
    usage: 'undo',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, { success: true, message: '__UNDO__', severity: 'info' }];
    },
  },

  // ── save [slot] ──
  {
    name: 'save',
    aliases: [],
    description: 'Guarda la partida en una ranura (0-2, por defecto 0)',
    usage: 'save [0|1|2]',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      const slot = args.length > 0 ? parseIntArg(args[0]) : 0;
      if (slot === null || slot < 0 || slot > 2) {
        return [state, err('Ranura inválida. Usa: 0, 1 o 2')];
      }
      return [state, { success: true, message: `__SAVE_${slot}__`, severity: 'info' }];
    },
  },

  // ── load [slot] ──
  {
    name: 'load',
    aliases: [],
    description: 'Carga la partida desde una ranura (0-2, por defecto 0)',
    usage: 'load [0|1|2]',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      const slot = args.length > 0 ? parseIntArg(args[0]) : 0;
      if (slot === null || slot < 0 || slot > 2) {
        return [state, err('Ranura inválida. Usa: 0, 1 o 2')];
      }
      return [state, { success: true, message: `__LOAD_${slot}__`, severity: 'info' }];
    },
  },

  // ── saves ──
  {
    name: 'saves',
    aliases: [],
    description: 'Lista las ranuras de guardado disponibles',
    usage: 'saves',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, { success: true, message: '__SAVES__', severity: 'info' }];
    },
  },

  // ── bond <amount> ──
  {
    name: 'bond',
    aliases: ['bono'],
    description: 'Emite un bono municipal para financiar infraestructura (20 años)',
    usage: 'bond <monto>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: bond <monto>')];
      const amount = parseIntArg(args[0]);
      if (amount === null || amount <= 0) return [state, err('El monto debe ser un número positivo.')];
      const [next, message] = issueBond(state, amount);
      return [next, next === state ? err(message) : ok(message)];
    },
  },

  // ── view bonds ──
  {
    name: 'view bonds',
    aliases: ['bonds', 'bonos'],
    description: 'Muestra bonos activos y calificación crediticia',
    usage: 'view bonds',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const rating = computeBondRating(state);
      const { bonds } = state.economy;
      const totalMonthly = bonds.reduce((s, b) => s + b.monthlyPayment, 0);

      const bondLines = bonds.length === 0
        ? ['  (sin bonos activos)']
        : bonds.map((b) =>
            `  $${b.amount} al ${(b.interestRate * 100).toFixed(0)}% — $${b.monthlyPayment}/mes — ${b.monthsRemaining} meses restantes`,
          );

      const msg = [
        '=== BONOS MUNICIPALES ===',
        `Calificación crediticia: ${rating}`,
        `Pago mensual total: $${totalMonthly}`,
        `Bonos activos: ${bonds.length}`,
        ...bondLines,
      ].join('\n');

      return [state, ok(msg)];
    },
  },

  // ── view pollution ──
  {
    name: 'view pollution',
    aliases: ['pollution', 'smog'],
    description: 'Muestra niveles de contaminación por zona',
    usage: 'view pollution',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const avg = state.avgPollution;
      const worst = [...state.tiles]
        .filter((t) => t.type === 'residential' || t.type === 'commercial')
        .sort((a, b) => b.pollution - a.pollution)
        .slice(0, 5);

      const worstLines = worst.length === 0
        ? ['  (sin zonas habitadas)']
        : worst.map((t) => `  (${t.x},${t.y}) ${t.type}: ${t.pollution} — ${pollutionLabel(t.pollution)}`);

      const emitters = state.tiles.filter((t) =>
        ['industrial', 'power_plant', 'foundry', 'iron_mine'].includes(t.type)
      ).length;
      const reducers = state.tiles.filter((t) =>
        ['park', 'waste_plant'].includes(t.type)
      ).length;

      const msg = [
        '=== CONTAMINACIÓN URBANA ===',
        `Promedio ciudad: ${avg}/100 — ${pollutionLabel(avg)}`,
        `Fuentes activas: ${emitters} · Reductores: ${reducers}`,
        '--- Zonas más afectadas ---',
        ...worstLines,
      ].join('\n');

      return [state, ok(msg)];
    },
  },

  // ── view traffic ──
  {
    name: 'view traffic',
    aliases: ['traffic', 'tráfico'],
    description: 'Alterna el mapa de calor de tráfico y muestra estado de congestión',
    usage: 'view traffic',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const avg = state.avgTrafficLoad ?? 0;
      const roads = state.tiles.filter((t) => t.type === 'road' || t.type === 'avenue' || t.type === 'highway');
      const maxCongested = roads.filter((t) => t.trafficLoad >= 80).length;
      const collapsed = roads.filter((t) => t.trafficLoad >= 95).length;

      const msg = [
        `=== TRÁFICO URBANO ===`,
        `Congestión promedio: ${avg}% — ${trafficLabel(avg)}`,
        `Vías congestionadas (≥80%): ${maxCongested}/${roads.length}`,
        collapsed > 0 ? `⚠ Colapso total (≥95%): ${collapsed} vías` : `Sin colapso total`,
        `Carreteras: ${roads.filter(t=>t.type==='road').length} · Avenidas: ${roads.filter(t=>t.type==='avenue').length} · Autopistas: ${roads.filter(t=>t.type==='highway').length}`,
        `[El mapa de calor ha sido activado/desactivado]`,
      ].join('\n');

      return [state, { success: true, message: `__TRAFFIC__\n${msg}`, severity: 'info' }];
    },
  },

  // ── district commands ──
  {
    name: 'district create',
    aliases: ['distrito crear', 'dc'],
    description: 'Crea un nuevo distrito y activa el modo pintura (máx. 4)',
    usage: 'district create <nombre>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: district create <nombre>')];
      const name = args.join(' ');
      if (state.districts.length >= 4) {
        return [state, err('Límite de 4 distritos alcanzado. Elimina uno para crear otro.')];
      }
      if (state.districts.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
        return [state, err(`Ya existe un distrito llamado "${name}".`)];
      }
      const [next, district] = createDistrict(state, name);
      return [next, ok(`__DISTRICT_PAINT__:${district.id}\nDistrito "${district.name}" creado (color: ${district.color}). Haz clic en tiles para añadirlos. Escribe "district stop" para terminar.`)];
    },
  },
  {
    name: 'district paint',
    aliases: ['distrito pintar', 'dp'],
    description: 'Entra en modo pintura para un distrito existente',
    usage: 'district paint <nombre>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: district paint <nombre>')];
      const name = args.join(' ');
      const d = findDistrictByName(state, name);
      if (!d) return [state, err(`Distrito "${name}" no encontrado.`)];
      return [state, ok(`__DISTRICT_PAINT__:${d.id}\nModo pintura activado para "${d.name}". Clic = añadir/quitar tile. "district stop" para terminar.`)];
    },
  },
  {
    name: 'district stop',
    aliases: ['distrito stop', 'ds'],
    description: 'Sale del modo pintura de distrito',
    usage: 'district stop',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, ok('__DISTRICT_PAINT_OFF__\nModo pintura desactivado.')];
    },
  },
  {
    name: 'district rename',
    aliases: ['distrito renombrar'],
    description: 'Renombra un distrito',
    usage: 'district rename <nombre-actual> <nuevo-nombre>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: district rename <nombre-actual> <nuevo-nombre>')];
      const oldName = args[0];
      const newName = args.slice(1).join(' ');
      const d = findDistrictByName(state, oldName);
      if (!d) return [state, err(`Distrito "${oldName}" no encontrado.`)];
      const next = renameDistrict(state, d.id, newName);
      return [next, ok(`Distrito renombrado: "${oldName}" → "${newName}"`)];
    },
  },
  {
    name: 'district delete',
    aliases: ['distrito eliminar', 'dd'],
    description: 'Elimina un distrito y sus políticas',
    usage: 'district delete <nombre>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 1) return [state, err('Uso: district delete <nombre>')];
      const name = args.join(' ');
      const d = findDistrictByName(state, name);
      if (!d) return [state, err(`Distrito "${name}" no encontrado.`)];
      return [deleteDistrict(state, d.id), ok(`Distrito "${name}" eliminado.`)];
    },
  },
  {
    name: 'district policy tax',
    aliases: ['distrito impuesto'],
    description: 'Establece tasa de impuesto local para un distrito',
    usage: 'district policy tax <nombre> <tasa%>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: district policy tax <nombre> <tasa%>')];
      const name = args.slice(0, -1).join(' ');
      const rate = parseIntArg(args[args.length - 1]);
      if (rate === null || rate < 1 || rate > 30) return [state, err('Tasa inválida (1-30).')];
      const d = findDistrictByName(state, name);
      if (!d) return [state, err(`Distrito "${name}" no encontrado.`)];
      const next = { ...state, districts: state.districts.map((x) =>
        x.id === d.id ? { ...x, policies: { ...x.policies, taxRate: rate } } : x
      )};
      return [next, ok(`Tasa fiscal del distrito "${name}" fijada en ${rate}%.`)];
    },
  },
  {
    name: 'district policy ban',
    aliases: ['distrito prohibir'],
    description: 'Prohíbe un tipo de zona en un distrito',
    usage: 'district policy ban <nombre> <tipo-zona>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: district policy ban <nombre> <tipo>')];
      const zoneType = args[args.length - 1].toLowerCase() as import('../engine/types').ZoneType;
      const name = args.slice(0, -1).join(' ');
      const d = findDistrictByName(state, name);
      if (!d) return [state, err(`Distrito "${name}" no encontrado.`)];
      const banned = d.policies.bannedZones ?? [];
      if (banned.includes(zoneType)) return [state, err(`"${zoneType}" ya está prohibido en "${name}".`)];
      const next = { ...state, districts: state.districts.map((x) =>
        x.id === d.id ? { ...x, policies: { ...x.policies, bannedZones: [...banned, zoneType] } } : x
      )};
      return [next, ok(`Zona "${zoneType}" prohibida en distrito "${name}".`)];
    },
  },
  {
    name: 'district policy priority',
    aliases: ['distrito prioridad'],
    description: 'Establece prioridad de gasto de un distrito (services|infrastructure|growth)',
    usage: 'district policy priority <nombre> <services|infrastructure|growth>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 2) return [state, err('Uso: district policy priority <nombre> <prioridad>')];
      const priority = args[args.length - 1].toLowerCase();
      if (!['services', 'infrastructure', 'growth'].includes(priority)) {
        return [state, err('Prioridad inválida. Usa: services, infrastructure o growth')];
      }
      const name = args.slice(0, -1).join(' ');
      const d = findDistrictByName(state, name);
      if (!d) return [state, err(`Distrito "${name}" no encontrado.`)];
      const next = { ...state, districts: state.districts.map((x) =>
        x.id === d.id ? { ...x, policies: { ...x.policies, spendingPriority: priority as import('../engine/types').SpendingPriority } } : x
      )};
      const labels: Record<string, string> = { services: 'Servicios (+20% radio)', infrastructure: 'Infraestructura (-20% mantenimiento)', growth: 'Crecimiento (+20% población)' };
      return [next, ok(`Prioridad del distrito "${name}": ${labels[priority]}`)];
    },
  },
  {
    name: 'view districts',
    aliases: ['distritos', 'district list'],
    description: 'Muestra todos los distritos y sus políticas',
    usage: 'view districts',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      if (state.districts.length === 0) {
        return [state, ok('Sin distritos. Usa "district create <nombre>" para crear uno.')];
      }
      const lines = ['=== DISTRITOS ==='];
      for (const d of state.districts) {
        lines.push(`${d.name} (${d.tileIds.length} tiles, color: ${d.color})`);
        if (d.policies.taxRate !== undefined) lines.push(`  · Impuesto local: ${d.policies.taxRate}%`);
        if (d.policies.spendingPriority) lines.push(`  · Prioridad: ${d.policies.spendingPriority}`);
        if (d.policies.bannedZones?.length) lines.push(`  · Prohibido: ${d.policies.bannedZones.join(', ')}`);
      }
      return [state, ok(lines.join('\n'))];
    },
  },

  // ── view density ──
  {
    name: 'view density',
    aliases: ['density-map'],
    description: 'Muestra resumen de caps de densidad asignados en el mapa',
    usage: 'view density',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const zoneTypes = ['residential', 'commercial', 'industrial'] as const;
      const lines: string[] = ['=== MAPA DE DENSIDADES ==='];

      for (const zt of zoneTypes) {
        const tiles = state.tiles.filter((t) => t.type === zt);
        if (tiles.length === 0) continue;
        const counts = { 1: 0, 2: 0, 3: 0 };
        for (const t of tiles) counts[t.densityCap ?? 3]++;
        const labels: Record<1|2|3, string> = { 1: 'baja', 2: 'media', 3: 'alta' };
        lines.push(`${zt}: ${Object.entries(counts)
          .filter(([, n]) => n > 0)
          .map(([cap, n]) => `${n} ${labels[Number(cap) as 1|2|3]}`)
          .join(', ')}`);
      }

      // High-density tiles that can't develop due to pollution or services
      const blocked = state.tiles.filter(
        (t) => t.type === 'residential' && (t.densityCap ?? 3) === 3 && t.zoneLevel < 3 &&
        ((t.pollution ?? 0) >= 30 || Object.values(t.coverage).filter(Boolean).length < 7),
      );
      if (blocked.length > 0) {
        lines.push(`Zonas alta densidad bloqueadas: ${blocked.length} (necesitan <30 contaminación y 7 servicios)`);
      }

      return [state, ok(lines.join('\n'))];
    },
  },

  // ── view charts ──
  {
    name: 'view charts',
    aliases: ['charts'],
    description: 'Muestra gráficos sparkline de los últimos 24 meses',
    usage: 'view charts',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, { success: true, message: '__CHARTS__', severity: 'info' }];
    },
  },

  // ── view hitos ──
  {
    name: 'view hitos',
    aliases: ['hitos', 'milestones'],
    description: 'Muestra el progreso de los hitos de la ciudad',
    usage: 'view hitos',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, ok(formatMilestoneList(state.milestones))];
    },
  },

  // ── livestats ──
  {
    name: 'livestats',
    aliases: ['ls', 'stats-live'],
    description: 'Alterna entre Pixelgram y el log de simulación en tiempo real',
    usage: 'livestats',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      return [state, { success: true, message: '__LIVESTATS__', severity: 'info' }];
    },
  },

  // ── seed ──
  {
    name: 'seed',
    aliases: ['ciudad prueba', 'testcity'],
    description: 'Carga una ciudad de prueba pre-construida (Año 6, ~430 hab)',
    usage: 'seed',
    execute(_args, _state): [GameState, ReturnType<typeof ok>] {
      const city = createTestCity();
      return [city, ok(
        `Ciudad semilla cargada.\n` +
        `Población: ${city.population} | Balance: $${city.economy.balance.toLocaleString()} | ` +
        `Felicidad: ${city.happiness}% | Contaminación media: ${city.avgPollution}\n` +
        `Tip: escribe "save 1" para guardarla en la ranura 1.`,
      )];
    },
  },

  // ── help ──
  {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Muestra todos los comandos disponibles',
    usage: 'help',
    execute(_args, state): [GameState, ReturnType<typeof ok>] {
      const lines = COMMANDS.map(
        (c) => `  ${c.usage.padEnd(40)} — ${c.description}`,
      );

      const tileLines = TILE_LEGEND.map(
        (t) => `  ${t.char.padEnd(6)} ${t.label}`,
      );

      const msg = [
        '=== COMANDOS DISPONIBLES ===',
        ...lines,
        '',
        '=== TILES DEL MAPA ===',
        ...tileLines,
      ].join('\n');

      return [state, ok(msg)];
    },
  },
];

/** Registry map for O(1) lookup */
export const COMMAND_REGISTRY: Map<string, CommandDefinition> = new Map();

for (const cmd of COMMANDS) {
  COMMAND_REGISTRY.set(cmd.name, cmd);
  for (const alias of cmd.aliases) {
    COMMAND_REGISTRY.set(alias, cmd);
  }
}

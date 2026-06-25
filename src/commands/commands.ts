import type { CommandDefinition, GameState, ServiceType, ZoneType } from '../engine/types';
import { parseCoords, parseIntArg } from './parser';
import { zoneTile, demolishTile, traceRoad, recalculateRoadAccess } from '../engine/world';
import { setTaxRate, setServiceBudget, issueBond, computeBondRating } from '../engine/economy';
import { tick } from '../engine/tick';
import { BUILDINGS } from '../data/buildings';
import { TILE_LEGEND } from '../renderer/asciiMap';
import { CHAIN_DESCRIPTIONS } from '../data/productionChains';
import { formatMilestoneList } from '../engine/milestones';
import { demandLabel } from '../engine/demand';

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
  'hospital', 'school', 'university',
  'granary', 'mill', 'bakery', 'iron_mine', 'foundry', 'tools_workshop',
]);

export const COMMANDS: CommandDefinition[] = [
  // ── zone <x> <y> <type> ──
  {
    name: 'zone',
    aliases: ['z'],
    description: 'Zonifica un tile del mapa',
    usage: 'zone <x> <y> <residential|commercial|industrial|farm|park|empty>',
    execute(args, state): [GameState, ReturnType<typeof ok>] {
      if (args.length < 3) return [state, err('Uso: zone <x> <y> <tipo>')];

      const coords = parseCoords(args[0], args[1], state.worldWidth, state.worldHeight);
      if (!coords) return [state, err(`Coordenadas inválidas: ${args[0]},${args[1]}`)];

      const zoneType = args[2].toLowerCase() as ZoneType;
      if (!VALID_ZONES.has(zoneType)) {
        return [state, err(`Tipo de zona inválido: "${zoneType}". Usa: ${[...VALID_ZONES].join(', ')}`)];
      }

      const building = BUILDINGS.find((b) => b.type === zoneType);
      const cost = building?.cost ?? 0;
      if (state.economy.balance < cost) {
        return [state, err(`Fondos insuficientes. Necesitas $${cost}, tienes $${state.economy.balance}.`)];
      }

      let next = zoneTile(state, coords.x, coords.y, zoneType);
      if (cost > 0) {
        next = { ...next, economy: { ...next.economy, balance: next.economy.balance - cost } };
      }
      next = recalculateRoadAccess(next);
      return [next, ok(`Zona "${zoneType}" establecida en (${coords.x},${coords.y}). -$${cost}`)];
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

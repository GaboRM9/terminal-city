import type { Tile, ZoneType } from '../engine/types';

// ─────────────────────────────────────────────
//  ASCII/Unicode tile → char + color mapping
//  Swap this file to change the entire visual theme
// ─────────────────────────────────────────────

export interface TileRenderConfig {
  char: string;
  color: string;
  bgColor?: string;
}

const EMPTY_CONFIG: TileRenderConfig = { char: '.', color: '#1a1a1a' };

const BASE_MAP: Record<ZoneType, TileRenderConfig> = {
  empty: EMPTY_CONFIG,
  water: { char: '~', color: '#0055ff', bgColor: '#000022' },
  road: { char: '#', color: '#666666' },
  residential: { char: '░', color: '#00ff41' },
  commercial: { char: '¢', color: '#ffb000' },
  industrial: { char: '⚙', color: '#ff6600' },
  farm: { char: '♠', color: '#44cc00' },
  park: { char: '♦', color: '#00cc44' },
  fire_station: { char: 'F', color: '#ff2200' },
  police_station: { char: 'P', color: '#2244ff' },
  power_plant: { char: 'E', color: '#ffee00' },
  water_pump: { char: 'W', color: '#00aaff' },
  granary: { char: 'G', color: '#aa8800' },
  mill: { char: 'M', color: '#cc9900' },
  bakery: { char: 'B', color: '#ddaa00' },
  iron_mine: { char: 'I', color: '#aaaaaa' },
  foundry: { char: 'Ω', color: '#ff4400' },
  tools_workshop: { char: 'T', color: '#88aacc' },
};

/** Residential density chars by zone level */
const RESIDENTIAL_DENSITY: Record<number, string> = {
  0: '.',
  1: '░',
  2: '▒',
  3: '█',
};

/** Color intensity for residential zone by level */
const RESIDENTIAL_COLORS: Record<number, string> = {
  0: '#1a1a1a',
  1: '#00aa2b',
  2: '#00cc35',
  3: '#00ff41',
};

export function getTileRenderConfig(tile: Tile): TileRenderConfig {
  if (tile.damaged) {
    return { char: 'X', color: '#880000' };
  }

  if (tile.type === 'residential') {
    return {
      char: RESIDENTIAL_DENSITY[tile.zoneLevel] ?? '.',
      color: RESIDENTIAL_COLORS[tile.zoneLevel] ?? '#1a1a1a',
    };
  }

  const config = BASE_MAP[tile.type];
  return config ?? EMPTY_CONFIG;
}

/** Generate a CSS color string, dimming uncovered tiles */
export function getTileColor(tile: Tile, dimUncovered: boolean): string {
  const config = getTileRenderConfig(tile);
  if (
    dimUncovered &&
    (tile.type === 'residential' || tile.type === 'commercial') &&
    !tile.coverage.water &&
    !tile.coverage.electricity
  ) {
    return '#333333'; // dim uncovered zones
  }
  return config.color;
}

/** For the minimap — single block char with color */
export function getMinimapConfig(tile: Tile): TileRenderConfig {
  const config = getTileRenderConfig(tile);
  return { char: '█', color: config.color };
}

/** Legend entries for the UI help panel */
export const TILE_LEGEND: Array<{ type: ZoneType; char: string; label: string }> = [
  { type: 'empty', char: '.', label: 'Vacío' },
  { type: 'water', char: '~', label: 'Agua' },
  { type: 'road', char: '#', label: 'Carretera' },
  { type: 'residential', char: '░▒█', label: 'Residencial (Nivel 1-3)' },
  { type: 'commercial', char: '¢', label: 'Comercial' },
  { type: 'industrial', char: '⚙', label: 'Industrial' },
  { type: 'farm', char: '♠', label: 'Granja' },
  { type: 'park', char: '♦', label: 'Parque' },
  { type: 'fire_station', char: 'F', label: 'Bomberos' },
  { type: 'police_station', char: 'P', label: 'Policía' },
  { type: 'power_plant', char: 'E', label: 'Planta Eléctrica' },
  { type: 'water_pump', char: 'W', label: 'Bomba de Agua' },
  { type: 'granary', char: 'G', label: 'Granero' },
  { type: 'mill', char: 'M', label: 'Molino' },
  { type: 'bakery', char: 'B', label: 'Panadería' },
  { type: 'iron_mine', char: 'I', label: 'Mina de Hierro' },
  { type: 'foundry', char: 'Ω', label: 'Fundición' },
  { type: 'tools_workshop', char: 'T', label: 'Taller' },
];

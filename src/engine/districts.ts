import type { District, GameState, ZoneType } from './types';

// ─────────────────────────────────────────────
//  District helpers — pure functions
// ─────────────────────────────────────────────

const DISTRICT_COLORS = [
  '#ff5555', '#55aaff', '#ffaa44', '#55ff88',
  '#ff55cc', '#aa88ff', '#00ffcc', '#ff8844',
];

let _districtCounter = 0;

/** Build a map from tile index → District for O(1) lookups */
export function buildDistrictMap(districts: District[]): Map<number, District> {
  const map = new Map<number, District>();
  for (const d of districts) {
    for (const idx of d.tileIds) {
      map.set(idx, d);
    }
  }
  return map;
}

/** Create a new district and add it to state */
export function createDistrict(state: GameState, name: string): [GameState, District] {
  const MAX_DISTRICTS = 4; // city_hall will increase this in Phase 4
  if (state.districts.length >= MAX_DISTRICTS) {
    return [state, null as unknown as District];
  }

  const color = DISTRICT_COLORS[_districtCounter++ % DISTRICT_COLORS.length];
  const district: District = {
    id: `district-${Date.now()}-${_districtCounter}`,
    name: name.trim(),
    color,
    tileIds: [],
    policies: {},
  };

  return [{ ...state, districts: [...state.districts, district] }, district];
}

/** Add or remove a tile from a district (toggle) */
export function paintDistrictTile(
  state: GameState,
  districtId: string,
  tileIdx: number,
): GameState {
  const districts = state.districts.map((d) => {
    if (d.id !== districtId) {
      // Remove from other districts first
      return { ...d, tileIds: d.tileIds.filter((i) => i !== tileIdx) };
    }
    // Toggle in target district
    const has = d.tileIds.includes(tileIdx);
    return {
      ...d,
      tileIds: has ? d.tileIds.filter((i) => i !== tileIdx) : [...d.tileIds, tileIdx],
    };
  });
  return { ...state, districts };
}

/** Rename a district */
export function renameDistrict(state: GameState, id: string, newName: string): GameState {
  return {
    ...state,
    districts: state.districts.map((d) =>
      d.id === id ? { ...d, name: newName.trim() } : d,
    ),
  };
}

/** Delete a district */
export function deleteDistrict(state: GameState, id: string): GameState {
  return { ...state, districts: state.districts.filter((d) => d.id !== id) };
}

/** Find district by name (case-insensitive) */
export function findDistrictByName(state: GameState, name: string): District | null {
  const lower = name.toLowerCase();
  return state.districts.find((d) => d.name.toLowerCase() === lower) ?? null;
}

/** Get the district a tile index belongs to */
export function getTileDistrict(state: GameState, tileIdx: number): District | null {
  return state.districts.find((d) => d.tileIds.includes(tileIdx)) ?? null;
}

/** Check if a zone type is banned in the district covering a tile */
export function isZoneBanned(state: GameState, tileIdx: number, zone: ZoneType): boolean {
  const d = getTileDistrict(state, tileIdx);
  if (!d || !d.policies.bannedZones) return false;
  return d.policies.bannedZones.includes(zone);
}

/** Centroid (canvas pixel center) of a district's tiles */
export function districtCentroid(
  district: District,
  worldWidth: number,
): { tileX: number; tileY: number } | null {
  if (district.tileIds.length === 0) return null;
  const sumX = district.tileIds.reduce((s, i) => s + (i % worldWidth), 0);
  const sumY = district.tileIds.reduce((s, i) => s + Math.floor(i / worldWidth), 0);
  return {
    tileX: Math.round(sumX / district.tileIds.length),
    tileY: Math.round(sumY / district.tileIds.length),
  };
}

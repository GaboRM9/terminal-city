import type { Tile } from '../engine/types';

// ─────────────────────────────────────────────
//  8×8 pixel-art sprites drawn with fillRect
//  Each row is exactly 8 chars; '.' = transparent
//  Scaled to any TILE_SIZE — cleanest at multiples of 8 (e.g. 24 = 3px/cell)
// ─────────────────────────────────────────────

export interface SpriteDef {
  rows: readonly string[];
  pal: Record<string, string>;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteDef,
  ox: number,
  oy: number,
  S: number,
  alpha = 1,
): void {
  const R = sprite.rows.length;
  const C = 8; // always treat as 8×8 grid
  const pw = Math.floor(S / C);
  const ph = Math.floor(S / R);
  const offX = Math.floor((S - pw * C) / 2);
  const offY = Math.floor((S - ph * R) / 2);

  const prev = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = prev * alpha;

  for (let r = 0; r < R; r++) {
    const row = sprite.rows[r] ?? '';
    for (let c = 0; c < C; c++) {
      const ch = row[c] ?? '.';
      if (ch === '.') continue;
      const color = sprite.pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + offX + c * pw, oy + offY + r * ph, pw, ph);
    }
  }

  if (alpha !== 1) ctx.globalAlpha = prev;
}

// ── Sprite definitions ────────────────────────

const WATER: SpriteDef = {
  rows: [
    'bBbBbBbB',
    'BbBBbBBb',
    'bBCbBCbB',
    'BBbBBbBB',
    'bBbBbBbB',
    'BCbBBCbB',
    'bBBbBBbB',
    'BBbBBbBB',
  ],
  pal: { b: '#001166', B: '#1133bb', C: '#55aaff' },
};

const ROAD: SpriteDef = {
  rows: [
    'SSSSSSSS',
    '........',
    '..ww....',
    '........',
    '........',
    '....ww..',
    '........',
    'SSSSSSSS',
  ],
  pal: { S: '#555555', w: '#888888' },
};

const AVENUE: SpriteDef = {
  rows: [
    'SSSSSSSS',
    '........',
    '.YY..YY.',
    '........',
    '........',
    '.YY..YY.',
    '........',
    'SSSSSSSS',
  ],
  pal: { S: '#555555', Y: '#ffcc00' },
};

const HIGHWAY: SpriteDef = {
  rows: [
    'wSwSwSwS',
    'w......w',
    '........',
    '........',
    '........',
    '........',
    'w......w',
    'wSwSwSwS',
  ],
  pal: { w: '#cccccc', S: '#888888' },
};

// ── Residential ───────────────────────────────

const RES1: SpriteDef = {
  // Small cottage — red roof, white walls, blue windows
  rows: [
    '...rr...',
    '..rRRr..',
    '.rRRRRr.',
    '.WwWwWW.',
    '.WBdBWW.',
    '.WwWwWW.',
    '.AAAAAA.',
    '........',
  ],
  pal: {
    r: '#aa2222', R: '#dd4444',
    W: '#eeeeee', w: '#cccccc',
    B: '#6699ff', d: '#885522',
    A: '#ccaa66',
  },
};

const RES2: SpriteDef = {
  // Apartment block — 3 floor grid
  rows: [
    '.WWWWWW.',
    '.WbWbWWW',
    '.WWWWWWW',
    '.WbWbWWW',
    '.WWWWWWW',
    '.WbWdWWW',
    '.WWWWWWW',
    '.AAAAAAA',
  ],
  pal: {
    W: '#dddddd', w: '#bbbbbb',
    b: '#334488', d: '#554422',
    A: '#ccaa66',
  },
};

const RES3: SpriteDef = {
  // High-rise glass tower
  rows: [
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'AAAAAAAA',
  ],
  pal: {
    B: '#224488', W: '#aaccff',
    w: '#4477bb', A: '#ccaa66',
  },
};

// ── Commercial ────────────────────────────────

const COM1: SpriteDef = {
  // Small shop — orange awning, yellow display
  rows: [
    'OOOOOOOO',
    '.OOOOOO.',
    '.WWWWWW.',
    '.WYYYYwW',
    '.WYYYYWW',
    '.WWWWWWW',
    '.WdWWWWW',
    '.AAAAAAA',
  ],
  pal: {
    O: '#ff7700', W: '#eeeeee',
    Y: '#ffdd00', w: '#aabbcc',
    d: '#664422', A: '#ccaa66',
  },
};

const COM2: SpriteDef = {
  // Department store — yellow sign band, glass facade
  rows: [
    'YYYYYYYY',
    'YYYYYYYY',
    '.WWWWWWW',
    '.WBBBBwW',
    '.WWWWWWW',
    '.WBBBBwW',
    '.WWWWWWW',
    'AAAAAAAA',
  ],
  pal: {
    Y: '#ffcc00', W: '#eeeeee',
    B: '#4488ff', w: '#aabbcc',
    A: '#ccaa66',
  },
};

const COM3: SpriteDef = {
  // Glass office tower
  rows: [
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'BWwWwWWW',
    'BBBBBBBB',
    'AAAAAAAA',
  ],
  pal: {
    B: '#2255aa', W: '#aaccff',
    w: '#4477bb', A: '#bbaa77',
  },
};

// ── Industrial ────────────────────────────────

const IND1: SpriteDef = {
  // Light factory — single chimney, small furnace
  rows: [
    '....S...',
    '....S...',
    '.sssssss',
    '.sFssss.',
    '.sssssss',
    '.SSSSSSS',
    '.sssssss',
    '........',
  ],
  pal: {
    S: '#888888', s: '#333333',
    F: '#ff6600',
  },
};

const IND2: SpriteDef = {
  // Medium factory — 2 chimneys, bigger furnace
  rows: [
    '.SS..SS.',
    '.SS..SS.',
    '.SSSSSS.',
    'sFFFFFFs',
    'ssssssss',
    'SSSSSSSS',
    'ssssssss',
    '........',
  ],
  pal: {
    S: '#888888', s: '#333333',
    F: '#ff6600',
  },
};

const IND3: SpriteDef = {
  // Heavy industrial — 3 chimneys, large furnace with glow
  rows: [
    'sS.sS.sS',
    'sS.sS.sS',
    'ssssssss',
    'sFFFFFFf',
    'sFFFFFFf',
    'ssssssss',
    'SSSSSSSS',
    '........',
  ],
  pal: {
    S: '#888888', s: '#333333',
    F: '#ff5500', f: '#ffaa00',
  },
};

// ── Services ──────────────────────────────────

const FARM: SpriteDef = {
  rows: [
    'GgGgGgGg',
    'gGgGgGgG',
    'GgGgGgGg',
    'gGgGgGgG',
    'aaaaaaaa',
    'GgGgGgGg',
    'gGgGgGgG',
    '........',
  ],
  pal: { G: '#44cc22', g: '#1a6600', a: '#886633' },
};

const PARK: SpriteDef = {
  rows: [
    '.GG..GG.',
    'GGGGGGGG',
    '.GG..GG.',
    '.NN..NN.',
    '.GG..GG.',
    'GGGGGGGG',
    '.GG..GG.',
    '........',
  ],
  pal: { G: '#22bb22', N: '#774422' },
};

const FIRE_STATION: SpriteDef = {
  rows: [
    'RRRRRRRR',
    'RwwwRwwR',
    'RRRRRRRR',
    '........',
    '.SSSSSS.',
    '.S.SS.S.',
    '.SSSSSS.',
    'RRRRRRRR',
  ],
  pal: {
    R: '#cc2222', w: '#ffaaaa',
    S: '#555555',
  },
};

const POLICE_STATION: SpriteDef = {
  rows: [
    'BBBBBBBB',
    'BwwwwwwB',
    'BBBBBBBB',
    'BYBBBYBB',
    'BBBBBBBB',
    '.BddddBB',
    '.BBBBBB.',
    '........',
  ],
  pal: {
    B: '#2244cc', w: '#aabbff',
    Y: '#ffcc00', d: '#112244',
  },
};

const POWER_PLANT: SpriteDef = {
  rows: [
    '..SS....',
    '..SS....',
    'SSYYYYYY',
    '.YYYYYYY',
    '.YzzYYYY',
    '.YYYYYYY',
    'YYYYYYYY',
    '........',
  ],
  pal: {
    S: '#888888', Y: '#ffcc00', z: '#333300',
  },
};

const WATER_PUMP: SpriteDef = {
  rows: [
    '...tt...',
    '..tTTt..',
    '.tTCCTt.',
    '.TCCCT..',
    '.tTCCTt.',
    '..tTTt..',
    '..SSSS..',
    '........',
  ],
  pal: {
    t: '#006677', T: '#00aacc',
    C: '#00ddff', S: '#666666',
  },
};

const HOSPITAL: SpriteDef = {
  rows: [
    'WWWWWWWW',
    'WWWRWWWW',
    'WWWRWWWW',
    'RRRRRRRR',
    'WWWRWWWW',
    'WWWRWWWW',
    'WWWWWWWW',
    'AAAAAAAA',
  ],
  pal: { W: '#eeeeee', R: '#cc2222', A: '#ccaa66' },
};

const SCHOOL: SpriteDef = {
  rows: [
    '....s...',
    '....A...',
    'AAAAAAAA',
    'AwwwwwwA',
    'AAAAAAAA',
    'ARRRddAA',
    'AAAAAAAA',
    '........',
  ],
  pal: {
    A: '#ccaa66', s: '#888888',
    w: '#eeeeee', R: '#cc3333',
    d: '#885522',
  },
};

const UNIVERSITY: SpriteDef = {
  rows: [
    'AAAAAAAA',
    'AwwwwwwA',
    'AAAAAAAA',
    'AWwwwwWA',
    'AAAAAAAA',
    '.AdddAA.',
    '.AAAAAA.',
    '........',
  ],
  pal: {
    A: '#ccaa66', w: '#eeeeee',
    W: '#ffffff', d: '#554422',
  },
};

const WASTE_PLANT: SpriteDef = {
  rows: [
    '.gGGGGg.',
    '.GGsGsGG',
    '.gGsGsGg',
    '.GGsGsGG',
    '.gGGGGgG',
    '.GGGGGG.',
    'GGGGGGGG',
    '........',
  ],
  pal: { g: '#116611', G: '#22aa22', s: '#111111' },
};

// ── Production buildings ──────────────────────

const GRANARY: SpriteDef = {
  rows: [
    '..AAAA..',
    '.AAAAAa.',
    'AAAAAaAA',
    'AAAAAaAA',
    '.AAAAAA.',
    '.AAAAAA.',
    '.AAAAAA.',
    '........',
  ],
  pal: { A: '#ccaa66', a: '#886633' },
};

const MILL: SpriteDef = {
  rows: [
    '....W...',
    '...WAW..',
    '.w.AAA.w',
    '.w.AAA.w',
    '...AAA..',
    '..AAAAA.',
    '..AAAAA.',
    '........',
  ],
  pal: { W: '#eeeeee', w: '#dddddd', A: '#ccaa66' },
};

const BAKERY: SpriteDef = {
  rows: [
    '....o...',
    '.OOOOOOO',
    '.OwWWwOO',
    '.OOOOOO.',
    '.OYYYYOO',
    '.OOOOOOo',
    '.OOdOOOO',
    'OOOOOOOO',
  ],
  pal: {
    O: '#ff7700', o: '#cc4400',
    W: '#ffffff', w: '#ffeeee',
    Y: '#ffdd00', d: '#663322',
  },
};

const IRON_MINE: SpriteDef = {
  rows: [
    'SSSSSSSS',
    'SSSsSSSS',
    'SSsSsSSS',
    'Ss......',
    'SS......',
    'SSsSsSSS',
    'nnnnnnnn',
    '........',
  ],
  pal: { S: '#888888', s: '#555555', n: '#443322' },
};

const FOUNDRY: SpriteDef = {
  rows: [
    '....s...',
    '....s...',
    '.sssssss',
    '.sFFFFss',
    '.sfFFfss',
    '.sssssss',
    'SSSSSSSS',
    '........',
  ],
  pal: {
    s: '#333333', S: '#666666',
    F: '#ff5500', f: '#ffaa00',
  },
};

const TOOLS_WORKSHOP: SpriteDef = {
  rows: [
    '.SSSSSSS',
    '.SWWwWWS',
    '.SSSSSSS',
    '.SWWwWWS',
    '.SSSSSSS',
    '.SyyyGSS',
    '.SSSSSSS',
    'SSSSSSSS',
  ],
  pal: {
    S: '#666666', W: '#ccdddd',
    w: '#aabbbb', y: '#ffcc00',
    G: '#22aa22',
  },
};

// ── Lookup tables ─────────────────────────────

const BY_ZONE: Partial<Record<string, SpriteDef>> = {
  water: WATER,
  road: ROAD,
  avenue: AVENUE,
  highway: HIGHWAY,
  farm: FARM,
  park: PARK,
  fire_station: FIRE_STATION,
  police_station: POLICE_STATION,
  power_plant: POWER_PLANT,
  water_pump: WATER_PUMP,
  hospital: HOSPITAL,
  school: SCHOOL,
  university: UNIVERSITY,
  waste_plant: WASTE_PLANT,
  granary: GRANARY,
  mill: MILL,
  bakery: BAKERY,
  iron_mine: IRON_MINE,
  foundry: FOUNDRY,
  tools_workshop: TOOLS_WORKSHOP,
};

const RES_BY_LEVEL = [undefined, RES1, RES2, RES3] as const;
const COM_BY_LEVEL = [undefined, COM1, COM2, COM3] as const;
const IND_BY_LEVEL = [undefined, IND1, IND2, IND3] as const;

export function getSpriteForTile(tile: Tile): SpriteDef | undefined {
  if (tile.damaged) return undefined;
  if (tile.type === 'residential') return RES_BY_LEVEL[tile.zoneLevel];
  if (tile.type === 'commercial')  return COM_BY_LEVEL[tile.zoneLevel];
  if (tile.type === 'industrial')  return IND_BY_LEVEL[tile.zoneLevel];
  return BY_ZONE[tile.type];
}

export function getSpriteForTool(tool: string): SpriteDef | undefined {
  if (tool === 'residential-low')    return RES1;
  if (tool === 'residential-medium') return RES2;
  if (tool === 'residential-high')   return RES3;
  if (tool.startsWith('residential')) return RES1;
  if (tool === 'commercial-low')     return COM1;
  if (tool === 'commercial-medium')  return COM2;
  if (tool === 'commercial-high')    return COM3;
  if (tool.startsWith('commercial')) return COM1;
  if (tool === 'industrial-light')   return IND1;
  if (tool === 'industrial-medium')  return IND2;
  if (tool === 'industrial-heavy')   return IND3;
  if (tool.startsWith('industrial')) return IND1;
  return BY_ZONE[tool];
}

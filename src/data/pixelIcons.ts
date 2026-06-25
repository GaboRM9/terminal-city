// ─────────────────────────────────────────────
//  8-bit pixel icon definitions (8 × 8 grids)
//  Each string in the grid is a row of 8 chars.
//  '.' = transparent. Other chars map to palette colors.
// ─────────────────────────────────────────────

export type PixelRow = (string | null)[];
export type IconGrid = PixelRow[]; // 8 rows × 8 cols

function icon(palette: Record<string, string>, rows: string[]): IconGrid {
  return rows.map((row) =>
    row.split('').map((ch) => (ch === '.' ? null : (palette[ch] ?? null))),
  );
}

// ── Color palette shortcuts ──────────────────
const G = '#00ff41'; const g = '#006618'; const d = '#002a0a'; // green (residential)
const A = '#ffb000'; const a = '#664400';                       // amber (commercial)
const O = '#ff6600'; const o = '#552200';                       // orange (industrial)
const H = '#999999'; const h = '#444444';                       // gray (road/metal)
const Y = '#ffee00'; const y = '#887700';                       // yellow (power)
const B = '#00aaff'; const b = '#004488';                       // blue (water)
const R = '#ff2200'; const r = '#880000';                       // red (fire)
const P = '#4488ff'; const p = '#223388';                       // blue-purple (police)
const N = '#44cc00'; const n = '#226600';                       // plant green (farm)
const T = '#00cc44'; const t = '#006622';                       // park green
const X = '#ff4444';                                            // demolish red
const W = '#cccccc'; const w = '#888888';                       // white/light gray
const M = '#cc8800'; const m = '#664400';                       // mill brown

export const PIXEL_ICONS: Record<string, IconGrid> = {

  // ── Zones ───────────────────────────────────

  residential: icon(
    { G, g, d },
    [
      '...GG...',
      '..GGGG..',
      '.GGGGGG.',
      'GGGGGGGG',
      'gggggggg',
      'gg.dd.gg',
      'gg.dd.gg',
      'gggggggg',
    ],
  ),

  commercial: icon(
    { A, a },
    [
      '.AAAAAA.',
      'AAAAAAAA',
      'A.AA.AAA',
      'AAAAAAAA',
      'A.AA.AAA',
      'AAAAAAAA',
      'A.AA.AAA',
      'AAAAAAAA',
    ],
  ),

  industrial: icon(
    { O, o },
    [
      '..OO....',
      '..OO....',
      '..OO....',
      '.oOOOOo.',
      'OOOOOOOO',
      'OO.OO.OO',
      'OOOOOOOO',
      'OOOOOOOO',
    ],
  ),

  farm: icon(
    { N, n },
    [
      'N.N.N.N.',
      'NNNNNNNN',
      'N.N.N.N.',
      'NNNNNNNN',
      '........',
      '...nn...',
      '...nn...',
      '...nn...',
    ],
  ),

  park: icon(
    { T, t },
    [
      '...TT...',
      '..TTTT..',
      '.TTTTTT.',
      'TTTTTTTT',
      '.TTTTTT.',
      '...tt...',
      '...tt...',
      '...tt...',
    ],
  ),

  empty: icon(
    { h },
    [
      '........',
      '........',
      '........',
      '....h...',
      '...h....',
      '........',
      '........',
      '........',
    ],
  ),

  // ── Roads ───────────────────────────────────

  road: icon(
    { H, h, W },
    [
      'HHHHHHHH',
      'H......H',
      'H..WW..H',
      'H..WW..H',
      'H..WW..H',
      'H..WW..H',
      'H......H',
      'HHHHHHHH',
    ],
  ),

  // ── Services ────────────────────────────────

  fire_station: icon(
    { R, r, Y: Y },
    [
      'RRRRRRRR',
      'RR....RR',
      'RRRRRRRR',
      'RR....RR',
      'RRRRRRRR',
      '.YYYYYY.',
      '.YYYYYY.',
      'RRRRRRRR',
    ],
  ),

  police_station: icon(
    { P, p, W },
    [
      '.PPPPPP.',
      'PPPPPPPP',
      'PP.PP.PP',
      'PP....PP',
      'PP.WW.PP',
      '.PPPPPP.',
      '..PPPP..',
      '...PP...',
    ],
  ),

  power_plant: icon(
    { Y, y },
    [
      '....Y...',
      '...YY...',
      '..YYY...',
      '.YYYY...',
      'YYYYY...',
      '.YYYY...',
      '..YYY...',
      '...YY...',
    ],
  ),

  water_pump: icon(
    { B, b },
    [
      '...BB...',
      '..BBBB..',
      '.BBBBBB.',
      'BBBBBBBB',
      'BBBBBBBB',
      '.BBBBBB.',
      '..BBBB..',
      '...bb...',
    ],
  ),

  // ── Production ──────────────────────────────

  granary: icon(
    { A, a, M },
    [
      '.aAAAAa.',
      'AAAAAAAA',
      'AAAAAAAA',
      'A.AAAA.A',
      'AAAAAAAA',
      'A.AAAA.A',
      'AAAAAAAA',
      'MMMMMMMM',
    ],
  ),

  mill: icon(
    { M, m, A },
    [
      '..M..M..',
      '.MM..MM.',
      'MMM..MMM',
      '....mm..',
      '..MMMM..',
      '....mm..',
      '..MMMM..',
      'MMMMMMMM',
    ],
  ),

  bakery: icon(
    { A, a, W, w },
    [
      '.w..w...',
      '.w..w...',
      '.AAAAAA.',
      'AAAAAAAA',
      'A.AAAA.A',
      'AAAAAAAA',
      'A......A',
      'AAAAAAAA',
    ],
  ),

  iron_mine: icon(
    { H, h, W },
    [
      'HHHHHHHH',
      'HH....HH',
      'H.hhhh.H',
      'H.h..h.H',
      'H.h..h.H',
      'HHHHHHHH',
      '.HHHHHH.',
      '..HHHH..',
    ],
  ),

  foundry: icon(
    { O, o, R, Y },
    [
      '..oo....',
      '..oo....',
      '.OOOO...',
      'OOOOOOOO',
      'OO.OO.OO',
      'RROORROO',
      'RRRRRRRR',
      'YYRRRRYY',
    ],
  ),

  tools_workshop: icon(
    { H, h, Y, y },
    [
      '.hh..hh.',
      'hHHHHHHh',
      'hH.HH.Hh',
      'hHHYYHHh',
      'hHHYYHHh',
      'hH.HH.Hh',
      'hHHHHHHh',
      '.hh..hh.',
    ],
  ),

  // ── Special ─────────────────────────────────

  demolish: icon(
    { X, R: R },
    [
      'X......X',
      '.X....X.',
      '..X..X..',
      '...XX...',
      '...XX...',
      '..X..X..',
      '.X....X.',
      'X......X',
    ],
  ),

  water: icon(
    { B, b },
    [
      'B.B.B.B.',
      '.B.B.B.B',
      'B.B.B.B.',
      '.B.B.B.B',
      'b.b.b.b.',
      '.b.b.b.b',
      'b.b.b.b.',
      '.b.b.b.b',
    ],
  ),
};

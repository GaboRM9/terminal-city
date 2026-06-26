import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { GameState } from '../engine/types';
import { getTileRenderConfig, getTileColor } from './asciiMap';
import { drawSprite, getSpriteForTile, getSpriteForTool } from './sprites';
import { useGameStore } from '../store/gameStore';
import { BUILDINGS } from '../data/buildings';
import { districtCentroid } from '../engine/districts';
import {
  RULER_W, RULER_H, CAR_COUNT,
  type PixelCar,
  initCars, updateCars, respawnStuckCars,
} from './pixelCars';

// ─────────────────────────────────────────────
//  Canvas map renderer with animated pixel cars
// ─────────────────────────────────────────────

const HOVER_BAR_H = 18; // px reserved for the coord/tile hover strip

interface MapRendererProps {
  dimUncovered?: boolean;
}

// ── Road preview helper ───────────────────────
function buildRoadPreview(
  roadStart: { x: number; y: number },
  hovered: { x: number; y: number },
): Set<string> {
  const keys = new Set<string>();
  const stepX = hovered.x > roadStart.x ? 1 : -1;
  for (let x = roadStart.x; x !== hovered.x; x += stepX) keys.add(`${x},${roadStart.y}`);
  const stepY = hovered.y > roadStart.y ? 1 : -1;
  for (let y = roadStart.y; y !== hovered.y + stepY; y += stepY) keys.add(`${hovered.x},${y}`);
  return keys;
}

// ── Car drawing ───────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function drawCar(ctx: CanvasRenderingContext2D, car: PixelCar, tileSize: number): void {
  const drawX = lerp(car.fromX, car.toX, car.t);
  const drawY = lerp(car.fromY, car.toY, car.t);

  const px = RULER_W + drawX * tileSize;
  const py = RULER_H + drawY * tileSize;

  const isHoriz = car.dx !== 0 || car.toX !== car.fromX;

  const bodyW = isHoriz ? Math.round(tileSize * 0.80) : Math.round(tileSize * 0.46);
  const bodyH = isHoriz ? Math.round(tileSize * 0.46) : Math.round(tileSize * 0.80);

  const bx = px + (tileSize - bodyW) / 2;
  const by = py + (tileSize - bodyH) / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx + 1, by + 2, bodyW, bodyH);

  // Car body
  ctx.fillStyle = car.color;
  ctx.fillRect(bx, by, bodyW, bodyH);

  // Windshield / roof area
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  if (isHoriz) {
    const stripX = car.dx >= 0 ? bx : bx + Math.floor(bodyW * 0.5);
    ctx.fillRect(stripX, by + 1, Math.floor(bodyW * 0.5), Math.floor(bodyH * 0.62));
  } else {
    const stripY = car.dy >= 0 ? by : by + Math.floor(bodyH * 0.5);
    ctx.fillRect(bx + 1, stripY, Math.floor(bodyW * 0.62), Math.floor(bodyH * 0.5));
  }

  // Headlights
  const HL = 2;
  ctx.fillStyle = '#ffffaa';
  if (isHoriz) {
    const fX = car.dx >= 0 ? bx + bodyW - HL : bx;
    ctx.fillRect(fX, by + 1, HL, HL);
    ctx.fillRect(fX, by + bodyH - HL - 1, HL, HL);
  } else {
    const fY = car.dy >= 0 ? by + bodyH - HL : by;
    ctx.fillRect(bx + 1, fY, HL, HL);
    ctx.fillRect(bx + bodyW - HL - 1, fY, HL, HL);
  }

  // Wheels
  const WH = Math.max(2, Math.round(tileSize * 0.10));
  ctx.fillStyle = '#111111';
  ctx.fillRect(bx,             by + bodyH - WH, WH, WH);
  ctx.fillRect(bx + bodyW - WH, by + bodyH - WH, WH, WH);
  ctx.fillRect(bx,             by,               WH, WH);
  ctx.fillRect(bx + bodyW - WH, by,               WH, WH);
}

// ── Main draw call (called every rAF frame) ───
function drawFrame(
  canvas: HTMLCanvasElement,
  state: GameState,
  cars: PixelCar[],
  hovered: { x: number; y: number } | null,
  buildTool: string | null,
  roadStart: { x: number; y: number } | null,
  dimUncovered: boolean,
  showTraffic: boolean,
  districtPaintMode: string | null,
  tileSize: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = state.worldWidth;
  const H = state.worldHeight;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Rulers ──────────────────────────────────
  ctx.fillStyle = '#2a2a2a';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let x = 0; x < W; x += 5) {
    ctx.fillText(String(x), RULER_W + x * tileSize + tileSize / 2, 7);
  }
  ctx.textAlign = 'right';
  for (let y = 0; y < H; y++) {
    ctx.fillText(
      String(y).padStart(2, '0'),
      RULER_W - 3,
      RULER_H + y * tileSize + tileSize / 2,
    );
  }

  // ── Road preview set ────────────────────────
  const previewKeys: Set<string> =
    buildTool === 'road' && roadStart && hovered
      ? buildRoadPreview(roadStart, hovered)
      : new Set();

  // ── Tiles ────────────────────────────────────
  const fontSize = Math.floor(tileSize * 0.55);
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const paintDistrict = districtPaintMode
    ? state.districts.find((d) => d.id === districtPaintMode) ?? null
    : null;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tile = state.tiles[y * W + x];
      const config = getTileRenderConfig(tile);
      const key = `${x},${y}`;

      const isHov     = hovered?.x === x && hovered?.y === y;
      const isStart   = roadStart?.x === x && roadStart?.y === y;
      const isPreview = previewKeys.has(key);

      const px = RULER_W + x * tileSize;
      const py = RULER_H + y * tileSize;

      // Tile background
      let bg = config.bgColor ?? '#0a0a0a';
      if      (isStart)                                     bg = '#1a4a1a';
      else if (isPreview)                                   bg = '#0f2a0f';
      else if (isHov && districtPaintMode && paintDistrict) bg = paintDistrict.color + '33';
      else if (isHov && buildTool === 'demolish')           bg = '#2a0808';
      else if (isHov && buildTool)                          bg = '#0c1e0c';
      else if (isHov)                                       bg = '#111811';

      ctx.fillStyle = bg;
      ctx.fillRect(px, py, tileSize, tileSize);

      // Subtle grid border
      ctx.strokeStyle = '#0e0e0e';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

      // ── Sprite or fallback text ───────────────
      if (isPreview) {
        const roadSpr = getSpriteForTool('road');
        if (roadSpr) drawSprite(ctx, roadSpr, px, py, tileSize, 0.6);
        else {
          ctx.fillStyle = '#336633';
          ctx.fillText('#', px + tileSize / 2, py + tileSize / 2 + 1);
        }
      } else if (isStart) {
        ctx.fillStyle = '#55ff55';
        ctx.fillText('#', px + tileSize / 2, py + tileSize / 2 + 1);
      } else if (isHov && buildTool && buildTool !== 'demolish') {
        const tileSpr = getSpriteForTile(tile);
        if (tileSpr) drawSprite(ctx, tileSpr, px, py, tileSize);
        else {
          ctx.fillStyle = getTileColor(tile, dimUncovered);
          ctx.fillText(config.char, px + tileSize / 2, py + tileSize / 2 + 1);
        }
        const previewSpr = getSpriteForTool(buildTool);
        if (previewSpr) {
          drawSprite(ctx, previewSpr, px, py, tileSize, 0.55);
        } else {
          const bdef = BUILDINGS.find((b) => b.type === buildTool);
          if (bdef) {
            ctx.fillStyle = bdef.color + '99';
            ctx.fillText(bdef.char, px + tileSize / 2, py + tileSize / 2 + 1);
          }
        }
      } else if (isHov && buildTool === 'demolish') {
        const tileSpr = getSpriteForTile(tile);
        if (tileSpr) drawSprite(ctx, tileSpr, px, py, tileSize, 0.4);
        ctx.fillStyle = 'rgba(255,30,30,0.45)';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else if (tile.damaged) {
        ctx.fillStyle = '#880000';
        ctx.fillText('X', px + tileSize / 2, py + tileSize / 2 + 1);
      } else {
        const sprite = getSpriteForTile(tile);
        if (sprite) {
          drawSprite(ctx, sprite, px, py, tileSize);
        } else {
          ctx.fillStyle = getTileColor(tile, dimUncovered);
          ctx.fillText(config.char, px + tileSize / 2, py + tileSize / 2 + 1);
        }
      }

      // Pollution overlay
      const pol = tile.pollution ?? 0;
      if (pol > 10) {
        const alpha = Math.min(0.55, (pol - 10) / 120);
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha.toFixed(3)})`;
        ctx.fillRect(px, py, tileSize, tileSize);
      }

      // Traffic heatmap overlay
      if (showTraffic && (tile.type === 'road' || tile.type === 'avenue' || tile.type === 'highway')) {
        const load = tile.trafficLoad ?? 0;
        if (load > 0) {
          const r = Math.round(load * 2.55);
          const g = Math.round((100 - load) * 2.55);
          ctx.fillStyle = `rgba(${r}, ${g}, 0, 0.75)`;
          ctx.fillRect(px, py, tileSize, tileSize);
        }
      }
    }
  }

  // ── District overlay ─────────────────────────
  if (state.districts.length > 0) {
    for (const district of state.districts) {
      if (district.tileIds.length === 0) continue;
      const tileSet = new Set(district.tileIds);

      ctx.fillStyle = district.color + '22';
      for (const idx of district.tileIds) {
        const tx = idx % W;
        const ty = Math.floor(idx / W);
        ctx.fillRect(RULER_W + tx * tileSize, RULER_H + ty * tileSize, tileSize, tileSize);
      }

      ctx.strokeStyle = district.color;
      ctx.lineWidth = 1.5;
      for (const idx of district.tileIds) {
        const tx = idx % W;
        const ty = Math.floor(idx / W);
        const px = RULER_W + tx * tileSize;
        const py = RULER_H + ty * tileSize;
        if (ty === 0 || !tileSet.has((ty - 1) * W + tx)) {
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + tileSize, py); ctx.stroke();
        }
        if (ty === H - 1 || !tileSet.has((ty + 1) * W + tx)) {
          ctx.beginPath(); ctx.moveTo(px, py + tileSize); ctx.lineTo(px + tileSize, py + tileSize); ctx.stroke();
        }
        if (tx === 0 || !tileSet.has(ty * W + (tx - 1))) {
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + tileSize); ctx.stroke();
        }
        if (tx === W - 1 || !tileSet.has(ty * W + (tx + 1))) {
          ctx.beginPath(); ctx.moveTo(px + tileSize, py); ctx.lineTo(px + tileSize, py + tileSize); ctx.stroke();
        }
      }

      const center = districtCentroid(district, W);
      if (center) {
        const cx = RULER_W + center.tileX * tileSize + tileSize / 2;
        const cy = RULER_H + center.tileY * tileSize + tileSize / 2;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00000099';
        ctx.fillRect(cx - 20, cy - 5, 40, 10);
        ctx.fillStyle = district.color;
        ctx.fillText(district.name.substring(0, 8), cx, cy);
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
  }

  // ── Cars ─────────────────────────────────────
  for (const car of cars) {
    drawCar(ctx, car, tileSize);
  }
}

// ── React component ───────────────────────────
export function MapRenderer({ dimUncovered = false }: MapRendererProps): JSX.Element {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const carsRef     = useRef<PixelCar[]>([]);
  const hoveredRef  = useRef<{ x: number; y: number } | null>(null);
  const frameRef    = useRef<number>(0);

  const stateRef         = useRef<GameState | null>(null);
  const buildToolRef     = useRef<string | null>(null);
  const roadStartRef     = useRef<{ x: number; y: number } | null>(null);
  const dimRef           = useRef(dimUncovered);
  const tileSizeRef      = useRef(24);

  const { state, buildTool, roadStart, handleTileClick, showTraffic, districtPaintMode } = useGameStore();

  stateRef.current     = state;
  buildToolRef.current = buildTool;
  roadStartRef.current = roadStart;
  dimRef.current       = dimUncovered;

  const showTrafficRef    = useRef(showTraffic);
  showTrafficRef.current  = showTraffic;
  const districtPaintRef  = useRef(districtPaintMode);
  districtPaintRef.current = districtPaintMode;

  // Dynamic tile size — fills the wrapper, no scrollbars
  const [tileSize, setTileSize] = useState(24);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const recalc = () => {
      const s = stateRef.current;
      if (!s) return;
      const W = s.worldWidth;
      const H = s.worldHeight;
      const cw = wrapper.clientWidth;
      const ch = wrapper.clientHeight - HOVER_BAR_H;
      const ts = Math.max(
        8,
        Math.min(
          Math.floor((cw - RULER_W) / W),
          Math.floor((ch - RULER_H) / H),
        ),
      );
      if (ts !== tileSizeRef.current) {
        tileSizeRef.current = ts;
        setTileSize(ts);
      }
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [hoverInfo, setHoverInfo] = useState('');

  const roadCount = useMemo(
    () => state.tiles.filter((t) => t.type === 'road' || t.type === 'avenue' || t.type === 'highway').length,
    [state.tiles],
  );

  useEffect(() => {
    if (roadCount === 0) {
      carsRef.current = [];
      return;
    }
    if (carsRef.current.length === 0) {
      carsRef.current = initCars(state.tiles, state.worldWidth, state.worldHeight);
    } else {
      carsRef.current = respawnStuckCars(
        carsRef.current, state.tiles, state.worldWidth, state.worldHeight,
      );
      if (carsRef.current.length < Math.min(CAR_COUNT, Math.floor(roadCount * 0.2) + 1)) {
        const fresh = initCars(state.tiles, state.worldWidth, state.worldHeight);
        const ids = new Set(carsRef.current.map((c) => c.id));
        carsRef.current = [
          ...carsRef.current,
          ...fresh.filter((c) => !ids.has(c.id)),
        ];
      }
    }
  }, [roadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function frame() {
      const s = stateRef.current;
      if (!s || !canvas) return;

      carsRef.current = updateCars(
        carsRef.current, s.tiles, s.worldWidth, s.worldHeight,
      );
      drawFrame(
        canvas, s, carsRef.current,
        hoveredRef.current, buildToolRef.current,
        roadStartRef.current, dimRef.current,
        showTrafficRef.current,
        districtPaintRef.current,
        tileSizeRef.current,
      );
      frameRef.current = requestAnimationFrame(frame);
    }

    frameRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Interaction handlers ──────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ts = tileSizeRef.current;
    const tx = Math.floor(((e.clientX - rect.left) * scaleX - RULER_W) / ts);
    const ty = Math.floor(((e.clientY - rect.top)  * scaleY - RULER_H) / ts);

    const s = stateRef.current;
    if (!s || tx < 0 || ty < 0 || tx >= s.worldWidth || ty >= s.worldHeight) {
      hoveredRef.current = null;
      setHoverInfo('');
      return;
    }
    hoveredRef.current = { x: tx, y: ty };
    const tile = s.tiles[ty * s.worldWidth + tx];
    const svcs = (Object.keys(tile.coverage) as Array<keyof typeof tile.coverage>)
      .filter((k) => tile.coverage[k]).join(', ');
    setHoverInfo(
      `(${tx},${ty}) ${tile.type} | Lv${tile.zoneLevel} | Pob ${tile.population}${svcs ? ` | ${svcs}` : ''}`,
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    setHoverInfo('');
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const bt = buildToolRef.current;
    if (!canvas || !bt) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const ts = tileSizeRef.current;
    const tx = Math.floor(((e.clientX - rect.left) * scaleX - RULER_W) / ts);
    const ty = Math.floor(((e.clientY - rect.top)  * scaleY - RULER_H) / ts);
    const s = stateRef.current;
    if (!s || tx < 0 || ty < 0 || tx >= s.worldWidth || ty >= s.worldHeight) return;
    handleTileClick(tx, ty);
  }, [handleTileClick]);

  const canvasW = RULER_W + state.worldWidth  * tileSize;
  const canvasH = RULER_H + state.worldHeight * tileSize;

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          display: 'block',
          cursor: buildTool ? 'crosshair' : 'default',
          imageRendering: 'pixelated',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          color: '#444',
          fontSize: '11px',
          fontFamily: '"JetBrains Mono", monospace',
          height: HOVER_BAR_H,
          lineHeight: `${HOVER_BAR_H}px`,
          paddingLeft: 4,
          flexShrink: 0,
        }}
      >
        {hoverInfo}
        {hoverInfo && buildTool && (
          <span style={{ color: '#00ff41', marginLeft: 8 }}>[{buildTool}]</span>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { GameState } from '../engine/types';
import { getTileRenderConfig, getTileColor } from './asciiMap';
import { useGameStore } from '../store/gameStore';
import { BUILDINGS } from '../data/buildings';
import {
  TILE_SIZE, RULER_W, RULER_H, CAR_COUNT,
  type PixelCar,
  initCars, updateCars, respawnStuckCars,
} from './pixelCars';

// ─────────────────────────────────────────────
//  Canvas map renderer with animated pixel cars
// ─────────────────────────────────────────────

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

function drawCar(ctx: CanvasRenderingContext2D, car: PixelCar): void {
  const drawX = lerp(car.fromX, car.toX, car.t);
  const drawY = lerp(car.fromY, car.toY, car.t);

  const px = RULER_W + drawX * TILE_SIZE;
  const py = RULER_H + drawY * TILE_SIZE;

  const isHoriz = car.dx !== 0 || car.toX !== car.fromX;

  const bodyW = isHoriz ? Math.round(TILE_SIZE * 0.80) : Math.round(TILE_SIZE * 0.46);
  const bodyH = isHoriz ? Math.round(TILE_SIZE * 0.46) : Math.round(TILE_SIZE * 0.80);

  const bx = px + (TILE_SIZE - bodyW) / 2;
  const by = py + (TILE_SIZE - bodyH) / 2;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx + 1, by + 2, bodyW, bodyH);

  // Car body
  ctx.fillStyle = car.color;
  ctx.fillRect(bx, by, bodyW, bodyH);

  // Windshield / roof area (dark strip toward the rear, so front is clear)
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  if (isHoriz) {
    // dark strip in back half
    const stripX = car.dx >= 0 ? bx : bx + Math.floor(bodyW * 0.5);
    ctx.fillRect(stripX, by + 1, Math.floor(bodyW * 0.5), Math.floor(bodyH * 0.62));
  } else {
    const stripY = car.dy >= 0 ? by : by + Math.floor(bodyH * 0.5);
    ctx.fillRect(bx + 1, stripY, Math.floor(bodyW * 0.62), Math.floor(bodyH * 0.5));
  }

  // Headlights — tiny bright pixels at front of car
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

  // Wheels — dark dots at body corners
  const WH = Math.max(2, Math.round(TILE_SIZE * 0.10));
  ctx.fillStyle = '#111111';
  ctx.fillRect(bx,            by + bodyH - WH, WH, WH);
  ctx.fillRect(bx + bodyW - WH, by + bodyH - WH, WH, WH);
  ctx.fillRect(bx,            by,              WH, WH);
  ctx.fillRect(bx + bodyW - WH, by,              WH, WH);
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
    ctx.fillText(String(x), RULER_W + x * TILE_SIZE + TILE_SIZE / 2, 7);
  }
  ctx.textAlign = 'right';
  for (let y = 0; y < H; y++) {
    ctx.fillText(
      String(y).padStart(2, '0'),
      RULER_W - 3,
      RULER_H + y * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  // ── Road preview set ────────────────────────
  const previewKeys: Set<string> =
    buildTool === 'road' && roadStart && hovered
      ? buildRoadPreview(roadStart, hovered)
      : new Set();

  // ── Tiles ────────────────────────────────────
  const fontSize = Math.floor(TILE_SIZE * 0.60);
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tile = state.tiles[y * W + x];
      const config = getTileRenderConfig(tile);
      const key = `${x},${y}`;

      const isHov     = hovered?.x === x && hovered?.y === y;
      const isStart   = roadStart?.x === x && roadStart?.y === y;
      const isPreview = previewKeys.has(key);

      const px = RULER_W + x * TILE_SIZE;
      const py = RULER_H + y * TILE_SIZE;

      // Tile background
      let bg = config.bgColor ?? '#0a0a0a';
      if      (isStart)                               bg = '#1a4a1a';
      else if (isPreview)                             bg = '#0f2a0f';
      else if (isHov && buildTool === 'demolish')     bg = '#2a0808';
      else if (isHov && buildTool)                    bg = '#0c1e0c';
      else if (isHov)                                 bg = '#111811';

      ctx.fillStyle = bg;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Subtle grid border
      ctx.strokeStyle = '#0e0e0e';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

      // Character
      let char  = config.char;
      let color = getTileColor(tile, dimUncovered);

      if (isStart)   { char = '#'; color = '#55ff55'; }
      else if (isPreview) { char = '#'; color = '#336633'; }
      else if (isHov && buildTool && buildTool !== 'demolish') {
        const bdef = BUILDINGS.find((b) => b.type === buildTool);
        if (bdef) { char = bdef.char; color = bdef.color + 'aa'; }
      } else if (isHov && buildTool === 'demolish') {
        color = '#ff220088';
      }

      ctx.fillStyle = color;
      ctx.fillText(char, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 1);
    }
  }

  // ── Cars (drawn above tiles) ─────────────────
  for (const car of cars) {
    drawCar(ctx, car);
  }
}

// ── React component ───────────────────────────
export function MapRenderer({ dimUncovered = false }: MapRendererProps): JSX.Element {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const carsRef     = useRef<PixelCar[]>([]);
  const hoveredRef  = useRef<{ x: number; y: number } | null>(null);
  const frameRef    = useRef<number>(0);

  // Mirror store slices into refs so the rAF closure always reads the latest
  const stateRef      = useRef<GameState | null>(null);
  const buildToolRef  = useRef<string | null>(null);
  const roadStartRef  = useRef<{ x: number; y: number } | null>(null);
  const dimRef        = useRef(dimUncovered);

  const { state, buildTool, roadStart, handleTileClick } = useGameStore();

  stateRef.current     = state;
  buildToolRef.current = buildTool;
  roadStartRef.current = roadStart;
  dimRef.current       = dimUncovered;

  const [hoverInfo, setHoverInfo] = useState('');

  // Reinitialise / respawn cars whenever road count changes
  const roadCount = useMemo(
    () => state.tiles.filter((t) => t.type === 'road').length,
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
      // Respawn any car stranded on a non-road tile
      carsRef.current = respawnStuckCars(
        carsRef.current, state.tiles, state.worldWidth, state.worldHeight,
      );
      // If still not enough cars, top up
      if (carsRef.current.length < Math.min(CAR_COUNT, Math.floor(roadCount * 0.2) + 1)) {
        const fresh = initCars(state.tiles, state.worldWidth, state.worldHeight);
        // Merge, dedup by id
        const ids = new Set(carsRef.current.map((c) => c.id));
        carsRef.current = [
          ...carsRef.current,
          ...fresh.filter((c) => !ids.has(c.id)),
        ];
      }
    }
  }, [roadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop — runs once on mount
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
    const tx = Math.floor(((e.clientX - rect.left) * scaleX - RULER_W) / TILE_SIZE);
    const ty = Math.floor(((e.clientY - rect.top)  * scaleY - RULER_H) / TILE_SIZE);

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
    const tx = Math.floor(((e.clientX - rect.left) * scaleX - RULER_W) / TILE_SIZE);
    const ty = Math.floor(((e.clientY - rect.top)  * scaleY - RULER_H) / TILE_SIZE);
    const s = stateRef.current;
    if (!s || tx < 0 || ty < 0 || tx >= s.worldWidth || ty >= s.worldHeight) return;
    handleTileClick(tx, ty);
  }, [handleTileClick]);

  const canvasW = RULER_W + state.worldWidth  * TILE_SIZE;
  const canvasH = RULER_H + state.worldHeight * TILE_SIZE;

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a',
        padding: '8px',
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
        }}
      />
      <div
        style={{
          color: '#444',
          fontSize: '11px',
          fontFamily: '"JetBrains Mono", monospace',
          marginTop: 4,
          height: 14,
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

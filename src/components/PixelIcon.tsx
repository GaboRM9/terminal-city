import type { IconGrid } from '../data/pixelIcons';

// ─────────────────────────────────────────────
//  8-bit pixel art renderer — CSS grid of micro-divs
// ─────────────────────────────────────────────

interface PixelIconProps {
  grid: IconGrid;
  /** px per pixel — default 4 → 32×32 icon */
  pixelSize?: number;
  /** Optional outer glow/border color when active */
  active?: boolean;
  dim?: boolean;
}

export function PixelIcon({ grid, pixelSize = 4, active = false, dim = false }: PixelIconProps): JSX.Element {
  const cols = grid[0]?.length ?? 8;
  const rows = grid.length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
        gap: 0,
        imageRendering: 'pixelated',
        opacity: dim ? 0.4 : 1,
        filter: active ? 'drop-shadow(0 0 4px #00ff41)' : undefined,
        flexShrink: 0,
      }}
    >
      {grid.flat().map((color, i) => (
        <div
          key={i}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: color ?? 'transparent',
          }}
        />
      ))}
    </div>
  );
}

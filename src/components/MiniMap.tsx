import { useGameStore } from '../store/gameStore';
import { getMinimapConfig } from '../renderer/asciiMap';

// ─────────────────────────────────────────────
//  Minimap — compact colored-block overview
// ─────────────────────────────────────────────

export function MiniMap(): JSX.Element {
  const { state } = useGameStore();

  const rows: JSX.Element[] = [];

  for (let y = 0; y < state.worldHeight; y++) {
    const cells: JSX.Element[] = [];
    for (let x = 0; x < state.worldWidth; x++) {
      const tile = state.tiles[y * state.worldWidth + x];
      const { char, color } = getMinimapConfig(tile);
      cells.push(
        <span
          key={x}
          style={{
            color,
            display: 'inline-block',
            width: '0.5ch',
            fontSize: '6px',
            lineHeight: 1,
          }}
          title={`(${x},${y}) ${tile.type}`}
        >
          {char}
        </span>,
      );
    }
    rows.push(
      <div key={y} style={{ display: 'flex' }}>
        {cells}
      </div>,
    );
  }

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        backgroundColor: '#0a0a0a',
        border: '1px solid #1a3a1a',
        padding: '4px',
        display: 'inline-block',
      }}
    >
      <div style={{ color: '#555', fontSize: '9px', marginBottom: 2 }}>MINIMAPA</div>
      {rows}
    </div>
  );
}

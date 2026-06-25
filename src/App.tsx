import React, { useEffect } from 'react';
import { MapRenderer } from './renderer/MapRenderer';
import { StatusPanel } from './components/StatusPanel';
import { CommandConsole } from './components/CommandConsole';
import { EventLog } from './components/EventLog';
import { MiniMap } from './components/MiniMap';
import { Pixelgram } from './components/Pixelgram';
import { BuildCatalog } from './components/BuildCatalog';
import { useGameStore } from './store/gameStore';

// ─────────────────────────────────────────────
//  App shell — full-screen terminal layout
// ─────────────────────────────────────────────

function VictoryOverlay(): JSX.Element | null {
  const { state, setSpeed } = useGameStore();
  const [dismissed, setDismissed] = React.useState(false);
  if (!state.victory || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <div
        style={{
          border: '2px solid #00ff41', backgroundColor: '#050f05',
          padding: '32px 48px', maxWidth: 480, textAlign: 'center',
        }}
      >
        <div style={{ color: '#ffb000', fontSize: 22, marginBottom: 12, letterSpacing: 2 }}>
          ⭐ CARTA DE CIUDAD ⭐
        </div>
        <div style={{ color: '#00ff41', fontSize: 13, lineHeight: 2 }}>
          <div>Terminal City ha alcanzado el estatus</div>
          <div>oficial de <strong>CIUDAD</strong>.</div>
          <div style={{ color: '#555', margin: '12px 0' }}>───────────────────────</div>
          <div>Año {state.year} · {state.population} ciudadanos</div>
          <div>Felicidad: {state.happiness}% · Balance: ${state.economy.balance.toLocaleString()}</div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => { setDismissed(true); }}
            style={{
              background: '#0a2a0a', border: '1px solid #00ff41', color: '#00ff41',
              padding: '6px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            Continuar creciendo
          </button>
          <button
            onClick={() => { setDismissed(true); setSpeed('pause'); }}
            style={{
              background: 'transparent', border: '1px solid #555', color: '#555',
              padding: '6px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            Pausar
          </button>
        </div>
      </div>
    </div>
  );
}

export function App(): JSX.Element {
  const { state, setSpeed, showLivestats, toggleLivestats } = useGameStore();

  useEffect(() => {
    setSpeed(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        color: '#00ff41',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          backgroundColor: '#0d0d0d',
          borderBottom: '1px solid #1a3a1a',
          padding: '4px 12px',
          fontSize: '11px',
          color: '#555',
          display: 'flex',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span>
          <span style={{ color: '#00ff41' }}>TERMINAL CITY v0.1</span>
          {' — city builder de consola'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Tick #{state.tickCount} | {state.tiles.filter((t) => t.type !== 'empty').length} tiles</span>
          {/* Livestats toggle pill */}
          <button
            onClick={toggleLivestats}
            title="Alternar entre Pixelgram y LiveStats (o escribe 'livestats')"
            style={{
              background: showLivestats ? '#0a2a0a' : 'transparent',
              border: `1px solid ${showLivestats ? '#00ff41' : '#333'}`,
              color: showLivestats ? '#00ff41' : '#444',
              cursor: 'pointer',
              padding: '1px 8px',
              fontSize: 10,
              fontFamily: 'inherit',
              borderRadius: 2,
              letterSpacing: 1,
            }}
          >
            {showLivestats ? '◈ LIVESTATS' : '◆ PIXELGRAM'}
          </button>
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left column: map + build catalog ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <MapRenderer dimUncovered />
          </div>
          <BuildCatalog />
        </div>

        {/* ── Right column ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 340,
            borderLeft: '1px solid #1a3a1a',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {showLivestats ? (
            /* LiveStats mode: simulation log + minimap */
            <>
              <EventLog />
              <div
                style={{
                  borderTop: '1px solid #1a3a1a',
                  padding: '6px 8px',
                  backgroundColor: '#080808',
                  flexShrink: 0,
                }}
              >
                <MiniMap />
              </div>
            </>
          ) : (
            /* Default: Pixelgram social feed */
            <Pixelgram />
          )}

          {/* Command console — always visible */}
          <CommandConsole />
        </div>
      </div>

      {/* Status bar */}
      <StatusPanel />

      {/* Victory overlay */}
      <VictoryOverlay />
    </div>
  );
}

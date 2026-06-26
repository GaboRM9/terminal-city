import React, { useEffect } from 'react';
import { MapRenderer } from './renderer/MapRenderer';
import { StatusPanel } from './components/StatusPanel';
import { CommandConsole } from './components/CommandConsole';
import { EventLog } from './components/EventLog';
import { MiniMap } from './components/MiniMap';
import { Pixelgram } from './components/Pixelgram';
import { BuildCatalog } from './components/BuildCatalog';
import { ChartsPanel } from './components/ChartsPanel';
import { MainMenu } from './components/MainMenu';
import { useGameStore } from './store/gameStore';
import { UI } from './i18n';
import { useState } from 'react';

// ─────────────────────────────────────────────
//  App shell — full-screen terminal layout
// ─────────────────────────────────────────────

const MONO = '"JetBrains Mono", "Fira Code", monospace';

function VictoryOverlay(): JSX.Element | null {
  const { state, setSpeed, lang } = useGameStore();
  const t = UI[lang];
  const [dismissed, setDismissed] = React.useState(false);
  if (!state.victory || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, fontFamily: MONO,
      }}
    >
      <div
        style={{
          border: '2px solid #00ff41', backgroundColor: '#050f05',
          padding: '32px 48px', maxWidth: 480, textAlign: 'center',
        }}
      >
        <div style={{ color: '#ffb000', fontSize: 22, marginBottom: 12, letterSpacing: 2 }}>
          {t.victoryTitle}
        </div>
        <div style={{ color: '#00ff41', fontSize: 13, lineHeight: 2 }}>
          <div>{t.victoryLine1}</div>
          <div><strong>{t.victoryLine2}</strong></div>
          <div style={{ color: '#555', margin: '12px 0' }}>───────────────────────</div>
          <div>{t.victoryYear(state.year)} · {t.victoryCitizens(state.population)}</div>
          <div>{t.victoryHappiness(state.happiness)} · {t.victoryBalance(state.economy.balance)}</div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: '#0a2a0a', border: '1px solid #00ff41', color: '#00ff41',
              padding: '6px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            {t.victoryContinue}
          </button>
          <button
            onClick={() => { setDismissed(true); setSpeed('pause'); }}
            style={{
              background: 'transparent', border: '1px solid #555', color: '#555',
              padding: '6px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
            }}
          >
            {t.victoryPause}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── City console tab bar ─────────────────────────────────────────────────────

type ConsoleTab = 'console' | 'pixelgram' | 'livestats' | 'charts';

const TAB_ICONS: Record<ConsoleTab, string> = {
  console:   '>_',
  pixelgram: '◆',
  livestats: '◈',
  charts:    '▲',
};

function CityConsole(): JSX.Element {
  const { consoleTab, setConsoleTab, lang } = useGameStore();
  const t = UI[lang];

  const tabs: { id: ConsoleTab; label: string }[] = [
    { id: 'console',   label: t.consoleHeader },
    { id: 'pixelgram', label: t.panels.pixelgram },
    { id: 'livestats', label: t.panels.livestats },
    { id: 'charts',    label: t.panels.charts },
  ];

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid #1a3a1a',
        display: 'flex',
        flexDirection: 'column',
        height: 240,
        backgroundColor: '#060606',
        fontFamily: MONO,
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a3a1a', flexShrink: 0, backgroundColor: '#080808' }}>
        <span style={{ padding: '4px 10px', color: '#1a3a1a', fontSize: 10, letterSpacing: 1, borderRight: '1px solid #1a3a1a', userSelect: 'none' }}>
          {'>'} city-console
        </span>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setConsoleTab(id)}
            style={{
              background:    consoleTab === id ? '#0a2a0a' : 'transparent',
              border:        'none',
              borderRight:   '1px solid #1a3a1a',
              borderBottom:  consoleTab === id ? '2px solid #00ff41' : '2px solid transparent',
              color:         consoleTab === id ? '#00ff41' : '#444',
              cursor:        'pointer',
              padding:       '4px 12px',
              fontSize:      10,
              fontFamily:    'inherit',
              letterSpacing: 1,
              display:       'flex',
              alignItems:    'center',
              gap:           5,
            }}
          >
            <span style={{ fontSize: 11 }}>{TAB_ICONS[id]}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {consoleTab === 'console' && <CommandConsole />}
        {consoleTab === 'pixelgram' && <Pixelgram />}
        {consoleTab === 'livestats' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <EventLog />
            <div style={{ borderLeft: '1px solid #1a3a1a', padding: '6px 8px', backgroundColor: '#080808', flexShrink: 0 }}>
              <MiniMap />
            </div>
          </div>
        )}
        {consoleTab === 'charts' && <ChartsPanel />}
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export function App(): JSX.Element {
  const { state, setSpeed, lang } = useGameStore();
  const t = UI[lang];
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');

  useEffect(() => {
    if (screen === 'game') setSpeed(1);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (screen === 'menu') {
    return <MainMenu onEnterGame={() => setScreen('game')} />;
  }

  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        height:          '100vh',
        width:           '100vw',
        backgroundColor: '#0a0a0a',
        overflow:        'hidden',
        fontFamily:      MONO,
        color:           '#00ff41',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          backgroundColor: '#0d0d0d',
          borderBottom:    '1px solid #1a3a1a',
          padding:         '4px 12px',
          fontSize:        '11px',
          color:           '#555',
          display:         'flex',
          justifyContent:  'space-between',
          alignItems:      'center',
          flexShrink:      0,
        }}
      >
        <span>
          <span style={{ color: '#00ff41' }}>{t.appTitle}</span>
          {t.appSubtitle}
        </span>
        <span>
          {t.tickCount(state.tickCount, state.tiles.filter((tile) => tile.type !== 'empty').length)}
        </span>
      </div>

      {/* Main area: map + building sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Map — fills available space, tile size auto-fits */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          <MapRenderer dimUncovered />
        </div>

        {/* Building sidebar */}
        <BuildCatalog />
      </div>

      {/* City console — tabbed, full width */}
      <CityConsole />

      {/* Status bar */}
      <StatusPanel />

      {/* Victory overlay */}
      <VictoryOverlay />
    </div>
  );
}

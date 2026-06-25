import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { LogEntry } from '../engine/types';

// ─────────────────────────────────────────────
//  Scrollable terminal event log
// ─────────────────────────────────────────────

const SEVERITY_COLORS: Record<LogEntry['severity'], string> = {
  info: '#00ff41',
  warning: '#ffb000',
  critical: '#ff2200',
};

const SOURCE_PREFIX: Record<LogEntry['source'], string> = {
  game: '  ',
  command: '> ',
  system: '# ',
};

function LogLine({ entry }: { entry: LogEntry }): JSX.Element {
  const color = SEVERITY_COLORS[entry.severity];
  const prefix = SOURCE_PREFIX[entry.source];
  const lines = entry.message.split('\n');

  return (
    <div style={{ marginBottom: 1 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ color: i === 0 ? color : '#aaa', fontSize: '12px' }}>
          {i === 0 && (
            <span style={{ color: '#444', marginRight: 4 }}>[{entry.timestamp}]</span>
          )}
          {i === 0 && <span style={{ color: '#555' }}>{prefix}</span>}
          {i > 0 && <span style={{ paddingLeft: '22ch' }} />}
          <span style={{ whiteSpace: 'pre-wrap' }}>{line}</span>
        </div>
      ))}
    </div>
  );
}

/** Shows only auto-generated simulation events (tick engine output) */
export function EventLog(): JSX.Element {
  const { state } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const simEntries = state.log.filter((e) => e.source === 'game');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simEntries.length]);

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        backgroundColor: '#080808',
        padding: '8px',
        overflowY: 'auto',
        flex: 1,
      }}
    >
      <div
        style={{
          color: '#336633',
          fontSize: '10px',
          letterSpacing: 1,
          borderBottom: '1px solid #1a3a1a',
          marginBottom: 6,
          paddingBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>SIMULACIÓN</span>
        <span style={{ color: '#222' }}>{simEntries.length} eventos</span>
      </div>
      {simEntries.map((entry) => (
        <LogLine key={entry.id} entry={entry} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

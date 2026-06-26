import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useGameStore } from '../store/gameStore';
import { executeCommand, autocomplete } from '../commands/executor';
import type { LogEntry } from '../engine/types';

// ─────────────────────────────────────────────
//  Command console — output panel + CLI input
//  Shows source='command' and source='system' entries
// ─────────────────────────────────────────────

const MAX_HISTORY = 50;

const SEVERITY_COLORS: Record<LogEntry['severity'], string> = {
  info: '#00ff41',
  warning: '#ffb000',
  critical: '#ff2200',
};

function OutputLine({ entry }: { entry: LogEntry }): JSX.Element {
  const color = SEVERITY_COLORS[entry.severity];
  const isCmd = entry.message.startsWith('> ');
  const lines = entry.message.split('\n');

  return (
    <div style={{ marginBottom: 2 }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            color: isCmd && i === 0 ? '#00cc33' : i === 0 ? color : '#777',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {i === 0 && !isCmd && (
            <span style={{ color: '#2a4a2a', marginRight: 4 }}>#</span>
          )}
          {line}
        </div>
      ))}
    </div>
  );
}

export function CommandConsole(): JSX.Element {
  const { state, addLog, saveGame, loadGame, getSavesMeta, undo, toggleLivestats, showLivestats, toggleCharts, toggleTraffic } = useGameStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const cmdEntries = state.log.filter(
    (e) => e.source === 'command' || e.source === 'system',
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cmdEntries.length]);

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setHistory((prev) =>
      prev[0] === trimmed ? prev : [trimmed, ...prev].slice(0, MAX_HISTORY),
    );
    setHistoryIdx(-1);
    setInput('');
    setSuggestions([]);

    addLog(`> ${trimmed}`, 'info', 'command');

    const [nextState, result] = executeCommand(trimmed, state);
    useGameStore.setState({ state: nextState });

    const msg = result.message;

    if (msg === '__LIVESTATS__') {
      toggleLivestats();
      addLog(showLivestats ? 'Pixelgram activado.' : 'LiveStats activado.', 'info', 'system');
      return;
    }

    if (msg === '__CHARTS__') {
      toggleCharts();
      addLog('Panel de gráficos activado.', 'info', 'system');
      return;
    }

    if (msg === '__UNDO__') {
      undo();
      return;
    }

    if (msg === '__SAVES__') {
      const meta = getSavesMeta();
      const lines = meta.map((m) =>
        m.isEmpty
          ? `  Ranura ${m.slot}: [vacía]`
          : `  Ranura ${m.slot}: Año ${m.year}, Mes ${m.month} · Pob. ${m.population} · $${m.balance}`,
      );
      addLog(['=== RANURAS DE GUARDADO ===', ...lines].join('\n'), 'info', 'command');
      return;
    }

    const saveMatch = msg.match(/^__SAVE_(\d)__$/);
    if (saveMatch) {
      saveGame(parseInt(saveMatch[1], 10));
      return;
    }

    const loadMatch = msg.match(/^__LOAD_(\d)__$/);
    if (loadMatch) {
      loadGame(parseInt(loadMatch[1], 10));
      return;
    }

    if (msg.startsWith('__TRAFFIC__')) {
      toggleTraffic();
      const rest = msg.replace('__TRAFFIC__\n', '');
      if (rest) addLog(rest, 'info', 'command');
      return;
    }

    addLog(msg, result.severity, 'command');
  }, [input, state, addLog, saveGame, loadGame, getSavesMeta, undo, toggleLivestats, showLivestats, toggleCharts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { submit(); return; }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(next);
        setInput(history[next] ?? '');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.max(historyIdx - 1, -1);
        setHistoryIdx(next);
        setInput(next === -1 ? '' : history[next] ?? '');
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const sugg = autocomplete(input);
        if (sugg.length === 1) {
          setInput(sugg[0].split(' ')[0] + ' ');
          setSuggestions([]);
        } else {
          setSuggestions(sugg);
        }
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        return;
      }
    },
    [input, history, historyIdx, submit],
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid #1a3a1a',
        backgroundColor: '#060606',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        minHeight: 0,
        height: 220,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid #1a3a1a',
          fontSize: '10px',
          color: '#336633',
          letterSpacing: 1,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>COMANDOS</span>
        <span style={{ color: '#222' }}>↑↓ historial · Tab completa</span>
      </div>

      {/* Output scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 8px',
          minHeight: 0,
        }}
      >
        {cmdEntries.length === 0 && (
          <div style={{ color: '#222', fontSize: '11px' }}>
            Escribe &quot;help&quot; para ver los comandos disponibles.
          </div>
        )}
        {cmdEntries.map((entry) => (
          <OutputLine key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div
          style={{
            padding: '2px 8px',
            borderTop: '1px solid #1a2a1a',
            flexShrink: 0,
          }}
        >
          {suggestions.map((s) => (
            <div key={s} style={{ color: '#00882b', fontSize: '11px' }}>
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Input line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px',
          borderTop: '1px solid #1a3a1a',
          flexShrink: 0,
          backgroundColor: '#0a0a0a',
        }}
      >
        <span style={{ color: '#00ff41', userSelect: 'none' }}>{'>'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSuggestions([]);
            setHistoryIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="help · zone · road · build · tax · next turn…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff41',
            fontFamily: 'inherit',
            fontSize: '13px',
            caretColor: '#00ff41',
          }}
        />
      </div>
    </div>
  );
}

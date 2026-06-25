import { useCallback, useRef, useState, KeyboardEvent } from 'react';
import { useGameStore } from '../store/gameStore';
import { executeCommand } from '../commands/executor';
import { autocomplete } from '../commands/executor';

// ─────────────────────────────────────────────
//  CLI command input with history (↑↓) and Tab autocomplete
// ─────────────────────────────────────────────

const MAX_HISTORY = 50;

export function CommandInput(): JSX.Element {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, addLog, saveGame, loadGame } = useGameStore();

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add to history (deduplicate consecutive)
    setHistory((prev) => {
      const next = prev[0] === trimmed ? prev : [trimmed, ...prev].slice(0, MAX_HISTORY);
      return next;
    });
    setHistoryIdx(-1);
    setInput('');
    setSuggestions([]);

    // Log the command
    addLog(`> ${trimmed}`, 'info', 'command');

    // Handle special side-effect commands
    if (trimmed === 'save') {
      saveGame();
      return;
    }
    if (trimmed === 'load') {
      loadGame();
      return;
    }

    const [nextState, result] = executeCommand(trimmed, state);

    // Sync state
    useGameStore.setState({ state: nextState });

    // Log result (skip internal signals)
    if (result.message !== '__SAVE__' && result.message !== '__LOAD__') {
      addLog(result.message, result.severity, 'command');
    }
  }, [input, state, addLog, saveGame, loadGame]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        submit();
        return;
      }

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
          // Fill first word of usage
          const firstWord = sugg[0].split(' ')[0];
          setInput(firstWord + ' ');
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
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: '13px',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #1a3a1a',
        padding: '6px 8px',
        flexShrink: 0,
      }}
    >
      {suggestions.length > 0 && (
        <div style={{ color: '#555', marginBottom: 4, paddingLeft: 16 }}>
          {suggestions.map((s) => (
            <div key={s} style={{ color: '#00aa2b' }}>
              {s}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#00ff41' }}>{'>'}</span>
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
          placeholder="Escribe un comando... (Tab para autocompletar, ↑↓ para historial)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff41',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            caretColor: '#00ff41',
          }}
        />
      </div>
    </div>
  );
}

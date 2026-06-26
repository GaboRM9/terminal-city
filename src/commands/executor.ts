import type { CommandResult, GameState } from '../engine/types';
import { parseCommand } from './parser';
import { COMMAND_REGISTRY } from './commands';
import { UI, getLang } from '../i18n';

// ─────────────────────────────────────────────
//  Command executor — wires parser to registry
// ─────────────────────────────────────────────

/** Execute a raw command string against the current game state */
export function executeCommand(
  raw: string,
  state: GameState,
): [GameState, CommandResult] {
  const parsed = parseCommand(raw);
  const t = UI[getLang()];

  if (!parsed.name) {
    return [state, { success: false, message: t.noCommand, severity: 'info' }];
  }

  const cmd = COMMAND_REGISTRY.get(parsed.name);
  if (!cmd) {
    return [
      state,
      {
        success: false,
        message: t.unknownCmd(parsed.name),
        severity: 'warning',
      },
    ];
  }

  try {
    return cmd.execute(parsed.args, state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [
      state,
      { success: false, message: t.internalError(msg), severity: 'critical' },
    ];
  }
}

/** Auto-complete the first matching command name for a partial input */
export function autocomplete(partial: string): string[] {
  if (!partial) return [];
  const lower = partial.toLowerCase();
  const seen = new Set<string>();
  const results: string[] = [];

  for (const [key, cmd] of COMMAND_REGISTRY.entries()) {
    if (key.startsWith(lower) && !seen.has(cmd.name)) {
      seen.add(cmd.name);
      results.push(cmd.usage);
    }
  }

  return results.slice(0, 5);
}

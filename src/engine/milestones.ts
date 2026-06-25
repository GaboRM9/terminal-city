import type { GameState, LogEntry, Milestone, PixelgramPost } from './types';
import { MILESTONE_DEFS } from '../data/milestoneDefs';
import { CITIZENS } from '../data/pixelgramScenarios';

// ─────────────────────────────────────────────
//  Milestone checking — runs every tick
// ─────────────────────────────────────────────

let _logCounter = 10_000; // offset to avoid collision with tick log ids
let _postCounter = 50_000;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Check all milestones against current state.
 * Returns updated state with newly completed milestones applied
 * (rewards credited, log entries added, Pixelgram posts generated).
 */
export function checkMilestones(state: GameState): GameState {
  let next = state;
  let changed = false;

  const updatedMilestones = [...next.milestones];
  const newLogs: LogEntry[] = [];
  const newPosts: PixelgramPost[] = [];
  let bonusBalance = 0;
  let victoryAchieved = false;

  for (let i = 0; i < updatedMilestones.length; i++) {
    const ms = updatedMilestones[i];
    if (ms.completed) continue;

    const def = MILESTONE_DEFS.find((d) => d.id === ms.id);
    if (!def || !def.condition(next)) continue;

    // Mark completed
    updatedMilestones[i] = {
      ...ms,
      completed: true,
      completedYear: next.year,
      completedMonth: next.month,
    };
    changed = true;

    bonusBalance += def.reward;
    if (def.isVictory) victoryAchieved = true;

    // Log entry
    newLogs.push({
      id: `ms-log-${++_logCounter}`,
      timestamp: `Año ${next.year}, Mes ${String(next.month).padStart(2, '0')}`,
      message: `🏆 HITO: ${def.title} — +$${def.reward.toLocaleString()} al balance`,
      severity: 'critical',
      source: 'game',
    });

    // Pixelgram post from a random citizen
    const citizen = pick(CITIZENS);
    newPosts.push({
      id: `pg-ms-${++_postCounter}`,
      year: next.year,
      month: next.month,
      authorName: citizen.name,
      authorHandle: citizen.handle,
      authorAvatar: citizen.avatar,
      authorColor: citizen.color,
      content: def.pixelgramPost,
      likes: Math.floor(Math.random() * 300) + 50,
      reposts: Math.floor(Math.random() * 80) + 10,
      scenario: `milestone_${def.id}`,
    });
  }

  if (!changed) return state;

  return {
    ...next,
    milestones: updatedMilestones,
    economy: {
      ...next.economy,
      balance: next.economy.balance + bonusBalance,
    },
    victory: next.victory || victoryAchieved,
    log: [...next.log, ...newLogs].slice(-200),
    pixelgramPosts: [...newPosts, ...next.pixelgramPosts].slice(0, 40),
  };
}

/** Format milestone list for the `view hitos` command */
export function formatMilestoneList(milestones: Milestone[]): string {
  const lines = milestones.map((ms) => {
    const icon = ms.isVictory ? '★' : ms.completed ? '✓' : '○';
    const status = ms.completed
      ? `(Año ${ms.completedYear}, Mes ${String(ms.completedMonth).padStart(2, '0')})`
      : '';
    const reward = `+$${ms.reward.toLocaleString()}`;
    return `  [${icon}] ${ms.title.padEnd(28)} ${reward.padEnd(10)} ${status}`;
  });

  const completed = milestones.filter((m) => m.completed).length;
  return [
    '=== HITOS DE LA CIUDAD ===',
    `  Completados: ${completed}/${milestones.length}`,
    '',
    ...lines,
    '',
    '  [○] pendiente  [✓] completado  [★] victoria',
  ].join('\n');
}

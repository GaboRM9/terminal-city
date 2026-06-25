import type { GameState, PixelgramPost } from './types';
import { CITIZENS, SCENARIOS } from '../data/pixelgramScenarios';
import type { Personality } from '../data/pixelgramScenarios';

// ─────────────────────────────────────────────
//  Pixelgram post generation engine
// ─────────────────────────────────────────────

let _postCounter = 0;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomLikes(): number {
  return Math.floor(Math.random() * 180) + 1;
}

function randomReposts(): number {
  return Math.floor(Math.random() * 40);
}

/** Weighted random pick from active scenarios */
function pickScenario(state: GameState) {
  const active = SCENARIOS.filter((s) => s.condition(state));
  if (active.length === 0) return SCENARIOS[0]; // fallback to baseline

  const totalWeight = active.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const scenario of active) {
    rand -= scenario.weight;
    if (rand <= 0) return scenario;
  }
  return active[active.length - 1];
}

/** Pick a citizen, preferring personality match if provided */
function pickCitizen(personalities?: Personality[]) {
  if (personalities && personalities.length > 0 && Math.random() > 0.3) {
    const matching = CITIZENS.filter((c) => personalities.includes(c.personality));
    if (matching.length > 0) return pick(matching);
  }
  return pick(CITIZENS);
}

/** Resolve a template (string or function) against the current state */
function resolveTemplate(
  template: string | ((s: GameState) => string),
  state: GameState,
): string {
  return typeof template === 'function' ? template(state) : template;
}

/** Generate N new Pixelgram posts based on current game state */
export function generatePixelgramPosts(state: GameState, count: number): PixelgramPost[] {
  const posts: PixelgramPost[] = [];
  const usedCitizens = new Set<string>();

  for (let i = 0; i < count; i++) {
    const scenario = pickScenario(state);
    const citizen = pickCitizen(scenario.personalities);

    // Avoid same citizen twice in one batch (unless no choice)
    if (usedCitizens.has(citizen.handle) && CITIZENS.length > count) continue;
    usedCitizens.add(citizen.handle);

    const template = pick(scenario.templates);
    const content = resolveTemplate(template, state);

    posts.push({
      id: `pg-${++_postCounter}-${state.tickCount}`,
      year: state.year,
      month: state.month,
      authorName: citizen.name,
      authorHandle: citizen.handle,
      authorAvatar: citizen.avatar,
      authorColor: citizen.color,
      content,
      likes: randomLikes(),
      reposts: randomReposts(),
      scenario: scenario.id,
    });
  }

  return posts;
}

export const MAX_PIXELGRAM_POSTS = 40;

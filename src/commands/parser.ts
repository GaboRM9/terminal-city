// ─────────────────────────────────────────────
//  Command parser — tokenizes CLI input
// ─────────────────────────────────────────────

export interface ParsedCommand {
  readonly name: string;
  readonly args: string[];
  readonly raw: string;
}

/** Tokenizes a raw command string into name + args */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) return { name: '', args: [], raw: input };

  const tokens = trimmed.split(/\s+/);
  const [first, ...rest] = tokens;

  // Handle two-word commands like "next turn", "view stats", "view map"
  const twoWordCommands = new Set(['next turn', 'view stats', 'view map', 'view hitos']);
  if (rest.length > 0) {
    const candidate = `${first} ${rest[0]}`.toLowerCase();
    if (twoWordCommands.has(candidate)) {
      return { name: candidate, args: rest.slice(1), raw: input };
    }
  }

  return { name: first.toLowerCase(), args: rest, raw: input };
}

/** Validate that a string is a valid non-negative integer */
export function parseIntArg(s: string): number | null {
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/** Validate coordinate pair */
export function parseCoords(
  xStr: string,
  yStr: string,
  maxX: number,
  maxY: number,
): { x: number; y: number } | null {
  const x = parseIntArg(xStr);
  const y = parseIntArg(yStr);
  if (x === null || y === null) return null;
  if (x < 0 || y < 0 || x >= maxX || y >= maxY) return null;
  return { x, y };
}

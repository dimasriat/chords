/**
 * Fingerpicking / strumming patterns — SOT §11 (Phase 2).
 *
 * A pattern is 8 cells × 4 sub-steps = 32 strokes. Each stroke:
 *   "." rest · "T" thumb→bass string · "F" fingers→treble strings ·
 *   "A" all (strum) · "X" mute/damp.
 * Written compactly as "|A...|A...|..." (pipes delimit cells).
 */

export type Stroke = "." | "T" | "F" | "A" | "X";

export interface Pattern {
  name: string;
  steps: Stroke[];
}

export const STEPS = 32;
export const SUBSTEPS_PER_CELL = 4;

const VALID: ReadonlySet<string> = new Set([".", "T", "F", "A", "X"]);

/** Parse a "|A...|"-form string (pipes/whitespace ignored) into a 32-stroke Pattern. */
export function parsePattern(name: string, src: string): Pattern {
  const chars = [...src].filter((c) => c !== "|" && c.trim() !== "");
  if (chars.length !== STEPS) {
    throw new Error(`Pattern "${name}" has ${chars.length} steps, expected ${STEPS}`);
  }
  for (const c of chars) {
    if (!VALID.has(c)) throw new Error(`Invalid stroke "${c}" in pattern "${name}"`);
  }
  return { name, steps: chars as Stroke[] };
}

export const PRESETS: Pattern[] = [
  parsePattern("Strum", "|A...|A...|A...|A...|A...|A...|A...|A...|"),
  parsePattern("Thumb–Fingers", "|T...|F...|T...|F...|T...|F...|T...|F...|"),
  parsePattern("Travis", "|T...|F...|T.F.|..T.|F...|T.F.|..T.|F...|"),
];

export function presetByName(name: string): Pattern {
  return PRESETS.find((p) => p.name === name) ?? PRESETS[0]!;
}

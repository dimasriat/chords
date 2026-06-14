/**
 * Chord namer — identify a chord from the notes being played (reverse of the
 * voicing generator). Used by the interactive chord finder.
 *
 * Given the sounded pitch-classes and the bass pitch-class, find a root for which
 * the interval set matches a known chord formula. Bass-root interpretations are
 * preferred; otherwise the result is named as a slash (inversion) chord.
 */

import { semitoneToNote } from "./notes";

/** Interval-set (sorted, from root) → chord suffix. Includes no-5th variants. */
const FORMULAS: Array<{ intervals: number[]; suffix: string }> = [
  // dyad
  { intervals: [0, 7], suffix: "5" },
  // triads
  { intervals: [0, 4, 7], suffix: "" },
  { intervals: [0, 3, 7], suffix: "m" },
  { intervals: [0, 3, 6], suffix: "dim" },
  { intervals: [0, 4, 8], suffix: "aug" },
  { intervals: [0, 2, 7], suffix: "sus2" },
  { intervals: [0, 5, 7], suffix: "sus4" },
  // sixths
  { intervals: [0, 4, 7, 9], suffix: "6" },
  { intervals: [0, 3, 7, 9], suffix: "m6" },
  // sevenths
  { intervals: [0, 4, 7, 11], suffix: "maj7" },
  { intervals: [0, 4, 7, 10], suffix: "7" },
  { intervals: [0, 3, 7, 10], suffix: "m7" },
  { intervals: [0, 3, 6, 10], suffix: "m7b5" },
  { intervals: [0, 3, 6, 9], suffix: "dim7" },
  { intervals: [0, 5, 7, 10], suffix: "7sus4" },
  // sevenths without the 5th
  { intervals: [0, 4, 11], suffix: "maj7" },
  { intervals: [0, 4, 10], suffix: "7" },
  { intervals: [0, 3, 10], suffix: "m7" },
  // add9
  { intervals: [0, 2, 4, 7], suffix: "add9" },
  { intervals: [0, 2, 3, 7], suffix: "madd9" },
  // ninths (full and no-5th)
  { intervals: [0, 2, 4, 7, 11], suffix: "maj9" },
  { intervals: [0, 2, 4, 11], suffix: "maj9" },
  { intervals: [0, 2, 4, 7, 10], suffix: "9" },
  { intervals: [0, 2, 4, 10], suffix: "9" },
  { intervals: [0, 2, 3, 7, 10], suffix: "m9" },
  { intervals: [0, 2, 3, 10], suffix: "m9" },
];

const FORMULA_BY_KEY = new Map(FORMULAS.map((f) => [f.intervals.join(","), f.suffix]));

const key = (pcs: number[], root: number) =>
  [...new Set(pcs.map((p) => ((p - root) % 12 + 12) % 12))].sort((a, b) => a - b).join(",");

/**
 * Name the chord made of these pitch-classes with this bass, or null if none of
 * the known formulas match. Bass-as-root is tried first (so a rooted chord beats
 * an inversion); other roots yield slash-chord names.
 */
export function nameChord(pitchClasses: number[], bassPc: number): string | null {
  const unique = [...new Set(pitchClasses.map((p) => ((p % 12) + 12) % 12))];
  if (unique.length < 2) return null;

  // Try the bass as root first, then the remaining notes.
  const bass = ((bassPc % 12) + 12) % 12;
  const roots = [bass, ...unique.filter((p) => p !== bass)];

  for (const root of roots) {
    const suffix = FORMULA_BY_KEY.get(key(unique, root));
    if (suffix === undefined) continue;
    const name = semitoneToNote(root) + suffix;
    return root === bass ? name : `${name}/${semitoneToNote(bass)}`;
  }

  // Foreign-bass slash chord: the bass isn't a chord tone, but the notes above it
  // form a known chord (e.g. A major over a D bass → A/D).
  const upper = unique.filter((p) => p !== bass);
  if (upper.length >= 2) {
    for (const root of upper) {
      const suffix = FORMULA_BY_KEY.get(key(upper, root));
      if (suffix !== undefined) {
        return `${semitoneToNote(root)}${suffix}/${semitoneToNote(bass)}`;
      }
    }
  }
  return null;
}

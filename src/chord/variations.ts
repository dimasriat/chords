/**
 * Variation generator (reharmonization) — SOT §7 "Default variation set".
 *
 * Given a typed chord symbol, auto-generate a tight, curated set of sensible
 * variations for the user to pick from. The originally typed chord is always
 * included. Slash/inversion bass notes are computed from the root.
 */

import { parseChord } from "./parser";
import { transposeNote } from "./notes";

/** Intervals (semitones from root) for the 3rd and 5th, by triad quality. */
const THIRD = { maj: 4, min: 3 } as const;
const FIFTH = 7;

/** Slash chord: keep the chord's prefix (e.g. "Bm"), add the bass note. */
function slash(prefix: string, root: string, semitones: number): string {
  return `${prefix}/${transposeNote(root, semitones)}`;
}

export function generateVariations(symbol: string): string[] {
  const parsed = parseChord(symbol);
  const { root, quality, extensions } = parsed;

  const out: string[] = [];
  const add = (s: string) => {
    if (!out.includes(s)) out.push(s);
  };

  const isDominant7 =
    quality === "maj" && extensions.length === 1 && extensions[0] === "7";

  if (quality === "maj" && !isDominant7) {
    // Major triad family.
    add(root); // base
    add(`${root}maj7`);
    add(`${root}7`);
    add(`${root}9`); // dominant ninth
    add(`${root}6`);
    add(`${root}add9`);
    add(`${root}maj9`);
    add(`${root}sus2`);
    add(`${root}sus4`);
    add(slash(root, root, THIRD.maj));
    add(slash(root, root, FIFTH));
  } else if (isDominant7) {
    // Dominant 7 family.
    add(`${root}7`); // base
    add(`${root}9`);
    add(`${root}13`);
    add(`${root}7sus4`);
  } else if (quality === "min") {
    // Minor triad family. (sus chords drop the "m" — they replace the third.)
    add(`${root}m`); // base
    add(`${root}m7`);
    add(`${root}m9`);
    add(`${root}m6`);
    add(`${root}madd9`);
    add(`${root}sus2`);
    add(`${root}sus4`);
    add(slash(`${root}m`, root, THIRD.min));
    add(slash(`${root}m`, root, FIFTH));
  }

  // Always include the chord the user actually typed.
  add(symbol);
  return out;
}

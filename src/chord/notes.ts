/**
 * Note ↔ semitone helpers — shared music-theory math (SOT §3 Layer 1).
 *
 * Pitch classes are 0–11 with C = 0. Used by the variation generator (slash-chord
 * bass notes) and downstream voicing / note-resolver modules.
 */

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const LETTER_SEMITONE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/** Note name (e.g. "C", "F#", "Bb") → pitch class 0–11. Throws on invalid input. */
export function noteToSemitone(note: string): number {
  const letter = note[0]?.toUpperCase();
  const base = letter !== undefined ? LETTER_SEMITONE[letter] : undefined;
  if (base === undefined) {
    throw new Error(`Invalid note: "${note}"`);
  }
  let semitone = base;
  for (const accidental of note.slice(1)) {
    if (accidental === "#") semitone += 1;
    else if (accidental === "b") semitone -= 1;
    else throw new Error(`Invalid accidental in note: "${note}"`);
  }
  return ((semitone % 12) + 12) % 12;
}

/** Pitch class → note name. Sharp spelling by default; flats when `preferFlat`. */
export function semitoneToNote(semitone: number, preferFlat = false): string {
  const pc = ((semitone % 12) + 12) % 12;
  return (preferFlat ? FLAT_NAMES : SHARP_NAMES)[pc]!;
}

/**
 * Transpose a note by a number of semitones. Spelling follows the source note:
 * a flat root (e.g. "Bb") yields flat results, otherwise sharps.
 */
export function transposeNote(note: string, semitones: number, preferFlat?: boolean): string {
  const useFlat = preferFlat ?? note.includes("b");
  return semitoneToNote(noteToSemitone(note) + semitones, useFlat);
}

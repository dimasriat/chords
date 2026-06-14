/**
 * Note resolver — SOT §8.
 *
 * Turns a voicing's fret array into concrete pitches (MIDI numbers / frequencies),
 * low string → high, ready for the Web Audio playback layer.
 */

import { OPEN_MIDI } from "./voicing";

const MUTED = -1;

/** Voicing frets → sounded MIDI pitches, low → high string. */
export function resolveMidi(frets: number[]): number[] {
  const out: number[] = [];
  for (let s = 0; s < frets.length; s++) {
    const f = frets[s]!;
    if (f !== MUTED) out.push(OPEN_MIDI[s]! + f);
  }
  return out;
}

/** Equal-tempered MIDI note → frequency in Hz (A4 = MIDI 69 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Voicing frets → sounded frequencies in Hz, low → high string. */
export function resolveFrequencies(frets: number[]): number[] {
  return resolveMidi(frets).map(midiToFreq);
}

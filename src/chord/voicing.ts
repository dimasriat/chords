/**
 * From-scratch voicing generator + validity — SOT §7.
 *
 * Builds guitar voicings by searching the fretboard for combinations whose sounded
 * notes match a chord, keeping only valid shapes (essential tones present, bass
 * lowest, ≥4 strings, fretted notes within a 5-fret span). Each voicing carries the
 * difficulty features the comparator scores.
 */

import { computeChordTones, type ChordTones } from "./chordTones";
import type { ParsedChord } from "./parser";

/** Standard tuning open-string MIDI pitches, low E (index 0) → high e (index 5). */
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const STRINGS = OPEN_MIDI.length;

/** A fret value: -1 = muted, 0 = open, n = fret n. */
const MUTED = -1;

const MAX_FRET = 12;
const MAX_SPAN = 4; // fretted notes fit within a 5-fret window
const MIN_SOUNDING = 4;
/** Above this many fretted notes a shape effectively requires a barre. */
const BARRE_THRESHOLD = 4;
/** Open strings can only ring alongside notes within this fret of the nut. */
const OPEN_POSITION_MAX = 4;

export interface VoicingFeatures {
  hasBarre: boolean;
  /** Effort in fingers — a barre is one finger covering its fret. */
  fingers: number;
  frettedCount: number;
  fretSpan: number;
  innerMutes: number;
  position: number;
}

export interface Voicing {
  /** Length-6 fret array, low E → high e (-1 muted, 0 open). */
  frets: number[];
  /** Sounded pitch-classes, low → high string. */
  notes: number[];
  features: VoicingFeatures;
  /** True when the chord's 3rd is left out (an "open"/ambiguous voicing). */
  omitsThird: boolean;
}

const pc = (string: number, fret: number) => (OPEN_MIDI[string]! + fret) % 12;

export function computeFeatures(frets: number[]): VoicingFeatures {
  const sounded = frets
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f !== MUTED);
  const fretted = sounded.filter(({ f }) => f > 0).map(({ f }) => f);

  const frettedCount = fretted.length;
  const fretSpan = fretted.length > 1 ? Math.max(...fretted) - Math.min(...fretted) : 0;
  const position = fretted.length > 0 ? Math.max(...fretted) : 0;
  const minFret = fretted.length > 0 ? Math.min(...fretted) : 0;

  const hasBarre = frettedCount > BARRE_THRESHOLD;
  // Effort in fingers: with a barre, the lowest fret is one finger and only the notes
  // above it need extra fingers; otherwise every fretted note needs its own finger.
  const notesAboveBarre = fretted.filter((f) => f > minFret).length;
  const fingers = hasBarre ? 1 + notesAboveBarre : frettedCount;

  let innerMutes = 0;
  if (sounded.length > 0) {
    const lo = sounded[0]!.i;
    const hi = sounded[sounded.length - 1]!.i;
    for (let i = lo + 1; i < hi; i++) {
      if (frets[i] === MUTED) innerMutes++;
    }
  }

  return { hasBarre, fingers, frettedCount, fretSpan, innerMutes, position };
}

export function isValidVoicing(frets: number[], tones: ChordTones): boolean {
  const soundedIdx = frets
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f !== MUTED);

  if (soundedIdx.length < MIN_SOUNDING) return false;

  // Fretted notes must fit within the span window.
  const fretted = soundedIdx.filter(({ f }) => f > 0).map(({ f }) => f);
  if (fretted.length > 1 && Math.max(...fretted) - Math.min(...fretted) > MAX_SPAN) {
    return false;
  }

  // Playability: an open string can't ring alongside notes high up the neck — those
  // "open string + fret 9" combinations are unplayable, not real chord shapes.
  const hasOpen = soundedIdx.some(({ f }) => f === 0);
  if (hasOpen && fretted.length > 0 && Math.max(...fretted) > OPEN_POSITION_MAX) {
    return false;
  }

  const allowed = new Set([...tones.pitchClasses, tones.bassPc]);
  const soundedPcs = soundedIdx.map(({ f, i }) => pc(i, f));

  // Every sounded note must belong to the chord.
  if (!soundedPcs.every((p) => allowed.has(p))) return false;

  // All essential tones present.
  const present = new Set(soundedPcs);
  if (!tones.essentialPcs.every((p) => present.has(p))) return false;

  // Bass: the lowest sounding string must be the root (or slash bass).
  const lowestPc = pc(soundedIdx[0]!.i, soundedIdx[0]!.f);
  if (lowestPc !== tones.bassPc) return false;

  return true;
}

/** Per-string fret candidates whose pitch-class belongs to the chord (plus mute). */
function candidatesPerString(tones: ChordTones): number[][] {
  const allowed = new Set([...tones.pitchClasses, tones.bassPc]);
  const options: number[][] = [];
  for (let s = 0; s < STRINGS; s++) {
    const frets = [MUTED];
    for (let f = 0; f <= MAX_FRET; f++) {
      if (allowed.has(pc(s, f))) frets.push(f);
    }
    options.push(frets);
  }
  return options;
}

/** True when `v` plays a strict subset of `w`'s strings at the same frets. */
function isStringSubset(v: number[], w: number[]): boolean {
  let fewer = false;
  for (let i = 0; i < STRINGS; i++) {
    if (v[i] === MUTED) {
      if (w[i] !== MUTED) fewer = true;
    } else if (w[i] !== v[i]) {
      return false;
    }
  }
  return fewer;
}

export function generateVoicings(input: string | ParsedChord): Voicing[] {
  const tones = computeChordTones(input);
  const perString = candidatesPerString(tones);

  const results: Voicing[] = [];
  const seen = new Set<string>();
  const current: number[] = new Array(STRINGS).fill(MUTED);

  const recurse = (s: number) => {
    if (s === STRINGS) {
      if (!isValidVoicing(current, tones)) return;
      const key = current.join(",");
      if (seen.has(key)) return;
      seen.add(key);
      const frets = [...current];
      const notes = frets
        .map((f, i) => ({ f, i }))
        .filter(({ f }) => f !== MUTED)
        .map(({ f, i }) => pc(i, f));
      const omitsThird = tones.thirdPc !== null && !notes.includes(tones.thirdPc);
      results.push({ frets, notes, features: computeFeatures(frets), omitsThird });
      return;
    }
    for (const f of perString[s]!) {
      current[s] = f;
      recurse(s + 1);
    }
    current[s] = MUTED;
  };

  recurse(0);

  // Drop voicings that are just a string-subset of a fuller one (same fingering, some
  // strings muted) — UNLESS the subset avoids a barre the fuller shape needs (then
  // it's a genuinely easier alternative, e.g. the top-4 "F" vs the full barre).
  return results.filter(
    (v) =>
      !results.some(
        (w) =>
          w !== v &&
          isStringSubset(v.frets, w.frets) &&
          !(w.features.hasBarre && !v.features.hasBarre),
      ),
  );
}

/** Does this voicing of the given chord leave out the chord's 3rd? (UI badge.) */
export function voicingOmitsThird(frets: number[], input: string | ParsedChord): boolean {
  let tones;
  try {
    tones = computeChordTones(input);
  } catch {
    return false;
  }
  if (tones.thirdPc === null) return false;
  const sounded = frets
    .map((f, i) => (f === MUTED ? -1 : pc(i, f)))
    .filter((p) => p >= 0);
  return !sounded.includes(tones.thirdPc);
}

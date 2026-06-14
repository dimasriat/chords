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
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const STRINGS = OPEN_MIDI.length;

/** A fret value: -1 = muted, 0 = open, n = fret n. */
const MUTED = -1;

const MAX_FRET = 12;
const MAX_SPAN = 4; // fretted notes fit within a 5-fret window
const MIN_SOUNDING = 4;
/** Above this many fretted notes a shape effectively requires a barre. */
const BARRE_THRESHOLD = 4;

export interface VoicingFeatures {
  hasBarre: boolean;
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

  let innerMutes = 0;
  if (sounded.length > 0) {
    const lo = sounded[0]!.i;
    const hi = sounded[sounded.length - 1]!.i;
    for (let i = lo + 1; i < hi; i++) {
      if (frets[i] === MUTED) innerMutes++;
    }
  }

  return {
    hasBarre: frettedCount > BARRE_THRESHOLD,
    frettedCount,
    fretSpan,
    innerMutes,
    position,
  };
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
      results.push({ frets, notes, features: computeFeatures(frets) });
      return;
    }
    for (const f of perString[s]!) {
      current[s] = f;
      recurse(s + 1);
    }
    current[s] = MUTED;
  };

  recurse(0);
  return results;
}

/**
 * Chord → pitch-classes — SOT §3 (Layer 1) / §7 voicing validity.
 *
 * Maps a parsed chord (quality + extensions) to the set of pitch-classes it may
 * sound, the subset that MUST be present (essential tones), and the root/bass
 * pitch-classes. Pure theory; consumed by the voicing generator.
 */

import { parseChord, type ChordQuality, type ParsedChord } from "./parser";
import { noteToSemitone } from "./notes";

export interface ChordTones {
  rootPc: number;
  bassPc: number;
  /** All pitch-classes the chord may sound (0–11). */
  pitchClasses: number[];
  /** Pitch-classes that must all be present for a voicing to be valid. */
  essentialPcs: number[];
  /** Pitch-class of the chord's 3rd (maj/min/dim/aug), or null for sus/no-3rd chords. */
  thirdPc: number | null;
}

/** Triad intervals (semitones from root): [third, fifth]. */
const TRIAD: Record<ChordQuality, { third: number; fifth: number }> = {
  maj: { third: 4, fifth: 7 },
  min: { third: 3, fifth: 7 },
  dim: { third: 3, fifth: 6 },
  aug: { third: 4, fifth: 8 },
  sus2: { third: 2, fifth: 7 },
  sus4: { third: 5, fifth: 7 },
};

const NINTH_EXTENSIONS = new Set(["9", "maj9", "add9", "madd9"]);

function intervalSet(parsed: ParsedChord): {
  intervals: Set<number>;
  third: number;
  fifth: number;
  hasExtension: boolean;
  seventh: number | null;
  hasNamedNinth: boolean;
} {
  const { third } = TRIAD[parsed.quality];
  let fifth = TRIAD[parsed.quality].fifth;
  const intervals = new Set<number>([0, third, fifth]);
  let seventh: number | null = null;

  for (const ext of parsed.extensions) {
    switch (ext) {
      case "7":
        if (parsed.quality === "dim") {
          // Fully-diminished 7th (bb7), not a m7b5.
          intervals.add(9);
          seventh = 9;
        } else {
          intervals.add(10);
          seventh = 10;
        }
        break;
      case "maj7":
        intervals.add(11);
        seventh = 11;
        break;
      case "6":
        intervals.add(9);
        break;
      case "add9":
        intervals.add(2);
        break;
      case "maj9":
        intervals.add(11);
        intervals.add(2);
        seventh = 11;
        break;
      case "9":
        intervals.add(10);
        intervals.add(2);
        seventh = 10;
        break;
      case "11":
        intervals.add(10);
        intervals.add(5);
        seventh = 10;
        break;
      case "13":
        intervals.add(10);
        intervals.add(9);
        seventh = 10;
        break;
      case "b5":
        intervals.delete(fifth);
        intervals.add(6);
        fifth = 6;
        break;
      case "#5":
        intervals.delete(fifth);
        intervals.add(8);
        fifth = 8;
        break;
      default:
        // Unhandled colour tones are ignored for Phase 1.
        break;
    }
  }

  return {
    intervals,
    third,
    fifth,
    hasExtension: parsed.extensions.length > 0,
    seventh,
    hasNamedNinth: parsed.extensions.some((e) => NINTH_EXTENSIONS.has(e)),
  };
}

export function computeChordTones(input: string | ParsedChord): ChordTones {
  const parsed = typeof input === "string" ? parseChord(input) : input;
  const rootPc = noteToSemitone(parsed.root);
  const bassPc = parsed.bass ? noteToSemitone(parsed.bass) : rootPc;

  const { intervals, third, fifth, hasExtension, seventh, hasNamedNinth } = intervalSet(parsed);
  const toPc = (i: number) => ((rootPc + i) % 12 + 12) % 12;

  // Chords with a real (maj/min/dim/aug) 3rd vs sus chords, whose "third" is the 2/4.
  const hasRealThird = ["maj", "min", "dim", "aug"].includes(parsed.quality);
  // On a 9th-or-higher chord that keeps its 7th, the 3rd may be omitted (the lush
  // "no 3rd" / open voicings guitarists use, e.g. Dmaj9 as xx0220).
  const NINTH_OR_HIGHER = new Set(["9", "maj9", "11", "13"]);
  const thirdOptional =
    seventh !== null && parsed.extensions.some((e) => NINTH_OR_HIGHER.has(e));

  // Essential tones: root always; the 3rd unless it's an optional/sus case; the 5th
  // only on a plain triad (or any diminished, whose b5 is defining); the 7th and a
  // named 9th when present (SOT §7).
  const essentialIntervals = new Set<number>([0]);
  if (!hasRealThird || !thirdOptional) essentialIntervals.add(third);
  if (!hasExtension || parsed.quality === "dim") essentialIntervals.add(fifth);
  if (seventh !== null) essentialIntervals.add(seventh);
  if (hasNamedNinth) essentialIntervals.add(2);

  return {
    rootPc,
    bassPc,
    pitchClasses: [...new Set([...intervals].map(toPc))],
    essentialPcs: [...new Set([...essentialIntervals].map(toPc))],
    thirdPc: hasRealThird ? toPc(third) : null,
  };
}

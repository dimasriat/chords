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

  // Essential tones: root + third always; fifth only on a plain triad; the 7th and
  // a named 9th are essential when present (SOT §7 voicing validity rule).
  const essentialIntervals = new Set<number>([0, third]);
  // The 5th is droppable on extended chords — except diminished, whose b5 is a
  // defining tone (dim/dim7 are stacks of minor thirds).
  if (!hasExtension || parsed.quality === "dim") essentialIntervals.add(fifth);
  if (seventh !== null) essentialIntervals.add(seventh);
  if (hasNamedNinth) essentialIntervals.add(2);

  const toPc = (i: number) => ((rootPc + i) % 12 + 12) % 12;

  return {
    rootPc,
    bassPc,
    pitchClasses: [...new Set([...intervals].map(toPc))],
    essentialPcs: [...new Set([...essentialIntervals].map(toPc))],
  };
}

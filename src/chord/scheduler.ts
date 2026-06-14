/**
 * Pattern scheduler — SOT §11 (Phase 2).
 *
 * Turns a pattern + voicing(s) + tempo into a list of timed note events. Pure: no
 * audio. Bass = lowest sounded string (thumb), treble = the remaining sounded
 * strings (fingers). `buildSequenceSchedule` spreads several chords across one
 * pattern cycle so a bridge/progression plays in the chosen pattern.
 */

import { STEPS, SUBSTEPS_PER_CELL, type Pattern, type Stroke } from "./patterns";
import { OPEN_MIDI } from "./voicing";

const MUTED = -1;

export interface NoteEvent {
  /** Seconds from the start of the pattern. */
  time: number;
  /** MIDI notes to pluck at this event (empty for a mute). */
  midi: number[];
  mute: boolean;
}

export interface Schedule {
  events: NoteEvent[];
  /** Total length of one pass through the pattern, in seconds. */
  duration: number;
}

function midiOf(frets: number[], indices: number[]): number[] {
  return indices.map((i) => OPEN_MIDI[i]! + frets[i]!);
}

/** The notes a single stroke triggers on a voicing, or null for a rest. */
export function strokeMidi(frets: number[], stroke: Stroke): { midi: number[]; mute: boolean } | null {
  const sounded = frets.map((f, i) => ({ f, i })).filter(({ f }) => f !== MUTED);
  const all = sounded.map((s) => s.i);
  switch (stroke) {
    case "T":
      return sounded.length ? { midi: midiOf(frets, [sounded[0]!.i]), mute: false } : null;
    case "F": {
      const treble = sounded.slice(1).map((s) => s.i);
      return treble.length ? { midi: midiOf(frets, treble), mute: false } : null;
    }
    case "A":
      return all.length ? { midi: midiOf(frets, all), mute: false } : null;
    case "X":
      return { midi: [], mute: true };
    default:
      return null; // "." rest
  }
}

const stepSeconds = (bpm: number) => 60 / bpm / SUBSTEPS_PER_CELL; // a 16th note

/** Schedule one voicing across the whole pattern. */
export function buildSchedule(pattern: Pattern, frets: number[], bpm: number): Schedule {
  const dt = stepSeconds(bpm);
  const events: NoteEvent[] = [];
  pattern.steps.forEach((stroke, step) => {
    const ev = strokeMidi(frets, stroke);
    if (ev) events.push({ time: step * dt, ...ev });
  });
  return { events, duration: STEPS * dt };
}

/**
 * Per-chord durations (in steps) for a bridge: the target (last) gets a full bar,
 * the from-chord (first) gets a half bar, and the connectors split the other half.
 * `D–D7–G` → [16, 16, 32]; `D–Am7–D7–G` → [16, 8, 8, 32].
 */
export function bridgeSegmentLengths(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [STEPS];
  const half = STEPS / 2;
  const connectors = n - 2;
  const lengths = [half]; // from
  for (let k = 0; k < connectors; k++) lengths.push(Math.round(half / connectors));
  lengths.push(STEPS); // target
  return lengths;
}

/**
 * Schedule a bridge: each chord plays the pattern **from beat 1** for its allotted
 * duration (target = full bar, from = ½ bar, connectors split the other ½). The
 * pattern restarts on every chord change.
 */
export function buildBridgeSchedule(pattern: Pattern, voicings: number[][], bpm: number): Schedule {
  const dt = stepSeconds(bpm);
  const segments = bridgeSegmentLengths(voicings.length);

  const events: NoteEvent[] = [];
  let offset = 0;
  voicings.forEach((frets, ci) => {
    const len = segments[ci]!;
    for (let s = 0; s < len; s++) {
      const ev = strokeMidi(frets, pattern.steps[s]!); // s < STEPS → pattern from beat 1
      if (ev) events.push({ time: (offset + s) * dt, ...ev });
    }
    offset += len;
  });
  return { events, duration: offset * dt };
}

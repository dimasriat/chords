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
 * Schedule a sequence of voicings across one pattern cycle — each chord gets a
 * contiguous chunk of the 32 steps (the bridge "grooves" in the pattern).
 */
export function buildSequenceSchedule(pattern: Pattern, voicings: number[][], bpm: number): Schedule {
  const dt = stepSeconds(bpm);
  const n = voicings.length;
  const events: NoteEvent[] = [];
  if (n === 0) return { events, duration: STEPS * dt };

  pattern.steps.forEach((stroke, step) => {
    const chordIdx = Math.min(Math.floor(step / (STEPS / n)), n - 1);
    const ev = strokeMidi(voicings[chordIdx]!, stroke);
    if (ev) events.push({ time: step * dt, ...ev });
  });
  return { events, duration: STEPS * dt };
}

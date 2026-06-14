/**
 * Pattern scheduler — SOT §11 (Phase 2).
 *
 * Turns a pattern + a voicing + a tempo into a list of timed note events. Pure: no
 * audio. The Web Audio sequencer plays the result. Bass = lowest sounded string
 * (thumb), treble = the remaining sounded strings (fingers).
 */

import { STEPS, SUBSTEPS_PER_CELL, type Pattern } from "./patterns";
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

export function buildSchedule(pattern: Pattern, frets: number[], bpm: number): Schedule {
  const stepDuration = 60 / bpm / SUBSTEPS_PER_CELL; // one sub-step = a 16th note

  const sounded = frets
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f !== MUTED);
  const bassIdx = sounded.length > 0 ? sounded[0]!.i : -1;
  const trebleIdx = sounded.slice(1).map((s) => s.i);
  const allIdx = sounded.map((s) => s.i);

  const midiOf = (indices: number[]) => indices.map((i) => OPEN_MIDI[i]! + frets[i]!);

  const events: NoteEvent[] = [];
  pattern.steps.forEach((stroke, step) => {
    const time = step * stepDuration;
    switch (stroke) {
      case "T":
        if (bassIdx >= 0) events.push({ time, midi: midiOf([bassIdx]), mute: false });
        break;
      case "F":
        if (trebleIdx.length) events.push({ time, midi: midiOf(trebleIdx), mute: false });
        break;
      case "A":
        if (allIdx.length) events.push({ time, midi: midiOf(allIdx), mute: false });
        break;
      case "X":
        events.push({ time, midi: [], mute: true });
        break;
      default:
        break; // "." rest
    }
  });

  return { events, duration: STEPS * stepDuration };
}

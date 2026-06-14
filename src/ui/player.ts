/**
 * Pattern player — SOT §11. Plays a scheduled pattern once or on a loop.
 *
 * Web Audio notes are scheduled cycle-by-cycle just ahead of time, so Stop simply
 * prevents future cycles (notes already scheduled in the current cycle ring out).
 */

import { buildSchedule, buildBridgeSchedule, type Schedule } from "../chord/scheduler";
import { presetByName } from "../chord/patterns";
import { audioContext, pluckMidiAt, muteAt, stopAll } from "./audio";
import type { Settings } from "./settings";

type StateListener = (playing: boolean) => void;

const LOOKAHEAD_MS = 90; // re-arm the next loop cycle this long before it starts

class PatternPlayer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<StateListener>();
  private playing = false;

  onState(cb: StateListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  private setPlaying(value: boolean): void {
    if (this.playing === value) return;
    this.playing = value;
    for (const cb of this.listeners) cb(value);
  }

  private scheduleCycle(start: number, schedule: Schedule): void {
    for (const ev of schedule.events) {
      if (ev.mute) muteAt(start + ev.time);
      else pluckMidiAt(ev.midi, start + ev.time, { strum: ev.midi.length > 1 });
    }
  }

  private playSchedule(schedule: Schedule, loop: boolean): void {
    this.stop();
    if (schedule.events.length === 0) return;
    const ac = audioContext();

    if (!loop) {
      this.scheduleCycle(ac.currentTime + 0.05, schedule);
      this.setPlaying(true);
      this.timer = setTimeout(() => this.setPlaying(false), (schedule.duration + 0.4) * 1000);
      return;
    }

    this.setPlaying(true);
    let cycleStart = ac.currentTime + 0.05;
    const loopCycle = () => {
      this.scheduleCycle(cycleStart, schedule);
      cycleStart += schedule.duration;
      this.timer = setTimeout(loopCycle, schedule.duration * 1000 - LOOKAHEAD_MS);
    };
    loopCycle();
  }

  /** Play a single chord with the current pattern. */
  play(frets: number[], settings: Settings): void {
    const pattern = presetByName(settings.patternName);
    this.playSchedule(buildSchedule(pattern, frets, settings.bpm), settings.loop);
  }

  /** Play a bridge: each chord plays the pattern from beat 1 for its segment. */
  playSequence(voicings: number[][], settings: Settings): void {
    const pattern = presetByName(settings.patternName);
    this.playSchedule(buildBridgeSchedule(pattern, voicings, settings.bpm), settings.loop);
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    stopAll();
    this.setPlaying(false);
  }
}

export const player = new PatternPlayer();

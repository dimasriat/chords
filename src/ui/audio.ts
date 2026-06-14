/**
 * Web Audio synth primitives — SOT §7 / §11.
 *
 * A plucked-ish synth (decaying triangle + lowpass per note) routed through a master
 * gain so a mute stroke can damp everything briefly. The pattern player schedules
 * notes at absolute AudioContext times; `playVoicing` is a one-shot strum.
 */

import { resolveMidi, midiToFreq } from "../chord/noteResolver";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function pluckOne(ac: AudioContext, freq: number, when: number): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lp = ac.createBiquadFilter();
  const duration = 1.6;
  const peak = 0.18;

  osc.type = "triangle";
  osc.frequency.value = freq;
  lp.type = "lowpass";
  lp.frequency.value = 3000;

  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0008, when + duration);

  osc.connect(lp).connect(gain).connect(master!);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

/** Pluck a set of MIDI notes at an absolute AudioContext time (optionally strummed). */
export function pluckMidiAt(midi: number[], when: number, opts?: { strum?: boolean }): void {
  const ac = audioContext();
  const stagger = opts?.strum ? 0.022 : 0;
  midi.forEach((m, i) => pluckOne(ac, midiToFreq(m), when + i * stagger));
}

/** Briefly damp the master gain to mute ringing strings at the given time. */
export function muteAt(when: number): void {
  audioContext();
  const g = master!.gain;
  g.cancelScheduledValues(when);
  g.setValueAtTime(1, when);
  g.linearRampToValueAtTime(0, when + 0.02);
  g.linearRampToValueAtTime(1, when + 0.08);
}

/** One-shot strum of a voicing (used outside the pattern player). */
export function playVoicing(frets: number[]): void {
  const ac = audioContext();
  pluckMidiAt(resolveMidi(frets), ac.currentTime + 0.02, { strum: true });
}

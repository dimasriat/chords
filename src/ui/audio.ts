/**
 * Web Audio chord playback — SOT §7 (synthesized strum).
 *
 * Plucked-ish synth: one decaying oscillator per sounded string, staggered to
 * imitate a downward strum. No samples to host — works for any chord. Browser-only.
 */

import { resolveFrequencies } from "../chord/noteResolver";

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    ctx = new Ctor();
  }
  // Browsers start the context suspended until a user gesture.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Strum the chord described by a voicing's fret array. */
export function playVoicing(frets: number[]): void {
  const ac = audioContext();
  const freqs = resolveFrequencies(frets);
  const now = ac.currentTime;
  const strumDelay = 0.045; // seconds between adjacent strings
  const duration = 1.8;

  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const lp = ac.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.value = freq;
    lp.type = "lowpass";
    lp.frequency.value = 3000;

    const start = now + i * strumDelay;
    const peak = 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);

    osc.connect(lp).connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
}

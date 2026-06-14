import { test, expect, describe } from "bun:test";
import { resolveMidi, midiToFreq, resolveFrequencies } from "./noteResolver";

describe("resolveMidi", () => {
  test("open D (xx0232) → D3 A3 D4 F#4 MIDI pitches", () => {
    expect(resolveMidi([-1, -1, 0, 2, 3, 2])).toEqual([50, 57, 62, 66]);
  });

  test("open E major (022100) → all six strings", () => {
    expect(resolveMidi([0, 2, 2, 1, 0, 0])).toEqual([40, 47, 52, 56, 59, 64]);
  });

  test("skips muted strings, low → high order", () => {
    expect(resolveMidi([-1, 3, 2, 0, 1, 0])).toEqual([48, 52, 55, 60, 64]); // open C
  });
});

describe("midiToFreq", () => {
  test("A4 (MIDI 69) = 440 Hz", () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  test("A3 (MIDI 57) = 220 Hz", () => {
    expect(midiToFreq(57)).toBeCloseTo(220, 5);
  });

  test("middle C (MIDI 60) ≈ 261.63 Hz", () => {
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
  });
});

describe("resolveFrequencies", () => {
  test("open D resolves to the matching frequency set", () => {
    const freqs = resolveFrequencies([-1, -1, 0, 2, 3, 2]);
    expect(freqs).toHaveLength(4);
    expect(freqs[0]).toBeCloseTo(midiToFreq(50), 5);
  });
});

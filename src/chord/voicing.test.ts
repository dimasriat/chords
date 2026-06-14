import { test, expect, describe } from "bun:test";
import { generateVoicings, isValidVoicing, computeFeatures } from "./voicing";
import { computeChordTones } from "./chordTones";

const has = (frets: number[][], target: number[]) =>
  frets.some((f) => f.length === target.length && f.every((v, i) => v === target[i]));

describe("computeFeatures", () => {
  test("open D (xx0232): 3 fingers, span 1, no barre, no inner mutes", () => {
    const f = computeFeatures([-1, -1, 0, 2, 3, 2]);
    expect(f).toEqual({
      hasBarre: false,
      fingers: 3,
      frettedCount: 3,
      fretSpan: 1,
      innerMutes: 0,
      position: 3,
    });
  });

  test("F barre (133211): barre = 1 finger + 3 above (4 effective), span 2", () => {
    const f = computeFeatures([1, 3, 3, 2, 1, 1]);
    expect(f.hasBarre).toBe(true);
    expect(f.frettedCount).toBe(6);
    expect(f.fingers).toBe(4); // 1 barre + notes at frets 2,3,3
    expect(f.fretSpan).toBe(2);
    expect(f.position).toBe(3);
  });

  test("inner muted string is counted (e.g. x0x232 style)", () => {
    // sounded strings span index 1..5, with string index 2 muted in the middle
    expect(computeFeatures([-1, 0, -1, 2, 3, 2]).innerMutes).toBe(1);
  });
});

describe("isValidVoicing", () => {
  const dMajor = computeChordTones("D");

  test("open D is valid", () => {
    expect(isValidVoicing([-1, -1, 0, 2, 3, 2], dMajor)).toBe(true);
  });

  test("fewer than 4 sounding strings is invalid", () => {
    expect(isValidVoicing([-1, -1, 0, 2, -1, -1], dMajor)).toBe(false);
  });

  test("missing the 3rd is invalid (no F# anywhere)", () => {
    // D, A, D, A only — root+fifth, no third
    expect(isValidVoicing([-1, 0, 0, 2, 3, -1], dMajor)).toBe(false);
  });

  test("wrong bass (not the root) is invalid for a non-slash chord", () => {
    // lowest sounding note is A, not D
    expect(isValidVoicing([-1, 0, 2, 2, 3, 2], dMajor)).toBe(false);
  });
});

describe("generateVoicings", () => {
  test("includes the open D shape", () => {
    const frets = generateVoicings("D").map((v) => v.frets);
    expect(has(frets, [-1, -1, 0, 2, 3, 2])).toBe(true);
  });

  test("includes the open C shape", () => {
    const frets = generateVoicings("C").map((v) => v.frets);
    expect(has(frets, [-1, 3, 2, 0, 1, 0])).toBe(true);
  });

  test("every generated voicing is valid", () => {
    const tones = computeChordTones("G");
    for (const v of generateVoicings("G")) {
      expect(isValidVoicing(v.frets, tones)).toBe(true);
    }
  });

  test("finds voicings for a rich chord (Bm9)", () => {
    expect(generateVoicings("Bm9").length).toBeGreaterThan(0);
  });

  test("each voicing carries notes and features", () => {
    const v = generateVoicings("D")[0]!;
    expect(v.notes.length).toBeGreaterThanOrEqual(4);
    expect(v.features).toBeDefined();
  });
});

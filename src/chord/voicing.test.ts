import { test, expect, describe } from "bun:test";
import {
  generateVoicings,
  isValidVoicing,
  computeFeatures,
  voicingOmitsThird,
  lowestFrettedFret,
} from "./voicing";
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

  test("no barre when the lowest fret carries a single string (D13 x5777 8)", () => {
    // A barre is the index finger across the lowest fret — only a barre when that
    // fret holds >=2 strings. Here fret 5 has one string, so it's not a barre and
    // every fretted note is its own finger (5 — which makes the shape unplayable).
    const f = computeFeatures([-1, 5, 7, 7, 7, 8]);
    expect(f.hasBarre).toBe(false);
    expect(f.fingers).toBe(5);
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

  test("collapses string-subsets to the fullest shape (Em → 022000, not xx2000)", () => {
    const frets = generateVoicings("Em").map((v) => v.frets);
    expect(has(frets, [0, 2, 2, 0, 0, 0])).toBe(true); // full open Em kept
    expect(has(frets, [-1, -1, 2, 0, 0, 0])).toBe(false); // subset xx2000 removed
    expect(has(frets, [0, 2, 2, 0, 0, -1])).toBe(false); // subset 02200x removed
  });

  test("collapses subsets even of a barre — keep the fullest, play fewer strings", () => {
    const frets = generateVoicings("F").map((v) => v.frets);
    expect(has(frets, [1, 3, 3, 2, 1, 1])).toBe(true); // full barre F kept
    expect(has(frets, [-1, -1, 3, 2, 1, 1])).toBe(false); // its top-4 subset removed
  });

  test("rejects unfingerable shapes — D13 drops x5777 8 (needs 5 fingers)", () => {
    const frets = generateVoicings("D13").map((v) => v.frets);
    expect(has(frets, [-1, 5, 7, 7, 7, 8])).toBe(false);
  });

  test("every generated voicing is playable with <=4 effective fingers (D13)", () => {
    for (const v of generateVoicings("D13")) {
      expect(v.features.fingers).toBeLessThanOrEqual(4);
    }
  });

  test("allows an open string below a high cluster — Am9 x0 5 5 5 7", () => {
    // Open A (bass) rings under a fret-5 cluster on the upper strings; the index
    // finger partial-barres only the upper strings, so the open A is fine.
    const frets = generateVoicings("Am9").map((v) => v.frets);
    expect(has(frets, [-1, 0, 5, 5, 5, 7])).toBe(true);
  });

  test("never lets an open string ring above a high fretted note", () => {
    for (const v of generateVoicings("Am9")) {
      const fretted = v.frets.map((f, i) => ({ f, i })).filter((x) => x.f > 0);
      const open = v.frets.map((f, i) => ({ f, i })).filter((x) => x.f === 0);
      if (!fretted.length || !open.length) continue;
      const maxFret = Math.max(...fretted.map((x) => x.f));
      if (maxFret > 4) {
        const maxOpenIdx = Math.max(...open.map((x) => x.i));
        const minFrettedIdx = Math.min(...fretted.map((x) => x.i));
        expect(maxOpenIdx).toBeLessThan(minFrettedIdx);
      }
    }
  });

  test("each voicing carries notes and features", () => {
    const v = generateVoicings("D")[0]!;
    expect(v.notes.length).toBeGreaterThanOrEqual(4);
    expect(v.features).toBeDefined();
  });

  test("Dmaj9 generates the no-3rd shape xx0220, flagged omitsThird", () => {
    const xx0220 = generateVoicings("Dmaj9").find((v) => v.frets.join(",") === "-1,-1,0,2,2,0");
    expect(xx0220).toBeDefined();
    expect(xx0220!.omitsThird).toBe(true);
  });

  test("a complete D major voicing does not omit the 3rd", () => {
    expect(generateVoicings("D").every((v) => v.omitsThird === false)).toBe(true);
  });
});

describe("lowestFrettedFret", () => {
  test("returns the lowest fretted note's fret", () => {
    expect(lowestFrettedFret([-1, -1, 0, 2, 3, 2])).toBe(2); // open D
    expect(lowestFrettedFret([1, 3, 3, 2, 1, 1])).toBe(1); // F barre
    expect(lowestFrettedFret([-1, 0, 5, 5, 5, 7])).toBe(5); // high Am9
  });

  test("ignores open (0) and muted (-1) strings", () => {
    expect(lowestFrettedFret([0, 0, 0, 0, 0, 0])).toBe(Infinity); // all open
    expect(lowestFrettedFret([-1, -1, -1, -1, -1, -1])).toBe(Infinity); // silent
  });
});

describe("voicingOmitsThird", () => {
  test("Dmaj9 as xx0220 omits the 3rd; open D does not", () => {
    expect(voicingOmitsThird([-1, -1, 0, 2, 2, 0], "Dmaj9")).toBe(true);
    expect(voicingOmitsThird([-1, -1, 0, 2, 3, 2], "D")).toBe(false);
  });
  test("sus chords (no real 3rd) are never flagged", () => {
    expect(voicingOmitsThird([-1, -1, 0, 2, 3, 0], "Dsus4")).toBe(false);
  });
});

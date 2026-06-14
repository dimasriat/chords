import { test, expect, describe } from "bun:test";
import { nameChord } from "./chordNamer";
import { resolveMidi } from "./noteResolver";

/** Helper: name a chord straight from a fret array. */
const fromFrets = (frets: number[]) => {
  const pcs = resolveMidi(frets).map((m) => m % 12);
  const bass = pcs[0];
  return nameChord(pcs, bass);
};

describe("nameChord", () => {
  test("major triad: D F# A → D", () => {
    expect(nameChord([2, 6, 9], 2)).toBe("D");
  });

  test("minor triad: B D F# → Bm", () => {
    expect(nameChord([11, 2, 6], 11)).toBe("Bm");
  });

  test("major seventh: C E G B → Cmaj7", () => {
    expect(nameChord([0, 4, 7, 11], 0)).toBe("Cmaj7");
  });

  test("dominant seventh: G B D F → G7", () => {
    expect(nameChord([7, 11, 2, 5], 7)).toBe("G7");
  });

  test("dominant ninth without the 5th: A C# G B → A9", () => {
    expect(nameChord([9, 1, 7, 11], 9)).toBe("A9");
  });

  test("inversion names as a slash chord: C E G over E → C/E", () => {
    expect(nameChord([0, 4, 7], 4)).toBe("C/E");
  });

  test("sus4: D G A → Dsus4", () => {
    expect(nameChord([2, 7, 9], 2)).toBe("Dsus4");
  });

  test("power chord: C G → C5", () => {
    expect(nameChord([0, 7], 0)).toBe("C5");
  });

  test("unrecognised cluster → null", () => {
    expect(nameChord([0, 1, 2], 0)).toBeNull();
  });

  test("fewer than two notes → null", () => {
    expect(nameChord([0], 0)).toBeNull();
  });

  test("works straight from a fret array (open D, open C)", () => {
    expect(fromFrets([-1, -1, 0, 2, 3, 2])).toBe("D");
    expect(fromFrets([-1, 3, 2, 0, 1, 0])).toBe("C");
  });
});

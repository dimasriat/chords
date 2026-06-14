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

  // Slash chords whose bass is NOT a chord tone: name the chord above the bass.
  test("A major over a D bass → A/D (xx0220)", () => {
    // D A C# E, bass D — D is the 4th of A, so the whole set isn't one chord
    expect(nameChord([2, 9, 1, 4], 2)).toBe("A/D");
    expect(fromFrets([-1, -1, 0, 2, 2, 0])).toBe("A/D");
  });

  test("G major over a C bass → G/C", () => {
    expect(nameChord([7, 11, 2, 0], 0)).toBe("G/C");
  });

  test("a true chord-tone bass still names as a normal inversion, not a slash-of-upper", () => {
    expect(nameChord([0, 4, 7], 4)).toBe("C/E"); // E is in C major → C/E, unchanged
  });

  // Added-tone chords, recognised only in root position.
  test("major add11 in root position: A C# E + D bass=A → Aadd11", () => {
    expect(nameChord([9, 1, 4, 2], 9)).toBe("Aadd11"); // A=root, C#, E, D(11)
  });

  test("6/9 in root position: C E G A D → C6/9", () => {
    expect(nameChord([0, 4, 7, 9, 2], 0)).toBe("C6/9");
  });

  test("minor add11 in root position → Cmadd11", () => {
    expect(nameChord([0, 3, 5, 7], 0)).toBe("Cmadd11");
  });

  test("the same notes with the 4th in the bass stay a slash chord (A/D, not Aadd11/D)", () => {
    expect(nameChord([2, 9, 1, 4], 2)).toBe("A/D"); // added-tone is root-position only
  });
});

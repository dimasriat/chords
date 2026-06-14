import { test, expect, describe } from "bun:test";
import { computeChordTones } from "./chordTones";

const pcs = (symbol: string) => [...computeChordTones(symbol).pitchClasses].sort((a, b) => a - b);
const ess = (symbol: string) => [...computeChordTones(symbol).essentialPcs].sort((a, b) => a - b);

describe("computeChordTones", () => {
  test("major triad C → C E G, all essential", () => {
    expect(pcs("C")).toEqual([0, 4, 7]);
    expect(ess("C")).toEqual([0, 4, 7]);
    expect(computeChordTones("C").rootPc).toBe(0);
    expect(computeChordTones("C").bassPc).toBe(0);
  });

  test("minor triad Dm → D F A", () => {
    expect(pcs("Dm")).toEqual([2, 5, 9]);
    expect(ess("Dm")).toEqual([2, 5, 9]);
  });

  test("Cmaj7 adds the major 7th; 5th becomes optional", () => {
    expect(pcs("Cmaj7")).toEqual([0, 4, 7, 11]);
    // essential = root, 3rd, 7th (5th optional once an extension is present)
    expect(ess("Cmaj7")).toEqual([0, 4, 11]);
  });

  test("C7 adds the dominant b7", () => {
    expect(pcs("C7")).toEqual([0, 4, 7, 10]);
    expect(ess("C7")).toEqual([0, 4, 10]);
  });

  test("Bm9 → minor triad + b7 + 9, those defining tones essential", () => {
    // B=11, D=2, F#=6, A=9, C#=1
    expect(pcs("Bm9")).toEqual([1, 2, 6, 9, 11]);
    expect(ess("Bm9")).toEqual([1, 2, 9, 11]); // root B, b3 D, b7 A, 9 C# (5th F# optional)
  });

  test("Csus4 → C F G", () => {
    expect(pcs("Csus4")).toEqual([0, 5, 7]);
    expect(ess("Csus4")).toEqual([0, 5, 7]);
  });

  test("slash chord C/E sets bass pitch-class to E", () => {
    expect(computeChordTones("C/E").bassPc).toBe(4);
    expect(computeChordTones("C/E").rootPc).toBe(0);
  });
});

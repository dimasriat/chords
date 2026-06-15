import { test, expect, describe } from "bun:test";
import { parseChord } from "./parser";

describe("parseChord", () => {
  // Acceptance-criteria cases (Phase 1 / SOT §3 Layer 1)
  test("minor triad: Bm", () => {
    expect(parseChord("Bm")).toEqual({
      root: "B",
      quality: "min",
      extensions: [],
      bass: null,
    });
  });

  test("case-insensitive root: lowercase note letters are uppercased", () => {
    expect(parseChord("bm")).toEqual({ root: "B", quality: "min", extensions: [], bass: null });
    expect(parseChord("c")).toEqual({ root: "C", quality: "maj", extensions: [], bass: null });
    expect(parseChord("f#m7")).toEqual({ root: "F#", quality: "min", extensions: ["7"], bass: null });
    expect(parseChord("bb")).toEqual({ root: "Bb", quality: "maj", extensions: [], bass: null });
  });

  test("case-insensitive slash bass: c/e", () => {
    expect(parseChord("c/e")).toEqual({ root: "C", quality: "maj", extensions: [], bass: "E" });
  });

  test("slash chord: C/E", () => {
    expect(parseChord("C/E")).toEqual({
      root: "C",
      quality: "maj",
      extensions: [],
      bass: "E",
    });
  });

  test("major seventh: Dmaj7", () => {
    expect(parseChord("Dmaj7")).toEqual({
      root: "D",
      quality: "maj",
      extensions: ["maj7"],
      bass: null,
    });
  });

  test("half-diminished: F#m7b5", () => {
    expect(parseChord("F#m7b5")).toEqual({
      root: "F#",
      quality: "min",
      extensions: ["7", "b5"],
      bass: null,
    });
  });

  // Additional coverage
  test("plain major: C", () => {
    expect(parseChord("C")).toEqual({ root: "C", quality: "maj", extensions: [], bass: null });
  });

  test("dominant seventh: G7", () => {
    expect(parseChord("G7")).toEqual({ root: "G", quality: "maj", extensions: ["7"], bass: null });
  });

  test("add9: Dadd9", () => {
    expect(parseChord("Dadd9")).toEqual({ root: "D", quality: "maj", extensions: ["add9"], bass: null });
  });

  test("sus4: Asus4", () => {
    expect(parseChord("Asus4")).toEqual({ root: "A", quality: "sus4", extensions: [], bass: null });
  });

  test("sus2: Dsus2", () => {
    expect(parseChord("Dsus2")).toEqual({ root: "D", quality: "sus2", extensions: [], bass: null });
  });

  test("minor ninth: Bm9", () => {
    expect(parseChord("Bm9")).toEqual({ root: "B", quality: "min", extensions: ["9"], bass: null });
  });

  test("flat root: Bb", () => {
    expect(parseChord("Bb")).toEqual({ root: "Bb", quality: "maj", extensions: [], bass: null });
  });

  test("sharp root slash chord: F#m/A", () => {
    expect(parseChord("F#m/A")).toEqual({ root: "F#", quality: "min", extensions: [], bass: "A" });
  });

  test("trims surrounding whitespace", () => {
    expect(parseChord("  Em  ")).toEqual({ root: "E", quality: "min", extensions: [], bass: null });
  });

  test("quality keywords are case-insensitive (DMaj9, ASus4)", () => {
    expect(parseChord("DMaj9")).toEqual({ root: "D", quality: "maj", extensions: ["maj9"], bass: null });
    expect(parseChord("ASus4")).toEqual({ root: "A", quality: "sus4", extensions: [], bass: null });
    expect(parseChord("CMAJ7")).toEqual({ root: "C", quality: "maj", extensions: ["maj7"], bass: null });
  });

  // Invalid input must be rejected clearly
  test("rejects invalid input", () => {
    expect(() => parseChord("")).toThrow();
    expect(() => parseChord("H")).toThrow();
    expect(() => parseChord("xyz")).toThrow();
    expect(() => parseChord("C/H")).toThrow();
    expect(() => parseChord("Bzz")).toThrow();
  });
});

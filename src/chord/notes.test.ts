import { test, expect, describe } from "bun:test";
import { noteToSemitone, semitoneToNote, transposeNote } from "./notes";

describe("noteToSemitone", () => {
  test("naturals", () => {
    expect(noteToSemitone("C")).toBe(0);
    expect(noteToSemitone("E")).toBe(4);
    expect(noteToSemitone("G")).toBe(7);
    expect(noteToSemitone("B")).toBe(11);
  });
  test("accidentals", () => {
    expect(noteToSemitone("C#")).toBe(1);
    expect(noteToSemitone("Db")).toBe(1);
    expect(noteToSemitone("Bb")).toBe(10);
    expect(noteToSemitone("F#")).toBe(6);
  });
  test("rejects invalid", () => {
    expect(() => noteToSemitone("H")).toThrow();
  });
});

describe("semitoneToNote", () => {
  test("sharp spelling by default", () => {
    expect(semitoneToNote(0)).toBe("C");
    expect(semitoneToNote(6)).toBe("F#");
    expect(semitoneToNote(10)).toBe("A#");
  });
  test("flat spelling when requested", () => {
    expect(semitoneToNote(10, true)).toBe("Bb");
    expect(semitoneToNote(1, true)).toBe("Db");
  });
  test("wraps modulo 12", () => {
    expect(semitoneToNote(12)).toBe("C");
    expect(semitoneToNote(16)).toBe("E");
  });
});

describe("transposeNote", () => {
  test("major third and fifth above C", () => {
    expect(transposeNote("C", 4)).toBe("E");
    expect(transposeNote("C", 7)).toBe("G");
  });
  test("minor third and fifth above B", () => {
    expect(transposeNote("B", 3)).toBe("D");
    expect(transposeNote("B", 7)).toBe("F#");
  });
  test("minor third and fifth above A", () => {
    expect(transposeNote("A", 3)).toBe("C");
    expect(transposeNote("A", 7)).toBe("E");
  });
  test("prefers flats when root is flat", () => {
    expect(transposeNote("Bb", 7)).toBe("F");
    expect(transposeNote("Eb", 3)).toBe("Gb");
  });
});

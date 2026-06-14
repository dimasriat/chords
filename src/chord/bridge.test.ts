import { test, expect, describe } from "bun:test";
import { generateBridges } from "./bridge";
import { parseChord } from "./parser";

describe("generateBridges D → G", () => {
  const bridges = generateBridges("D", "G");

  test("returns several ranked bridges, capped", () => {
    expect(bridges.length).toBeGreaterThan(3);
    expect(bridges.length).toBeLessThanOrEqual(12);
  });

  test("every sequence starts with the from-chord and ends with the to-chord", () => {
    for (const b of bridges) {
      expect(b.sequence[0]).toBe("D");
      expect(b.sequence[b.sequence.length - 1]).toBe("G");
    }
  });

  test("includes the secondary dominant D7 (the canonical D→G bridge)", () => {
    expect(bridges.some((b) => b.sequence.includes("D7"))).toBe(true);
  });

  test("includes a ii–V (Am7 then D7)", () => {
    expect(
      bridges.some((b) => b.sequence.includes("Am7") && b.sequence.includes("D7")),
    ).toBe(true);
  });

  test("includes the leading-tone diminished F#dim7", () => {
    expect(bridges.some((b) => b.sequence.includes("F#dim7"))).toBe(true);
  });

  test("every chord in every bridge is parseable/voiceable", () => {
    for (const b of bridges) {
      for (const sym of b.sequence) {
        expect(() => parseChord(sym)).not.toThrow();
      }
    }
  });

  test("no duplicate sequences", () => {
    const keys = bridges.map((b) => b.sequence.join(">"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("secondary dominant ranks first (strongest)", () => {
    expect(bridges[0]!.sequence).toContain("D7");
  });
});

describe("exotic / extended chords (D9 → G9)", () => {
  const bridges = generateBridges("D9", "G9");

  test("produces bridges for extended chords", () => {
    expect(bridges.length).toBeGreaterThan(2);
    expect(bridges.some((b) => b.sequence.includes("D9"))).toBe(true);
  });

  test("no no-op connector (e.g. D9 → D9 → G9 is dropped)", () => {
    for (const b of bridges) {
      expect(b.sequence.length).toBeGreaterThanOrEqual(3); // a real connector exists
      for (let i = 1; i < b.sequence.length; i++) {
        expect(b.sequence[i]).not.toBe(b.sequence[i - 1]); // no consecutive repeat
      }
    }
  });

  test("connectors inherit the extension level (lush in, lush out)", () => {
    // secondary dominant is D9 (not plain D7), ii is Am9 (not Am7)
    expect(bridges.some((b) => b.sequence.includes("D9"))).toBe(true);
    expect(bridges.some((b) => b.sequence.includes("Am9") && b.sequence.includes("D9"))).toBe(true);
    expect(bridges.some((b) => b.sequence.includes("D7"))).toBe(false);
  });
});

describe("plain inputs stay plain (no regression)", () => {
  test("D → G connectors are 7ths, not 9ths", () => {
    const bridges = generateBridges("D", "G");
    expect(bridges.some((b) => b.sequence.includes("D7"))).toBe(true);
    expect(bridges.some((b) => b.sequence.includes("Am7") && b.sequence.includes("D7"))).toBe(true);
  });
});

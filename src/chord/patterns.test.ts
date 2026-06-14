import { test, expect, describe } from "bun:test";
import { parsePattern, PRESETS, STEPS } from "./patterns";

describe("parsePattern", () => {
  test("parses a |A...|-form string into 32 strokes", () => {
    const p = parsePattern("Strum", "|A...|A...|A...|A...|A...|A...|A...|A...|");
    expect(p.name).toBe("Strum");
    expect(p.steps).toHaveLength(STEPS);
    expect(p.steps[0]).toBe("A");
    expect(p.steps[1]).toBe(".");
  });

  test("ignores pipes and whitespace", () => {
    const p = parsePattern("x", "|T...|F...|T...|F...|T...|F...|T...|F...|");
    expect(p.steps[0]).toBe("T");
    expect(p.steps[4]).toBe("F");
  });

  test("rejects an invalid stroke character", () => {
    expect(() => parsePattern("bad", "|Z...|".repeat(8))).toThrow();
  });

  test("rejects the wrong number of steps", () => {
    expect(() => parsePattern("short", "|A...|A...|")).toThrow();
  });
});

describe("PRESETS", () => {
  test("all presets are valid length-32 patterns", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(3);
    for (const p of PRESETS) {
      expect(p.steps).toHaveLength(STEPS);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  test("preset names are unique", () => {
    const names = PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

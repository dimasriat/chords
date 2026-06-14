import { test, expect, describe } from "bun:test";
import { generateVariations } from "./variations";

describe("generateVariations", () => {
  test("major triad: full default set (SOT §7)", () => {
    const v = generateVariations("C");
    expect(v).toContain("C"); // base always included
    for (const s of ["Cmaj7", "C7", "C9", "C6", "Cadd9", "Cmaj9", "Csus2", "Csus4", "C/E", "C/G"]) {
      expect(v).toContain(s);
    }
  });

  test("major triad offers the dominant 9 (e.g. A9)", () => {
    expect(generateVariations("A")).toContain("A9");
  });

  test("minor triad: includes m7/m9/madd9 and slash forms", () => {
    const v = generateVariations("Bm");
    expect(v).toContain("Bm");
    for (const s of ["Bm7", "Bm9", "Bm6", "Bmadd9", "Bsus2", "Bsus4", "Bm/D", "Bm/F#"]) {
      expect(v).toContain(s);
    }
  });

  test("minor slash uses ♭3 and 5 note names (Am/C, Am/E)", () => {
    const v = generateVariations("Am");
    expect(v).toContain("Am/C");
    expect(v).toContain("Am/E");
  });

  test("dominant 7: 9/13/7sus4", () => {
    const v = generateVariations("G7");
    expect(v).toContain("G7");
    for (const s of ["G9", "G13", "G7sus4"]) {
      expect(v).toContain(s);
    }
  });

  test("the typed chord is always present in its own list", () => {
    expect(generateVariations("Bm9")).toContain("Bm9");
    expect(generateVariations("Dmaj7")).toContain("Dmaj7");
  });

  test("no duplicate entries", () => {
    const v = generateVariations("C");
    expect(new Set(v).size).toBe(v.length);
  });

  test("list stays tight (curated, not exhaustive)", () => {
    expect(generateVariations("C").length).toBeLessThanOrEqual(12);
  });
});

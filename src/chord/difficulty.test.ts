import { test, expect, describe } from "bun:test";
import { DEFAULT_WEIGHTS, score, compare, topK, easiest } from "./difficulty";
import { computeFeatures } from "./voicing";

describe("score (SOT §7 starting weights)", () => {
  test("open D ≈ 4.6 points", () => {
    expect(score(computeFeatures([-1, -1, 0, 2, 3, 2]))).toBeCloseTo(4.6, 5);
  });

  test("compact barre (F) is easy-medium ≈ 8.6 points", () => {
    // barre(2) + fingers(4) + span(2) + position(0.6)
    expect(score(computeFeatures([1, 3, 3, 2, 1, 1]))).toBeCloseTo(8.6, 5);
  });

  test("accepts custom weights", () => {
    const f = computeFeatures([-1, -1, 0, 2, 3, 2]);
    expect(score(f, { ...DEFAULT_WEIGHTS, fingers: 0 })).toBeCloseTo(1.6, 5);
  });

  test("muting an inner string is harder than barring through it", () => {
    // Bm: x24432 (barre, no hole) should beat x24x32 (G muted in the middle)
    const barredThrough = score(computeFeatures([-1, 2, 4, 4, 3, 2]));
    const mutedMiddle = score(computeFeatures([-1, 2, 4, -1, 3, 2]));
    expect(barredThrough).toBeLessThan(mutedMiddle);
  });
});

describe("compare", () => {
  test("ranks the open shape easier than the barre", () => {
    const open = computeFeatures([-1, -1, 0, 2, 3, 2]);
    const barre = computeFeatures([1, 3, 3, 2, 1, 1]);
    expect(compare({ features: open } as any, { features: barre } as any)).toBeLessThan(0);
  });
});

describe("topK / easiest", () => {
  test("returns at most k voicings, easiest first", () => {
    const top = topK("D", 10);
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < top.length; i++) {
      expect(score(top[i]!.features)).toBeGreaterThanOrEqual(score(top[i - 1]!.features));
    }
  });

  test("easiest(D) is an open-position, no-barre shape", () => {
    const e = easiest("D")!;
    expect(e.features.hasBarre).toBe(false);
    // open D scores 4.6; the easiest must be at least that easy
    expect(score(e.features)).toBeLessThanOrEqual(4.6);
  });

  test("works for a rich chord", () => {
    expect(easiest("Bm9")).toBeDefined();
  });

  test("hideOpen filter excludes no-3rd voicings (Dmaj9 xx0220)", () => {
    const withOpen = topK("Dmaj9", 30);
    const noOpen = topK("Dmaj9", 30, undefined, { hideOpen: true });
    expect(withOpen.some((v) => v.frets.join(",") === "-1,-1,0,2,2,0")).toBe(true);
    expect(noOpen.some((v) => v.frets.join(",") === "-1,-1,0,2,2,0")).toBe(false);
    expect(noOpen.every((v) => !v.omitsThird)).toBe(true);
  });
});

import { test, expect, describe } from "bun:test";
import { computeFingering } from "./fingering";

describe("computeFingering", () => {
  test("open D (xx0232): fingers ascend by fret then string", () => {
    // G(2)->1, e(2)->2, B(3)->3; open/muted strings are 0
    expect(computeFingering([-1, -1, 0, 2, 3, 2])).toEqual([0, 0, 0, 1, 3, 2]);
  });

  test("open C (x32010): B(1)->1, D(2)->2, A(3)->3", () => {
    expect(computeFingering([-1, 3, 2, 0, 1, 0])).toEqual([0, 3, 2, 0, 1, 0]);
  });

  test("F barre (133211): lowest fret shares finger 1", () => {
    const f = computeFingering([1, 3, 3, 2, 1, 1]);
    // all fret-1 strings (low E, B, e) get finger 1
    expect(f[0]).toBe(1);
    expect(f[4]).toBe(1);
    expect(f[5]).toBe(1);
    // higher frets use other fingers, capped at 4
    expect(Math.max(...f)).toBeLessThanOrEqual(4);
  });

  test("open/muted strings get finger 0", () => {
    expect(computeFingering([0, 2, 2, 1, 0, 0])[0]).toBe(0); // open low E
    expect(computeFingering([-1, -1, 0, 2, 3, 2])[0]).toBe(0); // muted
  });
});

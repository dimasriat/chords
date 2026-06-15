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

  test("barre: two notes on the same higher fret get distinct fingers (x24432)", () => {
    const f = computeFingering([-1, 2, 4, 4, 3, 2]);
    expect(f[1]).toBe(1); // A @2 — part of the index barre
    expect(f[5]).toBe(1); // e @2 — part of the index barre
    // D@4 and G@4 share a fret but must be two separate fingers, not one
    expect(f[2]).not.toBe(f[3]);
    expect([3, 4]).toContain(f[2]);
    expect([3, 4]).toContain(f[3]);
  });

  test("no false barre: single string at the lowest fret → distinct fingers, no 2-2-2 (x5777 8)", () => {
    const f = computeFingering([-1, 5, 7, 7, 7, 8]);
    // the three strings at fret 7 must not all collapse onto one finger
    expect(new Set([f[2], f[3], f[4]]).size).toBe(3);
  });

  test("open/muted strings get finger 0", () => {
    expect(computeFingering([0, 2, 2, 1, 0, 0])[0]).toBe(0); // open low E
    expect(computeFingering([-1, -1, 0, 2, 3, 2])[0]).toBe(0); // muted
  });
});

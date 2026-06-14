import { test, expect, describe } from "bun:test";
import { buildSchedule } from "./scheduler";
import { parsePattern } from "./patterns";

const OPEN_D = [-1, -1, 0, 2, 3, 2]; // bass = D string (midi 50); treble = 57,62,66

describe("buildSchedule", () => {
  const thumbFingers = parsePattern("tf", "|T...|F...|T...|F...|T...|F...|T...|F...|");

  test("step timing is a 16th note at the given BPM", () => {
    const { events, duration } = buildSchedule(thumbFingers, OPEN_D, 120);
    // 120 BPM → beat 0.5s → 16th = 0.125s; 32 steps → 4s total
    expect(duration).toBeCloseTo(4, 5);
    expect(events[0]!.time).toBeCloseTo(0, 5);
    // second stroke (F) is at step 4 = 0.5s
    expect(events[1]!.time).toBeCloseTo(0.5, 5);
  });

  test("T plays only the bass string; F plays only the treble strings", () => {
    const { events } = buildSchedule(thumbFingers, OPEN_D, 120);
    expect(events[0]!.midi).toEqual([50]); // thumb → bass D
    expect(events[1]!.midi).toEqual([57, 62, 66]); // fingers → treble
  });

  test("A strums every sounded string", () => {
    const strum = parsePattern("a", "|A...|A...|A...|A...|A...|A...|A...|A...|");
    const { events } = buildSchedule(strum, OPEN_D, 120);
    expect(events[0]!.midi).toEqual([50, 57, 62, 66]);
    expect(events).toHaveLength(8); // one A per cell
  });

  test("X emits a mute event with no notes", () => {
    const muted = parsePattern("x", "|X...|A...|A...|A...|A...|A...|A...|A...|");
    const { events } = buildSchedule(muted, OPEN_D, 120);
    expect(events[0]!.mute).toBe(true);
    expect(events[0]!.midi).toEqual([]);
  });

  test("rests produce no events", () => {
    const sparse = parsePattern("s", "|A...|....|....|....|....|....|....|....|");
    expect(buildSchedule(sparse, OPEN_D, 120).events).toHaveLength(1);
  });

  test("tempo scales the timing", () => {
    const { duration } = buildSchedule(thumbFingers, OPEN_D, 60);
    expect(duration).toBeCloseTo(8, 5); // half the tempo → twice as long
  });
});

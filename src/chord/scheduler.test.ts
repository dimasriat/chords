import { test, expect, describe } from "bun:test";
import { buildSchedule, buildBridgeSchedule, bridgeSegmentLengths } from "./scheduler";
import { parsePattern } from "./patterns";

const OPEN_D = [-1, -1, 0, 2, 3, 2]; // bass = D string (midi 50); treble = 57,62,66
const OPEN_G = [3, 2, 0, 0, 0, 3]; // midi 43,47,50,55,59,67

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

describe("bridgeSegmentLengths", () => {
  test("D–D7–G → from ½, connector ½, target full", () => {
    expect(bridgeSegmentLengths(3)).toEqual([16, 16, 32]);
  });
  test("D–Am7–D7–G → ½ · ¼ · ¼ · full", () => {
    expect(bridgeSegmentLengths(4)).toEqual([16, 8, 8, 32]);
  });
  test("single chord → one full bar", () => {
    expect(bridgeSegmentLengths(1)).toEqual([32]);
  });
});

describe("buildBridgeSchedule", () => {
  const strum = parsePattern("a", "|A...|A...|A...|A...|A...|A...|A...|A...|");

  test("each chord plays its segment, restarting the pattern from beat 1", () => {
    // [D(16), G(16), D(32)] over an all-A pattern → A on every 4th step
    const { events, duration } = buildBridgeSchedule(strum, [OPEN_D, OPEN_G, OPEN_D], 120);
    // 4 (D, 16 steps) + 4 (G, 16 steps) + 8 (D, 32 steps) = 16 events
    expect(events).toHaveLength(16);
    expect(events[0]!.time).toBeCloseTo(0, 5); // D resets to beat 1
    expect(events[4]!.time).toBeCloseTo(16 * (0.5 / 4), 5); // G starts a fresh bar at step 16
    expect(events[0]!.midi).toEqual([50, 57, 62, 66]); // D
    expect(events[4]!.midi).toEqual([43, 47, 50, 55, 59, 67]); // G
    expect(duration).toBeCloseTo(64 * (0.5 / 4), 5); // 2 bars total
  });

  test("empty sequence yields no events", () => {
    expect(buildBridgeSchedule(strum, [], 120).events).toHaveLength(0);
  });
});

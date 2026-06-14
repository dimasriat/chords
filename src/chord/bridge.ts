/**
 * Chord bridging — given two chords, generate nice connecting sequences.
 *
 * Pure music theory: each bridge is a short sequence `[from, …connectors, to]`
 * named by its device (secondary dominant, ii–V, leading-tone dim7, tritone sub,
 * backdoor, walking bass, suspension). Ranked strongest-first, deduped, and filtered
 * to chords that actually voice on the guitar.
 */

import { parseChord } from "./parser";
import { transposeNote, noteToSemitone } from "./notes";
import { computeChordTones } from "./chordTones";
import { generateVoicings } from "./voicing";

export interface Bridge {
  name: string;
  sequence: string[];
}

const MAX_BRIDGES = 12;

function isVoiceable(symbol: string): boolean {
  try {
    return generateVoicings(symbol).length > 0;
  } catch {
    return false;
  }
}

export function generateBridges(fromSym: string, toSym: string): Bridge[] {
  const from = parseChord(fromSym);
  const to = parseChord(toSym);
  const t = to.root;

  const V = transposeNote(t, 7); // dominant: a 5th above the target
  const ii = transposeNote(t, 2); // supertonic
  const lt = transposeNote(t, -1); // leading tone: a half-step below
  const ts = transposeNote(t, 1); // tritone-sub root: a half-step above
  const bd = transposeNote(t, -2); // backdoor: a whole-step below

  // Ordered strongest → most colourful.
  const candidates: Bridge[] = [
    { name: "Secondary dominant", sequence: [fromSym, `${V}7`, toSym] },
    { name: "ii–V", sequence: [fromSym, `${ii}m7`, `${V}7`, toSym] },
    { name: "Dominant 9", sequence: [fromSym, `${V}9`, toSym] },
    { name: "Leading-tone dim7", sequence: [fromSym, `${lt}dim7`, toSym] },
    { name: "Suspension", sequence: [fromSym, `${t}sus4`, toSym] },
    { name: "Tritone sub", sequence: [fromSym, `${ts}7`, toSym] },
    { name: "Backdoor dominant", sequence: [fromSym, `${bd}7`, toSym] },
  ];

  // Walking bass: the from-chord over the leading tone, when that note belongs to it.
  const fromTones = new Set(computeChordTones(from).pitchClasses);
  if (fromTones.has(noteToSemitone(lt))) {
    candidates.push({ name: "Walking bass", sequence: [fromSym, `${fromSym}/${lt}`, toSym] });
  }

  const seen = new Set<string>();
  const out: Bridge[] = [];
  for (const b of candidates) {
    // Collapse consecutive duplicates so a connector that equals an endpoint (e.g.
    // D9 → D9 → G9) doesn't survive; if nothing real is left, skip the bridge.
    const sequence = b.sequence.filter((c, i) => i === 0 || c !== b.sequence[i - 1]);
    if (sequence.length < 3) continue; // collapsed to just from → to: no connector
    const key = sequence.join(">");
    if (seen.has(key)) continue;
    if (!sequence.every(isVoiceable)) continue;
    seen.add(key);
    out.push({ name: b.name, sequence });
    if (out.length >= MAX_BRIDGES) break;
  }
  return out;
}

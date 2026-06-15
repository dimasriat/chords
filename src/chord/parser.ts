/**
 * Chord symbol parser — SOT §3 (Layer 1, Chord Engine).
 *
 * Parses a text chord symbol (e.g. "Bm", "C/E", "Dmaj7", "F#m7b5") into a
 * structured {root, quality, extensions[], bass}. This is pure structure only;
 * mapping quality/extensions to actual intervals/pitch-classes is a separate
 * module's job.
 */

export type ChordQuality = "maj" | "min" | "dim" | "aug" | "sus2" | "sus4";

export interface ParsedChord {
  /** Root note, e.g. "C", "F#", "Bb". */
  root: string;
  /** Triad quality. */
  quality: ChordQuality;
  /** Extra colour/alterations in symbol order, e.g. ["maj7"], ["7", "b5"]. */
  extensions: string[];
  /** Slash bass note, or null when absent. */
  bass: string | null;
}

/** A note name: A–G (case-insensitive) with an optional single sharp/flat. */
const NOTE_RE = /^[A-Ga-g](#|b)?/;

/** Extension tokens, longest-first so "maj9" wins over "9", "add9" over "9". */
const EXTENSION_TOKENS = [
  "maj13", "maj11", "maj9", "maj7",
  "add13", "add11", "add9",
  "sus2", "sus4",
  "b13", "#11", "b9", "#9", "b5", "#5",
  "13", "11", "9", "7", "6", "5",
];

function matchNote(s: string): string | null {
  const m = s.match(NOTE_RE);
  if (!m) return null;
  // Normalise the note letter to uppercase so input is case-insensitive
  // ("bm" → "Bm", "c" → "C"); the flat sign "b" stays lowercase.
  return m[0][0]!.toUpperCase() + m[0].slice(1);
}

export function parseChord(input: string): ParsedChord {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Cannot parse empty chord symbol");
  }
  const raw = input.trim();

  // Split off an optional slash bass: the part after the last "/".
  let main = raw;
  let bass: string | null = null;
  const slash = raw.indexOf("/");
  if (slash !== -1) {
    const bassStr = raw.slice(slash + 1);
    const b = matchNote(bassStr);
    if (!b || b.length !== bassStr.length) {
      throw new Error(`Invalid bass note in "${input}": "${bassStr}"`);
    }
    bass = b;
    main = raw.slice(0, slash);
  }

  // Root.
  const root = matchNote(main);
  if (!root) {
    throw new Error(`Invalid root note in "${input}"`);
  }
  // Normalise multi-letter quality keywords to lowercase (DMaj9 → Dmaj9, ASus4 →
  // Asus4). Single "m" (minor) and accidentals are left untouched.
  let rest = main.slice(root.length).replace(/maj|sus|dim|aug|add/gi, (m) => m.toLowerCase());

  // Triad quality. Order matters: check "sus*"/"dim"/"aug"/"maj" before bare "m".
  let quality: ChordQuality = "maj";
  if (rest.startsWith("sus2")) {
    quality = "sus2";
    rest = rest.slice(4);
  } else if (rest.startsWith("sus4")) {
    quality = "sus4";
    rest = rest.slice(4);
  } else if (rest.startsWith("sus")) {
    quality = "sus4";
    rest = rest.slice(3);
  } else if (rest.startsWith("dim")) {
    quality = "dim";
    rest = rest.slice(3);
  } else if (rest.startsWith("aug")) {
    quality = "aug";
    rest = rest.slice(3);
  } else if (rest.startsWith("maj")) {
    // Major triad; "maj7"/"maj9" are extensions, leave them for the loop below.
    quality = "maj";
  } else if (rest.startsWith("m")) {
    quality = "min";
    rest = rest.slice(1);
  }

  // Remaining characters are extensions/alterations, consumed longest-first.
  const extensions: string[] = [];
  while (rest.length > 0) {
    const token = EXTENSION_TOKENS.find((t) => rest.startsWith(t));
    if (!token) {
      throw new Error(`Unrecognised chord suffix in "${input}" at "${rest}"`);
    }
    extensions.push(token);
    rest = rest.slice(token.length);
  }

  return { root, quality, extensions, bass };
}

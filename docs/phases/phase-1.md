# Phase 1 — Chord Engine + Library

> SOT reference: `docs/sot.md` §3 (Layers 1 & 2), §5 (P0 features).
> Status: **Draft — under discussion.** Not yet broken into beads issues.

## Goal (one sentence)

Type a chord → get smart **reharmonized variations** → see and **hear the easiest
way to play** each → **save** the ones you like to a personal library.

This delivers the four P0 features (reharmonization, easiest-pattern, audio, library
CRUD) and builds the engine every later phase sits on. **No board, no transpose yet.**

## In scope

1. **Chord parser** — text symbol → structured chord. Handles root, minor/major,
   7/maj7/9/add9/6/sus, and slash bass (`C/E`).
2. **Variation generator (reharmonization)** — given a parsed chord, auto-generate a
   curated set of sensible variations:
   - extensions (e.g. `Bm → Bm7, Bm9, Bmadd9, Bm6`)
   - inversions / slash chords (e.g. `C → C/E, C/G`)
3. **Voicing generator** — build voicings **from scratch**: chord pitch-classes →
   search the fretboard (6 open strings E A D G B E; each string mute/open/fret in a
   small window). Keep only **valid** voicings (SOT §7 rule): essential tones present
   (triad 1-3-5; 7th/9th may drop the 5th), root/slash-bass lowest, ≥4 sounding
   strings, doubling allowed.
4. **Difficulty scorer / comparator** — feature-based linear model
   `score = weights · features` (features: barre, #fretted, span, inner-mutes,
   position), exposed as `compare(a, b)`. Sort candidate voicings through it and slice
   the **top ~10** for the pick-list (top-K selection, not full sort). Phase 1 uses
   **hand-tuned default weights**; built as `weights · features` so Phase 1.5 can swap
   in learned weights (and the human comparator) with zero rework.
5. **Note resolver** — voicing → concrete pitches, for audio.
6. **Audio playback** — Web Audio, synthesized strum of a chord's notes. Tap to hear.
7. **Library CRUD** — add (type symbol → pick from auto-generated variations → save),
   list, edit chosen voicing, delete. Persisted in `bun:sqlite`.
8. **Chord diagram (visualization)** — SVG fretboard diagram per voicing: 6 string
   lines, fret lines, finger dots (with finger numbers), `O`/`X` for open/muted
   strings, fret-position label for up-the-neck shapes. Renders straight from the
   voicing's `frets[6]`/`fingers[6]` data. UI component → browser-verified.
9. **Minimal UI** — phone-first: an input to type a chord, a pick-list of variations
   each showing its **diagram** (easiest shape) + a play button, and the saved library
   list.

## Out of scope (Phase 1)

- Pairwise preference page / learned difficulty weights (Phase 1.5 — but the scorer
  is built as `weights · features` now so the weights can be swapped later).
- Board / pads grid (Phase 2).
- Transpose / key-family browser (Phase 3).
- Practice drills (Phase 4).
- Recorded guitar samples (synth is fine for now).
- Multi-user / auth.

## Decisions made (this session)

- **Voicings built from scratch** (intervals → pitch-classes → fretboard search). No
  bundled chord database.
- **Difficulty = `weights · features`** with hand-tuned default weights in Phase 1;
  pairwise-preference learning deferred to **Phase 1.5**.

## All build decisions settled

- Default variation set — SOT §7.
- Starting weights — barre+5, fretted+1, span+1, inner-mute+2, position+0.2 (SOT §7).
- Fretboard search window — 5-fret span, positions to ~fret 12 (SOT §7).
- Only non-blocking open item: audio realism (synth now, revisit later).

## Draft acceptance criteria (testable — TDD targets)

Pure modules (TDD: write failing test first, then implement):

- **Parser:** `parse("Bm")`, `parse("C/E")`, `parse("Dmaj7")`, `parse("F#m7b5")`
  return the correct structured chord; invalid input is rejected clearly.
- **Variation generator:** `variations("Bm")` includes `Bm7, Bm9, Bmadd9` and the
  slash/inversion forms, and excludes nonsense; output is stable/curated.
- **Voicing validity:** generated voicings all satisfy the §7 rule (essential tones,
  bass lowest, ≥4 strings); an open D / open C appear among them; invalid shapes
  (e.g. missing the 3rd, <4 strings) are rejected.
- **Difficulty comparator:** `compare(open, barre)` ranks the open shape easier;
  sorting a candidate set yields easiest-first; `topK(chord, 10)` returns 10 valid
  voicings easiest-first.
- **Note resolver:** a known voicing (e.g. open D) resolves to the expected pitch set.

UI / behavior (browser automation, not unit tests):

- Typing a chord shows the auto-generated variation list, each with a rendered
  **fretboard diagram** of its easiest shape.
- Each variation has a working play button (audible chord).
- Picking a variation and saving adds it to the library; it persists across reload.
- Library entries can be deleted.

## Suggested build order

1. Parser (pure, TDD) →
2. Variation generator (pure, TDD) →
3. Decide fingering data source → voicing + difficulty ranker (pure, TDD) →
4. Note resolver (pure, TDD) →
5. Audio playback (Web Audio) →
6. Library persistence (`bun:sqlite`) →
7. Phone-first UI tying it together (browser-verified).

## Open questions for this phase

- Exactly which variations to surface for each chord quality (curate the list).
- How many alternate voicings to show per chord (just easiest, or easy+hard?).
- Library scope: flat list, or grouped by root/key?

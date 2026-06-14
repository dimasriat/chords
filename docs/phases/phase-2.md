# Phase 2 — Pattern player (fingerpicking / strumming)

> SOT reference: `docs/sot.md` §11. Status: **in progress.**

## Goal

A global Settings page sets the current **pattern** (preset), **tempo**, and
**once/loop** mode. Every ▶︎ button plays its chord with that pattern, using the
bass/treble split of the voicing. Loop mode shows a Stop control.

## Decisions (this session)

- **Global setting** drives all ▶︎ buttons (not a separate practice page).
- **Presets only** in v1 — no custom grid editor yet.
- **Fixed 8/8** — every pattern is 8 cells × 4 = 32 steps.
- **Tempo (BPM)** lives in Settings alongside pattern + mode.

## Strokes

`.` rest · `T` thumb → bass string (lowest sounded) · `F` fingers → treble strings
(the rest) · `A` all (strum every sounded string) · `X` mute/damp.

## In scope

1. **Pattern model + parser** (pure, TDD): `parsePattern("|A...|...")` → `Stroke[32]`;
   preset patterns p1/p2/p3.
2. **Scheduler** (pure, TDD): `buildSchedule(pattern, voicing, bpm)` → timed
   `{ time, midi[], mute }` events; bass = lowest sounded string, treble = the rest;
   step duration = `(60/bpm)/4` s; total = 32 steps.
3. **Web Audio sequencer**: play a schedule once or looped; Stop; X damps ringing.
4. **Global settings** (localStorage): patternName, bpm, loop.
5. **Settings page**: pick preset (with grid preview), tempo slider, once/loop toggle.
6. **Wire ▶︎ buttons** (Find / Library / Finder) through the player; Stop bar while
   looping; add a Settings nav tab.

## Out of scope (v1)

- Custom pattern grid editor (presets only).
- Configurable time signatures (fixed 8/8).
- Per-chord patterns or progressions (single chord at a time).
- Recorded samples (still synth).

## Acceptance criteria (TDD targets, pure modules)

- **parsePattern:** valid `|A...|`-form strings → 32 strokes; rejects bad length/chars.
- **presets:** p1/p2/p3 parse to length-32 stroke arrays.
- **buildSchedule:** correct event times (16th-note spacing for the BPM), correct
  bass/treble note split per stroke, total duration = 32 steps, `A` plays all sounded,
  `T` plays only the bass string, `F` plays only treble strings, `X` → mute event.

UI/audio (browser-verified): preset selection + tempo + mode persist; ▶︎ plays the
pattern; loop loops until Stop; sounds correct on phone.

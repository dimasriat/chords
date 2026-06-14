# Chords — Source of Truth (SOT)

> This is the guardrail. All implementation must align with it. If implementation
> diverges, the default is implementation adjusts; if the doc is wrong, update it
> and record the decision in the relevant beads issue.

Status: **Draft / brainstorm** — last updated 2026-06-14

---

## 1. The pain point

Dimas plays **acoustic guitar**. He has memorized the **chord family of D major**
(its diatonic chords: D, Em, F#m, G, A, Bm) and is comfortable playing songs in D.

The friction:

- He doesn't have other keys' families memorized as well, so playing a song in a
  different "home" is hard.
- He sometimes blanks on a chord's **fretting pattern**.
- He doesn't always know how to **reharmonize** a plain chord into a richer one
  (e.g. a triad → a 9th, or a slash/inversion). He can do *some* of this by hand
  (normal → 9 chord) and wants the app to do it for him.
- Many chords have an **easy** and a **hard** (barre) version — he wants the easy one.
- He wants to **hear** a chord, since he works phone-first.

## 2. Who it's for

- **Single user: Dimas.** Personal tool, not multi-user (no accounts/auth in scope).
- **Phone-first.** Used through a mobile browser (he works from an iPhone over SSH/
  Termius, but the *app itself* he opens in a phone browser). UI must be touch-first,
  narrow-screen friendly, tap-to-play.
- Deployed on the VPS at **https://chords.dimsky.xyz**, served via **Caddy**.

## 3. Core concept — three layers

The app is built in three layers. The lower layers are the priority; the upper
layers sit on top of them.

### Layer 1 — Chord Engine (the foundation)
Pure music-theory logic, no UI:
- **Parse** a chord typed as text (`Bm`, `C/E`, `D7`) into a structured chord.
- **Generate variations** of that chord automatically (reharmonizations):
  - Extensions: `Bm → Bm7, Bm9, Bmadd9, Bm6 …`
  - Inversions / slash chords: `C → C/E, C/G …`
- For each playable voicing, know its **fingering** and a **difficulty score**,
  so the app can pick the **easiest** pattern by default.
- **Resolve a voicing to actual notes/pitches** so it can be played as audio.

### Layer 2 — Chord Library (personal, CRUD)
The chords *Dimas knows / wants*. The source of truth for what he plays.
- Add a chord by typing it as text. The engine **auto-generates variation choices**;
  **he picks** which to keep (auto-generate → user picks).
- Each saved entry knows its chosen voicing (easy by default), its notes, its sound.
- Edit / delete entries.

### Layer 3 — Board / Pads (the playground) — *later phase*
- A grid of tappable buttons (6+, flexible layout). Each pad holds a chord pulled
  **from the library**. Tap a pad → it plays the chord.
- Example board (D family):
  ```
  G    F#m   Em
  A    Bm    D
  D7   –     –
  ```
- **Transpose** the whole board between homes (D ⇄ G …), back and forth.
  This is **temporary state / nice-to-have, NOT a Phase 1 priority.**

## 4. Guiding principles

- **Reharmonization and "easiest shape" are the heart of the app.** Everything
  else is scaffolding around those two.
- **Auto-generate, human picks.** The app proposes; Dimas curates.
- **Hear everything.** Any chord/voicing on screen should be tappable to play.
- **Phone-first, touch-first, narrow screen.** No reliance on hover or wide layouts.
- **Music-theory logic lives in pure, testable modules** (parser, variation
  generator, difficulty ranker, note resolver) — not inside UI components (per
  project TDD rules).

## 5. Feature priority

| Priority | Feature |
|---|---|
| **P0** | Reharmonization: chord → auto-generated variations (extensions + inversions) |
| **P0** | Easiest-pattern selection: pick & default to the easy voicing, hard available |
| **P0** | Hear a chord (audio playback) |
| **P0** | Chord Library CRUD (auto-generate variations → user picks → save) |
| P1 | Board / pads (playable grid built from the library) |
| P2 | Transpose board between homes (temporary, nice-to-have) |
| P2 | Key-family browser ("show me G's whole family") |
| P3 | Memorization / practice drills |

## 6. Non-goals (for now)

- Multi-user, accounts, auth, sharing.
- Native mobile app (it's a web app).
- Song-sheet / lyrics-with-chords management.
- Other instruments (guitar only — acoustic).
- Persistent board-driven transposition rewriting the library.

## 7. Technical decisions

- **Runtime/build:** Bun. Server via `Bun.serve()` with HTML imports + React. No
  Express/Vite.
- **Styling: Bootstrap CSS** (overrides the Tailwind suggestion in CLAUDE.md). Use
  Bootstrap's classes/components for the phone-first UI; its grid + responsive
  utilities suit the narrow-screen layout. (Plain Bootstrap CSS; add react-bootstrap
  only if component ergonomics call for it.)
- **Persistence:** local to the VPS. `bun:sqlite` for the chord library + preference
  data (single user, simple, durable). Revisit if needs grow.
- **Chord shapes — built from scratch, no bundled database.** A chord is computed
  from intervals over its root (major = 1–3–5 / +4,+7 semitones; minor = +3,+7; add
  the 7th = +10, 9th = +14, sus4 = +5, etc.) into a pitch-class set. Guitar voicings
  are then found by searching the fretboard (6 fixed open pitches E A D G B E; each
  string = mute / open / a fret) for combinations matching the chord. **Search window:
  fretted notes must fit within any 5-fret span** (open strings are free, don't count
  toward the span); search positions from the nut up to ~fret 12.
- **Default variation set** (what the variation generator auto-offers; from standard
  practice, tunable later). Always include the base chord, plus:
  - **major triad** → `maj7, 7, 6, add9, maj9, sus2, sus4` + slash `/3` (e.g. `C/E`),
    `/5` (e.g. `C/G`)
  - **minor triad** → `m7, m9, m6, madd9, sus2, sus4` + slash `/♭3` (e.g. `Am/C`),
    `/5` (e.g. `Am/E`)
  - **dominant 7** → `9, 13, 7sus4`
  The user picks which to keep; the list stays tight on purpose.
- **Voicing validity rule.** A candidate voicing is valid iff:
  1. it contains the chord's **essential tones** — triad = 1-3-5; 7th/9th = root, 3rd,
     7th (+ 9th for a 9 chord). The **5th may be omitted on 7th/9th chords** (kept
     mandatory on plain triads).
  2. **root (or slash bass) is the lowest sounding string**;
  3. it has **≥4 sounding strings** (≤6). Doubling tones (e.g. an extra bass root) is
     allowed.
- **Difficulty model — feature-based linear scorer, learnable.** Each voicing is
  described by features and scored as `score = weights · features`; **easiest =
  lowest score**. Features (rough weight order):
  1. **barre** required (one finger flattening a whole fret) — biggest penalty
  2. **number of fretted notes** (open strings are free)
  3. **fret span / stretch**
  4. **inner muted strings** (skipping a middle string)
  5. **neck position** (lower/open slightly easier)
  **Starting weights (seed; learning retunes them):** barre **+5**, per fretted note
  **+1**, per fret of span **+1**, per inner muted string **+2**, per fret up the neck
  (highest fret) **+0.2**. Sanity check: open D ≈ 4.6 pts, F barre ≈ 13.6 pts (F is
  harder → higher). Easiest = lowest total.
  Defaults start as a **hand-tuned heuristic** (works day one). Later, a **pairwise
  preference page** ("which of these two voicings of the same chord is easier *for
  you*?") collects taps and refits the weights to Dimas's hands via a simple
  preference model (Bradley-Terry / logistic regression). Heuristic → learned is just
  swapping the weights vector — build the scorer this way from the start so there's
  zero rework.
- **The scorer is exposed as a comparator** `compare(a, b)` → which voicing is easier.
  Sorting candidate voicings runs through it; we slice the **top ~10** as the
  pick-list. The default comparator is the heuristic (sorts instantly, no taps). The
  **human is the same comparator slot** (tap "A or B easier?" = merge-sort by hand) —
  used only to *correct* the machine, and each correction becomes training data. Use
  **top-K selection, not a full sort**, to keep human comparisons minimal.
- **Reset / relearn.** Training data (the `Preference` rows) can be wiped at any time,
  reverting the weights to the hand-tuned defaults so the model relearns from scratch.
  A bad run of taps must never be permanent.
- **Audio:** **Web Audio API, synthesized** for Phase 1 — generate the chord's notes
  in-browser (e.g. a plucked/Karplus-Strong-ish or simple sampled oscillator,
  strummed). Rationale: works for *any* chord, nothing to host, lightest to ship,
  fine on phone. Can upgrade to recorded acoustic-guitar samples later. *(Decision —
  revisit if the synth sound is too unpleasant to be useful.)*
- **Chord visualization:** SVG **fretboard diagram** per voicing (string/fret grid,
  finger dots + numbers, `O`/`X` for open/muted, fret-position label). Rendered from
  the voicing's `frets[6]`/`fingers[6]` — no diagram library needed.
- **Deploy:** VPS, reverse-proxied by Caddy at `chords.dimsky.xyz`.

## 8. Data model (draft, to be refined per phase)

```
Chord (parsed)        : { root, quality, extensions[], bass? }
Chord (notes)         : { root, pitchClasses[] }              // from intervals
Voicing               : { chord, frets[6], fingers[6], notes[], features }
VoicingFeatures       : { hasBarre, frettedCount, fretSpan, innerMutes, position }
DifficultyWeights     : { barre, frettedCount, fretSpan, innerMutes, position }
Preference            : { id, chord, voicingA, voicingB, winner, createdAt }  // P1.5
LibraryEntry          : { id, symbol, parsedChord, chosenVoicing, createdAt }
```
`score(voicing) = weights · features` → easiest = lowest. Weights are the hand-tuned
defaults in Phase 1; refit from `Preference` rows in Phase 1.5.

## 9. Open questions / decisions needed

**Resolved this session:**
- ~~Fingering data source~~ → **DECIDED: build from scratch algorithmically**
  (intervals → pitch-class set → fretboard search). No bundled database. (See §7.)
- ~~Difficulty heuristic~~ → **DECIDED: feature-based linear scorer**
  `score = weights · features`, hand-tuned defaults now, pairwise-preference
  learning later. (See §7.)

- ~~Default variation set~~ → **DECIDED** (see §7 "Default variation set").
- ~~Starting weights~~ → **DECIDED** (barre+5, fretted+1, span+1, inner-mute+2,
  position+0.2 — see §7).
- ~~Fretboard search window~~ → **DECIDED: 5-fret span**, positions to ~fret 12.

**Still open:**
1. Audio realism threshold — is synth good enough, or do we need samples sooner?
   (Not blocking; can ship synth and revisit.)

## 10. Phase roadmap

- **Phase 1** — Chord Engine + Library: type a chord → reharmonized variations →
  easiest playable shape (heuristic difficulty) → hear it → save chosen to library.
  *(See `docs/phases/phase-1.md`.)*
- **Phase 1.5** — Pairwise preference page: compare two voicings of the same chord,
  learn personal difficulty weights, refit the scorer to Dimas's hands. Includes a
  **reset** that clears preference data and reverts to default weights to relearn.
- **Phase 2** — Board / pads built from the library, tap-to-play grid.
- **Phase 3** — Transpose, key-family browser.
- **Phase 4** — Memorization / practice.

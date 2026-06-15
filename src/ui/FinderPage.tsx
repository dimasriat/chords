/** Chord Finder page: build a voicing on the fretboard, the app names the chord. */

import React, { useState } from "react";
import { InteractiveFretboard } from "./InteractiveFretboard";
import { nameChord } from "../chord/chordNamer";
import { resolveMidi, resolveNoteNames } from "../chord/noteResolver";
import { usePlayer } from "./PlayerContext";

const EMPTY = [-1, -1, -1, -1, -1, -1];
const MAX_START_FRET = 12;

export function FinderPage({ onSave }: { onSave: (symbol: string, frets: number[]) => void }) {
  const { play } = usePlayer();
  const [frets, setFrets] = useState<number[]>(EMPTY);
  const [startFret, setStartFret] = useState(1);

  const clamp = (n: number) => Math.min(MAX_START_FRET, Math.max(1, n));

  const pcs = resolveMidi(frets).map((m) => m % 12);
  const notes = resolveNoteNames(frets);
  const name = pcs.length >= 2 ? nameChord(pcs, pcs[0]!) : null;
  const sounding = frets.some((f) => f !== -1);

  return (
    <div>
      <p className="text-muted small">
        Tap the fretboard to place fingers; tap above a string to toggle open/muted.
      </p>

      <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
        <span className="small text-muted">Min fret</span>
        <div className="btn-group btn-group-sm" role="group" aria-label="minimum fret">
          <button
            className="btn btn-outline-secondary"
            disabled={startFret <= 1}
            onClick={() => setStartFret((n) => clamp(n - 1))}
          >
            −
          </button>
          <span className="btn btn-outline-secondary disabled" style={{ minWidth: "3.5rem" }}>
            {startFret}fr
          </span>
          <button
            className="btn btn-outline-secondary"
            disabled={startFret >= MAX_START_FRET}
            onClick={() => setStartFret((n) => clamp(n + 1))}
          >
            ＋
          </button>
        </div>
      </div>

      <div className="text-center mb-2">
        <InteractiveFretboard frets={frets} onChange={setFrets} startFret={startFret} />
      </div>

      <div className="text-center mb-3">
        <div className="display-6">{name ?? (sounding ? "—" : "…")}</div>
        <div className="small text-muted">{notes.join(" ") || "no notes yet"}</div>
        {sounding && !name && (
          <div className="small text-secondary">not a chord I recognise (yet)</div>
        )}
      </div>

      <div className="d-flex gap-2 justify-content-center">
        <button
          className="btn btn-outline-secondary"
          disabled={!sounding}
          onClick={() => play(frets)}
        >
          ▶︎ Play
        </button>
        <button
          className="btn btn-outline-success"
          disabled={!name}
          onClick={() => name && onSave(name, frets)}
        >
          ＋ Save
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setFrets(EMPTY);
            setStartFret(1);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

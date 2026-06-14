/** Chord Finder page: build a voicing on the fretboard, the app names the chord. */

import React, { useState } from "react";
import { InteractiveFretboard } from "./InteractiveFretboard";
import { nameChord } from "../chord/chordNamer";
import { resolveMidi, resolveNoteNames } from "../chord/noteResolver";
import { playVoicing } from "./audio";

const EMPTY = [-1, -1, -1, -1, -1, -1];

export function FinderPage({ onSave }: { onSave: (symbol: string, frets: number[]) => void }) {
  const [frets, setFrets] = useState<number[]>(EMPTY);

  const pcs = resolveMidi(frets).map((m) => m % 12);
  const notes = resolveNoteNames(frets);
  const name = pcs.length >= 2 ? nameChord(pcs, pcs[0]!) : null;
  const sounding = frets.some((f) => f !== -1);

  return (
    <div>
      <p className="text-muted small">
        Tap the fretboard to place fingers; tap above a string to toggle open/muted.
      </p>

      <div className="text-center mb-2">
        <InteractiveFretboard frets={frets} onChange={setFrets} />
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
          onClick={() => playVoicing(frets)}
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
        <button className="btn btn-outline-secondary" onClick={() => setFrets(EMPTY)}>
          Clear
        </button>
      </div>
    </div>
  );
}

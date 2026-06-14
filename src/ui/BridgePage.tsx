/** Bridge page — type two chords, get ranked connecting sequences (SOT §11/theory). */

import React, { useMemo, useState } from "react";
import { generateBridges, type Bridge } from "../chord/bridge";
import { topK } from "../chord/difficulty";
import { ChordDiagram } from "./ChordDiagram";
import { usePlayer } from "./PlayerContext";

const SHAPES_PER_CHORD = 8;

function BridgeCard({ bridge }: { bridge: Bridge }) {
  const { playSequence } = usePlayer();
  // All shape options for each chord in the sequence (easiest first).
  const options = useMemo(
    () => bridge.sequence.map((sym) => topK(sym, SHAPES_PER_CHORD).map((v) => v.frets)),
    [bridge],
  );
  // Which shape is chosen per chord position.
  const [picks, setPicks] = useState<number[]>(() => bridge.sequence.map(() => 0));

  const cycle = (i: number) =>
    setPicks((prev) => {
      const next = [...prev];
      const count = options[i]!.length || 1;
      next[i] = (prev[i]! + 1) % count;
      return next;
    });

  const chosen = (i: number): number[] | null => options[i]![picks[i]!] ?? null;

  function play() {
    const voicings = bridge.sequence
      .map((_, i) => chosen(i))
      .filter((f): f is number[] => f !== null);
    playSequence(voicings);
  }

  return (
    <div className="card mb-2">
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-bold small">{bridge.name}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={play}>
            ▶︎
          </button>
        </div>
        <div className="d-flex align-items-end gap-1 overflow-auto">
          {bridge.sequence.map((sym, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted mb-4">→</span>}
              <div
                className="text-center"
                style={{ flex: "0 0 auto", cursor: "pointer" }}
                onClick={() => cycle(i)}
                title="Tap to change shape"
              >
                <div className="small fw-semibold">{sym}</div>
                {chosen(i) ? (
                  <ChordDiagram frets={chosen(i)!} size={0.8} showNotes={false} />
                ) : (
                  <div className="text-muted small py-3">—</div>
                )}
                {options[i]!.length > 1 && (
                  <div className="text-muted" style={{ fontSize: 10 }}>
                    {picks[i]! + 1}/{options[i]!.length}
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BridgePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bridges, setBridges] = useState<Bridge[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setBridges(generateBridges(from.trim(), to.trim()));
    } catch {
      setBridges(null);
      setError("Couldn't read those chords. Try e.g. D and G.");
    }
  }

  return (
    <div>
      <form onSubmit={handleGenerate} className="mb-2">
        <div className="input-group">
          <span className="input-group-text">from</span>
          <input
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="input-group-text">to</span>
          <input
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className="btn btn-primary" type="submit">
            Bridge
          </button>
        </div>
      </form>

      {error && <div className="alert alert-warning py-2">{error}</div>}
      {bridges && (
        <p className="small text-muted">
          ▶︎ plays in your current pattern · tap a shape to change it
        </p>
      )}

      {bridges && bridges.length === 0 && (
        <p className="text-muted">No bridges found for those chords.</p>
      )}
      {bridges?.map((b, i) => (
        <BridgeCard key={i} bridge={b} />
      ))}
    </div>
  );
}

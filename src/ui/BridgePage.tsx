/** Bridge page — type two chords, get ranked connecting sequences (SOT §11/theory). */

import React, { useState } from "react";
import { generateBridges, type Bridge } from "../chord/bridge";
import { easiest } from "../chord/difficulty";
import { ChordDiagram } from "./ChordDiagram";
import { strumSequence } from "./audio";

function voicingsOf(sequence: string[]): (number[] | null)[] {
  return sequence.map((s) => easiest(s)?.frets ?? null);
}

function BridgeCard({ bridge }: { bridge: Bridge }) {
  const shapes = voicingsOf(bridge.sequence);
  const playable = shapes.filter((f): f is number[] => f !== null);

  return (
    <div className="card mb-2">
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-bold small">{bridge.name}</span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => strumSequence(playable)}
          >
            ▶︎
          </button>
        </div>
        <div className="d-flex align-items-end gap-1 overflow-auto">
          {bridge.sequence.map((sym, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted mb-4">→</span>}
              <div className="text-center" style={{ flex: "0 0 auto" }}>
                <div className="small fw-semibold">{sym}</div>
                {shapes[i] ? (
                  <ChordDiagram frets={shapes[i]!} size={0.8} showNotes={false} />
                ) : (
                  <div className="text-muted small py-3">—</div>
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
      <form onSubmit={handleGenerate} className="mb-3">
        <div className="input-group">
          <span className="input-group-text">from</span>
          <input
            className="form-control"
            placeholder="D"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="input-group-text">to</span>
          <input
            className="form-control"
            placeholder="G"
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

      {bridges && bridges.length === 0 && (
        <p className="text-muted">No bridges found for those chords.</p>
      )}
      {bridges?.map((b, i) => (
        <BridgeCard key={i} bridge={b} />
      ))}
    </div>
  );
}

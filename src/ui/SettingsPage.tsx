/** Settings page — choose pattern, tempo, and once/loop mode (SOT §11). */

import React from "react";
import { usePlayer } from "./PlayerContext";
import { PRESETS, type Stroke } from "../chord/patterns";
import { MIN_BPM, MAX_BPM } from "./settings";

const SAMPLE = [-1, -1, 0, 2, 3, 2]; // open D, for previewing a pattern

function PatternPreview({ steps }: { steps: Stroke[] }) {
  const cells: string[] = [];
  for (let i = 0; i < steps.length; i += 4) {
    cells.push(steps.slice(i, i + 4).join("").replaceAll(".", "·"));
  }
  return <code className="d-block small text-body-secondary">|{cells.join("|")}|</code>;
}

export function SettingsPage() {
  const { settings, setSettings, play, stop, isPlaying } = usePlayer();

  return (
    <div>
      <h2 className="h6 text-muted">Pattern</h2>
      <div className="list-group mb-3">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className={`list-group-item list-group-item-action ${settings.patternName === p.name ? "active" : ""}`}
            onClick={() => setSettings({ ...settings, patternName: p.name })}
          >
            <div className="fw-bold">{p.name}</div>
            <PatternPreview steps={p.steps} />
          </button>
        ))}
      </div>
      <p className="small text-muted">
        T = thumb (bass) · F = fingers (treble) · A = all · X = mute · · = rest
      </p>

      <h2 className="h6 text-muted">Tempo: {settings.bpm} BPM</h2>
      <input
        type="range"
        className="form-range mb-3"
        min={MIN_BPM}
        max={MAX_BPM}
        value={settings.bpm}
        onChange={(e) => setSettings({ ...settings, bpm: Number(e.target.value) })}
      />

      <h2 className="h6 text-muted">Mode</h2>
      <div className="btn-group w-100 mb-3">
        <button
          type="button"
          className={`btn ${!settings.loop ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setSettings({ ...settings, loop: false })}
        >
          Play once
        </button>
        <button
          type="button"
          className={`btn ${settings.loop ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setSettings({ ...settings, loop: true })}
        >
          Loop
        </button>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary flex-fill" onClick={() => play(SAMPLE)}>
          ▶︎ Preview (D)
        </button>
        {isPlaying && (
          <button className="btn btn-danger flex-fill" onClick={stop}>
            ■ Stop
          </button>
        )}
      </div>
    </div>
  );
}

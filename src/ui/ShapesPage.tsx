/**
 * Shapes page — every voicing of one chord, easiest first (SOT §3 Layer 1).
 *
 * Distinct from reharmonization "variations": this is all the *ways to play the same
 * chord* (open, barre, up-the-neck), ranked by the difficulty comparator.
 */

import React, { useState } from "react";
import { topK } from "../chord/difficulty";
import { lowestFrettedFret } from "../chord/voicing";
import { ChordCard } from "./ChordCard";
import { usePlayer } from "./PlayerContext";

const MAX_SHAPES = 20;
const MAX_MIN_FRET = 12;

interface ShapesPageProps {
  symbol: string;
  onBack: () => void;
  onSave: (symbol: string, frets: number[]) => void;
}

export function ShapesPage({ symbol, onBack, onSave }: ShapesPageProps) {
  const { play, settings } = usePlayer();
  const [minFret, setMinFret] = useState(1);
  const clamp = (n: number) => Math.min(MAX_MIN_FRET, Math.max(1, n));

  // Rank the full set, then apply the neck-position filter, then cap the display —
  // so a high min-fret still surfaces up-the-neck shapes outside the easiest 20.
  let pool;
  try {
    pool = topK(symbol, Infinity, undefined, { hideOpen: settings.hideOpen });
  } catch {
    pool = [];
  }
  // Filter to shapes positioned at or above the chosen fret (open strings exempt).
  const shapes = pool
    .filter((v) => lowestFrettedFret(v.frets) >= minFret)
    .slice(0, MAX_SHAPES);

  return (
    <div>
      <button className="btn btn-link px-0 mb-1" onClick={onBack}>
        ← Back
      </button>
      <h2 className="h5 mb-2">
        {symbol} shapes <small className="text-muted">· easiest first</small>
      </h2>

      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="small text-muted">Min fret</span>
        <div className="btn-group btn-group-sm" role="group" aria-label="minimum fret">
          <button
            className="btn btn-outline-secondary"
            disabled={minFret <= 1}
            onClick={() => setMinFret((n) => clamp(n - 1))}
          >
            −
          </button>
          <span className="btn btn-outline-secondary disabled" style={{ minWidth: "3.5rem" }}>
            {minFret === 1 ? "any" : `${minFret}fr`}
          </span>
          <button
            className="btn btn-outline-secondary"
            disabled={minFret >= MAX_MIN_FRET}
            onClick={() => setMinFret((n) => clamp(n + 1))}
          >
            ＋
          </button>
        </div>
      </div>

      {shapes.length === 0 ? (
        <p className="text-muted">
          No shapes for {symbol}
          {minFret > 1 ? ` at fret ${minFret} or higher.` : "."}
        </p>
      ) : (
        <div className="row row-cols-2 row-cols-sm-3 g-2">
          {shapes.map((v, i) => (
            <div className="col" key={i}>
              <ChordCard symbol={symbol} frets={v.frets}>
                <button
                  className="btn btn-sm btn-outline-secondary flex-fill"
                  onClick={() => play(v.frets)}
                >
                  ▶︎
                </button>
                <button
                  className="btn btn-sm btn-outline-success flex-fill"
                  onClick={() => onSave(symbol, v.frets)}
                >
                  ＋
                </button>
              </ChordCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

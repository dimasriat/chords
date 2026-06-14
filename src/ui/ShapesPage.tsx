/**
 * Shapes page — every voicing of one chord, easiest first (SOT §3 Layer 1).
 *
 * Distinct from reharmonization "variations": this is all the *ways to play the same
 * chord* (open, barre, up-the-neck), ranked by the difficulty comparator.
 */

import React from "react";
import { topK } from "../chord/difficulty";
import { ChordCard } from "./ChordCard";
import { usePlayer } from "./PlayerContext";

const MAX_SHAPES = 20;

interface ShapesPageProps {
  symbol: string;
  onBack: () => void;
  onSave: (symbol: string, frets: number[]) => void;
}

export function ShapesPage({ symbol, onBack, onSave }: ShapesPageProps) {
  const { play } = usePlayer();

  let shapes;
  try {
    shapes = topK(symbol, MAX_SHAPES);
  } catch {
    shapes = [];
  }

  return (
    <div>
      <button className="btn btn-link px-0 mb-1" onClick={onBack}>
        ← Back
      </button>
      <h2 className="h5 mb-3">
        {symbol} shapes <small className="text-muted">· easiest first</small>
      </h2>

      {shapes.length === 0 ? (
        <p className="text-muted">No shapes found for {symbol}.</p>
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

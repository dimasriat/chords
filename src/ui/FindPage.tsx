/** Find page: type a chord → reharmonized variations, each saveable to the library. */

import React, { useState } from "react";
import { generateVariations } from "../chord/variations";
import { easiest } from "../chord/difficulty";
import { ChordCard } from "./ChordCard";
import { usePlayer } from "./PlayerContext";

interface VariationView {
  symbol: string;
  frets: number[] | null;
}

interface FindPageProps {
  onSave: (symbol: string, frets: number[]) => void;
  onShowShapes: (symbol: string) => void;
}

export function FindPage({ onSave, onShowShapes }: FindPageProps) {
  const { play, settings } = usePlayer();
  const [input, setInput] = useState("");
  const [variations, setVariations] = useState<VariationView[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const symbol = input.trim();
    if (!symbol) return;
    try {
      setVariations(
        generateVariations(symbol).map((s) => {
          const v = easiest(s, undefined, { hideOpen: settings.hideOpen });
          return { symbol: s, frets: v ? v.frets : null };
        }),
      );
    } catch {
      setVariations([]);
      setError("Couldn't read that chord. Try e.g. C, Bm, Dmaj7, F#m7b5.");
    }
  }

  return (
    <>
      <form onSubmit={handleGenerate} className="input-group mb-2">
        <input
          className="form-control"
          placeholder="Type a chord, e.g. Bm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button className="btn btn-primary" type="submit">
          Show
        </button>
      </form>

      {error && <div className="alert alert-warning py-2">{error}</div>}

      {variations.length > 0 && (
        <div className="row row-cols-2 row-cols-sm-3 g-2">
          {variations.map((v) => (
            <div className="col" key={v.symbol}>
              <ChordCard symbol={v.symbol} frets={v.frets}>
                <button
                  className="btn btn-sm btn-outline-secondary flex-fill"
                  onClick={() => v.frets && play(v.frets)}
                >
                  ▶︎
                </button>
                <button
                  className="btn btn-sm btn-outline-success flex-fill"
                  onClick={() => v.frets && onSave(v.symbol, v.frets)}
                >
                  ＋
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary flex-fill"
                  title="All shapes of this chord"
                  onClick={() => onShowShapes(v.symbol)}
                >
                  🔄
                </button>
              </ChordCard>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Add-chord flow — SOT §3 (Layer 2).
 *
 * Type a chord → see its reharmonized variations, each with the diagram of its
 * easiest shape and a play button → save the ones you like to your library →
 * manage the saved library. Phone-first Bootstrap layout.
 */

import React, { useEffect, useState } from "react";
import { generateVariations } from "../chord/variations";
import { easiest } from "../chord/difficulty";
import { ChordDiagram } from "./ChordDiagram";
import { playVoicing } from "./audio";
import { fetchLibrary, saveChord, removeChord, type LibraryEntry } from "./api";

interface VariationView {
  symbol: string;
  frets: number[] | null;
}

export function App() {
  const [input, setInput] = useState("");
  const [variations, setVariations] = useState<VariationView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);

  useEffect(() => {
    fetchLibrary().then(setLibrary).catch(() => setError("Couldn't load your library."));
  }, []);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const symbol = input.trim();
    if (!symbol) return;
    try {
      const views = generateVariations(symbol).map((s) => {
        const v = easiest(s);
        return { symbol: s, frets: v ? v.frets : null };
      });
      setVariations(views);
    } catch {
      setVariations([]);
      setError("Couldn't read that chord. Try e.g. C, Bm, Dmaj7, F#m7b5.");
    }
  }

  async function handleSave(symbol: string, frets: number[]) {
    try {
      const entry = await saveChord(symbol, frets);
      setLibrary((lib) => [entry, ...lib]);
    } catch {
      setError("Couldn't save that chord.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await removeChord(id);
      setLibrary((lib) => lib.filter((e) => e.id !== id));
    } catch {
      setError("Couldn't delete that chord.");
    }
  }

  return (
    <div className="container py-3" style={{ maxWidth: 560 }}>
      <h1 className="h4 mb-3">🎸 chords</h1>

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
        <section className="mb-4">
          <h2 className="h6 text-muted">Variations</h2>
          <div className="row row-cols-2 row-cols-sm-3 g-2">
            {variations.map((v) => (
              <div className="col" key={v.symbol}>
                <div className="card h-100 text-center">
                  <div className="card-body p-2">
                    <div className="fw-bold mb-1">{v.symbol}</div>
                    {v.frets ? (
                      <>
                        <ChordDiagram frets={v.frets} />
                        <div className="d-flex gap-1 mt-2">
                          <button
                            className="btn btn-sm btn-outline-secondary flex-fill"
                            onClick={() => playVoicing(v.frets!)}
                          >
                            ▶︎
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success flex-fill"
                            onClick={() => handleSave(v.symbol, v.frets!)}
                          >
                            ＋
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted small py-3">no easy shape</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="h6 text-muted">My library ({library.length})</h2>
        {library.length === 0 ? (
          <p className="text-muted small">No saved chords yet.</p>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 g-2">
            {library.map((e) => (
              <div className="col" key={e.id}>
                <div className="card h-100 text-center">
                  <div className="card-body p-2">
                    <div className="fw-bold mb-1">{e.symbol}</div>
                    <ChordDiagram frets={e.voicing} />
                    <div className="d-flex gap-1 mt-2">
                      <button
                        className="btn btn-sm btn-outline-secondary flex-fill"
                        onClick={() => playVoicing(e.voicing)}
                      >
                        ▶︎
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger flex-fill"
                        onClick={() => handleDelete(e.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

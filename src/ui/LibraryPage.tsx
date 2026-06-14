/** My Library page: the saved chords, with play and delete. */

import React from "react";
import { ChordCard } from "./ChordCard";
import { playVoicing } from "./audio";
import type { LibraryEntry } from "./api";

interface LibraryPageProps {
  library: LibraryEntry[];
  onDelete: (id: number) => void;
}

export function LibraryPage({ library, onDelete }: LibraryPageProps) {
  if (library.length === 0) {
    return <p className="text-muted">No saved chords yet — add some from Find or Chord Finder.</p>;
  }
  return (
    <div className="row row-cols-2 row-cols-sm-3 g-2">
      {library.map((e) => (
        <div className="col" key={e.id}>
          <ChordCard symbol={e.symbol} frets={e.voicing}>
            <button
              className="btn btn-sm btn-outline-secondary flex-fill"
              onClick={() => playVoicing(e.voicing)}
            >
              ▶︎
            </button>
            <button
              className="btn btn-sm btn-outline-danger flex-fill"
              onClick={() => onDelete(e.id)}
            >
              🗑
            </button>
          </ChordCard>
        </div>
      ))}
    </div>
  );
}

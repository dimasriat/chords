/**
 * Reusable chord card: symbol, diagram, the notes actually sounding, and an action
 * row (passed as children). Larger padding so up-neck position labels aren't cropped.
 */

import React from "react";
import { ChordDiagram } from "./ChordDiagram";
import { resolveNoteNames } from "../chord/noteResolver";

interface ChordCardProps {
  symbol: string;
  frets: number[] | null;
  children?: React.ReactNode;
}

export function ChordCard({ symbol, frets, children }: ChordCardProps) {
  return (
    <div className="card h-100 text-center">
      <div className="card-body p-3">
        <div className="fw-bold mb-1">{symbol}</div>
        {frets ? (
          <>
            <ChordDiagram frets={frets} />
            <div className="small text-muted mt-1">{resolveNoteNames(frets).join(" ")}</div>
            {children && <div className="d-flex gap-1 mt-2">{children}</div>}
          </>
        ) : (
          <div className="text-muted small py-3">no easy shape</div>
        )}
      </div>
    </div>
  );
}

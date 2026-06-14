/**
 * Chord diagram (SVG) — SOT §7 visualization.
 *
 * Renders a vertical guitar chord chart from a voicing's fret array: string/fret
 * grid, finger dots (with numbers), O/X markers for open/muted strings, and a
 * fret-position label for shapes played up the neck. Pure presentation; the
 * fret/finger data comes from the engine.
 */

import React from "react";
import { computeFingering } from "../chord/fingering";
import { OPEN_MIDI } from "../chord/voicing";
import { semitoneToNote } from "../chord/notes";

const MUTED = -1;
const STRINGS = 6;
const FRET_ROWS = 5;

interface ChordDiagramProps {
  frets: number[];
  fingers?: number[];
  size?: number;
  /** Show each string's sounding note, aligned under its string line. */
  showNotes?: boolean;
}

export function ChordDiagram({ frets, fingers, size = 1, showNotes = true }: ChordDiagramProps) {
  const fingering = fingers ?? computeFingering(frets);

  const fretted = frets.filter((f) => f > 0);
  const maxF = fretted.length ? Math.max(...fretted) : 0;
  const minF = fretted.length ? Math.min(...fretted) : 0;
  // Show from the nut when the shape fits in the first 5 frets, else slide up.
  const startFret = maxF <= FRET_ROWS ? 1 : minF;
  const showNut = startFret === 1;

  // Geometry (in SVG user units, scaled by `size` via viewBox/width).
  const sx = 22; // string spacing
  const fy = 26; // fret spacing
  const left = 40; // wide enough that the "Nfr" position label isn't cropped
  const top = 34;
  const gridW = sx * (STRINGS - 1);
  const gridH = fy * FRET_ROWS;
  const width = left * 2 + gridW;
  const height = top + gridH + (showNotes ? 30 : 14);
  const noteY = top + gridH + 16;

  const stringX = (s: number) => left + s * sx;
  const fretY = (row: number) => top + row * fy;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width * size, height: "auto", display: "block", margin: "0 auto" }}
      role="img"
      aria-label="chord diagram"
    >
      {/* Nut (thick) or top fret line */}
      <line
        x1={left}
        y1={top}
        x2={left + gridW}
        y2={top}
        stroke="#222"
        strokeWidth={showNut ? 5 : 1.5}
      />
      {/* Fret lines */}
      {Array.from({ length: FRET_ROWS }, (_, r) => (
        <line
          key={`f${r}`}
          x1={left}
          y1={fretY(r + 1)}
          x2={left + gridW}
          y2={fretY(r + 1)}
          stroke="#888"
          strokeWidth={1}
        />
      ))}
      {/* Strings */}
      {Array.from({ length: STRINGS }, (_, s) => (
        <line
          key={`s${s}`}
          x1={stringX(s)}
          y1={top}
          x2={stringX(s)}
          y2={top + gridH}
          stroke="#888"
          strokeWidth={1}
        />
      ))}
      {/* Position label when sliding up the neck */}
      {!showNut && (
        <text x={left - 12} y={fretY(0) + fy * 0.7} fontSize={12} textAnchor="end" fill="#555">
          {startFret}fr
        </text>
      )}
      {/* Per-string markers and dots */}
      {frets.map((f, s) => {
        const x = stringX(s);
        if (f === MUTED) {
          return (
            <text key={`m${s}`} x={x} y={top - 10} fontSize={14} textAnchor="middle" fill="#b00">
              ✕
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle key={`o${s}`} cx={x} cy={top - 14} r={5} fill="none" stroke="#222" strokeWidth={1.5} />
          );
        }
        const row = f - startFret; // 0-based row within the window
        const cy = fretY(row) + fy / 2;
        return (
          <g key={`d${s}`}>
            <circle cx={x} cy={cy} r={8} fill="#222" />
            {fingering[s]! > 0 && (
              <text x={x} y={cy + 4} fontSize={11} textAnchor="middle" fill="#fff">
                {fingering[s]}
              </text>
            )}
          </g>
        );
      })}
      {/* Sounding note under each string, aligned to the string line */}
      {showNotes &&
        frets.map((f, s) =>
          f === MUTED ? null : (
            <text key={`n${s}`} x={stringX(s)} y={noteY} fontSize={11} textAnchor="middle" fill="#0d6efd">
              {semitoneToNote((OPEN_MIDI[s]! + f) % 12)}
            </text>
          ),
        )}
    </svg>
  );
}

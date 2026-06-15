/**
 * Interactive fretboard — tap to build a voicing.
 *
 * Tap a fret cell to place/remove a finger on that string; tap the marker above a
 * string to toggle it open/muted. Shows a 5-fret window starting at `startFret`
 * (default 1 = from the nut) so shapes up the neck can be built. Emits the full
 * (absolute) fret array on every change so the parent can name the chord.
 */

import React from "react";

const STRINGS = 6;
const FRET_ROWS = 5;
const MUTED = -1;
const LABELS = ["E", "A", "D", "G", "B", "e"];

interface Props {
  frets: number[];
  onChange: (frets: number[]) => void;
  /** Lowest fret shown in the window (1 = from the nut). */
  startFret?: number;
}

export function InteractiveFretboard({ frets, onChange, startFret = 1 }: Props) {
  const showNut = startFret === 1;
  const sx = 34;
  const fy = 38;
  const left = 46;
  const top = 50;
  const gridW = sx * (STRINGS - 1);
  const gridH = fy * FRET_ROWS;
  const width = left * 2 + gridW;
  const height = top + gridH + 22;

  const stringX = (s: number) => left + s * sx;
  const fretY = (row: number) => top + row * fy;

  const set = (s: number, value: number) => {
    const next = [...frets];
    next[s] = value;
    onChange(next);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, touchAction: "manipulation" }}
      role="application"
      aria-label="interactive fretboard"
    >
      {/* Nut (thick) or top fret line when sliding up the neck */}
      <line x1={left} y1={top} x2={left + gridW} y2={top} stroke="#222" strokeWidth={showNut ? 5 : 1.5} />
      {/* Position label when the window starts above the nut */}
      {!showNut && (
        <text x={left - 12} y={top + fy * 0.7} fontSize={13} textAnchor="end" fill="#555">
          {startFret}fr
        </text>
      )}
      {/* Fret lines */}
      {Array.from({ length: FRET_ROWS }, (_, r) => (
        <line key={`f${r}`} x1={left} y1={fretY(r + 1)} x2={left + gridW} y2={fretY(r + 1)} stroke="#888" />
      ))}
      {/* Strings */}
      {Array.from({ length: STRINGS }, (_, s) => (
        <line key={`s${s}`} x1={stringX(s)} y1={top} x2={stringX(s)} y2={top + gridH} stroke="#888" />
      ))}

      {/* Clickable fret cells */}
      {Array.from({ length: STRINGS }, (_, s) =>
        Array.from({ length: FRET_ROWS }, (_, r) => {
          const f = startFret + r;
          return (
            <rect
              key={`c${s}-${f}`}
              x={stringX(s) - sx / 2}
              y={fretY(r)}
              width={sx}
              height={fy}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => set(s, frets[s] === f ? 0 : f)}
            />
          );
        }),
      )}

      {/* Finger dots (only those within the visible window) */}
      {frets.map((f, s) =>
        f >= startFret && f < startFret + FRET_ROWS ? (
          <circle
            key={`d${s}`}
            cx={stringX(s)}
            cy={fretY(f - startFret) + fy / 2}
            r={11}
            fill="#0d6efd"
            style={{ pointerEvents: "none" }}
          />
        ) : null,
      )}

      {/* Top markers: tap to toggle open/muted */}
      {frets.map((f, s) => (
        <g key={`m${s}`} style={{ cursor: "pointer" }} onClick={() => set(s, f === MUTED ? 0 : MUTED)}>
          <rect x={stringX(s) - sx / 2} y={top - 30} width={sx} height={26} fill="transparent" />
          {f === MUTED ? (
            <text x={stringX(s)} y={top - 10} fontSize={16} textAnchor="middle" fill="#b00">
              ✕
            </text>
          ) : f === 0 ? (
            <circle cx={stringX(s)} cy={top - 16} r={6} fill="none" stroke="#222" strokeWidth={1.5} />
          ) : null}
        </g>
      ))}

      {/* String labels */}
      {LABELS.map((label, s) => (
        <text key={`l${s}`} x={stringX(s)} y={top + gridH + 16} fontSize={12} textAnchor="middle" fill="#666">
          {label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Fretting-hand finger assignment — a heuristic hint for the chord diagram.
 *
 * Pure logic (lives here, not in the component, per project rules). Not a perfect
 * solver: it assigns plausible finger numbers (1–4) so the diagram can label dots.
 * A barre (more fretted notes than fingers) shares finger 1 across the lowest fret.
 */

const MUTED = -1;
/** More fretted notes than fingers ⇒ a barre is required. */
const BARRE_THRESHOLD = 4;

export function computeFingering(frets: number[]): number[] {
  const fingers = new Array(frets.length).fill(0);
  const fretted = frets
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f > MUTED && f > 0);

  if (fretted.length === 0) return fingers;

  const minFret = Math.min(...fretted.map(({ f }) => f));
  const countAtMin = fretted.filter(({ f }) => f === minFret).length;
  // A barre = the index finger laid across the lowest fret, which only works (and is
  // only worth it) when that fret holds ≥2 strings.
  const isBarre = fretted.length > BARRE_THRESHOLD && countAtMin >= 2;

  if (isBarre) {
    // Lowest fret → barre with finger 1. Every note above the barre needs its own
    // finger (2, 3, 4) — two notes on the same higher fret are still two fingers.
    for (const { f, i } of fretted) {
      if (f === minFret) fingers[i] = 1;
    }
    const above = fretted
      .filter(({ f }) => f > minFret)
      .sort((a, b) => a.f - b.f || a.i - b.i);
    above.forEach(({ i }, idx) => {
      fingers[i] = Math.min(idx + 2, 4);
    });
  } else {
    // Assign ascending by fret, then string; cap at finger 4.
    const ordered = [...fretted].sort((a, b) => a.f - b.f || a.i - b.i);
    ordered.forEach(({ i }, idx) => {
      fingers[i] = Math.min(idx + 1, 4);
    });
  }

  return fingers;
}

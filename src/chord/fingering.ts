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
  const isBarre = fretted.length > BARRE_THRESHOLD;

  if (isBarre) {
    // Lowest fret → barre with finger 1; remaining distinct frets → 2, 3, 4.
    for (const { f, i } of fretted) {
      if (f === minFret) fingers[i] = 1;
    }
    const higher = [...new Set(fretted.filter(({ f }) => f > minFret).map(({ f }) => f))].sort(
      (a, b) => a - b,
    );
    const fretToFinger = new Map<number, number>();
    higher.forEach((fr, idx) => fretToFinger.set(fr, Math.min(idx + 2, 4)));
    for (const { f, i } of fretted) {
      if (f > minFret) fingers[i] = fretToFinger.get(f)!;
    }
  } else {
    // Assign ascending by fret, then string; cap at finger 4.
    const ordered = [...fretted].sort((a, b) => a.f - b.f || a.i - b.i);
    ordered.forEach(({ i }, idx) => {
      fingers[i] = Math.min(idx + 1, 4);
    });
  }

  return fingers;
}

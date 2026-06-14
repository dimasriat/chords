/**
 * Difficulty comparator + top-K — SOT §7.
 *
 * Scores a voicing's playing difficulty as `weights · features` (easiest = lowest
 * score) and exposes it as a comparator so voicings can be sorted and the easiest
 * surfaced. Weights are the hand-tuned defaults for now; Phase 1.5 swaps in learned
 * weights via the exact same shape — so this module never needs reworking.
 */

import { generateVoicings, type Voicing, type VoicingFeatures } from "./voicing";
import type { ParsedChord } from "./parser";

export interface DifficultyWeights {
  barre: number;
  fingers: number;
  fretSpan: number;
  innerMutes: number;
  position: number;
}

/**
 * SOT §7 starting weights. Cost is driven by effective fingers (a barre is one
 * finger), with only a moderate barre surcharge — so a compact barre (≤3 notes after
 * the barre, ≤2-fret span) lands in "easy-medium": open D ≈ 4.6, barre-Bm/F ≈ 8.6.
 */
export const DEFAULT_WEIGHTS: DifficultyWeights = {
  barre: 2,
  fingers: 1,
  fretSpan: 1,
  innerMutes: 1, // muting a middle string is light effort
  position: 0.2,
};

export function score(features: VoicingFeatures, weights: DifficultyWeights = DEFAULT_WEIGHTS): number {
  return (
    weights.barre * (features.hasBarre ? 1 : 0) +
    weights.fingers * features.fingers +
    weights.fretSpan * features.fretSpan +
    weights.innerMutes * features.innerMutes +
    weights.position * features.position
  );
}

/** Comparator: negative when `a` is easier than `b`. */
export function compare(a: Voicing, b: Voicing, weights: DifficultyWeights = DEFAULT_WEIGHTS): number {
  return score(a.features, weights) - score(b.features, weights);
}

/** The k easiest valid voicings for a chord, easiest first. */
export function topK(
  input: string | ParsedChord,
  k: number,
  weights: DifficultyWeights = DEFAULT_WEIGHTS,
): Voicing[] {
  return generateVoicings(input)
    .sort((a, b) => compare(a, b, weights))
    .slice(0, k);
}

/** The single easiest valid voicing, or undefined if none exist. */
export function easiest(input: string | ParsedChord, weights: DifficultyWeights = DEFAULT_WEIGHTS): Voicing | undefined {
  return topK(input, 1, weights)[0];
}

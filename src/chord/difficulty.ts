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
  frettedCount: number;
  fretSpan: number;
  innerMutes: number;
  position: number;
}

/** SOT §7 starting weights: open D ≈ 4.6, F barre ≈ 13.6. */
export const DEFAULT_WEIGHTS: DifficultyWeights = {
  barre: 5,
  frettedCount: 1,
  fretSpan: 1,
  innerMutes: 2,
  position: 0.2,
};

export function score(features: VoicingFeatures, weights: DifficultyWeights = DEFAULT_WEIGHTS): number {
  return (
    weights.barre * (features.hasBarre ? 1 : 0) +
    weights.frettedCount * features.frettedCount +
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

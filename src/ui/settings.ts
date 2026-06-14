/** Global playback settings (SOT §11), persisted in localStorage. */

export interface Settings {
  patternName: string;
  bpm: number;
  loop: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  patternName: "Strum",
  bpm: 100,
  loop: false,
};

export const MIN_BPM = 40;
export const MAX_BPM = 200;

const KEY = "chords.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore (private mode, etc.)
  }
}

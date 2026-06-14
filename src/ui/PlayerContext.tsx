/** React context exposing global playback settings + the pattern player. */

import React, { createContext, useContext, useEffect, useState } from "react";
import { player } from "./player";
import { loadSettings, saveSettings, type Settings } from "./settings";

interface PlayerContextValue {
  settings: Settings;
  setSettings: (s: Settings) => void;
  play: (frets: number[]) => void;
  stop: () => void;
  isPlaying: boolean;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => player.onState(setIsPlaying), []);

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  };

  const value: PlayerContextValue = {
    settings,
    setSettings,
    play: (frets) => player.play(frets, settings),
    stop: () => player.stop(),
    isPlaying,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

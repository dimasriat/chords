/**
 * App shell — navbar + three pages (Find / My Library / Chord Finder) sharing the
 * library state. SOT §3 (Layer 2).
 */

import React, { useEffect, useState } from "react";
import { Navbar, type Tab } from "./Navbar";
import { FindPage } from "./FindPage";
import { LibraryPage } from "./LibraryPage";
import { FinderPage } from "./FinderPage";
import { SettingsPage } from "./SettingsPage";
import { ShapesPage } from "./ShapesPage";
import { usePlayer } from "./PlayerContext";
import { fetchLibrary, saveChord, removeChord, type LibraryEntry } from "./api";

export function App() {
  const [tab, setTab] = useState<Tab>("find");
  const [shapesFor, setShapesFor] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isPlaying, stop, settings } = usePlayer();

  function goToTab(t: Tab) {
    setShapesFor(null);
    setTab(t);
  }

  useEffect(() => {
    fetchLibrary().then(setLibrary).catch(() => setError("Couldn't load your library."));
  }, []);

  async function handleSave(symbol: string, frets: number[]) {
    try {
      const entry = await saveChord(symbol, frets);
      setLibrary((lib) => [entry, ...lib]);
    } catch {
      setError("Couldn't save that chord.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await removeChord(id);
      setLibrary((lib) => lib.filter((e) => e.id !== id));
    } catch {
      setError("Couldn't delete that chord.");
    }
  }

  return (
    <>
      <Navbar tab={tab} setTab={goToTab} />
      <div className="container py-3" style={{ maxWidth: 560 }}>
        {error && <div className="alert alert-warning py-2">{error}</div>}
        {shapesFor ? (
          <ShapesPage symbol={shapesFor} onBack={() => setShapesFor(null)} onSave={handleSave} />
        ) : (
          <>
            {tab === "find" && <FindPage onSave={handleSave} onShowShapes={setShapesFor} />}
            {tab === "library" && (
              <LibraryPage library={library} onDelete={handleDelete} onShowShapes={setShapesFor} />
            )}
            {tab === "finder" && <FinderPage onSave={handleSave} />}
            {tab === "settings" && <SettingsPage />}
          </>
        )}
      </div>

      {isPlaying && settings.loop && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-3" style={{ zIndex: 1050 }}>
          <button className="btn btn-danger rounded-pill shadow px-4" onClick={stop}>
            ■ Stop
          </button>
        </div>
      )}
    </>
  );
}

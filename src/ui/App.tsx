/**
 * App shell — navbar + three pages (Find / My Library / Chord Finder) sharing the
 * library state. SOT §3 (Layer 2).
 */

import React, { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { pathToRoute, routeToPath, type Route, type Tab } from "./routing";
import { FindPage } from "./FindPage";
import { LibraryPage } from "./LibraryPage";
import { FinderPage } from "./FinderPage";
import { BridgePage } from "./BridgePage";
import { SettingsPage } from "./SettingsPage";
import { ShapesPage } from "./ShapesPage";
import { usePlayer } from "./PlayerContext";
import { fetchLibrary, saveChord, removeChord, type LibraryEntry } from "./api";

export function App() {
  const [route, setRoute] = useState<Route>(() => pathToRoute(window.location.pathname));
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isPlaying, stop, settings } = usePlayer();
  const { tab, shapesFor } = route;

  // Push a new route to the URL (History API) and re-render.
  function navigate(next: Route) {
    if (window.location.pathname !== routeToPath(next)) {
      window.history.pushState(null, "", routeToPath(next));
    }
    setRoute(next);
  }

  const goToTab = (t: Tab) => navigate({ tab: t, shapesFor: null });
  const showShapes = (symbol: string) => navigate({ tab, shapesFor: symbol });

  // Reflect browser back/forward into state.
  useEffect(() => {
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
          <ShapesPage
            symbol={shapesFor}
            onBack={() => goToTab(tab)}
            onSave={handleSave}
          />
        ) : (
          <>
            {tab === "find" && <FindPage onSave={handleSave} onShowShapes={showShapes} />}
            {tab === "library" && (
              <LibraryPage library={library} onDelete={handleDelete} onShowShapes={showShapes} />
            )}
            {tab === "finder" && <FinderPage onSave={handleSave} />}
            {tab === "bridge" && <BridgePage />}
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

/** Bootstrap navbar switching between the app's pages. */

import React from "react";

export type Tab = "find" | "library" | "finder" | "bridge" | "settings";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "find", label: "Find" },
  { id: "library", label: "Library" },
  { id: "finder", label: "Finder" },
  { id: "bridge", label: "Bridge" },
  { id: "settings", label: "⚙" },
];

export function Navbar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="navbar navbar-expand bg-dark border-bottom border-body" data-bs-theme="dark">
      <div className="container-fluid" style={{ maxWidth: 560 }}>
        <span className="navbar-brand mb-0 h1">🎸 chords</span>
        <ul className="navbar-nav">
          {TABS.map((t) => (
            <li className="nav-item" key={t.id}>
              <button
                className={`nav-link btn btn-link ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

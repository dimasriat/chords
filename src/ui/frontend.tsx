import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PlayerProvider } from "./PlayerContext";

const container = document.getElementById("root");
if (!container) throw new Error("missing #root");
createRoot(container).render(
  <PlayerProvider>
    <App />
  </PlayerProvider>,
);

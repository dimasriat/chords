/**
 * Client-side routing — pure path ↔ route mapping (no React/DOM/window here, so it's
 * unit-testable per project rules). App wires these into the History API; the server
 * serves index.html for these paths so deep links and reloads work.
 */

export type Tab = "find" | "library" | "finder" | "bridge" | "settings";

export interface Route {
  tab: Tab;
  /** A chord symbol when viewing its shapes page, else null. */
  shapesFor: string | null;
}

const SHAPES_PREFIX = "/shapes/";

const TAB_TO_PATH: Record<Tab, string> = {
  find: "/find",
  library: "/library",
  finder: "/finder",
  bridge: "/bridge",
  settings: "/settings",
};

const PATH_TO_TAB: Record<string, Tab> = {
  "/": "find",
  "/find": "find",
  "/library": "library",
  "/finder": "finder",
  "/bridge": "bridge",
  "/settings": "settings",
};

/** Map a URL pathname to the route it represents (unknown paths fall back to Find). */
export function pathToRoute(pathname: string): Route {
  // Normalise a trailing slash (except for the root "/").
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (p.startsWith(SHAPES_PREFIX)) {
    const encoded = p.slice(SHAPES_PREFIX.length);
    if (encoded) {
      return { tab: "find", shapesFor: safeDecode(encoded) };
    }
  }

  return { tab: PATH_TO_TAB[p] ?? "find", shapesFor: null };
}

/** Map a route to its canonical URL pathname. */
export function routeToPath(route: Route): string {
  if (route.shapesFor) {
    return `${SHAPES_PREFIX}${encodeURIComponent(route.shapesFor)}`;
  }
  return TAB_TO_PATH[route.tab];
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

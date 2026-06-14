/**
 * Library API client — talks to the Bun.serve /api/library endpoints.
 * Type-only import of LibraryEntry (erased at build, so no server code is bundled).
 */

import type { LibraryEntry } from "../library/store";

export type { LibraryEntry };

export async function fetchLibrary(): Promise<LibraryEntry[]> {
  const res = await fetch("/api/library");
  if (!res.ok) throw new Error(`fetchLibrary failed: ${res.status}`);
  return res.json();
}

export async function saveChord(symbol: string, voicing: number[]): Promise<LibraryEntry> {
  const res = await fetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, voicing }),
  });
  if (!res.ok) throw new Error(`saveChord failed: ${res.status}`);
  return res.json();
}

export async function removeChord(id: number): Promise<void> {
  const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`removeChord failed: ${res.status}`);
}

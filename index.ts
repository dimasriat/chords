/**
 * chords — Bun.serve app server (SOT §7).
 *
 * Serves the phone-first UI and the library CRUD API. The deployed sqlite DB lives
 * at data/chords.db (override via CHORDS_DB_PATH); tests never touch it.
 */

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import index from "./src/ui/index.html";
import { initLibrary, addEntry, listEntries, deleteEntry } from "./src/library/store";
import { parseChord } from "./src/chord/parser";

const DB_PATH = process.env.CHORDS_DB_PATH ?? "data/chords.db";
mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
initLibrary(db);

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  routes: {
    "/": index,

    "/api/library": {
      GET: () => Response.json(listEntries(db)),
      POST: async (req) => {
        let body: unknown;
        try {
          body = await req.json();
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const { symbol, voicing } = (body ?? {}) as { symbol?: unknown; voicing?: unknown };
        if (typeof symbol !== "string" || !Array.isArray(voicing)) {
          return new Response("expected { symbol: string, voicing: number[] }", { status: 400 });
        }
        try {
          parseChord(symbol);
        } catch {
          return new Response("unparseable chord", { status: 400 });
        }
        return Response.json(addEntry(db, symbol, voicing as number[]));
      },
    },

    "/api/library/:id": {
      DELETE: (req) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return new Response("bad id", { status: 400 });
        deleteEntry(db, id);
        return new Response(null, { status: 204 });
      },
    },
  },
  development: { hmr: true, console: true },
});

console.log(`chords listening on ${server.url}`);

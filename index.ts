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
  hostname: process.env.BIND_HOST ?? "127.0.0.1",
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
  // Dev features (HMR + the dev JSX runtime) only outside production; in production
  // this keeps Bun on the stable `react/jsx-runtime` and avoids jsxDEV errors.
  development: process.env.NODE_ENV !== "production" ? { hmr: true, console: true } : false,
});

console.log(`chords listening on ${server.url}`);

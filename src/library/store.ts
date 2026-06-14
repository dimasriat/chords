/**
 * Chord library persistence — SOT §8 (Layer 2).
 *
 * A single-user store of saved chords (symbol + chosen voicing) backed by
 * bun:sqlite. The data layer is pure DB I/O so it can be unit-tested with an
 * in-memory database.
 */

import { Database } from "bun:sqlite";

export interface LibraryEntry {
  id: number;
  symbol: string;
  /** Chosen voicing fret array (length 6, -1 muted, 0 open). */
  voicing: number[];
  createdAt: string;
}

interface Row {
  id: number;
  symbol: string;
  voicing: string;
  created_at: string;
}

export function initLibrary(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      voicing TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
    )
  `);
}

function toEntry(row: Row): LibraryEntry {
  return {
    id: row.id,
    symbol: row.symbol,
    voicing: JSON.parse(row.voicing),
    createdAt: row.created_at,
  };
}

export function addEntry(db: Database, symbol: string, voicing: number[]): LibraryEntry {
  const row = db
    .query<Row, [string, string]>(
      "INSERT INTO library (symbol, voicing) VALUES (?, ?) RETURNING *",
    )
    .get(symbol, JSON.stringify(voicing));
  return toEntry(row!);
}

export function listEntries(db: Database): LibraryEntry[] {
  const rows = db.query<Row, []>("SELECT * FROM library ORDER BY id DESC").all();
  return rows.map(toEntry);
}

export function deleteEntry(db: Database, id: number): void {
  db.query<unknown, [number]>("DELETE FROM library WHERE id = ?").run(id);
}

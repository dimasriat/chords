import { test, expect, describe, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { initLibrary, addEntry, listEntries, deleteEntry, type LibraryEntry } from "./store";

let db: Database;
beforeEach(() => {
  db = new Database(":memory:");
  initLibrary(db);
});

describe("library store", () => {
  test("adds an entry and returns it with an id", () => {
    const e = addEntry(db, "Bm9", [-1, 2, 0, 2, 2, -1]);
    expect(e.id).toBeGreaterThan(0);
    expect(e.symbol).toBe("Bm9");
    expect(e.voicing).toEqual([-1, 2, 0, 2, 2, -1]);
    expect(typeof e.createdAt).toBe("string");
  });

  test("lists entries, newest first", () => {
    addEntry(db, "C", [-1, 3, 2, 0, 1, 0]);
    addEntry(db, "G", [3, 2, 0, 0, 0, 3]);
    const all = listEntries(db);
    expect(all.map((e) => e.symbol)).toEqual(["G", "C"]);
    expect(all[0]!.voicing).toEqual([3, 2, 0, 0, 0, 3]);
  });

  test("deletes an entry", () => {
    const a = addEntry(db, "C", [-1, 3, 2, 0, 1, 0]);
    const b = addEntry(db, "D", [-1, -1, 0, 2, 3, 2]);
    deleteEntry(db, a.id);
    const remaining = listEntries(db);
    expect(remaining.map((e) => e.symbol)).toEqual(["D"]);
  });

  test("round-trips voicing arrays faithfully (JSON)", () => {
    const frets = [-1, -1, 0, 2, 3, 2];
    const e = addEntry(db, "D", frets);
    const fetched = listEntries(db).find((x) => x.id === e.id)!;
    expect(fetched.voicing).toEqual(frets);
  });
});

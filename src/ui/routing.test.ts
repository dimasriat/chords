import { test, expect, describe } from "bun:test";
import { pathToRoute, routeToPath, type Tab } from "./routing";

describe("pathToRoute", () => {
  test("root maps to Find", () => {
    expect(pathToRoute("/")).toEqual({ tab: "find", shapesFor: null });
  });

  test("known tab paths", () => {
    expect(pathToRoute("/find")).toEqual({ tab: "find", shapesFor: null });
    expect(pathToRoute("/library")).toEqual({ tab: "library", shapesFor: null });
    expect(pathToRoute("/finder")).toEqual({ tab: "finder", shapesFor: null });
    expect(pathToRoute("/bridge")).toEqual({ tab: "bridge", shapesFor: null });
    expect(pathToRoute("/settings")).toEqual({ tab: "settings", shapesFor: null });
  });

  test("trailing slash is ignored", () => {
    expect(pathToRoute("/library/")).toEqual({ tab: "library", shapesFor: null });
  });

  test("unknown path falls back to Find", () => {
    expect(pathToRoute("/nope")).toEqual({ tab: "find", shapesFor: null });
  });

  test("shapes path decodes the symbol (incl. slash and sharp)", () => {
    expect(pathToRoute("/shapes/Am9").shapesFor).toBe("Am9");
    expect(pathToRoute("/shapes/C%2FE").shapesFor).toBe("C/E");
    expect(pathToRoute("/shapes/F%23m7").shapesFor).toBe("F#m7");
  });

  test("empty shapes symbol falls back to Find", () => {
    expect(pathToRoute("/shapes/")).toEqual({ tab: "find", shapesFor: null });
  });
});

describe("routeToPath", () => {
  test("tab routes", () => {
    expect(routeToPath({ tab: "library", shapesFor: null })).toBe("/library");
    expect(routeToPath({ tab: "find", shapesFor: null })).toBe("/find");
  });

  test("shapes route encodes the symbol", () => {
    expect(routeToPath({ tab: "find", shapesFor: "Am9" })).toBe("/shapes/Am9");
    expect(routeToPath({ tab: "find", shapesFor: "C/E" })).toBe("/shapes/C%2FE");
    expect(routeToPath({ tab: "find", shapesFor: "F#m7" })).toBe("/shapes/F%23m7");
  });
});

describe("round-trip", () => {
  test("every tab survives path → route → path", () => {
    const tabs: Tab[] = ["find", "library", "finder", "bridge", "settings"];
    for (const tab of tabs) {
      const path = routeToPath({ tab, shapesFor: null });
      expect(pathToRoute(path)).toEqual({ tab, shapesFor: null });
    }
  });

  test("shapes symbols survive route → path → route", () => {
    for (const sym of ["Am9", "C/E", "F#m7", "Bbmaj7"]) {
      const route = { tab: "find" as Tab, shapesFor: sym };
      expect(pathToRoute(routeToPath(route))).toEqual(route);
    }
  });
});

import { describe, it, expect } from "vitest";
import { makeGrid } from "../raster/grid";
import { rasterize } from "../raster/rasterize";
import { hd, hd95, asd, assd, surfaceDice } from "./boundary";

const policy = { emptyDice: "one", emptyDistance: "undefined" } as const;

describe("boundary metrics", () => {
  it("HD95 <= HD and both > 0 for offset boxes", () => {
    const g = makeGrid(50, 50, [1, 1]);
    const a = rasterize(g, [{ kind: "box", x: 10, y: 10, w: 20, h: 20 }]);
    const b = rasterize(g, [{ kind: "box", x: 12, y: 10, w: 20, h: 20 }]);
    expect(hd95(g, a, b, policy)).toBeLessThanOrEqual(hd(g, a, b, policy));
    expect(hd(g, a, b, policy)).toBeGreaterThan(0);
  });
  it("identical masks have zero surface distance and surfaceDice 1", () => {
    const g = makeGrid(30, 30, [1, 1]);
    const a = rasterize(g, [{ kind: "circle", cx: 15, cy: 15, r: 8 }]);
    expect(assd(g, a, a, policy)).toBeCloseTo(0, 5);
    expect(asd(g, a, a, policy)).toBeCloseTo(0, 5);
    expect(surfaceDice(g, a, a, 1, policy)).toBeCloseTo(1);
  });
  it("distances scale with mm spacing", () => {
    const g1 = makeGrid(50, 50, [1, 1]);
    const g2 = makeGrid(50, 50, [2, 2]);
    const a = rasterize(g1, [{ kind: "box", x: 10, y: 10, w: 20, h: 20 }]);
    const b = rasterize(g1, [{ kind: "box", x: 15, y: 10, w: 20, h: 20 }]);
    expect(hd(g2, a, b, policy)).toBeCloseTo(2 * hd(g1, a, b, policy), 4);
  });
  it("NSD tolerance is monotonic non-decreasing", () => {
    const g = makeGrid(50, 50, [1, 1]);
    const a = rasterize(g, [{ kind: "box", x: 10, y: 10, w: 20, h: 20 }]);
    const b = rasterize(g, [{ kind: "box", x: 13, y: 11, w: 20, h: 20 }]);
    expect(surfaceDice(g, a, b, 5, policy)).toBeGreaterThanOrEqual(surfaceDice(g, a, b, 2, policy));
  });
  it("empty mask uses policy (NaN for 'undefined')", () => {
    const g = makeGrid(20, 20, [1, 1]);
    const a = rasterize(g, [{ kind: "box", x: 5, y: 5, w: 4, h: 4 }]);
    const empty = new Uint8Array(400);
    expect(Number.isNaN(hd(g, a, empty, policy))).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { makeGrid } from "../raster/grid";
import { rasterize } from "../raster/rasterize";
import { areaMm2, absoluteVolumeDiffMm2, relativeVolumeDiff } from "./volume";
describe("volume", () => {
  it("area in mm^2 uses spacing", () => {
    const g = makeGrid(10, 10, [2, 3]);
    const m = rasterize(g, [{ kind: "box", x: 0, y: 0, w: 2, h: 2 }]);
    expect(areaMm2(g, m)).toBeCloseTo(24);
  });
  it("absolute and relative volume difference", () => {
    const g = makeGrid(20, 20, [1, 1]);
    const gt = rasterize(g, [{ kind: "box", x: 0, y: 0, w: 4, h: 4 }]);
    const pred = rasterize(g, [{ kind: "box", x: 0, y: 0, w: 4, h: 5 }]);
    expect(absoluteVolumeDiffMm2(g, gt, pred)).toBeCloseTo(4);
    expect(relativeVolumeDiff(g, gt, pred)).toBeCloseTo(4 / 16);
  });
  it("relative diff is NaN when gt empty", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const empty = new Uint8Array(100);
    const pred = rasterize(g, [{ kind: "box", x: 0, y: 0, w: 2, h: 2 }]);
    expect(Number.isNaN(relativeVolumeDiff(g, empty, pred))).toBe(true);
  });
});

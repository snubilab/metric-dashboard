import { describe, it, expect } from "vitest";
import { makeGrid } from "../raster/grid";
import { rasterize } from "../raster/rasterize";
import { connectedComponents, lesionWise } from "./lesionwise";

describe("lesionwise", () => {
  it("finds two separated components", () => {
    const g = makeGrid(40, 20, [1, 1]);
    const m = rasterize(g, [
      { kind: "box", x: 2, y: 2, w: 5, h: 5 },
      { kind: "box", x: 30, y: 2, w: 5, h: 5 },
    ]);
    expect(connectedComponents(g, m).length).toBe(2);
  });

  it("voxel dice high but lesion sensitivity low when small lesion missed (iou)", () => {
    const g = makeGrid(60, 60, [1, 1]);
    const gt = rasterize(g, [
      { kind: "circle", cx: 20, cy: 30, r: 14 },
      { kind: "circle", cx: 50, cy: 50, r: 2 },
    ]);
    const pred = rasterize(g, [{ kind: "circle", cx: 20, cy: 30, r: 14 }]);
    const r = lesionWise(g, gt, pred, { criterion: "iou", threshold: 0.1 });
    expect(r.lesionSensitivity).toBeCloseTo(0.5);
    expect(r.voxelDice).toBeGreaterThan(0.9);
    // The single matched lesion is segmented near-perfectly, but the missed
    // small lesion contributes a Dice=0 FN, so lesion-wise Dice is penalized to
    // roughly half of the matched lesion's Dice.
    const matchedDice = r.voxelDice;
    expect(r.lesionWiseDice).toBeLessThan(matchedDice - 0.1);
    expect(r.lesionWiseDice).toBeGreaterThan(0.4);
    expect(r.lesionWiseDice).toBeLessThan(0.6);
  });

  it("two diagonally-adjacent blobs are one component under 8-connectivity", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const m = rasterize(g, [
      { kind: "box", x: 1, y: 1, w: 1, h: 1 },
      { kind: "box", x: 2, y: 2, w: 1, h: 1 },
    ]);
    expect(connectedComponents(g, m).length).toBe(1);
  });

  it("disjoint lesions do not match at iou threshold 0", () => {
    const g = makeGrid(40, 20, [1, 1]);
    const gt = rasterize(g, [{ kind: "box", x: 2, y: 2, w: 3, h: 3 }]);
    const pred = rasterize(g, [{ kind: "box", x: 30, y: 2, w: 3, h: 3 }]);
    const r = lesionWise(g, gt, pred, { criterion: "iou", threshold: 0 });
    expect(r.tpLesions).toBe(0);
    expect(r.fnLesions).toBe(1);
    expect(r.fpLesions).toBe(1);
    expect(r.lesionSensitivity).toBe(0);
  });

  it("centroid criterion matches both shifted lesions", () => {
    const g = makeGrid(60, 60, [1, 1]);
    const gt = rasterize(g, [
      { kind: "circle", cx: 15, cy: 15, r: 5 },
      { kind: "circle", cx: 45, cy: 45, r: 5 },
    ]);
    const pred = rasterize(g, [
      { kind: "circle", cx: 16, cy: 15, r: 5 },
      { kind: "circle", cx: 45, cy: 46, r: 5 },
    ]);
    const r = lesionWise(g, gt, pred, { criterion: "centroid", threshold: 5 });
    expect(r.lesionSensitivity).toBeCloseTo(1);
    expect(r.tpLesions).toBe(2);
  });
});

import { describe, it, expect } from "vitest";
import { makeGrid } from "../raster/grid";
import { edt } from "./edt";

describe("edt", () => {
  it("distance from a single foreground pixel grows euclidean", () => {
    const g = makeGrid(5, 1, [1, 1]);
    const mask = new Uint8Array([0, 0, 1, 0, 0]); // seed at x=2
    const d = edt(g, mask); // distance (mm) to nearest foreground
    expect(d[2]).toBeCloseTo(0);
    expect(d[0]).toBeCloseTo(2);
    expect(d[4]).toBeCloseTo(2);
  });
  it("respects anisotropic spacing", () => {
    const g = makeGrid(1, 3, [1, 10]); // rows are 10mm apart
    const mask = new Uint8Array([1, 0, 0]);
    const d = edt(g, mask);
    expect(d[1]).toBeCloseTo(10);
    expect(d[2]).toBeCloseTo(20);
  });
  it("2D euclidean: diagonal neighbor", () => {
    const g = makeGrid(3, 3, [1, 1]);
    const mask = new Uint8Array(9);
    mask[0] = 1; // foreground at (0,0)
    const d = edt(g, mask);
    expect(d[3 * 2 + 2]).toBeCloseTo(Math.sqrt(8)); // (2,2) -> sqrt(2^2+2^2)
  });
  it("all-background mask is +Infinity everywhere (no NaN)", () => {
    const g = makeGrid(4, 4, [1, 1]);
    const d = edt(g, new Uint8Array(16));
    expect(d.every((v) => v === Infinity)).toBe(true);
    expect(d.some((v) => Number.isNaN(v))).toBe(false);
  });
});

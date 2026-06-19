import { describe, it, expect } from "vitest";
import { makeGrid, index, diagonalMm } from "./grid";

describe("grid", () => {
  it("computes flat index", () => {
    const g = makeGrid(4, 3, [1, 1]);
    expect(index(g, 2, 1)).toBe(6); // y*width + x
  });
  it("computes physical diagonal in mm", () => {
    const g = makeGrid(3, 4, [2, 2]); // 6mm x 8mm
    expect(diagonalMm(g)).toBeCloseTo(10, 5);
  });
});

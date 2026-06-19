import { describe, it, expect } from "vitest";
import { makeGrid } from "./grid";
import { rasterize } from "./rasterize";

describe("rasterize", () => {
  it("box fills exactly its pixel rectangle", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const m = rasterize(g, [{ kind: "box", x: 2, y: 2, w: 3, h: 4 }]);
    expect(m.reduce((a, b) => a + b, 0)).toBe(12);
    expect(m[2 * 10 + 2]).toBe(1);
    expect(m[0]).toBe(0);
  });
  it("circle pixel count approximates area", () => {
    const g = makeGrid(40, 40, [1, 1]);
    const m = rasterize(g, [{ kind: "circle", cx: 20, cy: 20, r: 10 }]);
    const count = m.reduce((a, b) => a + b, 0);
    expect(count).toBeGreaterThan(280); // ~pi*100=314
    expect(count).toBeLessThan(340);
  });
  it("union of overlapping shapes does not double-count", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const m = rasterize(g, [
      { kind: "box", x: 0, y: 0, w: 5, h: 5 },
      { kind: "box", x: 3, y: 0, w: 5, h: 5 },
    ]);
    expect(m.every((v) => v === 0 || v === 1)).toBe(true);
  });
});

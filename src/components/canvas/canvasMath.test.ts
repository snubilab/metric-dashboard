import { describe, it, expect } from "vitest";
import {
  screenToGrid,
  hitTestShape,
  moveShape,
  addCircle,
  addBox,
  pathToPolygon,
} from "./canvasMath";
import { makeGrid } from "../../engine/raster/grid";
import type { Shape, Vec2 } from "../../types/engine";

const rect = { left: 0, top: 0, width: 100, height: 100 } as DOMRect;

describe("screenToGrid", () => {
  it("maps the top-left corner to grid origin", () => {
    const g = makeGrid(10, 10, [1, 1]);
    expect(screenToGrid(0, 0, rect, g)).toEqual({ x: 0, y: 0 });
  });

  it("maps the center of the canvas to the center grid cell", () => {
    const g = makeGrid(10, 10, [1, 1]);
    // 50px of 100px wide canvas -> 0.5 of 10 cells -> floor(5) = 5
    expect(screenToGrid(50, 50, rect, g)).toEqual({ x: 5, y: 5 });
  });

  it("scales independently per axis when grid is non-square", () => {
    const g = makeGrid(20, 5, [1, 1]);
    // x: 50/100 * 20 = 10 ; y: 50/100 * 5 = 2.5 -> floor 2
    expect(screenToGrid(50, 50, rect, g)).toEqual({ x: 10, y: 2 });
  });

  it("accounts for a non-zero rect offset", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const offset = { left: 20, top: 30, width: 100, height: 100 } as DOMRect;
    // (40-20)/100 * 10 = 2 ; (60-30)/100 * 10 = 3
    expect(screenToGrid(40, 60, offset, g)).toEqual({ x: 2, y: 3 });
  });

  it("clamps coordinates beyond the canvas edges into the grid", () => {
    const g = makeGrid(10, 10, [1, 1]);
    expect(screenToGrid(-50, -50, rect, g)).toEqual({ x: 0, y: 0 });
    expect(screenToGrid(200, 200, rect, g)).toEqual({ x: 9, y: 9 });
  });
});

describe("hitTestShape — circle", () => {
  const circle: Shape = { kind: "circle", cx: 5, cy: 5, r: 3 };

  it("hits a cell at the center", () => {
    expect(hitTestShape(circle, 5, 5)).toBe(true);
  });

  it("misses a cell outside the radius", () => {
    expect(hitTestShape(circle, 9, 9)).toBe(false);
  });
});

describe("hitTestShape — box", () => {
  const box: Shape = { kind: "box", x: 2, y: 2, w: 4, h: 4 };

  it("hits a cell inside the box", () => {
    expect(hitTestShape(box, 3, 3)).toBe(true);
  });

  it("misses a cell to the left of the box", () => {
    expect(hitTestShape(box, 0, 3)).toBe(false);
  });

  it("misses a cell on the far (exclusive) edge", () => {
    expect(hitTestShape(box, 6, 3)).toBe(false);
  });
});

describe("hitTestShape — polygon", () => {
  const triangle: Shape = {
    kind: "polygon",
    points: [
      [0, 0],
      [8, 0],
      [0, 8],
    ],
  };

  it("hits a cell inside the triangle", () => {
    expect(hitTestShape(triangle, 1, 1)).toBe(true);
  });

  it("misses a cell beyond the hypotenuse", () => {
    expect(hitTestShape(triangle, 7, 7)).toBe(false);
  });
});

describe("moveShape", () => {
  it("translates a circle center", () => {
    const moved = moveShape({ kind: "circle", cx: 5, cy: 5, r: 2 }, 3, -1);
    expect(moved).toEqual({ kind: "circle", cx: 8, cy: 4, r: 2 });
  });

  it("translates a box origin", () => {
    const moved = moveShape({ kind: "box", x: 1, y: 1, w: 4, h: 4 }, 2, 5);
    expect(moved).toEqual({ kind: "box", x: 3, y: 6, w: 4, h: 4 });
  });

  it("translates every polygon point", () => {
    const moved = moveShape(
      { kind: "polygon", points: [[0, 0], [2, 0], [0, 2]] },
      1,
      1,
    );
    expect(moved).toEqual({
      kind: "polygon",
      points: [[1, 1], [3, 1], [1, 3]],
    });
  });

  it("does not mutate the original shape", () => {
    const original: Shape = { kind: "circle", cx: 5, cy: 5, r: 2 };
    moveShape(original, 3, 3);
    expect(original).toEqual({ kind: "circle", cx: 5, cy: 5, r: 2 });
  });
});

describe("shape factories", () => {
  it("addCircle builds a circle shape", () => {
    expect(addCircle(4, 6, 2)).toEqual({
      kind: "circle",
      cx: 4,
      cy: 6,
      r: 2,
    });
  });

  it("addBox builds a box shape", () => {
    expect(addBox(1, 2, 3, 4)).toEqual({
      kind: "box",
      x: 1,
      y: 2,
      w: 3,
      h: 4,
    });
  });
});

describe("pathToPolygon", () => {
  it("builds a polygon shape from a square-ish path of >= 3 points", () => {
    const path: Vec2[] = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];
    expect(pathToPolygon(path)).toEqual({ kind: "polygon", points: path });
  });

  it("returns null for a 2-point path (below default minPoints)", () => {
    const path: Vec2[] = [
      [0, 0],
      [4, 0],
    ];
    expect(pathToPolygon(path)).toBeNull();
  });

  it("returns null for an empty path", () => {
    expect(pathToPolygon([])).toBeNull();
  });

  it("honors a custom minPoints threshold", () => {
    const path: Vec2[] = [
      [0, 0],
      [4, 0],
      [4, 4],
    ];
    expect(pathToPolygon(path, { minPoints: 4 })).toBeNull();
  });

  it("downsamples consecutive duplicate points before counting", () => {
    const path: Vec2[] = [
      [0, 0],
      [0, 0],
      [4, 0],
      [4, 0],
      [4, 4],
      [4, 4],
    ];
    expect(pathToPolygon(path)).toEqual({
      kind: "polygon",
      points: [
        [0, 0],
        [4, 0],
        [4, 4],
      ],
    });
  });

  it("drops the path when too few points survive de-duplication", () => {
    const path: Vec2[] = [
      [2, 2],
      [2, 2],
      [2, 2],
    ];
    expect(pathToPolygon(path)).toBeNull();
  });

  it("simplifies points within simplifyEps as near-duplicates", () => {
    const path: Vec2[] = [
      [0, 0],
      [0.4, 0.3],
      [4, 0],
      [4, 4],
    ];
    expect(pathToPolygon(path, { simplifyEps: 1 })).toEqual({
      kind: "polygon",
      points: [
        [0, 0],
        [4, 0],
        [4, 4],
      ],
    });
  });

  it("does not mutate the input path", () => {
    const path: Vec2[] = [
      [0, 0],
      [4, 0],
      [4, 4],
    ];
    const snapshot = JSON.parse(JSON.stringify(path));
    pathToPolygon(path);
    expect(path).toEqual(snapshot);
  });
});

import { describe, it, expect } from "vitest";
import {
  screenToGrid,
  hitTestShape,
  moveShape,
  addCircle,
  addBox,
  pathToPolygon,
  resizeCircle,
  resizeBoxCorner,
  scalePolygon,
  handlePositions,
  hitTestHandle,
  normalizeBox,
  rectFromDrag,
  circleFromDrag,
  isBelowMinSize,
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

describe("resizeCircle", () => {
  const circle = { kind: "circle", cx: 5, cy: 5, r: 3 } as const;

  it("sets the radius to the new value", () => {
    expect(resizeCircle(circle, 7)).toEqual({
      kind: "circle",
      cx: 5,
      cy: 5,
      r: 7,
    });
  });

  it("clamps the radius to a minimum of 1", () => {
    expect(resizeCircle(circle, 0).r).toBe(1);
    expect(resizeCircle(circle, -4).r).toBe(1);
  });

  it("does not mutate the original circle", () => {
    resizeCircle(circle, 99);
    expect(circle.r).toBe(3);
  });
});

describe("resizeBoxCorner", () => {
  const box = { kind: "box", x: 2, y: 2, w: 6, h: 6 } as const;

  it("resizes by dragging the bottom-right corner outward", () => {
    expect(resizeBoxCorner(box, "br", 10, 12)).toEqual({
      kind: "box",
      x: 2,
      y: 2,
      w: 8,
      h: 10,
    });
  });

  it("resizes by dragging the top-left corner, keeping bottom-right anchored", () => {
    // Anchor (right, bottom) = (8, 8); new tl = (4, 5).
    expect(resizeBoxCorner(box, "tl", 4, 5)).toEqual({
      kind: "box",
      x: 4,
      y: 5,
      w: 4,
      h: 3,
    });
  });

  it("normalizes a corner dragged past the opposite corner (no inversion)", () => {
    // Drag bottom-right far past the anchored top-left (2, 2).
    const result = resizeBoxCorner(box, "br", -3, -1);
    expect(result.w).toBeGreaterThanOrEqual(0);
    expect(result.h).toBeGreaterThanOrEqual(0);
    expect(result).toEqual({ kind: "box", x: -3, y: -1, w: 5, h: 3 });
  });

  it("does not mutate the original box", () => {
    resizeBoxCorner(box, "br", 20, 20);
    expect(box).toEqual({ kind: "box", x: 2, y: 2, w: 6, h: 6 });
  });
});

describe("scalePolygon", () => {
  // Square centered at (5, 5) with half-extent 5.
  const square: Extract<Shape, { kind: "polygon" }> = {
    kind: "polygon",
    points: [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
  };

  it("scales about the centroid by a factor > 1", () => {
    const scaled = scalePolygon(square, 2);
    expect(scaled.points).toEqual([
      [-5, -5],
      [15, -5],
      [15, 15],
      [-5, 15],
    ]);
  });

  it("keeps the centroid fixed when scaling", () => {
    const scaled = scalePolygon(square, 0.5);
    const cx = scaled.points.reduce((s, [px]) => s + px, 0) / 4;
    const cy = scaled.points.reduce((s, [, py]) => s + py, 0) / 4;
    expect(cx).toBeCloseTo(5);
    expect(cy).toBeCloseTo(5);
  });

  it("does not mutate the original polygon", () => {
    scalePolygon(square, 3);
    expect(square.points[0]).toEqual([0, 0]);
  });
});

describe("handlePositions", () => {
  it("returns a single handle on a circle's right edge", () => {
    const handles = handlePositions({ kind: "circle", cx: 5, cy: 5, r: 3 });
    expect(handles).toHaveLength(1);
    expect(handles[0]).toEqual([8, 5]);
  });

  it("returns four corner handles for a box", () => {
    const handles = handlePositions({ kind: "box", x: 2, y: 2, w: 4, h: 6 });
    expect(handles).toHaveLength(4);
    expect(handles).toEqual([
      [2, 2],
      [6, 2],
      [2, 8],
      [6, 8],
    ]);
  });

  it("returns four bounding-box corners for a polygon", () => {
    const handles = handlePositions({
      kind: "polygon",
      points: [
        [1, 1],
        [5, 0],
        [3, 7],
      ],
    });
    expect(handles).toHaveLength(4);
    expect(handles).toEqual([
      [1, 0],
      [5, 0],
      [1, 7],
      [5, 7],
    ]);
  });
});

describe("hitTestHandle", () => {
  const box = { kind: "box", x: 2, y: 2, w: 4, h: 4 } as const;

  it("returns the index of a handle within the pick radius", () => {
    // Bottom-right handle is at (6, 6).
    expect(hitTestHandle(box, 6.4, 6.2, 1)).toBe(3);
  });

  it("returns null when no handle is within the pick radius", () => {
    expect(hitTestHandle(box, 4, 4, 1)).toBeNull();
  });

  it("hits a circle's lone right-edge handle", () => {
    const circle = { kind: "circle", cx: 5, cy: 5, r: 3 } as const;
    expect(hitTestHandle(circle, 8, 5, 0.5)).toBe(0);
  });
});

describe("normalizeBox", () => {
  it("returns the drag as-is for a bottom-right drag (ax<bx, ay<by)", () => {
    // Arrange / Act
    const result = normalizeBox(2, 3, 12, 9);
    // Assert
    expect(result).toEqual({ x: 2, y: 3, w: 10, h: 6 });
  });

  it("flips a top-left drag (ax>bx, ay>by) to positive w/h with x=bx, y=by", () => {
    const result = normalizeBox(12, 9, 2, 3);
    expect(result).toEqual({ x: 2, y: 3, w: 10, h: 6 });
  });

  it("normalizes a top-right drag (ax<bx, ay>by) to positive w/h, x=min, y=min", () => {
    const result = normalizeBox(2, 9, 12, 3);
    expect(result).toEqual({ x: 2, y: 3, w: 10, h: 6 });
  });

  it("normalizes a bottom-left drag (ax>bx, ay<by) to positive w/h, x=min, y=min", () => {
    const result = normalizeBox(12, 3, 2, 9);
    expect(result).toEqual({ x: 2, y: 3, w: 10, h: 6 });
  });
});

describe("rectFromDrag", () => {
  it("returns a box matching the normalized drag bbox", () => {
    const result = rectFromDrag(2, 3, 12, 9);
    expect(result).toEqual({ kind: "box", x: 2, y: 3, w: 10, h: 6 });
  });

  it("is direction-agnostic (reversed drag yields the same box)", () => {
    expect(rectFromDrag(12, 9, 2, 3)).toEqual(rectFromDrag(2, 3, 12, 9));
  });

  it("does not mutate its scalar inputs (frozen-input safe)", () => {
    const ax = 2,
      ay = 3,
      bx = 12,
      by = 9;
    rectFromDrag(ax, ay, bx, by);
    expect([ax, ay, bx, by]).toEqual([2, 3, 12, 9]);
  });
});

describe("circleFromDrag", () => {
  it("inscribes a circle in a square drag 0,0->10,10 (cx:5,cy:5,r:5)", () => {
    expect(circleFromDrag(0, 0, 10, 10)).toEqual({
      kind: "circle",
      cx: 5,
      cy: 5,
      r: 5,
    });
  });

  it("inscribes an HONEST circle in a non-square drag 0,0->10,4 (r=min/2=2)", () => {
    // r = min(10, 4) / 2 = 2 ; a true circle, never an ellipse.
    expect(circleFromDrag(0, 0, 10, 4)).toEqual({
      kind: "circle",
      cx: 5,
      cy: 2,
      r: 2,
    });
  });

  it("yields an identical circle for a reversed-direction drag 10,10->0,0", () => {
    expect(circleFromDrag(10, 10, 0, 0)).toEqual(circleFromDrag(0, 0, 10, 10));
  });

  it("yields r=0 for a zero-area tap 5,5->5,5 (min-size guard rejects later)", () => {
    expect(circleFromDrag(5, 5, 5, 5)).toEqual({
      kind: "circle",
      cx: 5,
      cy: 5,
      r: 0,
    });
  });

  it("does not mutate its scalar inputs (frozen-input safe)", () => {
    const ax = 0,
      ay = 0,
      bx = 10,
      by = 4;
    circleFromDrag(ax, ay, bx, by);
    expect([ax, ay, bx, by]).toEqual([0, 0, 10, 4]);
  });
});

describe("isBelowMinSize", () => {
  const MIN = 5;

  it("returns false when both w and h are >= minGrid (commit)", () => {
    expect(isBelowMinSize(0, 0, 8, 6, MIN)).toBe(false);
  });

  it("returns true when w < minGrid (discard)", () => {
    expect(isBelowMinSize(0, 0, 3, 8, MIN)).toBe(true);
  });

  it("returns true when h < minGrid (discard)", () => {
    expect(isBelowMinSize(0, 0, 8, 3, MIN)).toBe(true);
  });

  it("returns false at exactly minGrid on both axes (boundary, equal is NOT below)", () => {
    expect(isBelowMinSize(0, 0, MIN, MIN, MIN)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { placeTagBadges, boundsOfShapes } from "./sceneDraw";
import type { Shape } from "../../types/engine";

const CHIP_H = 16;
const GAP = 3;

describe("boundsOfShapes", () => {
  it("returns null for no shapes", () => {
    expect(boundsOfShapes([])).toBeNull();
  });

  it("bounds a circle by its center ± radius", () => {
    const c: Shape = { kind: "circle", cx: 100, cy: 128, r: 40 };
    expect(boundsOfShapes([c])).toEqual({ minX: 60, minY: 88, maxX: 140, maxY: 168 });
  });

  it("unions across circle + box + polygon (so fit covers the whole scene)", () => {
    const shapes: Shape[] = [
      { kind: "circle", cx: 100, cy: 100, r: 10 }, // 90..110
      { kind: "box", x: 200, y: 50, w: 20, h: 20 }, // x 200..220, y 50..70
      { kind: "polygon", points: [[10, 240], [40, 250]] }, // x 10..40, y 240..250
    ];
    expect(boundsOfShapes(shapes)).toEqual({ minX: 10, minY: 50, maxX: 220, maxY: 250 });
  });
});

describe("placeTagBadges", () => {
  it("returns non-overlapping vertical bands for three coincident requests", () => {
    // Arrange: three chips all wanting the same (cx, yBottom).
    const requests = [
      { cx: 100, yBottom: 200, halfW: 12 },
      { cx: 100, yBottom: 200, halfW: 12 },
      { cx: 100, yBottom: 200, halfW: 12 },
    ];

    // Act
    const placed = placeTagBadges(requests, CHIP_H, GAP);

    // Assert: adjacent bands (sorted top-to-bottom) are at least chipH + gap apart.
    const desc = placed.map((p) => p.yBottom).sort((a, b) => b - a);
    for (let i = 1; i < desc.length; i++) {
      expect(desc[i - 1] - desc[i]).toBeGreaterThanOrEqual(CHIP_H + GAP);
    }
  });

  it("preserves input order in the returned array", () => {
    const requests = [
      { cx: 100, yBottom: 200, halfW: 12 },
      { cx: 100, yBottom: 200, halfW: 12 },
    ];
    const placed = placeTagBadges(requests, CHIP_H, GAP);
    expect(placed).toHaveLength(2);
    expect(placed[0].cx).toBe(100);
    expect(placed[1].cx).toBe(100);
  });

  it("keeps a far-apart request at its original position", () => {
    // Arrange: one chip near the bottom, one far above and to the side.
    const requests = [
      { cx: 100, yBottom: 200, halfW: 12 },
      { cx: 10, yBottom: 50, halfW: 12 },
    ];

    // Act
    const placed = placeTagBadges(requests, CHIP_H, GAP);

    // Assert: the far-apart (second) request is untouched.
    expect(placed[1].yBottom).toBe(50);
    expect(placed[0].yBottom).toBe(200);
  });

  it("clamps so no chip rises above y = chipH", () => {
    // Arrange: many coincident chips would push the top one above the canvas.
    const requests = Array.from({ length: 5 }, () => ({
      cx: 100,
      yBottom: CHIP_H + 2,
      halfW: 12,
    }));

    // Act
    const placed = placeTagBadges(requests, CHIP_H, GAP);

    // Assert: every chip's bottom stays at or below the clamp floor (chipH + 1),
    // i.e. nothing goes above y = chipH.
    for (const p of placed) {
      expect(p.yBottom).toBeGreaterThanOrEqual(CHIP_H + 1);
    }
  });
});

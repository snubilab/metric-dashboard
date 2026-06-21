import { describe, it, expect, vi } from "vitest";
import { drawDetectionScene, roleColorVar } from "./detectionDraw";
import type { Classification } from "../../engine/metrics/detClassify";
import { makeGrid } from "../../engine/raster/grid";
import type { DetBox } from "../../types/engine";

const grid = makeGrid(16, 16, [1, 1]);

/** A real canvas element (so resolveColor's getComputedStyle works under jsdom). */
function realCanvas(): HTMLElement {
  const el = document.createElement("canvas");
  el.width = 160;
  el.height = 160;
  return el;
}

/**
 * A recording 2d-context stub: it captures the y-coordinate passed to each
 * rounded-rect chip (the chip's top edge) so we can assert the de-collision pass
 * separated stacked chips, and tracks measureText/font so layout runs.
 */
function recordingCtx() {
  const moveToYs: number[] = [];
  const ctx = {
    font: "",
    textAlign: "",
    textBaseline: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn((_x: number, y: number) => {
      moveToYs.push(y);
    }),
    lineTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    fillText: vi.fn(),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, moveToYs };
}

describe("roleColorVar", () => {
  it("maps matched and tp to --c-gt", () => {
    expect(roleColorVar("matched")).toBe("--c-gt");
    expect(roleColorVar("tp")).toBe("--c-gt");
  });

  it("maps fp to --c-warn", () => {
    expect(roleColorVar("fp")).toBe("--c-warn");
  });

  it("maps fn and below to --c-text-dim", () => {
    expect(roleColorVar("fn")).toBe("--c-text-dim");
    expect(roleColorVar("below")).toBe("--c-text-dim");
  });
});

describe("drawDetectionScene", () => {
  it("does not throw when ctx is null (jsdom getContext)", () => {
    const classification: Classification = {
      predRoles: [],
      gtRoles: [],
      counts: { tp: 0, fp: 0, fn: 0 },
    };
    expect(() =>
      drawDetectionScene(null, realCanvas(), {
        grid,
        gt: [],
        preds: [],
        classification,
      }),
    ).not.toThrow();
  });

  it("clears and draws without throwing for a populated scene", () => {
    const { ctx } = recordingCtx();
    const gt: DetBox[] = [{ x: 2, y: 2, w: 4, h: 4 }];
    const preds: DetBox[] = [{ x: 2, y: 2, w: 4, h: 4, confidence: 0.9 }];
    const classification: Classification = {
      predRoles: ["tp"],
      gtRoles: ["matched"],
      counts: { tp: 1, fp: 0, fn: 0 },
    };
    expect(() =>
      drawDetectionScene(ctx, realCanvas(), { grid, gt, preds, classification }),
    ).not.toThrow();
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it("shows GT identity (never 'FN') while drawing, before any prediction", () => {
    // classification null = drawing stage. A ground-truth box must read as GT,
    // not as a false negative, until a prediction exists to miss it.
    const { ctx } = recordingCtx();
    const gt: DetBox[] = [{ x: 2, y: 2, w: 6, h: 6 }];
    drawDetectionScene(ctx, realCanvas(), {
      grid,
      gt,
      preds: [],
      classification: null,
    });
    const texts = (ctx.fillText as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0],
    );
    expect(texts).toContain("GT");
    expect(texts).not.toContain("FN");
  });

  it("de-collides stacked confidence/role chips so they don't share one band", () => {
    // Two ABOVE preds at the SAME top edge → 4 chips (TP+conf, FP+conf) all want
    // the same yBottom; the de-collision pass must push them into distinct bands.
    const { ctx, moveToYs } = recordingCtx();
    const box: DetBox = { x: 4, y: 4, w: 4, h: 4 };
    const gt: DetBox[] = [{ ...box }];
    const preds: DetBox[] = [
      { ...box, confidence: 0.9 },
      { ...box, confidence: 0.4 },
    ];
    const classification: Classification = {
      predRoles: ["tp", "fp"],
      gtRoles: ["matched"],
      counts: { tp: 1, fp: 1, fn: 0 },
    };

    drawDetectionScene(ctx, realCanvas(), { grid, gt, preds, classification });

    // roundRectPath's moveTo carries each chip's top y. Four chips at one anchor
    // must occupy at least two distinct y bands after de-collision.
    const uniqueChipYs = new Set(moveToYs.map((y) => Math.round(y)));
    expect(uniqueChipYs.size).toBeGreaterThan(1);
  });
});

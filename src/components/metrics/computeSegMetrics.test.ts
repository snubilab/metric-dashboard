import { describe, it, expect } from "vitest";
import { computeSegMetrics } from "./computeSegMetrics";
import { makeGrid } from "../../engine/raster/grid";
import type { EngineState, Shape } from "../../types/engine";

const policy = { emptyDice: "one", emptyDistance: "undefined" } as const;

function stateWith(gt: Shape[], aShapes: Shape[], bShapes: Shape[]): EngineState {
  return {
    grid: makeGrid(32, 32, [1, 1]),
    gt,
    predictions: [
      { id: "A", shapes: aShapes },
      { id: "B", shapes: bShapes },
    ],
    policy,
  };
}

describe("computeSegMetrics", () => {
  it("identical GT and prediction yields dice 1 and hd95 0", () => {
    const circle: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 8 }];
    const state = stateWith(circle, circle, []);

    const result = computeSegMetrics(state, "A");

    expect(result.dice).toBeCloseTo(1, 6);
    expect(result.iou).toBeCloseTo(1, 6);
    expect(result.sensitivity).toBeCloseTo(1, 6);
    expect(result.precision).toBeCloseTo(1, 6);
    expect(result.hd95).toBeCloseTo(0, 6);
    expect(result.assd).toBeCloseTo(0, 6);
    expect(result.nsd).toBeCloseTo(1, 6);
    expect(result.volRel).toBeCloseTo(0, 6);
  });

  it("selects the requested prediction layer", () => {
    const gt: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 8 }];
    const matching: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 8 }];
    const off: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 4 }];
    const state = stateWith(gt, matching, off);

    expect(computeSegMetrics(state, "A").dice).toBeCloseTo(1, 6);
    expect(computeSegMetrics(state, "B").dice).toBeLessThan(1);
  });

  it("uses nsdToleranceMm when provided", () => {
    const gt: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 8 }];
    const pred: Shape[] = [{ kind: "circle", cx: 16, cy: 16, r: 7 }];
    const state = { ...stateWith(gt, pred, []), nsdToleranceMm: 5 };

    const result = computeSegMetrics(state, "A");
    expect(result.nsd).toBeGreaterThan(0);
    expect(result.nsd).toBeLessThanOrEqual(1);
  });
});

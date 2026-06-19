import { describe, it, expect } from "vitest";
import type { EngineState } from "../../types/engine";
import { rasterize } from "../../engine/raster/rasterize";
import { dice } from "../../engine/metrics/overlap";
import { hd95 } from "../../engine/metrics/boundary";
import { lesionWise } from "../../engine/metrics/lesionwise";
import { segmentationScenarios } from "./scenarios";

/** Find a scenario by id or fail loudly so a missing scenario is obvious. */
function scenario(id: string): EngineState {
  const found = segmentationScenarios.find((s) => s.id === id);
  if (!found) {
    throw new Error(`scenario "${id}" not found`);
  }
  return found.state;
}

/** Rasterize GT and a single prediction layer of a scenario state. */
function masks(state: EngineState, predId: "A" | "B" = "A") {
  const gt = rasterize(state.grid, state.gt);
  const layer = state.predictions.find((p) => p.id === predId);
  const pred = rasterize(state.grid, layer ? layer.shapes : []);
  return { gt, pred };
}

describe("segmentationScenarios", () => {
  it("exposes a full clinical context for every scenario", () => {
    expect(segmentationScenarios.length).toBeGreaterThanOrEqual(8);
    for (const s of segmentationScenarios) {
      expect(s.clinical.situation.trim().length).toBeGreaterThan(0);
      expect(s.clinical.modality.trim().length).toBeGreaterThan(0);
      expect(s.clinical.atStake.trim().length).toBeGreaterThan(0);
      expect(s.clinical.consequence.trim().length).toBeGreaterThan(0);
      expect(s.teachingPoint.trim().length).toBeGreaterThan(0);
    }
  });

  it("missed brain metastasis: voxel Dice high but lesion sensitivity low", () => {
    const state = scenario("missed-met");
    const { gt, pred } = masks(state);
    const result = lesionWise(state.grid, gt, pred, {
      criterion: "iou",
      threshold: 0.1,
      policy: state.policy,
    });
    expect(result.voxelDice).toBeGreaterThan(0.85);
    expect(result.lesionSensitivity).toBeLessThan(0.6);
  });

  it("stray false-positive blob: Dice stays high while HD95 explodes", () => {
    const state = scenario("stray-fp");
    const { gt, pred } = masks(state);
    expect(dice(gt, pred, state.policy)).toBeGreaterThan(0.8);
    expect(hd95(state.grid, gt, pred, state.policy)).toBeGreaterThan(20);
  });
});

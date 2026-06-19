import { describe, it, expect } from "vitest";
import type { EngineState } from "../../types/engine";
import { rasterize } from "../../engine/raster/rasterize";
import { dice, iou, precision, sensitivity } from "../../engine/metrics/overlap";
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

  it("over-segmentation: sensitivity near-perfect but precision collapses", () => {
    const state = scenario("over-segmentation");
    const { gt, pred } = masks(state, "A");
    // A paints far past the GT, so it covers (almost) all true voxels...
    expect(sensitivity(gt, pred, state.policy)).toBeGreaterThan(0.95);
    // ...yet most predicted voxels are false positives, so precision is low.
    expect(precision(gt, pred, state.policy)).toBeLessThan(0.4);

    // The well-fitted contrast model B keeps both high — sensitivity alone
    // cannot tell A from B, only precision exposes the over-draw.
    const tight = masks(state, "B");
    expect(sensitivity(tight.gt, tight.pred, state.policy)).toBeGreaterThan(0.95);
    expect(precision(tight.gt, tight.pred, state.policy)).toBeGreaterThan(0.7);
  });

  it("small-lesion instability: a larger boundary shift collapses Dice on a tiny lesion", () => {
    const state = scenario("small-lesion-instability");
    // A is a 4-pixel shift, B a 1-pixel shift, both on the same r=5 lesion.
    const big = masks(state, "A");
    const small = masks(state, "B");
    const diceBig = dice(big.gt, big.pred, state.policy);
    const diceSmall = dice(small.gt, small.pred, state.policy);

    // A few pixels of disagreement already drag Dice well below 1.0...
    expect(diceBig).toBeLessThan(0.7);
    // ...and the larger shift is markedly worse than the tiny one — the
    // hallmark instability of Dice on very small structures. (The scenario
    // only carries small lesions; the "negligible on a large organ" half of
    // the teaching point is asserted in the liver-margin / stray-fp cases
    // where the same absolute offset barely moves Dice on a big structure.)
    expect(diceSmall - diceBig).toBeGreaterThan(0.2);
  });

  it("liver margin: Dice stays high while HD95 flags a clinically large margin error", () => {
    const state = scenario("liver-margin");
    const { gt, pred } = masks(state, "A");
    // The bulge is a contiguous slab, so overlap stays acceptable...
    expect(dice(gt, pred, state.policy)).toBeGreaterThan(0.8);
    // ...but the boundary metric climbs to the depth of the bulge (mm).
    expect(hd95(state.grid, gt, pred, state.policy)).toBeGreaterThan(10);
  });

  it("rank agrees but magnitude disagrees: equal Dice, far-apart HD95", () => {
    const state = scenario("rank-agree-magnitude-disagree");
    const a = masks(state, "A");
    const b = masks(state, "B");
    const diceA = dice(a.gt, a.pred, state.policy);
    const diceB = dice(b.gt, b.pred, state.policy);
    const hdA = hd95(state.grid, a.gt, a.pred, state.policy);
    const hdB = hd95(state.grid, b.gt, b.pred, state.policy);

    // Both add an equal-area spur, so the overlap ranking is essentially tied.
    expect(Math.abs(diceA - diceB)).toBeLessThan(0.01);
    // Both metrics agree A is the better (or equal) model: A wins on HD95 and
    // is not worse on Dice — no rank inversion.
    expect(hdA).toBeLessThan(hdB);
    expect(diceA).toBeGreaterThanOrEqual(diceB - 0.01);
    // But the boundary-quality gap is enormous compared with the overlap gap.
    expect(hdB - hdA).toBeGreaterThan(20);
  });

  it("empty negative case: degenerate metrics resolve as the policy documents", () => {
    const state = scenario("empty-negative-case");
    // Prediction A: empty GT, single false-positive blob.
    const fp = masks(state, "A");
    // Precision penalizes the false positive (no true positives possible).
    expect(precision(fp.gt, fp.pred, state.policy)).toBe(0);
    // Dice/IoU hit the FP-only branch (denominator from FP alone) -> 0.
    expect(dice(fp.gt, fp.pred, state.policy)).toBe(0);
    expect(iou(fp.gt, fp.pred, state.policy)).toBe(0);
    // Distance is undefined under the scenario's emptyDistance policy.
    expect(Number.isNaN(hd95(state.grid, fp.gt, fp.pred, state.policy))).toBe(true);

    // Prediction B: empty GT and empty pred -> Dice resolves to the emptyDice
    // policy value ("one"), a policy choice, not a fact about the model.
    const both = masks(state, "B");
    expect(dice(both.gt, both.pred, state.policy)).toBe(1);
  });

  it("broken vessel topology: voxel overlap stays high (topology is commentary)", () => {
    const state = scenario("broken-vessel-topology");
    const { gt, pred } = masks(state, "A");
    // Dropping a small gap barely dents voxel overlap...
    expect(dice(gt, pred, state.policy)).toBeGreaterThan(0.9);
    expect(iou(gt, pred, state.policy)).toBeGreaterThan(0.85);
    // ...yet the prediction is now two disconnected components instead of one.
    // The "broken centerline" / clDice aspect is topology, which the voxel
    // engine cannot measure; connectivity is the only measurable proxy here.
    const components = lesionWise(state.grid, gt, pred, {
      criterion: "iou",
      threshold: 0.1,
      policy: state.policy,
    });
    expect(components.fpLesions).toBeGreaterThanOrEqual(1);
  });
});

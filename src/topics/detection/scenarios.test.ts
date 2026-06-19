import { describe, it, expect } from "vitest";
import {
  detectionScenarios,
  luna16Scans,
  rsnaGt,
  rsnaPreds,
} from "./scenarios";
import {
  averagePrecision,
  frocCurve,
  luna16Score,
  prCurve,
  sensitivityAtFp,
} from "../../engine/metrics/detection";

describe("detectionScenarios", () => {
  it("exposes the four required clinical scenarios with full context", () => {
    const ids = detectionScenarios.map((s) => s.id);
    expect(ids).toContain("luna16-nodule-fp-burden");
    expect(ids).toContain("rsna-ap50-vs-ap75");
    expect(ids).toContain("deeplesion-sensitivity-at-fixed-fp");
    expect(ids).toContain("camelyon16-metastasis-fp-per-image");

    for (const scenario of detectionScenarios) {
      expect(scenario.clinical.situation.length).toBeGreaterThan(0);
      expect(scenario.clinical.modality.length).toBeGreaterThan(0);
      expect(scenario.clinical.atStake.length).toBeGreaterThan(0);
      expect(scenario.clinical.consequence.length).toBeGreaterThan(0);
      expect(scenario.teachingPoint.length).toBeGreaterThan(0);
      expect(scenario.reference).toBeTruthy();
      expect(scenario.state.detections).toBeDefined();
    }
  });

  it("RSNA scene: AP at IoU 0.5 is meaningfully higher than at IoU 0.75", () => {
    const ap50 = averagePrecision(prCurve(rsnaPreds, rsnaGt, 0.5), "coco101");
    const ap75 = averagePrecision(prCurve(rsnaPreds, rsnaGt, 0.75), "coco101");

    expect(ap50).toBeGreaterThan(ap75 + 0.1);
    // The scene is built so loose boxes match at .5 but not at .75.
    expect(ap50).toBeGreaterThan(0.9);
    expect(ap75).toBeLessThan(0.1);
  });

  it("LUNA16 scene: luna16Score is computable in [0, 1]", () => {
    const froc = frocCurve(
      luna16Scans.detectionsPerScan,
      luna16Scans.gtPerScan,
      0.5,
    );
    const score = luna16Score(froc);

    expect(Number.isFinite(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    // Sub-perfect: the subtle nodules cost false positives to recover.
    expect(score).toBeLessThan(1);
    expect(score).toBeGreaterThan(0);
  });

  it("LUNA16 scene: full sensitivity is reached only well past 4 FP/scan", () => {
    const froc = frocCurve(
      luna16Scans.detectionsPerScan,
      luna16Scans.gtPerScan,
      0.5,
    );

    // Not yet perfect at a tolerable 1 FP/scan: the subtle nodule is missed.
    expect(sensitivityAtFp(froc, 1)).toBeLessThan(1);
    // Still sub-perfect at 4 FP/scan — the narrative anchor.
    expect(sensitivityAtFp(froc, 4)).toBeLessThan(1);
    // Full sensitivity only at a high false-positive budget.
    expect(sensitivityAtFp(froc, 8)).toBe(1);

    // The operating point that first reaches sensitivity 1.0 sits past 4 FP/scan.
    const firstPerfect = froc.find((point) => point.sensitivity === 1);
    expect(firstPerfect).toBeDefined();
    expect(firstPerfect!.fpPerScan).toBeGreaterThan(4);
  });
});

import { describe, expect, it } from "vitest";
import { classificationMetrics, confusionFromScores } from "../../engine/metrics/classification";
import type { ConfusionCounts } from "../../engine/metrics/classification";
import { CLS_PRESETS, DEFAULT_CLS_PRESET_ID } from "./presets";

const EXPECTED_COUNTS: Record<string, ConfusionCounts> = {
  "empty-start": { tp: 1, fp: 1, fn: 1, tn: 1 },
  "rare-all-negative": { tp: 0, fp: 0, fn: 5, tn: 95 },
  "screening-threshold": { tp: 19, fp: 24, fn: 1, tn: 56 },
  "confirmatory-threshold": { tp: 10, fp: 1, fn: 10, tn: 79 },
} as const;

describe("CLS_PRESETS", () => {
  it("exposes several preset scenes and a valid default", () => {
    expect(CLS_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(CLS_PRESETS.map((preset) => preset.id)).toContain(DEFAULT_CLS_PRESET_ID);
  });

  for (const preset of CLS_PRESETS) {
    it(`${preset.id} yields its documented confusion counts`, () => {
      expect(confusionFromScores(preset.cases, preset.threshold)).toEqual(
        EXPECTED_COUNTS[preset.id],
      );
    });
  }

  it("rare-all-negative exposes the accuracy versus sensitivity split", () => {
    const preset = CLS_PRESETS.find((item) => item.id === "rare-all-negative");
    expect(preset).toBeDefined();
    if (!preset) throw new TypeError("rare-all-negative preset missing");

    const metrics = classificationMetrics(confusionFromScores(preset.cases, preset.threshold));
    expect(metrics.accuracy).toBe(0.95);
    expect(metrics.sensitivity).toBe(0);
    expect(metrics.balancedAccuracy).toBe(0.5);
  });
});

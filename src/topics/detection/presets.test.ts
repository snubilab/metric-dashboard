import { describe, it, expect } from "vitest";
import { DET_PRESETS, DEFAULT_DET_PRESET_ID } from "./presets";
import { matchDetections } from "../../engine/metrics/detection";
import type { MatchCounts } from "../../engine/metrics/detection";

/** Documented match counts for each preset, keyed by id. */
const EXPECTED_COUNTS: Record<string, MatchCounts> = {
  "clean-detection": { tp: 3, fp: 0, fn: 0 },
  "missed-low-recall": { tp: 2, fp: 0, fn: 1 },
  "over-detection-low-precision": { tp: 2, fp: 3, fn: 0 },
  "loose-localization": { tp: 3, fp: 0, fn: 0 },
  "mixed-confidence": { tp: 3, fp: 2, fn: 0 },
};

describe("DET_PRESETS", () => {
  it("exposes exactly five presets", () => {
    expect(DET_PRESETS).toHaveLength(5);
  });

  it("default preset id matches an existing preset", () => {
    const ids = DET_PRESETS.map((preset) => preset.id);
    expect(ids).toContain(DEFAULT_DET_PRESET_ID);
  });

  it("ground-truth objects never carry a confidence field", () => {
    for (const preset of DET_PRESETS) {
      for (const gt of preset.gtObjects) {
        expect(gt.confidence).toBeUndefined();
      }
    }
  });

  it("every predicted box carries a confidence field", () => {
    for (const preset of DET_PRESETS) {
      for (const box of preset.boxes) {
        expect(box.confidence).toBeDefined();
      }
    }
  });

  for (const preset of DET_PRESETS) {
    it(`"${preset.id}" yields its documented TP/FP/FN counts at IoU ${preset.iouThreshold}`, () => {
      const counts = matchDetections(preset.boxes, preset.gtObjects, {
        iouThreshold: preset.iouThreshold,
      });
      expect(counts).toEqual(EXPECTED_COUNTS[preset.id]);
    });
  }
});

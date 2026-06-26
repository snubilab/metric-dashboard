import { describe, expect, it } from "vitest";
import { winner } from "../../components/metrics/detectDisagreements";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import { REPORT_PRESETS } from "./presets";

describe("report generation presets", () => {
  it("ships four instructive preset examples", () => {
    expect(REPORT_PRESETS.map((preset) => preset.id)).toEqual([
      "negation-flip",
      "laterality-swap",
      "temporal-change",
      "entity-swap",
    ]);
  });

  it("each preset produces an A-vs-B rank flip", () => {
    for (const preset of REPORT_PRESETS) {
      const winners = reportComparisonRows(
        preset.reference,
        preset.candidateA,
        preset.candidateB,
      ).map(winner);
      expect(winners).toContain("A");
      expect(winners).toContain("B");
    }
  });

  it("each preset declares the learner action that should be felt", () => {
    for (const preset of REPORT_PRESETS) {
      expect(preset.description.length).toBeGreaterThan(20);
      expect(preset.descriptionKo.length).toBeGreaterThan(10);
    }
  });
});

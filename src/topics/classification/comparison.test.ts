import { describe, expect, it } from "vitest";
import { classificationComparisonRows } from "../../components/metrics/classificationComparisonRows";
import { winner } from "../../components/metrics/detectDisagreements";
import { classificationScenarios } from "./scenarios";

describe("classification scenario A-vs-B comparison", () => {
  for (const scenario of classificationScenarios) {
    describe(scenario.id, () => {
      it("provides classification comparison data", () => {
        expect(scenario.state.classification?.cases.length ?? 0).toBeGreaterThan(0);
      });

      it("produces a genuine metric rank flip", () => {
        const data = scenario.state.classification;
        expect(data).toBeDefined();
        if (!data) throw new TypeError("classification scenario data missing");

        const winners = classificationComparisonRows(
          data.cases,
          data.thresholdA,
          data.thresholdB,
        ).map(winner);

        expect(winners).toContain("A");
        expect(winners).toContain("B");
      });

      it("reports finite metric values in [0, 1] for both models", () => {
        const data = scenario.state.classification;
        expect(data).toBeDefined();
        if (!data) throw new TypeError("classification scenario data missing");

        const rows = classificationComparisonRows(data.cases, data.thresholdA, data.thresholdB);
        for (const row of rows) {
          expect(Number.isFinite(row.a)).toBe(true);
          expect(Number.isFinite(row.b)).toBe(true);
          expect(row.a).toBeGreaterThanOrEqual(0);
          expect(row.a).toBeLessThanOrEqual(1);
          expect(row.b).toBeGreaterThanOrEqual(0);
          expect(row.b).toBeLessThanOrEqual(1);
        }
      });
    });
  }
});

import { describe, it, expect } from "vitest";
import { detectionScenarios } from "./scenarios";
import { detComparisonRows } from "../../components/metrics/detComparisonRows";
import { winner } from "../../components/metrics/detectDisagreements";

/**
 * Every Object Detection scenario must carry a second detector (B) and produce a
 * genuine rank flip: at least one pair of comparison rows whose winners disagree,
 * mirroring the segmentation A-vs-B table. These tests guard that contract.
 */
describe("detection scenario A-vs-B comparison", () => {
  for (const scenario of detectionScenarios) {
    describe(scenario.id, () => {
      const detections = scenario.state.detections;

      it("provides a non-empty detector B (boxesB)", () => {
        expect(detections).toBeDefined();
        expect(detections!.boxesB).toBeDefined();
        expect(detections!.boxesB!.length).toBeGreaterThan(0);
      });

      it("produces a genuine rank flip between detectors A and B", () => {
        const { gtObjects, boxes, boxesB } = detections!;
        const rows = detComparisonRows(gtObjects, boxes, boxesB!);

        const winners = rows.map(winner);
        const aWins = winners.filter((w) => w === "A").length;
        const bWins = winners.filter((w) => w === "B").length;

        // A genuine flip: at least one metric favors A and at least one favors B,
        // so the detectors trade wins rather than one dominating or all tying.
        expect(aWins).toBeGreaterThan(0);
        expect(bWins).toBeGreaterThan(0);
      });

      it("reports finite metric values in [0, 1] for both detectors", () => {
        const { gtObjects, boxes, boxesB } = detections!;
        const rows = detComparisonRows(gtObjects, boxes, boxesB!);

        for (const row of rows) {
          for (const value of [row.a, row.b]) {
            expect(Number.isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          }
        }
      });
    });
  }
});

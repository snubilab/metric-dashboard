import { describe, expect, it } from "vitest";
import {
  averagePrecision,
  classificationMetrics,
  confusionFromScores,
  fixedOperatingPoint,
  prCurve,
  rocAuc,
  rocCurve,
} from "./classification";
import type { ClassificationCase, ConfusionCounts } from "./classification";

const workedCounts: ConfusionCounts = { tp: 20, fn: 15, fp: 25, tn: 50 };

function repeatedCases(
  count: number,
  actual: ClassificationCase["actual"],
  score: number,
): ClassificationCase[] {
  return Array.from({ length: count }, () => ({ actual, score }));
}

describe("classification metrics", () => {
  it("computes confusion-matrix ratios from slide-style counts", () => {
    const metrics = classificationMetrics(workedCounts);

    expect(metrics.sensitivity).toBeCloseTo(20 / 35);
    expect(metrics.specificity).toBeCloseTo(50 / 75);
    expect(metrics.ppv).toBeCloseTo(20 / 45);
    expect(metrics.npv).toBeCloseTo(50 / 65);
    expect(metrics.accuracy).toBeCloseTo(70 / 110);
    expect(metrics.balancedAccuracy).toBeCloseTo((20 / 35 + 50 / 75) / 2);
  });

  it("shows the all-negative imbalance trap numerically", () => {
    const cases: readonly ClassificationCase[] = [
      ...repeatedCases(5, "positive", 0.1),
      ...repeatedCases(95, "negative", 0.1),
    ];
    const counts = confusionFromScores(cases, 0.5);

    const metrics = classificationMetrics(counts);
    expect(metrics.accuracy).toBe(0.95);
    expect(metrics.sensitivity).toBe(0);
    expect(metrics.balancedAccuracy).toBe(0.5);
  });

  it("sweeps ROC and PR curves from scores", () => {
    const cases: readonly ClassificationCase[] = [
      { actual: "positive", score: 0.9 },
      { actual: "positive", score: 0.8 },
      { actual: "negative", score: 0.7 },
      { actual: "negative", score: 0.2 },
    ];

    expect(rocCurve(cases).map((p) => [p.fpr, p.tpr])).toEqual([
      [0, 0],
      [0, 0.5],
      [0, 1],
      [0.5, 1],
      [1, 1],
    ]);
    expect(rocAuc(cases)).toBe(1);
    expect(prCurve(cases).map((p) => [p.recall, p.precision])).toEqual([
      [0, 1],
      [0.5, 1],
      [1, 1],
      [1, 2 / 3],
      [1, 0.5],
    ]);
    expect(averagePrecision(cases)).toBe(1);
  });

  it("finds fixed operating points by constraint", () => {
    const cases: readonly ClassificationCase[] = [
      { actual: "positive", score: 0.95 },
      { actual: "positive", score: 0.7 },
      { actual: "positive", score: 0.4 },
      { actual: "negative", score: 0.8 },
      { actual: "negative", score: 0.3 },
      { actual: "negative", score: 0.1 },
    ];

    expect(fixedOperatingPoint(cases, { kind: "sens-at-spec", minimum: 2 / 3 })?.value)
      .toBeCloseTo(1);
    expect(fixedOperatingPoint(cases, { kind: "spec-at-sens", minimum: 2 / 3 })?.value)
      .toBeCloseTo(2 / 3);
  });
});

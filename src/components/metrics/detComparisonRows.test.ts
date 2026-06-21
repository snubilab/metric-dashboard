import { describe, it, expect } from "vitest";
import type { DetBox } from "../../types/engine";
import { detComparisonRows } from "./detComparisonRows";
import { winner } from "./detectDisagreements";

/**
 * Two ground-truth objects on a small, well-separated coordinate space so a
 * box either matches its GT exactly or not at all.
 */
const gt: DetBox[] = [
  { x: 0, y: 0, w: 10, h: 10 },
  { x: 100, y: 100, w: 10, h: 10 },
];

/**
 * Detector A — aggressive: covers BOTH GT boxes (2 TP) and emits two extra
 * boxes far from any GT (2 FP). High recall, low precision.
 *   tp=2, fp=2, fn=0 -> recall=1.0, precision=0.5
 */
const predsA: DetBox[] = [
  { x: 0, y: 0, w: 10, h: 10, confidence: 0.9 },
  { x: 100, y: 100, w: 10, h: 10, confidence: 0.8 },
  { x: 50, y: 50, w: 10, h: 10, confidence: 0.7 },
  { x: 70, y: 20, w: 10, h: 10, confidence: 0.6 },
];

/**
 * Detector B — conservative: a single confident box on the first GT, missing
 * the second GT and emitting no false boxes. Low recall, high precision.
 *   tp=1, fp=0, fn=1 -> recall=0.5, precision=1.0
 */
const predsB: DetBox[] = [
  { x: 0, y: 0, w: 10, h: 10, confidence: 0.95 },
];

describe("detComparisonRows", () => {
  const rows = detComparisonRows(gt, predsA, predsB);
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

  it("returns the five rows in the exact key order", () => {
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.key)).toEqual(["recall", "precision", "f1", "ap50", "apRange"]);
  });

  it("recall favors the aggressive detector A", () => {
    expect(byKey.recall.a).toBeGreaterThan(byKey.recall.b);
  });

  it("precision favors the conservative detector B (the flip)", () => {
    expect(byKey.precision.b).toBeGreaterThan(byKey.precision.a);
  });

  it("every value is a finite number in [0, 1]", () => {
    for (const row of rows) {
      for (const value of [row.a, row.b]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("the comparison genuinely flips between recall and precision", () => {
    expect(winner(byKey.recall)).toBe("A");
    expect(winner(byKey.precision)).toBe("B");
  });
});

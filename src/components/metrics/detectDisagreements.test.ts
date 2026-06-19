import { describe, it, expect } from "vitest";
import { detectDisagreements, winner } from "./detectDisagreements";
import type { MetricRow } from "./types";

describe("winner", () => {
  it("higher value wins when higherIsBetter", () => {
    const row: MetricRow = { key: "dice", label: "Dice", a: 0.9, b: 0.7, higherIsBetter: true };
    expect(winner(row)).toBe("A");
  });

  it("lower value wins when not higherIsBetter", () => {
    const row: MetricRow = { key: "hd95", label: "HD95", a: 8, b: 3, unit: "mm", higherIsBetter: false };
    expect(winner(row)).toBe("B");
  });

  it("equal values are a tie", () => {
    const row: MetricRow = { key: "dice", label: "Dice", a: 0.8, b: 0.8, higherIsBetter: true };
    expect(winner(row)).toBe("tie");
  });
});

describe("detectDisagreements", () => {
  it("flags rankFlip on HD95 when its winner opposes the Dice winner", () => {
    const rows: MetricRow[] = [
      { key: "dice", label: "Dice", a: 0.9, b: 0.7, higherIsBetter: true }, // A wins
      { key: "hd95", label: "HD95", a: 8, b: 3, unit: "mm", higherIsBetter: false }, // lower wins -> B
      { key: "iou", label: "IoU", a: 0.85, b: 0.6, higherIsBetter: true }, // A wins
    ];

    const result = detectDisagreements(rows);
    const byKey = Object.fromEntries(result.map((r) => [r.key, r]));

    // reference row never flips against itself
    expect(byKey.dice.rankFlip).toBe(false);
    // HD95 winner (B) opposes reference Dice winner (A)
    expect(byKey.hd95.rankFlip).toBe(true);
    // IoU agrees with Dice
    expect(byKey.iou.rankFlip).toBe(false);
  });

  it("does not flag a tie row as a rank flip", () => {
    const rows: MetricRow[] = [
      { key: "dice", label: "Dice", a: 0.9, b: 0.7, higherIsBetter: true }, // A wins
      { key: "iou", label: "IoU", a: 0.8, b: 0.8, higherIsBetter: true }, // tie
    ];
    const result = detectDisagreements(rows);
    expect(result.find((r) => r.key === "iou")!.rankFlip).toBe(false);
  });

  it("flags largeGap when relative gap exceeds 0.5", () => {
    const rows: MetricRow[] = [
      { key: "dice", label: "Dice", a: 0.9, b: 0.85, higherIsBetter: true }, // small gap
      { key: "hd95", label: "HD95", a: 10, b: 2, unit: "mm", higherIsBetter: false }, // |10-2|/10 = 0.8
    ];
    const result = detectDisagreements(rows);
    const byKey = Object.fromEntries(result.map((r) => [r.key, r]));
    expect(byKey.dice.largeGap).toBe(false);
    expect(byKey.hd95.largeGap).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(detectDisagreements([])).toEqual([]);
  });
});

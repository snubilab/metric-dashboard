import { describe, expect, it } from "vitest";
import {
  mae,
  meanSignedBias,
  mse,
  pearsonR,
  regressionMetrics,
  rmse,
  rSquared,
  spearmanRho,
} from "./regression";

const POINTS = [
  { target: 1, prediction: 2 },
  { target: 2, prediction: 1 },
  { target: 3, prediction: 5 },
  { target: 4, prediction: 4 },
] as const;

describe("regression metrics", () => {
  it("computes error magnitude and signed bias from residuals", () => {
    expect(mae(POINTS)).toBe(1);
    expect(mse(POINTS)).toBe(1.5);
    expect(rmse(POINTS)).toBeCloseTo(Math.sqrt(1.5));
    expect(meanSignedBias(POINTS)).toBe(0.5);
  });

  it("computes variance explained and correlation metrics", () => {
    const points = [
      { target: 1, prediction: 1 },
      { target: 2, prediction: 4 },
      { target: 3, prediction: 9 },
      { target: 4, prediction: 16 },
      { target: 5, prediction: 25 },
    ] as const;

    expect(rSquared(points)).toBeLessThan(0);
    expect(pearsonR(points)).toBeCloseTo(0.9811, 3);
    expect(spearmanRho(points)).toBe(1);
  });

  it("uses average ranks for tied Spearman inputs", () => {
    const points = [
      { target: 1, prediction: 10 },
      { target: 2, prediction: 10 },
      { target: 3, prediction: 30 },
      { target: 4, prediction: 40 },
    ] as const;

    expect(spearmanRho(points)).toBeCloseTo(0.9487, 3);
  });

  it("returns NaN for empty or degenerate correlation inputs", () => {
    expect(Number.isNaN(regressionMetrics([]).mae)).toBe(true);
    expect(Number.isNaN(pearsonR([{ target: 1, prediction: 2 }]))).toBe(true);
    expect(Number.isNaN(rSquared([
      { target: 2, prediction: 1 },
      { target: 2, prediction: 3 },
    ]))).toBe(true);
  });
});

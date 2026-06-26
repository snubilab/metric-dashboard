import type { RegressionPoint } from "../../types/engine";
import { regressionMetrics } from "../../engine/metrics/regression";

export type RegressionLead = "A" | "B" | "tie";

export interface RegressionComparisonRow {
  readonly key: string;
  readonly label: string;
  readonly labelKo: string;
  readonly a: number;
  readonly b: number;
  readonly unit?: string;
  readonly direction: "lower" | "higher" | "zero";
}

const EPS = 1e-9;

export function regressionRowLead(row: RegressionComparisonRow): RegressionLead {
  const left = row.direction === "zero" ? Math.abs(row.a) : row.a;
  const right = row.direction === "zero" ? Math.abs(row.b) : row.b;
  if (Math.abs(left - right) < EPS) return "tie";
  if (row.direction === "higher") return left > right ? "A" : "B";
  return left < right ? "A" : "B";
}

export function regressionComparisonRows(
  pointsA: readonly RegressionPoint[],
  pointsB: readonly RegressionPoint[],
): RegressionComparisonRow[] {
  const a = regressionMetrics(pointsA);
  const b = regressionMetrics(pointsB);
  return [
    {
      key: "mae",
      label: "MAE",
      labelKo: "MAE",
      a: a.mae,
      b: b.mae,
      direction: "lower",
    },
    {
      key: "rmse",
      label: "RMSE",
      labelKo: "RMSE",
      a: a.rmse,
      b: b.rmse,
      direction: "lower",
    },
    {
      key: "r2",
      label: "R²",
      labelKo: "R²",
      a: a.r2,
      b: b.r2,
      direction: "higher",
    },
    {
      key: "bias",
      label: "Mean signed bias",
      labelKo: "평균 부호 편향",
      a: a.meanSignedBias,
      b: b.meanSignedBias,
      direction: "zero",
    },
    {
      key: "pearson",
      label: "Pearson r",
      labelKo: "Pearson r",
      a: a.pearsonR,
      b: b.pearsonR,
      direction: "higher",
    },
    {
      key: "spearman",
      label: "Spearman ρ",
      labelKo: "Spearman ρ",
      a: a.spearmanRho,
      b: b.spearmanRho,
      direction: "higher",
    },
  ];
}

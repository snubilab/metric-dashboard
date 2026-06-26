import type { RegressionPoint } from "../../types/engine";

export interface RegressionMetrics {
  readonly mae: number;
  readonly mse: number;
  readonly rmse: number;
  readonly r2: number;
  readonly meanSignedBias: number;
  readonly pearsonR: number;
  readonly spearmanRho: number;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function residuals(points: readonly RegressionPoint[]): number[] {
  return points.map((point) => point.prediction - point.target);
}

export function mae(points: readonly RegressionPoint[]): number {
  return mean(residuals(points).map(Math.abs));
}

export function mse(points: readonly RegressionPoint[]): number {
  return mean(residuals(points).map((residual) => residual * residual));
}

export function rmse(points: readonly RegressionPoint[]): number {
  const value = mse(points);
  return Number.isFinite(value) ? Math.sqrt(value) : Number.NaN;
}

export function meanSignedBias(points: readonly RegressionPoint[]): number {
  return mean(residuals(points));
}

export function rSquared(points: readonly RegressionPoint[]): number {
  if (points.length < 2) return Number.NaN;
  const targetMean = mean(points.map((point) => point.target));
  const sst = points.reduce((sum, point) => {
    const centered = point.target - targetMean;
    return sum + centered * centered;
  }, 0);
  if (sst === 0) return Number.NaN;
  const sse = points.reduce((sum, point) => {
    const residual = point.prediction - point.target;
    return sum + residual * residual;
  }, 0);
  return 1 - sse / sst;
}

function correlation(xs: readonly number[], ys: readonly number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return Number.NaN;
  const xMean = mean(xs);
  const yMean = mean(ys);
  let numerator = 0;
  let xSquares = 0;
  let ySquares = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const xValue = xs[i];
    const yValue = ys[i];
    if (xValue === undefined || yValue === undefined) return Number.NaN;
    const dx = xValue - xMean;
    const dy = yValue - yMean;
    numerator += dx * dy;
    xSquares += dx * dx;
    ySquares += dy * dy;
  }
  const denom = Math.sqrt(xSquares * ySquares);
  return denom === 0 ? Number.NaN : numerator / denom;
}

export function pearsonR(points: readonly RegressionPoint[]): number {
  return correlation(
    points.map((point) => point.target),
    points.map((point) => point.prediction),
  );
}

function averageRanks(values: readonly number[]): number[] {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = Array<number>(values.length).fill(0);
  let start = 0;
  while (start < sorted.length) {
    const first = sorted[start];
    if (!first) return ranks;
    let end = start;
    while (end + 1 < sorted.length && sorted[end + 1]?.value === first.value) {
      end += 1;
    }
    const averageRank = (start + end + 2) / 2;
    for (let i = start; i <= end; i += 1) {
      const item = sorted[i];
      if (item) ranks[item.index] = averageRank;
    }
    start = end + 1;
  }
  return ranks;
}

export function spearmanRho(points: readonly RegressionPoint[]): number {
  return correlation(
    averageRanks(points.map((point) => point.target)),
    averageRanks(points.map((point) => point.prediction)),
  );
}

export function regressionMetrics(points: readonly RegressionPoint[]): RegressionMetrics {
  return {
    mae: mae(points),
    mse: mse(points),
    rmse: rmse(points),
    r2: rSquared(points),
    meanSignedBias: meanSignedBias(points),
    pearsonR: pearsonR(points),
    spearmanRho: spearmanRho(points),
  };
}

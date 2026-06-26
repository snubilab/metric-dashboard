import type { ClassificationCase } from "../../types/engine";

export type { ClassificationCase } from "../../types/engine";

export interface ConfusionCounts {
  readonly tp: number;
  readonly fp: number;
  readonly fn: number;
  readonly tn: number;
}

export interface ClassificationMetrics {
  readonly sensitivity: number;
  readonly specificity: number;
  readonly ppv: number;
  readonly npv: number;
  readonly accuracy: number;
  readonly balancedAccuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
}

export interface CurvePoint {
  readonly threshold: number;
  readonly tpr: number;
  readonly fpr: number;
  readonly recall: number;
  readonly precision: number;
}

export type FixedOperatingKind = "sens-at-spec" | "spec-at-sens";

export interface FixedOperatingRequest {
  readonly kind: FixedOperatingKind;
  readonly minimum: number;
}

export interface FixedOperatingResult {
  readonly threshold: number;
  readonly value: number;
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function confusionFromScores(
  cases: readonly ClassificationCase[],
  threshold: number,
): ConfusionCounts {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  for (const item of cases) {
    const predictedPositive = item.score >= threshold;
    if (item.actual === "positive" && predictedPositive) tp += 1;
    if (item.actual === "positive" && !predictedPositive) fn += 1;
    if (item.actual === "negative" && predictedPositive) fp += 1;
    if (item.actual === "negative" && !predictedPositive) tn += 1;
  }

  return { tp, fp, fn, tn };
}

export function classificationMetrics(counts: ConfusionCounts): ClassificationMetrics {
  const sensitivity = safeRatio(counts.tp, counts.tp + counts.fn);
  const specificity = safeRatio(counts.tn, counts.tn + counts.fp);
  const ppv = safeRatio(counts.tp, counts.tp + counts.fp);
  const npv = safeRatio(counts.tn, counts.tn + counts.fn);
  const accuracy = safeRatio(counts.tp + counts.tn, counts.tp + counts.fp + counts.fn + counts.tn);
  const precision = ppv;
  const recall = sensitivity;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    sensitivity,
    specificity,
    ppv,
    npv,
    accuracy,
    balancedAccuracy: (sensitivity + specificity) / 2,
    precision,
    recall,
    f1,
  };
}

export function fBeta(precision: number, recall: number, beta: number): number {
  const betaSquared = beta * beta;
  const denominator = betaSquared * precision + recall;
  return denominator === 0 ? 0 : ((1 + betaSquared) * precision * recall) / denominator;
}

function thresholds(cases: readonly ClassificationCase[]): number[] {
  const unique = Array.from(new Set(cases.map((item) => item.score))).sort((a, b) => b - a);
  if (unique.length === 0) return [Number.POSITIVE_INFINITY];
  return [unique[0] + 1, ...unique];
}

function pointAt(cases: readonly ClassificationCase[], threshold: number): CurvePoint {
  const counts = confusionFromScores(cases, threshold);
  const metrics = classificationMetrics(counts);
  return {
    threshold,
    tpr: metrics.sensitivity,
    fpr: 1 - metrics.specificity,
    recall: metrics.recall,
    precision: counts.tp + counts.fp === 0 ? 1 : metrics.precision,
  };
}

export function rocCurve(cases: readonly ClassificationCase[]): CurvePoint[] {
  return thresholds(cases).map((threshold) => pointAt(cases, threshold));
}

export function prCurve(cases: readonly ClassificationCase[]): CurvePoint[] {
  return thresholds(cases).map((threshold) => pointAt(cases, threshold));
}

export function rocAuc(cases: readonly ClassificationCase[]): number {
  const points = rocCurve(cases).sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let area = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    area += (curr.fpr - prev.fpr) * ((prev.tpr + curr.tpr) / 2);
  }
  return area;
}

export function averagePrecision(cases: readonly ClassificationCase[]): number {
  const points = prCurve(cases).sort((a, b) => a.recall - b.recall || b.precision - a.precision);
  let area = 0;
  let prevRecall = 0;
  for (const point of points) {
    if (point.recall > prevRecall) {
      area += (point.recall - prevRecall) * point.precision;
      prevRecall = point.recall;
    }
  }
  return area;
}

export function fixedOperatingPoint(
  cases: readonly ClassificationCase[],
  request: FixedOperatingRequest,
): FixedOperatingResult | undefined {
  const points = rocCurve(cases);
  const feasible = points.filter((point) =>
    request.kind === "sens-at-spec"
      ? 1 - point.fpr >= request.minimum
      : point.tpr >= request.minimum,
  );
  if (feasible.length === 0) return undefined;
  const chosen = feasible.reduce((current, point) => {
    const value = request.kind === "sens-at-spec" ? point.tpr : 1 - point.fpr;
    const currentValue = request.kind === "sens-at-spec" ? current.tpr : 1 - current.fpr;
    return value > currentValue ? point : current;
  });
  return {
    threshold: chosen.threshold,
    value: request.kind === "sens-at-spec" ? chosen.tpr : 1 - chosen.fpr,
  };
}

import type { ClassificationCase, ClassificationComparisonCase } from "../../types/engine";
import {
  averagePrecision,
  classificationMetrics,
  confusionFromScores,
  rocAuc,
} from "../../engine/metrics/classification";
import type { MetricRow } from "./types";

interface ClassificationScores {
  readonly accuracy: number;
  readonly balancedAccuracy: number;
  readonly sensitivity: number;
  readonly specificity: number;
  readonly ppv: number;
  readonly npv: number;
  readonly f1: number;
  readonly auroc: number;
  readonly ap: number;
}

interface MetricSpec {
  readonly key: string;
  readonly label: string;
  readonly field: keyof ClassificationScores;
}

const METRIC_SPECS: readonly MetricSpec[] = [
  { key: "accuracy", label: "Accuracy", field: "accuracy" },
  { key: "balancedAccuracy", label: "Balanced Accuracy", field: "balancedAccuracy" },
  { key: "sensitivity", label: "Sensitivity", field: "sensitivity" },
  { key: "specificity", label: "Specificity", field: "specificity" },
  { key: "ppv", label: "PPV", field: "ppv" },
  { key: "npv", label: "NPV", field: "npv" },
  { key: "f1", label: "F1", field: "f1" },
  { key: "auroc", label: "AUROC", field: "auroc" },
  { key: "ap", label: "AP", field: "ap" },
];

function casesForSide(
  cases: readonly ClassificationComparisonCase[],
  side: "A" | "B",
): ClassificationCase[] {
  return cases.map((item) => ({
    actual: item.actual,
    score: side === "A" ? item.scoreA : item.scoreB,
  }));
}

function scoreSide(cases: readonly ClassificationCase[], threshold: number): ClassificationScores {
  const metrics = classificationMetrics(confusionFromScores(cases, threshold));
  return {
    accuracy: metrics.accuracy,
    balancedAccuracy: metrics.balancedAccuracy,
    sensitivity: metrics.sensitivity,
    specificity: metrics.specificity,
    ppv: metrics.ppv,
    npv: metrics.npv,
    f1: metrics.f1,
    auroc: rocAuc(cases),
    ap: averagePrecision(cases),
  };
}

export function classificationComparisonRows(
  cases: readonly ClassificationComparisonCase[],
  thresholdA: number,
  thresholdB: number,
): MetricRow[] {
  const a = scoreSide(casesForSide(cases, "A"), thresholdA);
  const b = scoreSide(casesForSide(cases, "B"), thresholdB);
  return METRIC_SPECS.map((spec) => ({
    key: spec.key,
    label: spec.label,
    a: a[spec.field],
    b: b[spec.field],
    higherIsBetter: true,
  }));
}

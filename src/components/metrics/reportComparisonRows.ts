import { compareReports } from "../../engine/metrics/reportGeneration";
import type { MetricRow } from "./types";

export const REPORT_COMPARISON_ROW_KEYS = [
  "bleu1",
  "rougeL",
  "meteor",
  "bertScore",
  "rateScore",
  "chexbertF1",
  "srrBertF1",
  "temporalF1",
  "radGraphF1",
  "greenErrors",
  "crimsonWeightedErrors",
] as const;

export type ReportComparisonRowKey = (typeof REPORT_COMPARISON_ROW_KEYS)[number];

export interface ReportComparisonRow extends MetricRow {
  readonly key: ReportComparisonRowKey;
}

export function reportComparisonRows(
  reference: string,
  candidateA: string,
  candidateB: string,
): ReportComparisonRow[] {
  const comparison = compareReports(reference, candidateA, candidateB);
  return [
    {
      key: "bleu1",
      label: "BLEU-1",
      a: comparison.a.bleu1,
      b: comparison.b.bleu1,
      higherIsBetter: true,
    },
    {
      key: "rougeL",
      label: "ROUGE-L",
      a: comparison.a.rougeL,
      b: comparison.b.rougeL,
      higherIsBetter: true,
    },
    {
      key: "meteor",
      label: "METEOR proxy",
      a: comparison.a.meteor,
      b: comparison.b.meteor,
      higherIsBetter: true,
    },
    {
      key: "bertScore",
      label: "BERTScore proxy",
      a: comparison.a.bertScore,
      b: comparison.b.bertScore,
      higherIsBetter: true,
    },
    {
      key: "rateScore",
      label: "RaTEscore proxy",
      a: comparison.a.rateScore,
      b: comparison.b.rateScore,
      higherIsBetter: true,
    },
    {
      key: "chexbertF1",
      label: "CheXbert finding F1 proxy",
      a: comparison.a.chexbertF1,
      b: comparison.b.chexbertF1,
      higherIsBetter: true,
    },
    {
      key: "srrBertF1",
      label: "SRR-BERT F1 proxy",
      a: comparison.a.srrBertF1,
      b: comparison.b.srrBertF1,
      higherIsBetter: true,
    },
    {
      key: "temporalF1",
      label: "Temporal cue F1 proxy",
      a: comparison.a.temporalF1,
      b: comparison.b.temporalF1,
      higherIsBetter: true,
    },
    {
      key: "radGraphF1",
      label: "RadGraph F1 proxy",
      a: comparison.a.radGraphF1,
      b: comparison.b.radGraphF1,
      higherIsBetter: true,
    },
    {
      key: "greenErrors",
      label: "GREEN-style error count",
      a: comparison.a.greenErrors,
      b: comparison.b.greenErrors,
      higherIsBetter: false,
    },
    {
      key: "crimsonWeightedErrors",
      label: "CRIMSON-style weighted errors",
      a: comparison.a.crimsonWeightedErrors,
      b: comparison.b.crimsonWeightedErrors,
      higherIsBetter: false,
    },
  ];
}

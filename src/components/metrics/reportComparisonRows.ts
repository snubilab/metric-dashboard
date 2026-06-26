import { compareReports } from "../../engine/metrics/reportGeneration";
import type { MetricRow } from "./types";

export function reportComparisonRows(
  reference: string,
  candidateA: string,
  candidateB: string,
): MetricRow[] {
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
      label: "CheXbert F1 proxy",
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
      label: "Temporal F1",
      a: comparison.a.temporalF1,
      b: comparison.b.temporalF1,
      higherIsBetter: true,
    },
    {
      key: "lateralityF1",
      label: "Laterality F1",
      a: comparison.a.lateralityF1,
      b: comparison.b.lateralityF1,
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
      label: "GREEN error count",
      a: comparison.a.greenErrors,
      b: comparison.b.greenErrors,
      higherIsBetter: false,
    },
    {
      key: "crimsonWeightedErrors",
      label: "CRIMSON weighted errors",
      a: comparison.a.crimsonWeightedErrors,
      b: comparison.b.crimsonWeightedErrors,
      higherIsBetter: false,
    },
  ];
}

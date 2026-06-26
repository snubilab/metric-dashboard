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
      key: "lexicalOverlap",
      label: "Lexical overlap proxy",
      a: comparison.a.lexicalOverlap,
      b: comparison.b.lexicalOverlap,
      higherIsBetter: true,
    },
    {
      key: "findingF1",
      label: "Finding F1",
      a: comparison.a.findingF1,
      b: comparison.b.findingF1,
      higherIsBetter: true,
    },
    {
      key: "assertionF1",
      label: "Assertion F1",
      a: comparison.a.assertionF1,
      b: comparison.b.assertionF1,
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
      key: "temporalF1",
      label: "Temporal F1",
      a: comparison.a.temporalF1,
      b: comparison.b.temporalF1,
      higherIsBetter: true,
    },
    {
      key: "safetyErrors",
      label: "Safety error count",
      a: comparison.a.safetyErrors,
      b: comparison.b.safetyErrors,
      higherIsBetter: false,
    },
  ];
}

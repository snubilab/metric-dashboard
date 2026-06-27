import { describe, expect, it } from "vitest";
import { winner } from "./detectDisagreements";
import { localizedMetricLabel } from "./metricLabel";
import { reportComparisonRows } from "./reportComparisonRows";

describe("reportComparisonRows", () => {
  it("creates finite A-vs-B rows with a rank flip", () => {
    const rows = reportComparisonRows(
      "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.",
      "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.",
      "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.",
    );

    expect(rows.map(winner)).toContain("A");
    expect(rows.map(winner)).toContain("B");
    for (const row of rows) {
      expect(Number.isFinite(row.a)).toBe(true);
      expect(Number.isFinite(row.b)).toBe(true);
    }
  });

  it("returns the honest top-level report metric row contract", () => {
    const rows = reportComparisonRows(
      "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.",
      "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.",
      "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.",
    );

    expect(rows.map((row) => row.key)).toEqual([
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
    ]);
    expect(rows.map((row) => row.key)).not.toContain("lateralityF1");
    expect(rows.map((row) => row.label)).toEqual([
      "BLEU-1",
      "ROUGE-L",
      "METEOR proxy",
      "BERTScore proxy",
      "RaTEscore proxy",
      "CheXbert finding F1 proxy",
      "SRR-BERT F1 proxy",
      "Temporal cue F1 proxy",
      "RadGraph F1 proxy",
      "GREEN-style error count",
      "CRIMSON-style weighted errors",
    ]);
    expect(rows.map((row) => row.key)).not.toContain("clinicalAcceptance");
  });

  it("keeps localized proxy and style labels explicit", () => {
    expect(localizedMetricLabel("chexbertF1", "CheXbert finding F1 proxy", "ko")).toBe(
      "CheXbert finding F1 proxy",
    );
    expect(localizedMetricLabel("temporalF1", "Temporal cue F1 proxy", "ko")).toBe(
      "Temporal cue F1 proxy",
    );
    expect(localizedMetricLabel("greenErrors", "GREEN-style error count", "ko")).toBe(
      "GREEN-style error count",
    );
    expect(localizedMetricLabel("crimsonWeightedErrors", "CRIMSON-style weighted errors", "ko")).toBe(
      "CRIMSON-style weighted errors",
    );
  });
});

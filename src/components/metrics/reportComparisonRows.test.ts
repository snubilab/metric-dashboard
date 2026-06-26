import { describe, expect, it } from "vitest";
import { winner } from "./detectDisagreements";
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
});

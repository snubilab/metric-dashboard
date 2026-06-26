import { describe, expect, it } from "vitest";
import {
  compareReports,
  extractClinicalCues,
  lexicalOverlapF1,
} from "./reportGeneration";

describe("report generation metrics", () => {
  it("rewards lexical overlap even when negation flips", () => {
    const reference =
      "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.";
    const candidateA =
      "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.";
    const candidateB =
      "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.";

    expect(lexicalOverlapF1(reference, candidateB)).toBeGreaterThan(
      lexicalOverlapF1(reference, candidateA),
    );

    const result = compareReports(reference, candidateA, candidateB);
    expect(result.a.assertionF1).toBeGreaterThan(result.b.assertionF1);
    expect(result.a.safetyErrors).toBeLessThan(result.b.safetyErrors);
  });

  it("extracts laterality and temporal cues deterministically", () => {
    const cues = extractClinicalCues(
      "Compared with prior, right lower lobe opacity has improved. No pleural effusion.",
    );

    expect(cues.findings).toContain("opacity");
    expect(cues.laterality).toContain("right");
    expect(cues.temporal).toContain("improved");
    expect(cues.absentFindings).toContain("pleural effusion");
  });

  it("makes single clinical edits visible in the intended metric family", () => {
    const reference = "Right pneumothorax has improved. No pleural effusion.";
    const same = "Right pneumothorax has improved. No pleural effusion.";
    const assertionFlip = "Right pneumothorax has improved. Pleural effusion is present.";
    const lateralityFlip = "Left pneumothorax has improved. No pleural effusion.";
    const temporalFlip = "Right pneumothorax has worsened. No pleural effusion.";

    const assertionComparison = compareReports(reference, same, assertionFlip);
    const lateralityComparison = compareReports(reference, same, lateralityFlip);
    const temporalComparison = compareReports(reference, same, temporalFlip);

    expect(assertionComparison.a.assertionF1).toBeGreaterThan(
      assertionComparison.b.assertionF1,
    );
    expect(lateralityComparison.a.lateralityF1).toBeGreaterThan(
      lateralityComparison.b.lateralityF1,
    );
    expect(temporalComparison.a.temporalF1).toBeGreaterThan(temporalComparison.b.temporalF1);
  });
});

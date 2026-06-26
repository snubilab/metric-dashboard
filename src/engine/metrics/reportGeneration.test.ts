import { describe, expect, it } from "vitest";
import {
  compareReports,
  bleu1Score,
  extractClinicalCues,
  lexicalOverlapF1,
  meteorProxyScore,
  rougeLScore,
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
    expect(result.b.bleu1).toBeGreaterThan(result.a.bleu1);
    expect(result.b.rougeL).toBeGreaterThan(result.a.rougeL);
    expect(result.b.meteor).toBeGreaterThan(result.a.meteor);
    expect(result.a.assertionF1).toBeGreaterThan(result.b.assertionF1);
    expect(result.a.greenErrors).toBeLessThan(result.b.greenErrors);
    expect(result.a.crimsonWeightedErrors).toBeLessThan(result.b.crimsonWeightedErrors);
  });

  it("exposes separate BLEU, ROUGE-L, and METEOR proxies", () => {
    const reference = "No pleural effusion. Pulmonary edema has improved.";
    const paraphrase = "No pleural fluid. Pulmonary edema has decreased.";
    const terse = "No edema.";

    expect(bleu1Score(reference, terse)).toBeGreaterThan(rougeLScore(reference, terse));
    expect(meteorProxyScore(reference, paraphrase)).toBeGreaterThan(
      lexicalOverlapF1(reference, paraphrase),
    );
  });

  it("clips repeated lexical matches so overlap proxies stay bounded", () => {
    const reference = "No pneumothorax.";
    const repeated = "pneumothorax pneumothorax pneumothorax pneumothorax.";

    expect(bleu1Score(reference, repeated)).toBeLessThan(1);
    expect(meteorProxyScore(reference, repeated)).toBeLessThanOrEqual(1);
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
    expect(temporalComparison.a.radGraphF1).toBeGreaterThan(temporalComparison.b.radGraphF1);
  });

  it("counts unsupported candidate-only findings and extra cues as error-category rows", () => {
    const reference = "No pleural effusion.";
    const safe = "No pleural fluid.";
    const unsupported = "No pleural effusion. New right pneumothorax.";

    const comparison = compareReports(reference, safe, unsupported);

    expect(comparison.b.greenErrors).toBeGreaterThan(comparison.a.greenErrors);
    expect(comparison.b.crimsonWeightedErrors).toBeGreaterThan(
      comparison.a.crimsonWeightedErrors,
    );
  });

  it("lets SRR-BERT proxy differ from coarse CheXbert labels", () => {
    const reference = "Right lower lobe opacity has improved.";
    const sameFindingWrongAttributes = "Left lower lobe opacity has worsened.";

    const comparison = compareReports(reference, reference, sameFindingWrongAttributes);

    expect(comparison.b.chexbertF1).toBe(1);
    expect(comparison.b.srrBertF1).toBeLessThan(comparison.b.chexbertF1);
  });
});

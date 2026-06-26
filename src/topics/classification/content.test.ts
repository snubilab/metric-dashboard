import { describe, expect, it } from "vitest";
import { classificationLearn } from "./content";
import { classificationLearnKo } from "./contentKo";

const REQUIRED_IDS = [
  "confusion-matrix",
  "sensitivity-specificity",
  "ppv-npv",
  "accuracy-balanced-accuracy",
  "precision-recall-f1-fbeta",
  "roc-auroc",
  "pr-auprc-ap",
  "fixed-operating-points",
] as const;

describe("classification Learn content", () => {
  it("includes every required section in English and Korean", () => {
    expect(classificationLearn.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
    expect(classificationLearnKo.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
  });

  it("provides meaning, features, caveats, and figures for every section", () => {
    for (const section of classificationLearn.sections) {
      expect(section.meaning.length).toBeGreaterThan(0);
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.caveats.length).toBeGreaterThan(0);
      expect(section.figure).toBeDefined();
    }
  });
});

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

  it("attaches distinct interactive demos to fixed-threshold metric families", () => {
    expect(classificationLearn.sections.find((section) => section.id === "sensitivity-specificity")?.miniSim?.kind).toBe("cls-row-tradeoff");
    expect(classificationLearn.sections.find((section) => section.id === "ppv-npv")?.miniSim?.kind).toBe("cls-prevalence-columns");
    expect(classificationLearn.sections.find((section) => section.id === "accuracy-balanced-accuracy")?.miniSim?.kind).toBe("cls-accuracy-imbalance");
    expect(classificationLearn.sections.find((section) => section.id === "precision-recall-f1-fbeta")?.miniSim?.kind).toBe("cls-fbeta-weight");
    expect(classificationLearnKo.sections.find((section) => section.id === "sensitivity-specificity")?.miniSim?.kind).toBe("cls-row-tradeoff");
  });
});

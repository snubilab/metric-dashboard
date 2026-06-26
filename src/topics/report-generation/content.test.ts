import { describe, expect, it } from "vitest";
import { reportGenerationLearn } from "./content";
import { reportGenerationLearnKo } from "./contentKo";

const REQUIRED_IDS = [
  "bleu",
  "rouge-l",
  "meteor",
  "bertscore",
  "ratescore",
  "temporal-f1",
  "chexbert-f1",
  "srr-bert-f1",
  "graph-f1",
  "green",
  "crimson",
  "clinical-acceptance",
] as const;

describe("report generation Learn content", () => {
  it("keeps English and Korean section parity", () => {
    expect(reportGenerationLearn.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
    expect(reportGenerationLearnKo.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
  });

  it("provides full section content and figures", () => {
    for (const section of reportGenerationLearn.sections) {
      expect(section.meaning.length).toBeGreaterThan(0);
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.caveats.length).toBeGreaterThan(0);
      expect(section.figure).toBeDefined();
    }
  });

  it("does not use forbidden absolute grade verdicts", () => {
    const text = JSON.stringify([reportGenerationLearn, reportGenerationLearnKo]);
    expect(text).not.toMatch(/좋음|나쁨|우수|열등|best metric|worst metric/);
  });
});

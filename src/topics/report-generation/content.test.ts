import { describe, expect, it } from "vitest";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
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
  "llm-evaluator-landscape",
  "clinical-acceptance",
] as const;

const RELATED_EVALUATORS = ["VERT", "ReFINE", "RadOT-Eval"] as const;
const EXPECTED_MINISIMS = [
  "report-lexical-paraphrase",
  "report-entity-assertion",
  "report-temporal-direction",
  "report-label-graph-granularity",
  "report-error-weighting",
] as const;

function learnText(): string {
  return JSON.stringify([reportGenerationLearn, reportGenerationLearnKo]);
}

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
    expect(learnText()).not.toMatch(/좋음|나쁨|우수|열등|best metric|worst metric/);
  });

  it("covers related learned evaluators without presenting them as live metrics", () => {
    const text = learnText();
    for (const evaluator of RELATED_EVALUATORS) {
      expect(text).toContain(evaluator);
    }

    const evaluatorSection = reportGenerationLearn.sections.find(
      (section) => section.id === "llm-evaluator-landscape",
    );
    const evaluatorSectionKo = reportGenerationLearnKo.sections.find(
      (section) => section.id === "llm-evaluator-landscape",
    );
    expect(JSON.stringify([evaluatorSection, evaluatorSectionKo])).toMatch(/not live|live LLM judge/);
    expect(JSON.stringify([evaluatorSection, evaluatorSectionKo])).toMatch(/static dashboard|static/);

    const rowKeys = reportComparisonRows("reference", "candidate A", "candidate B").map((row) =>
      row.key.toLowerCase(),
    );
    expect(rowKeys.join(" ")).not.toMatch(/vert|refine|radot/);
  });

  it("adds focused report miniSims to the metric families that move differently", () => {
    const miniSims = reportGenerationLearn.sections
      .map((section) => section.miniSim?.kind)
      .filter((kind) => kind !== undefined);

    expect(miniSims).toEqual(EXPECTED_MINISIMS);
    expect(reportGenerationLearnKo.sections.map((section) => section.miniSim?.kind)).toEqual(
      reportGenerationLearn.sections.map((section) => section.miniSim?.kind),
    );
  });
});

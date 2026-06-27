import { describe, expect, it } from "vitest";
import { winner } from "../../components/metrics/detectDisagreements";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import { reportGenerationScenarios } from "./scenarios";
import { reportGenerationScenariosKo } from "./scenariosKo";

describe("report generation scenarios", () => {
  it("keeps Korean scenarios in exact parity with English scenarios", () => {
    const englishIds = reportGenerationScenarios.map((scenario) => scenario.id);
    const koreanIds = reportGenerationScenariosKo.map((scenario) => scenario.id);

    expect(koreanIds).toEqual(englishIds);
  });

  it("each scenario has reportGeneration state and a true rank flip", () => {
    for (const scenario of reportGenerationScenarios) {
      const report = scenario.state.reportGeneration;
      expect(report).toBeDefined();
      if (!report) throw new TypeError("reportGeneration state missing");

      const winners = reportComparisonRows(
        report.reference,
        report.candidateA,
        report.candidateB,
      ).map(winner);
      expect(winners).toContain("A");
      expect(winners).toContain("B");
    }
  });

  it("each scenario explains which metric-observed unit caused the flip", () => {
    const required =
      /lexical|assertion|laterality|temporal|entity|Lexical|Temporal|RaTEscore|METEOR|GREEN|CRIMSON|label|attribute/;
    for (const scenario of reportGenerationScenarios) {
      expect(scenario.teachingPoint).toMatch(required);
    }
  });
});

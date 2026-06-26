import { describe, expect, it } from "vitest";
import { regressionScenarios } from "./scenarios";
import { regressionComparisonRows, regressionRowLead } from "./scenarioRows";

describe("regression scenarios", () => {
  for (const scenario of regressionScenarios) {
    describe(scenario.id, () => {
      it("carries an A-vs-B regression scene", () => {
        expect(scenario.state.regression?.points.length).toBeGreaterThanOrEqual(4);
        expect(scenario.state.regression?.pointsB?.length).toBeGreaterThanOrEqual(4);
      });

      it("produces at least one rank or interpretation flip", () => {
        const regression = scenario.state.regression;
        expect(regression).toBeDefined();

        const rows = regressionComparisonRows(regression?.points ?? [], regression?.pointsB ?? []);
        const winners = rows.map(regressionRowLead);
        expect(winners).toContain("A");
        expect(winners).toContain("B");
      });

      it("reports finite values for all stated scenario metrics", () => {
        const regression = scenario.state.regression;
        const rows = regressionComparisonRows(regression?.points ?? [], regression?.pointsB ?? []);

        for (const row of rows) {
          expect(Number.isFinite(row.a)).toBe(true);
          expect(Number.isFinite(row.b)).toBe(true);
        }
      });
    });
  }
});

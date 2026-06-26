import type { ClassificationComparisonCase, EngineState } from "../../types/engine";

const GRID = { width: 256, height: 256, spacingMm: [1, 1] as [number, number] };
const POLICY = { emptyDice: "one" as const, emptyDistance: "undefined" as const };

function repeatComparison(
  count: number,
  actual: ClassificationComparisonCase["actual"],
  scoreA: number,
  scoreB: number,
): ClassificationComparisonCase[] {
  return Array.from({ length: count }, () => ({ actual, scoreA, scoreB }));
}

export function classificationState(
  cases: readonly ClassificationComparisonCase[],
  thresholdA = 0.5,
  thresholdB = 0.5,
): EngineState {
  return {
    grid: GRID,
    gt: [],
    predictions: [],
    classification: { cases: [...cases], thresholdA, thresholdB },
    policy: POLICY,
  };
}

export const rareDiseaseCases = [
  ...repeatComparison(4, "positive", 0.1, 0.9),
  ...repeatComparison(1, "positive", 0.1, 0.1),
  ...repeatComparison(10, "negative", 0.1, 0.8),
  ...repeatComparison(85, "negative", 0.1, 0.1),
];

export const screeningCases = [
  ...repeatComparison(12, "positive", 0.9, 0.9),
  ...repeatComparison(7, "positive", 0.75, 0.2),
  ...repeatComparison(1, "positive", 0.2, 0.2),
  ...repeatComparison(2, "negative", 0.7, 0.7),
  ...repeatComparison(22, "negative", 0.65, 0.2),
  ...repeatComparison(56, "negative", 0.1, 0.1),
];

export const confirmatoryCases = [
  ...repeatComparison(10, "positive", 0.9, 0.9),
  ...repeatComparison(8, "positive", 0.65, 0.2),
  ...repeatComparison(2, "positive", 0.2, 0.2),
  ...repeatComparison(1, "negative", 0.9, 0.9),
  ...repeatComparison(29, "negative", 0.65, 0.2),
  ...repeatComparison(50, "negative", 0.1, 0.1),
];

export const rocPrCases = [
  ...repeatComparison(5, "positive", 0.9, 0.99),
  ...repeatComparison(5, "positive", 0.9, 0.7),
  ...repeatComparison(10, "negative", 0.99, 0.8),
  ...repeatComparison(40, "negative", 0.1, 0.8),
  ...repeatComparison(40, "negative", 0.1, 0.1),
];

import type { EngineState, RegressionPoint } from "../../types/engine";
import type { Scenario } from "../../types/topic";

const GRID = { width: 256, height: 256, spacingMm: [1, 1] as [number, number] };
const POLICY = { emptyDice: "one" as const, emptyDistance: "undefined" as const };

function regressionState(points: RegressionPoint[], pointsB: RegressionPoint[]): EngineState {
  return {
    grid: GRID,
    gt: [],
    predictions: [
      { id: "A", shapes: [] },
      { id: "B", shapes: [] },
    ],
    regression: { points, pointsB },
    policy: POLICY,
  };
}

export const regressionScenarios: Scenario[] = [
  {
    id: "outlier-rmse-flip",
    title: "ADC map: one outlier changes the error story",
    clinical: {
      situation:
        "A model estimates lesion ADC from image patches. Most voxels are close, but one patch is distorted by motion.",
      modality: "Diffusion MRI",
      atStake:
        "MAE summarizes the typical residual, while RMSE gives a large residual more weight.",
      consequence:
        "Prediction B has smaller usual residuals, yet its one large miss makes RMSE point back to A.",
    },
    state: regressionState(
      [
        { target: 1, prediction: 3 },
        { target: 2, prediction: 0 },
        { target: 3, prediction: 5 },
        { target: 4, prediction: 2 },
        { target: 5, prediction: 7 },
      ],
      [
        { target: 1, prediction: 1.2 },
        { target: 2, prediction: 2.2 },
        { target: 3, prediction: 3.2 },
        { target: 4, prediction: 4.2 },
        { target: 5, prediction: 12 },
      ],
    ),
    teachingPoint:
      "MAE follows the typical residual and leads toward B; RMSE amplifies the single large miss and leads toward A.",
    reference: "Regression metrics from seminar slides 15-16.",
  },
  {
    id: "constant-bias-correlation-flip",
    title: "Bone age: correlation hides a constant shift",
    clinical: {
      situation:
        "A bone-age model preserves patient ordering but predicts every age about three months high.",
      modality: "Hand radiograph",
      atStake:
        "Correlation asks whether cases move together; mean signed bias asks whether estimates are shifted.",
      consequence:
        "A can keep Pearson r near 1 while carrying a visible positive bias. B lowers bias with slightly noisier ordering.",
    },
    state: regressionState(
      [
        { target: 1, prediction: 4 },
        { target: 2, prediction: 5 },
        { target: 3, prediction: 6 },
        { target: 4, prediction: 7 },
        { target: 5, prediction: 8 },
        { target: 6, prediction: 9 },
      ],
      [
        { target: 1, prediction: 0.2 },
        { target: 2, prediction: 2.8 },
        { target: 3, prediction: 2.2 },
        { target: 4, prediction: 4.8 },
        { target: 5, prediction: 4.2 },
        { target: 6, prediction: 6.8 },
      ],
    ),
    teachingPoint:
      "Pearson r follows A because the line is straight; mean signed bias and error magnitude point to B.",
    reference: "Regression metrics from seminar slides 15-16.",
  },
  {
    id: "monotonic-nonlinear-spearman",
    title: "Risk score: monotonic but nonlinear",
    clinical: {
      situation:
        "A model predicts a continuous risk score whose scale bends upward for high-risk patients.",
      modality: "CT-derived risk score",
      atStake:
        "Pearson r reads linear association; Spearman ρ reads rank-preserving monotonic association.",
      consequence:
        "A preserves every rank but bends the numeric scale. B is more linear but swaps two neighboring cases.",
    },
    state: regressionState(
      [
        { target: 1, prediction: 1 },
        { target: 2, prediction: 1.4 },
        { target: 3, prediction: 2.2 },
        { target: 4, prediction: 4 },
        { target: 5, prediction: 7.5 },
        { target: 6, prediction: 12 },
      ],
      [
        { target: 1, prediction: 1.1 },
        { target: 2, prediction: 3.1 },
        { target: 3, prediction: 2.9 },
        { target: 4, prediction: 4.2 },
        { target: 5, prediction: 5.1 },
        { target: 6, prediction: 5.8 },
      ],
    ),
    teachingPoint:
      "Spearman ρ follows A because ranks are preserved; Pearson r and error magnitude can move toward B when numeric scale matters.",
    reference: "Regression metrics from seminar slides 15-16.",
  },
  {
    id: "r2-with-clinical-bias",
    title: "Ejection fraction: substantial R² with a shifted scale",
    clinical: {
      situation:
        "A cardiac model tracks ejection fraction across the population but systematically overestimates the measurement.",
      modality: "Cardiac MRI",
      atStake:
        "R² can stay substantial when between-patient variance is large; bias still matters near clinical thresholds.",
      consequence:
        "A explains much of the spread, while B keeps the average signed error closer to zero.",
    },
    state: regressionState(
      [
        { target: 25, prediction: 30 },
        { target: 35, prediction: 40 },
        { target: 45, prediction: 50 },
        { target: 55, prediction: 60 },
        { target: 65, prediction: 70 },
      ],
      [
        { target: 25, prediction: 21 },
        { target: 35, prediction: 39 },
        { target: 45, prediction: 41 },
        { target: 55, prediction: 59 },
        { target: 65, prediction: 61 },
      ],
    ),
    teachingPoint:
      "R² and correlation can remain substantial while mean signed bias exposes a clinically meaningful shift.",
    reference: "Regression metrics from seminar slides 15-16.",
  },
];

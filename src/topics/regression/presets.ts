import type { RegressionPoint } from "../../types/engine";

export interface RegressionPreset {
  readonly id: string;
  readonly label: string;
  readonly labelKo: string;
  readonly description: string;
  readonly descriptionKo: string;
  readonly points: RegressionPoint[];
}

export const REG_PRESETS: readonly RegressionPreset[] = [
  {
    id: "small-balanced",
    label: "Small residuals",
    labelKo: "작은 잔차",
    description: "Balanced residuals keep magnitude and bias views close together.",
    descriptionKo: "잔차가 작고 균형적이면 오차 크기와 편향 관점이 함께 움직입니다.",
    points: [
      { target: 1, prediction: 1.1 },
      { target: 2, prediction: 1.8 },
      { target: 3, prediction: 3.2 },
      { target: 4, prediction: 3.9 },
      { target: 5, prediction: 5.1 },
    ],
  },
  {
    id: "one-outlier",
    label: "One outlier",
    labelKo: "이상치 하나",
    description: "One large residual pulls RMSE away from MAE.",
    descriptionKo: "큰 잔차 하나가 RMSE를 MAE보다 멀리 끌어올립니다.",
    points: [
      { target: 1, prediction: 1.1 },
      { target: 2, prediction: 2.2 },
      { target: 3, prediction: 2.8 },
      { target: 4, prediction: 4.1 },
      { target: 5, prediction: 12 },
    ],
  },
  {
    id: "constant-bias",
    label: "Constant bias",
    labelKo: "일정한 편향",
    description: "The ordering tracks the target, while every value is shifted upward.",
    descriptionKo: "순서는 목표값을 따라가지만 모든 예측이 같은 방향으로 이동해 있습니다.",
    points: [
      { target: 1, prediction: 3 },
      { target: 2, prediction: 4 },
      { target: 3, prediction: 5 },
      { target: 4, prediction: 6 },
      { target: 5, prediction: 7 },
    ],
  },
  {
    id: "monotonic-curve",
    label: "Monotonic curve",
    labelKo: "단조 곡선",
    description: "The rank order is preserved even though the relationship is curved.",
    descriptionKo: "관계가 곡선이어도 순위는 그대로 유지되는 예입니다.",
    points: [
      { target: 1, prediction: 1 },
      { target: 2, prediction: 1.5 },
      { target: 3, prediction: 2.4 },
      { target: 4, prediction: 4.2 },
      { target: 5, prediction: 7.4 },
      { target: 6, prediction: 12 },
    ],
  },
];

import type { LearnContent } from "../../types/topic";
import { regressionLearn } from "./content";

export const regressionLearnKo: LearnContent = {
  ...regressionLearn,
  intro:
    "영상 회귀는 나이, 부피, 강도, ADC, 위험 점수처럼 연속적인 목표값을 평가합니다. 핵심은 하나의 판정이 아니라, 각 지표가 어떤 실패 양상을 드러내는지 보는 것입니다: 오차 크기, 이상치 민감도, 편향 방향, 분산 설명력, 선형 상관, 단조 상관.",
  sections: [
    {
      ...regressionLearn.sections[0],
      title: "MAE — 평균 절대오차",
      meaning: "MAE는 잔차의 절댓값 평균이라 목표값과 같은 단위로 읽힙니다.",
      features: ["전형적인 절대 오차를 직관적으로 보여줍니다.", "MSE나 RMSE보다 큰 잔차 하나에 덜 끌려갑니다."],
      caveats: ["모델이 과대예측하는지 과소예측하는지는 숨깁니다. 그 방향은 평균 부호 편향이 답합니다.", "드물지만 임상적으로 중요한 큰 오차는 덜 드러날 수 있습니다. RMSE가 그 부분을 더 키워 보여줍니다."],
      complements: "RMSE와 함께 보면 이상치 민감도를, 평균 부호 편향과 함께 보면 방향을 분리해 읽을 수 있습니다.",
    },
    {
      ...regressionLearn.sections[1],
      title: "MSE — 평균 제곱오차",
      meaning: "MSE는 각 잔차를 제곱한 뒤 평균내므로 큰 잔차에 훨씬 큰 무게를 둡니다.",
      features: ["매끄러운 최적화 손실로 쓰기 쉽습니다.", "큰 빗나감을 숫자에서 두드러지게 만듭니다."],
      caveats: ["단위가 제곱 단위라 MAE나 RMSE보다 바로 해석하기 어렵습니다."],
      complements: "같은 목표 단위로 설명해야 할 때는 RMSE와 함께 읽습니다.",
    },
    {
      ...regressionLearn.sections[2],
      title: "RMSE — 평균 제곱근 오차",
      meaning: "RMSE는 MSE에 제곱근을 씌워 목표값 단위로 돌아오면서도 큰 잔차에 대한 민감도를 유지합니다.",
      features: ["같은 사례 집합에서는 항상 MAE 이상입니다.", "RMSE와 MAE의 간격이 크면 잔차 꼬리가 두꺼운 신호입니다."],
      caveats: ["이상치 하나가 대표 숫자를 크게 움직일 수 있으므로 MAE와 잔차 그림을 같이 봅니다."],
      complements: "MAE와 함께 보면 전형적인 오차와 이상치 주도 오차를 분리할 수 있습니다.",
    },
    {
      ...regressionLearn.sections[3],
      title: "R² — 결정계수",
      meaning: "R²는 잔차 오차를 목표값 자체의 분산과 비교합니다.",
      features: ["예측이 목표값의 변동을 평균 예측에 비해 얼마나 따라가는지 보여줍니다."],
      caveats: ["임상적으로 의미 있는 편향이 남아도 R²는 크게 남을 수 있습니다. 평균 부호 편향을 함께 읽어야 합니다."],
      complements: "분산 추적은 숫자 스케일의 보정과 다르므로 평균 부호 편향, MAE와 함께 봅니다.",
    },
    {
      ...regressionLearn.sections[4],
      title: "평균 부호 편향",
      meaning: "평균 부호 편향은 잔차의 부호를 보존해 예측이 평균적으로 높게 또는 낮게 이동했는지 보여줍니다.",
      features: ["양수는 과대예측, 음수는 과소예측을 뜻합니다."],
      caveats: ["서로 다른 방향의 잔차가 상쇄될 수 있으므로 크기는 MAE나 RMSE와 함께 봅니다."],
      complements: "강한 선형 상관이 있어도 값이 이동할 수 있으므로 Pearson r과 함께 봅니다.",
    },
    {
      ...regressionLearn.sections[5],
      title: "Pearson r",
      meaning: "Pearson r은 목표값과 예측값 사이의 선형 상관과 방향을 측정합니다.",
      features: ["직선 관계에서 순서와 스케일이 함께 움직이는지를 잘 포착합니다."],
      caveats: ["일정한 이동은 r을 거의 바꾸지 않을 수 있고, 비선형 단조 관계는 순위 일치보다 낮게 보일 수 있습니다."],
      complements: "Spearman ρ와 함께 보면 선형 상관과 단조 상관을 분리할 수 있습니다.",
    },
    {
      ...regressionLearn.sections[6],
      title: "Spearman ρ",
      meaning: "Spearman ρ는 값을 순위로 바꾼 뒤 상관을 계산해 순서가 단조적으로 보존되는지를 봅니다.",
      features: ["곡선 관계라도 순서가 보존되면 높게 남을 수 있습니다."],
      caveats: ["숫자 스케일의 보정은 보지 않습니다. 값 수준의 오차는 MAE, RMSE, 편향으로 확인합니다."],
      complements: "임상적으로 순서가 중요하지만 선형 스케일도 중요할 때 Pearson r과 함께 봅니다.",
    },
  ],
  complementarity: {
    intro: "회귀 지표는 같은 잔차를 서로 다른 질문으로 읽기 때문에 함께 봐야 합니다.",
    pairs: [
      { blindSpot: "전형적인 오차만 보고 이상치 강조가 약함", blindMetric: "MAE", caughtBy: "RMSE" },
      { blindSpot: "크기는 보지만 방향은 모름", blindMetric: "MAE / RMSE", caughtBy: "평균 부호 편향" },
      { blindSpot: "선형 추적은 보지만 숫자 이동은 놓침", blindMetric: "Pearson r", caughtBy: "평균 부호 편향" },
      { blindSpot: "선형 상관만 봄", blindMetric: "Pearson r", caughtBy: "Spearman ρ" },
    ],
    benchmarks: [
      {
        name: "회귀 결과 보고",
        task: "연속형 의료영상 목표값",
        combination: "MAE + RMSE + R² + 편향 + Pearson r + Spearman ρ",
        perspective: "크기, 큰 잔차, 분산, 이동, 상관을 함께 읽습니다.",
      },
    ],
  },
};

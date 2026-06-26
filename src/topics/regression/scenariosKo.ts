import type { Scenario } from "../../types/topic";
import { regressionScenarios } from "./scenarios";

export const regressionScenariosKo: Scenario[] = regressionScenarios.map((scenario) => {
  switch (scenario.id) {
    case "outlier-rmse-flip":
      return {
        ...scenario,
        title: "ADC 지도: 이상치 하나가 오차 해석을 바꿈",
        clinical: {
          situation: "모델이 병변 패치의 ADC 값을 추정합니다. 대부분은 가깝지만 한 패치가 움직임 아티팩트로 크게 빗나갑니다.",
          modality: "확산 MRI",
          atStake: "MAE는 전형적인 잔차를 요약하고, RMSE는 큰 잔차에 더 큰 무게를 둡니다.",
          consequence: "예측 B는 보통의 잔차가 작지만, 큰 오차 하나 때문에 RMSE는 A 쪽을 가리킵니다.",
        },
        teachingPoint: "MAE는 전형적인 잔차를 따라 B 쪽으로, RMSE는 큰 오차 하나를 증폭해 A 쪽으로 움직입니다.",
      };
    case "constant-bias-correlation-flip":
      return {
        ...scenario,
        title: "골연령: 상관이 일정한 이동을 가림",
        clinical: {
          situation: "골연령 모델이 환자 순서는 보존하지만 모든 나이를 약 3개월 높게 예측합니다.",
          modality: "손 X-ray",
          atStake: "상관은 값들이 함께 움직이는지를 보고, 평균 부호 편향은 추정치가 한쪽으로 이동했는지를 봅니다.",
          consequence: "A는 Pearson r을 1에 가깝게 유지하지만 양의 편향이 뚜렷합니다. B는 순위가 조금 흔들리는 대신 편향을 줄입니다.",
        },
        teachingPoint: "Pearson r은 직선 관계인 A를 따르고, 평균 부호 편향과 오차 크기는 B를 가리킵니다.",
      };
    case "monotonic-nonlinear-spearman":
      return {
        ...scenario,
        title: "위험 점수: 단조적이지만 비선형",
        clinical: {
          situation: "연속 위험 점수 예측에서 고위험 환자 구간의 숫자 스케일이 위로 휘어집니다.",
          modality: "CT 기반 위험 점수",
          atStake: "Pearson r은 선형 상관을, Spearman ρ는 순위가 보존되는 단조 관계를 봅니다.",
          consequence: "A는 모든 순위를 보존하지만 숫자 스케일이 휘어집니다. B는 더 선형적이지만 가까운 두 사례의 순위를 바꿉니다.",
        },
        teachingPoint: "Spearman ρ는 순위를 보존한 A를 따르고, Pearson r과 오차 크기는 숫자 스케일이 중요할 때 B로 움직일 수 있습니다.",
      };
    default:
      return {
        ...scenario,
        title: "박출률: 큰 R²와 이동된 스케일",
        clinical: {
          situation: "심장 모델이 전체 환자군의 박출률 분산은 따라가지만 측정값을 체계적으로 높게 예측합니다.",
          modality: "심장 MRI",
          atStake: "환자 간 분산이 크면 R²는 크게 남을 수 있습니다. 임상 임계값 주변에서는 편향도 따로 봐야 합니다.",
          consequence: "A는 분산을 많이 설명하지만, B는 평균 부호 오차를 0에 더 가깝게 둡니다.",
        },
        teachingPoint: "R²와 상관이 분산 추적을 보여도, 평균 부호 편향은 임상적으로 의미 있는 이동을 드러냅니다.",
      };
  }
});

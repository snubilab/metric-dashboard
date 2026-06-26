import type { Scenario } from "../../types/topic";
import {
  classificationState,
  confirmatoryCases,
  rareDiseaseCases,
  rocPrCases,
  screeningCases,
} from "./scenarioData";

export const classificationScenariosKo: Scenario[] = [
  {
    id: "rare-disease-accuracy-trap",
    title: "희귀 질환: 모두 음성일 때의 Accuracy 함정",
    clinical: {
      situation: "유병률이 낮은 질환 선별 코호트",
      modality: "흉부 CT 분류 모델",
      atStake: "양성은 드물지만, 놓친 양성이 추적검사의 핵심 위험이 됩니다.",
      consequence: "Accuracy는 높게 남아도 Sensitivity는 0일 수 있습니다.",
    },
    state: classificationState(rareDiseaseCases),
    teachingPoint:
      "모델 A는 모두 음성으로 예측해 Accuracy/Specificity에서 앞서고, 모델 B는 양성을 대부분 찾아 Sensitivity, Balanced Accuracy, PPV, NPV, F1에서 앞섭니다.",
    reference: "슬라이드 3-5: Confusion Matrix, Accuracy, Balanced Accuracy, class imbalance.",
  },
  {
    id: "screening-high-recall",
    title: "선별검사: 낮은 임계값에서 Recall 우선",
    clinical: {
      situation: "암 선별의 1차 통과 단계",
      modality: "유방촬영 분류 모델",
      atStake: "이 단계는 최종 진단이 아니라 2차 판독으로 넘기는 관문입니다.",
      consequence: "임계값을 낮추면 놓침 일부가 오경보로 이동합니다.",
    },
    state: classificationState(screeningCases),
    teachingPoint:
      "모델 A는 Sensitivity와 NPV에서 앞서고, 모델 B는 Specificity, PPV, Accuracy, F1에서 앞섭니다. 운영 목표가 어느 행을 먼저 볼지 정합니다.",
    reference: "슬라이드 12: 선별은 Sensitivity, NPV, F2처럼 Recall을 강조합니다.",
  },
  {
    id: "confirmatory-high-specificity",
    title: "확진 단계: 생검 전 Specificity 우선",
    clinical: {
      situation: "침습적 처치 전 확진 성격의 분류",
      modality: "초음파 악성도 분류 모델",
      atStake: "위양성은 불필요한 생검으로 이어질 수 있습니다.",
      consequence: "엄격한 임계값은 Sensitivity 일부를 내주고 Specificity와 PPV를 올립니다.",
    },
    state: classificationState(confirmatoryCases),
    teachingPoint:
      "모델 A는 Sensitivity와 Balanced Accuracy에서 앞서고, 모델 B는 Specificity, PPV, Accuracy, F1에서 앞섭니다.",
    reference: "슬라이드 12: 확진 결정은 Specificity, PPV, F0.5를 강조합니다.",
  },
  {
    id: "roc-pr-imbalance",
    title: "클래스 불균형에서 ROC와 PR의 순위 뒤집힘",
    clinical: {
      situation: "정상 풀이 큰 희귀 양성 검색",
      modality: "망막 질환 위험 분류 모델",
      atStake: "양성 클래스 자체가 임상적 관심 대상입니다.",
      consequence: "ROC 요약과 PR 요약이 같은 점수표를 다르게 순위화할 수 있습니다.",
    },
    state: classificationState(rocPrCases),
    teachingPoint:
      "모델 A는 대부분의 음성을 낮게 두어 AUROC에서 앞서고, 모델 B는 초기 검색 순서에 양성을 몰아 AP에서 앞섭니다.",
    reference: "슬라이드 8-10: ROC/AUROC와 PR/AUPRC/AP, 그리고 prevalence에 민감한 PR baseline.",
  },
];

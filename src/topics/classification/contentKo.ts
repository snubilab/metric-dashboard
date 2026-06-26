import type { EngineState } from "../../types/engine";
import type { LearnContent, MiniSimConfig } from "../../types/topic";

const SIM_STATE: EngineState = {
  grid: { width: 1, height: 1, spacingMm: [1, 1] },
  gt: [],
  predictions: [],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
};

function miniSim(kind: string, spotlightMetric: string): MiniSimConfig {
  return { kind, spotlightMetric, initialState: SIM_STATE };
}

export const classificationLearnKo: LearnContent = {
  intro:
    "영상 분류 모델은 각 검사에 양성 점수를 내고, 임계값이 그 점수를 양성/음성 예측으로 바꿉니다. 같은 점수표라도 Confusion Matrix, threshold sweep, 임상 운영점 중 무엇을 보느냐에 따라 강조되는 실패 양상이 달라집니다.",
  sections: [
    {
      id: "confusion-matrix",
      title: "Confusion Matrix",
      formula: "\\begin{bmatrix}TP & FN \\\\ FP & TN\\end{bmatrix}",
      meaning:
        "Confusion Matrix는 실제 양성/음성과 예측 양성/음성을 네 칸으로 셉니다. TP와 TN은 대각선 카운트, FP는 실제 음성을 양성으로 울린 오경보, FN은 실제 양성을 놓친 경우입니다.",
      features: [
        "고정 임계값 분류 지표는 TP, FP, FN, TN에서 출발합니다.",
        "오경보와 놓침을 하나의 총합에 숨기지 않고 분리해 보여줍니다.",
      ],
      caveats: [
        "임계값 하나가 Confusion Matrix 하나를 만들며, 임계값을 움직이면 모든 칸이 바뀝니다.",
        "같은 Accuracy라도 FP/FN 조합은 전혀 다를 수 있습니다.",
      ],
      figure: "cls-confusion",
    },
    {
      id: "sensitivity-specificity",
      title: "Sensitivity / Specificity",
      formula:
        "\\mathrm{Sensitivity}=\\frac{TP}{TP+FN},\\quad \\mathrm{Specificity}=\\frac{TN}{TN+FP}",
      meaning:
        "Sensitivity는 실제 양성 중 잡아낸 비율입니다. Specificity는 실제 음성 중 걸러낸 비율입니다. 둘은 Confusion Matrix의 실제 클래스 기준 두 행을 설명합니다.",
      features: [
        "Sensitivity는 FN을 통해 놓친 양성을 추적합니다.",
        "Specificity는 FP를 통해 오경보를 추적합니다.",
        "Balanced Accuracy는 Sensitivity와 Specificity의 평균입니다.",
      ],
      caveats: [
        "Sensitivity만 보면 위양성 부담이 보이지 않습니다.",
        "Specificity만 보면 놓친 양성 수가 보이지 않습니다.",
      ],
      figure: "cls-rows",
      miniSim: miniSim("cls-row-tradeoff", "sensitivity"),
      complements: "클래스 비율이 기울어진 문제에서는 두 행을 함께 보세요.",
    },
    {
      id: "ppv-npv",
      title: "PPV / NPV",
      formula:
        "\\mathrm{PPV}=\\frac{TP}{TP+FP},\\quad \\mathrm{NPV}=\\frac{TN}{TN+FN}",
      meaning:
        "PPV는 예측 양성 중 실제 양성의 비율입니다. NPV는 예측 음성 중 실제 음성의 비율입니다. 둘은 예측 열 기준 지표라 prevalence에 따라 움직입니다.",
      features: [
        "PPV는 양성 예측의 precision입니다.",
        "NPV는 음성 결과로 추적검사를 줄일 때 유용합니다.",
      ],
      caveats: [
        "Sensitivity와 Specificity가 같아도 prevalence가 바뀌면 PPV와 NPV가 바뀝니다.",
        "희귀 양성 문제에서는 Sensitivity가 높아도 PPV가 낮을 수 있습니다.",
      ],
      figure: "cls-columns",
      miniSim: miniSim("cls-prevalence-columns", "ppv"),
    },
    {
      id: "accuracy-balanced-accuracy",
      title: "Accuracy vs Balanced Accuracy",
      formula:
        "\\mathrm{Accuracy}=\\frac{TP+TN}{N},\\quad \\mathrm{Balanced\\ Accuracy}=\\frac{\\mathrm{Sensitivity}+\\mathrm{Specificity}}{2}",
      meaning:
        "Accuracy는 전체 중 맞춘 비율입니다. Balanced Accuracy는 Sensitivity와 Specificity를 평균내어 양성/음성 클래스에 같은 행 가중치를 줍니다.",
      features: [
        "클래스가 비슷하게 섞인 문제에서는 Accuracy가 직관적입니다.",
        "불균형 문제에서는 Balanced Accuracy가 희귀 클래스를 더 직접적으로 드러냅니다.",
      ],
      caveats: [
        "유병률 5%에서 모두 음성으로 예측하면 Accuracy는 0.95이고 Sensitivity는 0입니다.",
        "Balanced Accuracy도 두 행을 하나로 요약하므로 Sensitivity와 Specificity를 함께 확인해야 합니다.",
      ],
      figure: "cls-accuracy",
      miniSim: miniSim("cls-accuracy-imbalance", "accuracy"),
    },
    {
      id: "precision-recall-f1-fbeta",
      title: "Precision / Recall / F1 / F-beta",
      formula:
        "F_\\beta=(1+\\beta^2)\\frac{\\mathrm{Precision}\\cdot\\mathrm{Recall}}{\\beta^2\\mathrm{Precision}+\\mathrm{Recall}}",
      meaning:
        "Precision은 PPV이고 Recall은 Sensitivity입니다. F1은 둘의 조화평균이며, F-beta는 beta로 가중을 바꿉니다. beta가 1보다 크면 Recall, 1보다 작으면 Precision 쪽을 더 반영합니다.",
      features: [
        "F1은 한 임계값에서 양성 예측 열과 실제 양성 행을 함께 요약합니다.",
        "F2는 선별처럼 Recall을 강조할 때, F0.5는 확진처럼 Precision을 강조할 때 맞습니다.",
      ],
      caveats: [
        "F1과 F-beta는 선택한 임계값에 의존합니다.",
        "TN을 포함하지 않으므로 오경보가 중요하면 Specificity와 함께 봐야 합니다.",
      ],
      figure: "cls-f1",
      miniSim: miniSim("cls-fbeta-weight", "fBeta"),
    },
    {
      id: "roc-auroc",
      title: "ROC / AUROC",
      formula:
        "\\mathrm{ROC}: (\\mathrm{FPR},\\mathrm{TPR}),\\quad \\mathrm{AUROC}=P(s_+>s_-)",
      meaning:
        "ROC는 임계값을 훑으며 false-positive rate와 true-positive rate를 그립니다. AUROC는 무작위 양성 점수가 무작위 음성 점수보다 높을 확률로 해석할 수 있습니다.",
      features: [
        "ROC는 임계값 선택과 점수 순위를 분리해 보여줍니다.",
        "AUROC는 하나의 운영 임계값에 묶이지 않습니다.",
      ],
      caveats: [
        "AUROC는 FPR 분모가 전체 음성이기 때문에 클래스 불균형에서 안정적으로 보일 수 있습니다.",
        "희귀 양성 검색에서는 ROC와 함께 PR, AUPRC/AP를 확인하세요.",
      ],
      figure: "cls-curves",
    },
    {
      id: "pr-auprc-ap",
      title: "PR / AUPRC / AP",
      formula: "\\mathrm{AP}=\\sum_k (R_k-R_{k-1})P_k",
      meaning:
        "PR 곡선은 양성 클래스 관점에서 Recall과 Precision을 임계값별로 그립니다. AUPRC와 AP는 더 많은 양성을 회수할수록 precision이 어떻게 변하는지 요약합니다.",
      features: [
        "PR은 precision 분모에 FP가 직접 들어가므로 위양성을 민감하게 드러냅니다.",
        "prevalence baseline은 양성 prevalence입니다.",
        "AP는 ranked list 앞부분에 양성이 얼마나 모이는지 반영합니다.",
      ],
      caveats: [
        "AUPRC/AP 값은 prevalence의 영향을 크게 받습니다.",
        "AP와 사다리꼴 AUPRC는 관련된 요약이지만 보간 방식은 명시해야 합니다.",
      ],
      figure: "cls-curves",
    },
    {
      id: "fixed-operating-points",
      title: "Fixed operating points: Sens@Spec / Spec@Sens / partial AUC",
      formula:
        "\\mathrm{Sens@Spec}_{0.90}=\\max_t \\mathrm{Sensitivity}(t)\\;\\mathrm{s.t.}\\;\\mathrm{Specificity}(t)\\ge 0.90",
      meaning:
        "Fixed operating point는 Sens@Spec 0.90, Spec@Sens 0.95처럼 명시된 임상 제약 아래의 값을 보고합니다. partial AUC는 임상적으로 의미 있는 ROC 구간만 적분합니다.",
      features: [
        "생검 전 최소 specificity처럼 실제 배포 조건과 직접 연결됩니다.",
        "하나의 전체 curve 면적 안에 임계값 제약을 숨기지 않습니다.",
      ],
      caveats: [
        "목표 제약값을 결과와 함께 반드시 써야 합니다.",
        "목표 제약이 달라지면 모델 순위가 뒤집힐 수 있습니다.",
      ],
      figure: "cls-threshold",
    },
  ],
};

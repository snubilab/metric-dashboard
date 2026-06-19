/**
 * Korean Learn content for the Image Detection topic.
 *
 * Mirrors `detectionLearn` (content.ts) exactly — same section ids, same KaTeX
 * formulas, and the same mini-sim configs (reused from content.ts) — with the
 * intro, titles, meaning, features, and caveats translated into natural
 * technical Korean. Metric tokens ('AP', 'mAP', 'FROC', 'IoU', 'AP50', 'AP75')
 * are kept as-is inside the Korean text.
 */

import type { LearnContent, MiniSimConfig } from "../../types/topic";
import type { EngineState } from "../../types/engine";

/** Minimal valid EngineState: default grid, default policy, no shapes/detections. */
function emptyState(): EngineState {
  return {
    grid: { width: 256, height: 256, spacingMm: [1, 1] },
    gt: [],
    predictions: [
      { id: "A", shapes: [] },
      { id: "B", shapes: [] },
    ],
    policy: { emptyDice: "one", emptyDistance: "undefined" },
  };
}

/** Builds a mini-sim config for a detection widget against an empty engine state. */
function detectionSim(kind: string, spotlightMetric: string): MiniSimConfig {
  return { kind, spotlightMetric, initialState: emptyState() };
}

export const detectionLearnKo: LearnContent = {
  intro:
    "검출 지표는 서로 맞물린 두 가지 질문에 답합니다. 객체가 어디에 있는가, " +
    "그리고 모델이 얼마나 확신하는가입니다. 어떤 수치를 계산하기 전에 먼저 " +
    "매칭 규칙을 고정해야 합니다. 위치 판정 기준(IoU 또는 거리 임계값), 신뢰도 " +
    "임계값, 그리고 예측과 정답 객체를 일대일로 짝짓는 규칙이 그것입니다. 이 " +
    "매칭으로부터 정밀도, 재현율, F1, 그리고 임계값에 의존하지 않는 요약 지표인 " +
    "AP와 mAP가 도출됩니다. 의료 병변 검출에서는 여기에 FROC와 고정된 거짓양성 " +
    "예산에서 보고하는 민감도가 더해지는데, 검진에서는 병변을 놓치는 비용과 " +
    "거짓 경보를 하나 더 내는 비용이 대칭적이지 않기 때문입니다.",
  sections: [
    {
      id: "matching",
      title: "매칭 & IoU (일대일)",
      formula: "\\mathrm{IoU} = \\frac{|A \\cap B|}{|A \\cup B|}",
      meaning:
        "검출 지표는 예측이 정답 객체와 매칭되는지를 판정하는 데서 시작합니다. " +
        "박스 검출에서 위치 판정 기준은 예측 박스 A와 정답 박스 B의 " +
        "교집합/합집합(IoU)입니다. IoU 임계값이 0.5일 때, IoU >= 0.5인 예측은 " +
        "참양성(TP)이고 IoU < 0.5인 예측은 거짓양성(FP, 매칭되지 않음)입니다. " +
        "매칭은 일대일입니다. 하나의 정답 객체는 단 하나의 예측 — 가장 높은 " +
        "점수를 받았거나 가장 잘 겹치는 예측 — 에만 매칭될 수 있고, 같은 객체에 " +
        "대한 중복 예측은 거짓양성으로 집계됩니다.",
      features: [
        "IoU는 박스 기반 검출에서 표준이 되는 위치 판정 기준입니다.",
        "점(point)이나 후보(candidate) 검출에서는 IoU 대신 거리 임계값을 쓸 수 있습니다.",
        "매칭은 신뢰도 임계값과 평가 단위(병변별·영상별·스캔별)도 함께 고정해야 합니다.",
        "탐욕적(greedy) 매칭은 신뢰도가 가장 높은 예측부터 할당합니다.",
      ],
      caveats: [
        "한 객체에 박스를 중복으로 그려도 추가 점수는 없으며, 오히려 거짓양성이 됩니다.",
        "하나의 정답 객체를 두 개의 참양성으로 쪼개어 인정할 수는 없습니다.",
        "IoU 임계값을 바꾸면 어떤 예측이 매칭으로 집계되는지가 달라지고, 따라서 이후의 모든 지표가 함께 바뀝니다.",
      ],
      figure: "det-matching",
      complements:
        "TP/FP/FN를 정의합니다. 한 병변에 대한 중복 검출은 FP가 됩니다.",
      miniSim: detectionSim("matching-duplicate-fp", "matching"),
    },
    {
      id: "precision",
      title: "정밀도 (Precision)",
      formula: "\\mathrm{Precision} = \\frac{TP}{TP + FP}",
      meaning:
        "정밀도는 예측한 객체 중 실제로 맞은 비율을 측정합니다. 정밀도가 낮다는 " +
        "것은 모델이 거짓양성 검출을 많이 만들어낸다는 뜻입니다.",
      features: [
        "거짓양성에 민감합니다.",
        "매칭 이후 고정된 신뢰도 임계값에서 계산합니다.",
      ],
      caveats: [
        "정밀도가 높다고 해서 얼마나 많은 객체를 놓쳤는지는 알 수 없습니다.",
        "보수적인 모델은 많은 병변을 놓치면서도 높은 정밀도를 보일 수 있습니다.",
      ],
      figure: "det-confusion",
      complements:
        "재현율(그리고 임계값을 훑는 AP)과 함께 보고하세요.",
    },
    {
      id: "recall",
      title: "재현율 / 민감도 (Recall / Sensitivity)",
      formula: "\\mathrm{Recall} = \\mathrm{Sensitivity} = \\frac{TP}{TP + FN}",
      meaning:
        "재현율은 정답 객체 중 실제로 검출된 비율을 측정합니다. 재현율이 낮다는 " +
        "것은 놓친 객체가 많다는 뜻이며, 놓친 병변이 가장 큰 손실인 검진에서 " +
        "가장 중요한 수치입니다.",
      features: [
        "거짓음성(놓친 객체)에 민감합니다.",
        "검출에서는 민감도와 동일한 개념입니다.",
      ],
      caveats: [
        "재현율만으로는 거짓양성 부담에 대해 아무것도 말해주지 않습니다.",
        "박스를 마구 예측하면 재현율은 부풀릴 수 있지만 정밀도가 무너집니다.",
      ],
      figure: "det-confusion",
      complements:
        "정밀도와 함께 보고하세요. 병변 검출에서는 FROC를 통해 스캔당 FP와 함께 보고하세요.",
    },
    {
      id: "f1",
      title: "F1 점수",
      formula:
        "F_1 = \\frac{2 \\times \\mathrm{Precision} \\times \\mathrm{Recall}}{\\mathrm{Precision} + \\mathrm{Recall}}",
      meaning:
        "F1은 정밀도와 재현율의 조화 평균으로, 고정된 하나의 신뢰도 임계값에서 " +
        "두 지표를 한 수치로 요약합니다.",
      features: [
        "정밀도와 재현율을 하나의 수치로 균형 있게 나타냅니다.",
        "단일 운영 임계값이 의미를 가질 때 유용합니다.",
      ],
      caveats: [
        "F1은 선택한 신뢰도 임계값에 의존합니다.",
        "AP처럼 모든 임계값에 걸친 동작을 요약하지는 못합니다.",
      ],
      figure: "det-confusion",
      complements:
        "임계값에 의존하므로, 임계값에 의존하지 않는 요약으로는 AP를 보고하세요.",
    },
    {
      id: "ap",
      title: "평균 정밀도 (AP)",
      formula: "\\mathrm{AP} = \\int_0^1 p(r)\\,dr",
      meaning:
        "AP(Average Precision)는 신뢰도 임계값에 걸친 정밀도-재현율 곡선 전체를 " +
        "요약합니다. 여기서 p(r)은 재현율 r에서의 정밀도입니다. AP는 신뢰도 " +
        "순위와 위치 정확성을 임계값에 의존하지 않는 하나의 점수로 결합합니다.",
      features: [
        "객체 검출 벤치마크에서 지배적으로 쓰이는 요약 지표입니다.",
        "올바른 검출을 거짓 검출보다 높은 신뢰도로 순위 매기는 모델에 보상을 줍니다.",
        "매칭에 사용한 IoU 임계값(또는 위치 판정 기준)에 의존합니다.",
      ],
      caveats: [
        "AP는 IoU 임계값에 의존하므로 AP50, AP75, AP@[.5:.95]를 명시적으로 표기하세요.",
        "보간 방식(VOC 11점, all-points, COCO 101점)이 다르므로 어떤 방식인지 반드시 밝혀야 합니다.",
        "AP는 곡선 전체를 적분하므로 단일 운영 임계값에 대해서는 불변입니다.",
      ],
      figure: "pr-curve",
      complements:
        "AP50과 AP75를 함께(또는 AP@[.5:.95]를) 보고하세요. AP50은 높은데 AP75가 낮으면 위치 판정이 느슨하다는 뜻입니다.",
      miniSim: detectionSim("ap-reorder", "ap"),
    },
    {
      id: "map",
      title: "평균 AP (mAP)",
      formula:
        "\\mathrm{mAP} = \\frac{1}{N}\\sum_{i=1}^{N} \\mathrm{AP}_i",
      meaning:
        "mAP는 객체 클래스, 여러 IoU 임계값, 또는 둘 모두에 걸쳐 평균낸 AP의 " +
        "평균입니다. 클래스별·임계값별 검출 품질을 하나의 대표 수치로 응축합니다.",
      features: [
        "클래스 및/또는 IoU 임계값에 걸쳐 AP를 평균냅니다.",
        "대부분의 검출 챌린지에서 순위를 정하는 대표 지표입니다.",
      ],
      caveats: [
        "평균을 내면 어떤 클래스나 IoU 임계값이 점수를 좌우하는지가 가려집니다.",
        "평균을 내는 축(클래스 vs IoU 임계값)을 반드시 명시해야 합니다.",
      ],
      figure: "pr-curve",
      complements:
        "클래스/IoU에 걸쳐 평균낸 값이므로, 불균형을 보려면 클래스별 AP를 살펴보세요.",
    },
    {
      id: "ap50",
      title: "AP50 (느슨한 위치 판정)",
      formula: "\\mathrm{AP50} = \\mathrm{AP}\\,|_{\\mathrm{IoU}=0.50}",
      meaning:
        "AP50은 IoU 임계값 0.50에서 계산한 AP로, 박스 위치가 대략 맞기만 해도 " +
        "정답으로 인정하는 비교적 느슨한 위치 판정 기준입니다.",
      features: [
        "부정확한 박스 배치에 관대합니다.",
        "단일 AP 값으로 가장 흔히 보고됩니다.",
      ],
      caveats: [
        "AP50이 높다고 해서 위치 정확성이 보장되지는 않습니다.",
        "박스가 실제로 얼마나 정밀한지 보려면 AP75와 비교해야 합니다.",
      ],
      figure: "ap-threshold",
      complements:
        "둘을 비교하면 위치 판정의 엄격함을 읽을 수 있습니다.",
    },
    {
      id: "ap75",
      title: "AP75 (엄격한 위치 판정)",
      formula: "\\mathrm{AP75} = \\mathrm{AP}\\,|_{\\mathrm{IoU}=0.75}",
      meaning:
        "AP75는 IoU 임계값 0.75에서 계산한 AP로, 검출을 정답으로 인정하려면 더 " +
        "정확한 박스 배치를 요구하는 엄격한 기준입니다.",
      features: [
        "딱 맞게 잘 위치한 박스에 보상을 줍니다.",
        "위치 품질을 판단하려면 AP50과 함께 읽어야 합니다.",
      ],
      caveats: [
        "AP50이 높은데 AP75가 낮다면, 모델이 객체를 찾기는 하지만 느슨하게 위치시키는 것입니다.",
        "작거나 경계를 잡기 어려운 구조에서는 AP75가 급격히 떨어질 수 있습니다.",
      ],
      figure: "ap-threshold",
      complements:
        "둘을 비교하면 위치 판정의 엄격함을 읽을 수 있습니다.",
    },
    {
      id: "apRange",
      title: "AP@[.5:.95] (COCO)",
      formula:
        "\\mathrm{AP}_{[.5:.95]} = \\frac{1}{10}\\sum_{t \\in \\{.5,.55,\\dots,.95\\}} \\mathrm{AP}\\,|_{\\mathrm{IoU}=t}",
      meaning:
        "AP@[.5:.95]는 0.50부터 0.95까지 0.05 간격으로 이루어진 열 개의 IoU " +
        "임계값에 걸쳐 AP를 평균냅니다. IoU 임계값을 훑어가며 평가하므로 하나의 " +
        "기준점이 아니라 전 범위에 걸친 위치 품질을 평가합니다.",
      features: [
        "COCO의 핵심 지표로, 일관된 위치 정확성에 보상을 줍니다.",
        "느슨한 임계값에서만 매칭되는 모델에 불이익을 줍니다.",
      ],
      caveats: [
        "AP50보다 까다로우므로 절댓값은 더 낮게 보입니다.",
        "각 IoU 임계값마다 PR 곡선을 다시 계산하므로 비용이 더 큽니다.",
      ],
      figure: "pr-curve",
      complements:
        "여러 IoU 임계값에 걸친 위치 품질을 요약합니다.",
    },
    {
      id: "froc",
      title: "FROC (Free-response ROC)",
      formula: "y = \\mathrm{Sensitivity}, \\quad x = \\frac{\\#\\,FP}{\\text{영상 또는 스캔}}",
      meaning:
        "FROC 곡선은 병변 단위 민감도(y)를 영상당 또는 스캔당 거짓양성 개수(x)에 " +
        "대해 그립니다. 거짓양성 부담을 명시적으로 드러내면서 얼마나 많은 병변을 " +
        "잡아내는지를 평가합니다. 하나의 영상이나 스캔에 여러 병변이 있을 수 있는 " +
        "상황에 적합한 틀입니다.",
      features: [
        "의료 병변 검출과 CAD(컴퓨터 보조 진단)의 표준입니다.",
        "영상이나 스캔당 여러 병변을 다룰 수 있습니다.",
        "원하는 임의의 거짓양성 수준에서 민감도를 읽어낼 수 있습니다.",
        "전체 슬라이드 병리에도 쓰입니다 — CAMELYON16은 전이 검출을 FROC로 " +
          "채점하며, 민감도를 영상당 FP에 대해 그립니다.",
      ],
      caveats: [
        "후보 검출을 늘리면 민감도는 올라가지만 스캔당 FP도 함께 올라갑니다.",
        "단일 민감도 수치를 보고할 때는 반드시 곡선을 함께 제시해야 합니다.",
        "영상당 FP와 스캔당 FP는 서로 다른 단위이므로 혼동하면 안 됩니다.",
      ],
      figure: "froc-fig",
      complements:
        "민감도를 스캔당 FP와 함께 묶습니다. FP 예산 없는 민감도 수치는 의미가 없습니다.",
      miniSim: detectionSim("froc-add-fp", "froc"),
    },
    {
      id: "sensAtFp",
      title: "고정 영상당 FP 또는 스캔당 FP에서의 민감도",
      formula:
        "\\mathrm{Score} = \\frac{1}{|F|}\\sum_{f \\in F} \\mathrm{Sensitivity}\\,(\\mathrm{FP} \\le f)",
      meaning:
        "FROC 곡선을 하나 이상의 미리 정한 거짓양성 예산에서 읽으면, 고정된 " +
        "거짓양성 조건에서의 검출 민감도를 보고할 수 있습니다. 예를 들어 LUNA16은 " +
        "스캔당 FP가 {1/8, 1/4, 1/2, 1, 2, 4, 8}인 일곱 개 수준에 걸쳐 민감도를 " +
        "평균내고, DeepLesion은 영상당 거짓양성 5개에서의 민감도를 보고하며, " +
        "CAMELYON16은 전체 슬라이드 전이 검출을 FROC로 채점하면서 민감도를 " +
        "영상당 평균 거짓양성에 대해 읽습니다.",
      features: [
        "임상적으로 의미 있는 FP 예산에서의 성능을 직접 진술합니다.",
        "CAD 환경에서는 임계값에 의존하지 않는 단일 요약보다 해석하기 쉽습니다.",
        "여러 FP 수준을 평균내면 챌린지 순위를 정하는 단일 점수가 됩니다.",
        "여러 모달리티에 걸칩니다 — LUNA16(CT, 스캔당 FP), DeepLesion(CT, 영상당 FP), " +
          "CAMELYON16(전체 슬라이드 병리, 영상당 FP).",
      ],
      caveats: [
        "선택한 FP 예산은 그것이 대표하는 임상 워크플로와 맞아야 합니다.",
        "영상당 FP 예산과 스캔당 FP 예산은 서로 바꿔 쓸 수 없습니다.",
        "하나의 FP 수준에서의 점수는 다른 수준에서의 동작을 가립니다.",
      ],
      figure: "sensatfp",
      complements:
        "고정된 영상당 FP 또는 스캔당 FP 수준을 항상 함께 명시하세요.",
    },
  ],
  complementarity: {
    intro:
      "어떤 단일 검출 수치도 그 자체만으로는 신뢰할 수 없습니다. 위치 판정, " +
      "거짓양성 부담, 임계값 선택, 중복 억제는 서로 독립적인 네 개의 축이며, " +
      "모든 대표 지표는 그중 적어도 하나에 대해 눈이 멉니다. 한 축에서의 높은 " +
      "점수가 다른 축에서의 실패를 가리지 못하도록 지표를 상호 보완적인 쌍으로 " +
      "보고하세요. 이것이 바로 의료 검출 벤치마크가 강제하는 방식입니다.",
    pairs: [
      {
        blindSpot:
          "느슨한 vs 엄격한 위치 판정 — 병변과 대략 겹치지만 중심에서 벗어난 " +
          "박스도 여전히 정답으로 집계됩니다.",
        blindMetric: "AP50",
        caughtBy:
          "IoU 기준을 높여 위치 판정이 실제로 얼마나 엄격한지 드러내는 " +
          "AP75 / AP@[.5:.95].",
      },
      {
        blindSpot:
          "거짓양성 부담 — 민감도 수치는 몇 개의 병변을 잡았는지는 알려주지만 " +
          "그 대가로 얼마나 많은 거짓 경보가 발생했는지는 말해주지 않습니다.",
        blindMetric: "민감도 단독",
        caughtBy:
          "민감도를 명시적인 거짓양성 예산에 고정하는 FROC / 스캔당 FP.",
      },
      {
        blindSpot:
          "임계값 의존성 — 단일 신뢰도 임계값은 하나의 운영점을 돋보이게 " +
          "조정될 수 있습니다.",
        blindMetric: "단일 임계값에서의 F1",
        caughtBy:
          "모든 임계값에 걸친 동작을 요약하는 AP / PR 곡선.",
      },
      {
        blindSpot:
          "중복 검출 — 하나의 병변에 여러 박스를 쌓아 올려도 그 병변은 여전히 " +
          "검출된 것으로 기록됩니다.",
        blindMetric: "재현율",
        caughtBy:
          "같은 병변에 대한 추가 박스가 거짓양성이 되는, 일대일 매칭을 동반한 정밀도.",
      },
    ],
    benchmarks: [
      {
        name: "RSNA Pneumonia Detection",
        task: "흉부 X선 폐렴 음영 검출",
        combination: "IoU 임계값에 걸쳐 평균낸 mAP",
        perspective:
          "IoU 임계값을 훑어, 음영을 찾았는지뿐 아니라 위치 판정의 엄격함까지 " +
          "채점합니다.",
      },
      {
        name: "LUNA16",
        task: "CT 폐 결절 검출",
        combination:
          "FROC — 고정 스캔당 FP 수준 {1/8, 1/4, 1/2, 1, 2, 4, 8}에서의 평균 민감도",
        perspective:
          "재현율만 보고하는 대신, 결절 민감도를 명시적인 스캔당 거짓양성 예산에 " +
          "묶습니다.",
      },
      {
        name: "CAMELYON16",
        task: "병리 전체 슬라이드 전이 검출",
        combination: "FROC — 민감도 vs 영상당 FP",
        perspective:
          "전이 민감도와 함께 슬라이드당 거짓양성 부담을 명시적으로 드러냅니다.",
      },
      {
        name: "DeepLesion",
        task: "CT 범용 병변 검출",
        combination: "고정 영상당 FP에서의 민감도(예: 영상당 5 FP)",
        perspective:
          "영상당 임상적으로 의미 있는 거짓양성 예산에서의 검출 성능을 진술합니다.",
      },
    ],
  },
};

export default detectionLearnKo;

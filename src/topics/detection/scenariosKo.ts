/**
 * Korean detection scenarios.
 *
 * Mirrors `detectionScenarios` (scenarios.ts) exactly — same ids, same
 * EngineState objects (reused via `detectionScenarios`), and same references —
 * with title, clinical context, and teaching point translated into natural
 * technical Korean. Metric tokens ('AP', 'FROC', 'IoU', 'AP50', 'AP75') are kept
 * as-is inside the Korean text.
 */

import type { Scenario } from "../../types/topic";
import { detectionScenarios } from "./scenarios";

/** Looks up the English scenario by id to reuse its state and reference. */
function base(id: string): Scenario {
  const scenario = detectionScenarios.find((s) => s.id === id);
  if (!scenario) {
    throw new Error(`Unknown detection scenario id: ${id}`);
  }
  return scenario;
}

export const detectionScenariosKo: Scenario[] = [
  {
    ...base("luna16-nodule-fp-burden"),
    title: "LUNA16: 거짓양성에 파묻히는 폐결절 CAD",
    clinical: {
      situation:
        "폐결절 CAD 시스템이 검진용 흉부 CT에서 후보를 표시합니다. 미세하고 " +
        "대비가 낮은 결절을 잡으려면 임계값을 낮춰야 하는데, 그러면 방사선의가 " +
        "일일이 기각해야 할 추가 표시가 스캔마다 쏟아집니다.",
      modality: "흉부 CT",
      atStake:
        "악성 결절을 놓치면 암 진단이 늦어지고, 스캔당 거짓 표시가 과도하면 판독이 " +
        "느려지고 경보 피로가 쌓입니다.",
      consequence:
        "용인 가능한 스캔당 1 FP에서 민감도는 약 0.8이고, 스캔당 4 FP까지도 여전히 " +
        "0.8에 머뭅니다. 미세 결절은 아주 낮은 임계값에서야 드러나므로, 완전한 " +
        "민감도에 도달하려면 스캔당 4 FP를 한참 넘어선 약 5.4가 듭니다. LUNA16 " +
        "점수는 스캔당 FP가 {1/8, 1/4, 1/2, 1, 2, 4, 8}인 일곱 개 예산에 걸쳐 이 " +
        "절충을 평균냅니다.",
    },
    teachingPoint:
      "FROC는 거짓양성 부담을 명시적으로 드러냅니다. 병변 민감도가 오를 때마다 " +
      "스캔당 거짓 표시가 늘어나는 대가를 치릅니다. 어떤 스캔당 FP에서 측정했는지 " +
      "없이는 단일 민감도 수치는 의미가 없습니다.",
  },
  {
    ...base("rsna-ap50-vs-ap75"),
    title: "RSNA 폐렴: AP50은 높고 AP75는 낮다",
    clinical: {
      situation:
        "한 모델이 흉부 X선에서 폐렴 음영 주위에 경계 박스를 그립니다. 모든 박스가 " +
        "올바른 음영 위에 놓이지만 중심에서 살짝 벗어나 있어, 기준 박스와 대략 IoU " +
        "0.60으로 겹칩니다.",
      modality: "흉부 X선",
      atStake:
        "'음영을 검출했다'가 '딱 맞게 위치시켰다'까지 의미해야 하는지의 문제입니다. " +
        "느슨한 박스도 판독자를 올바른 영역으로 안내하지만, 추적 측정을 안내하는 " +
        "소견이라면 딱 맞는 박스가 더 중요합니다.",
      consequence:
        "IoU 0.50에서는 세 음영 모두 검출로 집계되어 AP50이 높습니다. IoU 0.75에서는 " +
        "어떤 박스도 자격을 얻지 못해 AP75가 무너집니다 — 같은 모델을 위치 정밀도로 " +
        "판정한 결과입니다.",
    },
    teachingPoint:
      "AP50이 높은데 AP75가 낮은 조합은, 객체를 찾기는 하지만 느슨하게 위치시키는 " +
      "모델의 특징입니다. 하나만 떼어 인용하지 말고 항상 AP50, AP75, AP@[.5:.95]를 " +
      "함께 읽으세요.",
  },
  {
    ...base("deeplesion-sensitivity-at-fixed-fp"),
    title: "DeepLesion: 영상당 거짓양성 5개에서의 민감도",
    clinical: {
      situation:
        "범용 병변 검출기가 CT 한 단면에서 유형을 가리지 않고 병변을 표시합니다. " +
        "뚜렷한 병변은 확신 있게 표시되지만, 미세한 병변은 여러 거짓양성과 함께 " +
        "낮은 점수에서야 드러납니다.",
      modality: "CT (범용 병변 검출)",
      atStake:
        "검토자가 영상당 일정 수의 거짓양성을 용인하기로 했을 때 병변이 얼마나 " +
        "잡히는가입니다 — DeepLesion은 영상당 5 FP에서의 민감도를 보고합니다.",
      consequence:
        "영상당 5 FP에서 민감도는 1.0에 도달하지만, 더 엄격한 영상당 1 FP에서는 " +
        "0.5로 떨어집니다. 대표 수치는 그것이 측정된 FP 예산과 함께일 때만 의미가 " +
        "있습니다.",
    },
    teachingPoint:
      "고정 영상당 FP에서의 민감도는 거짓양성 예산을 고정하여 두 검출기를 공정하게 " +
      "비교할 수 있게 해줍니다 — 다만 그 예산은 임상 워크플로와 맞아야 하고, 영상당 " +
      "FP는 스캔당 FP와 바꿔 쓸 수 없습니다.",
  },
  {
    ...base("camelyon16-metastasis-fp-per-image"),
    title: "CAMELYON16: 영상당 FP에 대한 전이 검출",
    clinical: {
      situation:
        "한 검출기가 전체 슬라이드 영상에서 림프절 전이를 위치시킵니다. 큰 전이 " +
        "병소는 확신 있게 검출되지만, 작은 병소는 애매하고, 양성 모방 병변이 " +
        "산발적인 거짓양성을 만들어냅니다.",
      modality: "전체 슬라이드 조직병리",
      atStake:
        "병변 단위 검출 민감도를, 병리의가 검토해야 할 슬라이드당 평균 거짓양성 " +
        "개수와 견주어 따집니다.",
      consequence:
        "민감도는 영상당 1 FP에서 약 0.75이고, 작은 전이를 더 높은 영상당 FP에서 " +
        "받아들여야 비로소 1.0에 도달합니다. 이는 CAMELYON16의 FROC 평가를 " +
        "그대로 반영합니다.",
    },
    teachingPoint:
      "전체 슬라이드 영상에서 FROC는 영상당 FP에 대해 그려집니다. 병변 단위 민감도는 " +
      "병리의가 용인할 영상당 거짓양성 부담을 고정한 뒤에야 의미를 가집니다.",
  },
];

export default detectionScenariosKo;

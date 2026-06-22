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
        "스캔당 FP 1개를 허용하는 지점에서 민감도는 약 0.8이고, 스캔당 4 FP까지 올려도 " +
        "여전히 0.8에 머뭅니다. 미세 결절은 임계값을 아주 낮춰야 비로소 드러나므로, " +
        "민감도를 끝까지 끌어올리려면 스캔당 4 FP를 한참 넘긴 약 5.4가 필요합니다. LUNA16 " +
        "점수는 스캔당 FP가 {1/8, 1/4, 1/2, 1, 2, 4, 8}인 일곱 개 예산에 걸쳐 이 " +
        "절충을 평균낸 값입니다.",
    },
    teachingPoint:
      "같은 스캔을 보는 두 검출기입니다. A는 적극적이라 모든 결절을 잡지만(재현율 " +
      "1.0) 스캔마다 거짓 표시를 잔뜩 남깁니다(정밀도 0.16). B는 보수적이라 거짓 " +
      "표시는 거의 없지만(정밀도 1.0) 결절의 5분의 1을 놓칩니다(재현율 0.8). 재현율은 " +
      "A를, 정밀도와 F1은 B를 가리킵니다. 어느 쪽을 쓸지는 놓친 암과 판독 피로 중 " +
      "무엇이 더 비싼지에 달려 있으니, 재현율과 정밀도는 늘 함께 보세요.",
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
        "'음영을 검출했다'가 '딱 맞게 잡았다'까지 뜻해야 하는지가 쟁점입니다. " +
        "느슨한 박스도 판독자를 올바른 영역으로 안내하지만, 추적 측정의 근거가 되는 " +
        "소견이라면 딱 맞는 박스가 더 중요합니다.",
      consequence:
        "IoU 0.50에서는 세 음영이 모두 검출로 집계되어 AP50이 높습니다. 반면 IoU " +
        "0.75에서는 어떤 박스도 기준을 넘지 못해 AP75가 무너집니다. 같은 모델을 위치 " +
        "정밀도로 다시 판정했을 뿐인데도 그렇습니다.",
    },
    teachingPoint:
      "같은 음영을 보는 두 검출기입니다. A는 모두 찾지만 위치가 느슨해서 AP50은 " +
      "높지만(1.0) AP@[.5:.95]는 낮습니다(0.30). B는 더 적은 음영에 대해 위치를 정확히 " +
      "잡아 AP50은 낮지만(0.66) AP@[.5:.95]는 높습니다(0.66). AP50은 A를, AP@[.5:.95]는 " +
      "B를 앞세웁니다. 어느 쪽이 더 딱 맞게 잡았는지는 어떤 IoU 기준으로 보느냐에 따라 " +
      "뒤집히니, AP50·AP75·AP@[.5:.95]를 늘 함께 보세요.",
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
        "검토자가 영상당 거짓양성을 일정 수만큼 받아들이기로 했을 때 병변이 얼마나 " +
        "잡히느냐가 관건입니다. DeepLesion은 영상당 5 FP에서의 민감도를 보고합니다.",
      consequence:
        "영상당 5 FP에서 민감도는 1.0에 도달하지만, 더 엄격한 영상당 1 FP에서는 " +
        "0.5로 떨어집니다. 대표 수치는 그것을 측정한 FP 예산을 함께 밝혀야 비로소 " +
        "의미가 있습니다.",
    },
    teachingPoint:
      "같은 병변을 보는 두 검출기입니다. A는 민감도를 끝까지 끌어올리지만(재현율 1.0) " +
      "거짓 표시를 대가로 치르고(정밀도 0.40), B는 표시가 모두 정답이지만(정밀도 1.0) " +
      "병변의 4분의 1을 놓칩니다(재현율 0.75). 재현율은 A를, 정밀도와 F1은 B를 " +
      "가리킵니다. 정밀도-재현율의 같은 갈림길이 병변 단위에서 다시 나타나는 셈입니다. " +
      "공정하게 보려면 거짓양성 예산을 먼저 정하고 그 지점의 민감도를 비교하세요.",
  },
  {
    ...base("camelyon16-metastasis-fp-per-image"),
    title: "CAMELYON16: 영상당 FP에 대한 전이 검출",
    clinical: {
      situation:
        "한 검출기가 전체 슬라이드 영상에서 림프절 전이의 위치를 짚어냅니다. 큰 전이 " +
        "병소는 확신 있게 검출되지만, 작은 병소는 애매하고, 양성 모방 병변이 " +
        "산발적인 거짓양성을 만들어냅니다.",
      modality: "전체 슬라이드 조직병리",
      atStake:
        "병변 단위 검출 민감도를, 병리의가 검토해야 할 슬라이드당 평균 거짓양성 " +
        "개수와 견주어 따집니다.",
      consequence:
        "민감도는 영상당 1 FP에서 약 0.75이고, 작은 전이는 영상당 FP를 더 높여 " +
        "받아들여야 비로소 1.0에 도달합니다. CAMELYON16의 FROC 평가가 바로 이렇게 " +
        "이뤄집니다.",
    },
    teachingPoint:
      "같은 슬라이드를 보는 두 검출기입니다. A는 모든 전이를 표시하지만(재현율 1.0) " +
      "이미지마다 거짓 표시가 따라오고(정밀도 0.44), B는 정밀하지만(정밀도 1.0) 4분의 " +
      "1을 놓칩니다(재현율 0.75). 재현율은 A를, 정밀도와 F1은 B를 가리킵니다. 전체 " +
      "슬라이드에서는 병리의가 견딜 수 있는 이미지당 거짓양성 부담에 따라 선택이 " +
      "갈리니, 그 예산을 먼저 정한 뒤에 비교하세요.",
  },
];

export default detectionScenariosKo;

/**
 * Korean clinical segmentation scenarios.
 *
 * Mirrors {@link segmentationScenarios} EXACTLY: the same scenario ids, the same
 * `state` objects (imported and reused from `scenarios.ts` so the geometry stays
 * engine-correct), and the same references — but with the prose (title and the
 * clinical situation / modality / atStake / consequence) and the teaching point
 * translated into natural, technically-accurate Korean.
 *
 * Reusing the English `state` objects guarantees that every scenario's metrics
 * compute to the same numbers; only the surrounding narrative differs.
 */

import type { EngineState } from "../../types/engine";
import type { Scenario } from "../../types/topic";
import { segmentationScenarios } from "./scenarios";

/** Look up the English scenario's engine state by id so the Korean one reuses it. */
function stateFor(id: string): EngineState {
  const scenario = segmentationScenarios.find((s) => s.id === id);
  if (scenario === undefined) {
    throw new Error(`Unknown segmentation scenario id: ${id}`);
  }
  return scenario.state;
}

export const segmentationScenariosKo: Scenario[] = [
  {
    id: "missed-met",
    title: "선별 MRI에서 놓친 작은 뇌 전이",
    clinical: {
      situation:
        "전뇌(whole-brain) 선별 MRI에 지배적인 전이 병변 하나와 아주 작은 두 번째 " +
        "병변이 있습니다. 모델은 큰 병변은 훌륭하게 분할하지만 작은 병변은 완전히 " +
        "놓칩니다.",
      modality: "조영증강 뇌 MRI",
      atStake:
        "치료하지 않은 전이는 다음 검사 전에 커지거나 출혈하거나 추가로 파종될 수 " +
        "있습니다.",
      consequence:
        "복셀 Dice는 훌륭해 보이고 리포트는 검토를 통과하지만, 치료 가능한 병변이 " +
        "끝내 표시되지 않았습니다.",
    },
    state: stateFor("missed-met"),
    teachingPoint:
      "큰 병변이 복셀 수를 지배하므로 복셀 Dice는 0.85 이상으로 유지되지만, 병변 단위 " +
      "민감도는 0.5에 불과합니다 — 두 병변 중 하나만 찾았기 때문입니다. 병변 단위 " +
      "지표는 복셀 Dice가 숨긴, 놓친 전이를 드러냅니다.",
    reference: "BraTS-METS 2023 (lesion-wise Dice + lesion-wise HD95 + FP/FN penalty).",
  },
  {
    id: "stray-fp",
    title: "떨어져 나간 위양성 덩어리가 HD95를 망가뜨린다",
    clinical: {
      situation:
        "모델이 간 병변을 거의 완벽하게 분할하지만, 시야 안 멀리 떨어진 곳에서 작고 " +
        "엉뚱한 덩어리 하나를 함께 출력합니다.",
      modality: "조영증강 복부 CT",
      atStake:
        "경계 지표는 실제 병변에 대한 절제연(margin) 정확도를 인증하는 역할을 해야 " +
        "합니다.",
      consequence:
        "Dice는 거의 움직이지 않아 겹침만 보는 리포트는 깨끗해 보이지만, HD95는 멀리 " +
        "떨어진 덩어리까지의 거리로 치솟아 신뢰할 수 없는 마스크임을 알립니다.",
    },
    state: stateFor("stray-fp"),
    teachingPoint:
      "떨어져 나간 덩어리는 픽셀을 몇 개만 더할 뿐이라 Dice는 0.8 이상으로 유지되지만, " +
      "최악의 경계 거리가 이제 멀리 떨어진 덩어리에 닿기 때문에 HD95는 20mm를 넘어 " +
      "폭발합니다. Dice는 항상 경계 지표와 짝지어야 합니다.",
    reference: "Taha & Hanbury 2015; HD is very sensitive to outliers.",
  },
  {
    id: "over-segmentation",
    title: "과다 분할: 높은 민감도, 낮은 정밀도",
    clinical: {
      situation:
        "종양 모델이 질환을 절대 놓치지 않도록 튜닝되어, 실제 종양보다 훨씬 큰 영역을 " +
        "칠하면서 건강한 조직까지 집어삼킵니다.",
      modality: "뇌 MRI (종양 분할)",
      atStake:
        "이 마스크가 방사선 치료 계획을 좌우한다면, 과도하게 그려진 표적 윤곽(과대 " +
        "윤곽화) 안의 건강한 뇌까지 방사선이 조사됩니다.",
      consequence:
        "민감도는 거의 완벽하지만 정밀도는 무너집니다 — 예측 픽셀 대부분이 " +
        "위양성입니다.",
    },
    state: stateFor("over-segmentation"),
    teachingPoint:
      "예측 A는 정답 전체를 덮지만(민감도 ≈ 1) 면적이 훨씬 커서 정밀도가 낮습니다. " +
      "민감도만으로는 과다 분할을 보상하게 되므로, 반드시 정밀도와 함께 읽어야 합니다.",
    reference: "Metrics Reloaded — sensitivity vs precision trade-off.",
  },
  {
    id: "small-lesion-instability",
    title: "작은 병변에서의 Dice 불안정성",
    clinical: {
      situation:
        "두 판독자가 같은 아주 작은 열공성 경색(lacunar infarct)을 1픽셀 경계 차이로 " +
        "분할합니다. 큰 장기였다면 보이지도 않을 차이입니다.",
      modality: "뇌 MRI (작은 허혈 병변)",
      atStake:
        "Dice가 분할 품질의 합격/불합격 기준으로 사용되고 있습니다.",
      consequence:
        "작은 병변에서는 똑같은 작은 오프셋이 Dice를 급격히 떨어뜨리는 반면, 같은 " +
        "오프셋이 큰 구조에서는 Dice에 거의 흠집을 내지 않습니다.",
    },
    state: stateFor("small-lesion-instability"),
    teachingPoint:
      "반지름 5픽셀 병변에서 4픽셀 이동만으로도 Dice는 이미 1.0보다 한참 아래로 " +
      "떨어집니다. 같은 절대 이동량이 큰 장기에서는 무시할 만한 수준입니다. Dice는 " +
      "아주 작은 구조에서 불안정합니다.",
    reference: "Metrics Reloaded — small-structure instability of Dice.",
  },
  {
    id: "liver-margin",
    title: "수술 계획을 위한 간 종양 절제연",
    clinical: {
      situation:
        "간 종양 마스크가 전반적으로 정답과 잘 겹치지만, 외과의가 정확한 절제연을 " +
        "필요로 하는 부위에서 경계의 한쪽 엽(lobe)이 바깥으로 부풀어 있습니다.",
      modality: "조영증강 복부 CT (수술 계획)",
      atStake:
        "절제연은 경계에서 직접 읽어내므로, 국소적인 돌출은 너무 많이 또는 너무 적게 " +
        "절제함을 뜻합니다.",
      consequence:
        "Dice는 허용 가능해 보일 만큼 높지만, HD95는 절제연을 따라 임상적으로 의미 있는 " +
        "국소 경계 오차를 드러냅니다.",
    },
    state: stateFor("liver-margin"),
    teachingPoint:
      "부풀어 오른 절제연은 연속된 픽셀 덩어리를 더하므로 Dice는 높게 유지되지만, HD95는 " +
      "돌출의 깊이까지 올라갑니다. 수술 절제연에서는 경계 지표가 타협 불가입니다 — Dice " +
      "단독으로는 엉뚱한 것을 인증하게 됩니다.",
    reference: "Medical Segmentation Decathlon / KiTS23 — Dice + surface metric.",
  },
  {
    id: "rank-agree-magnitude-disagree",
    title: "순위는 일치, 크기는 불일치 (Dice 대 HD95)",
    clinical: {
      situation:
        "두 후보 모델을 비교합니다. Dice에서는 거의 동점이라, Dice만 보는 리더보드는 " +
        "동전 던지기로 판정할 것입니다.",
      modality: "복부 CT (장기 분할)",
      atStake:
        "배포를 위한 모델 선택이 위원회가 어떤 요약 지표를 신뢰하느냐에 달려 있습니다.",
      consequence:
        "모델 A와 B는 거의 동일한 Dice를 갖지만, B에 멀리 뻗은 경계 돌기가 있어서 HD95는 " +
        "큰 폭으로 차이가 납니다.",
    },
    state: stateFor("rank-agree-magnitude-disagree"),
    teachingPoint:
      "두 예측 모두 면적이 같은 작은 돌기를 더하므로 Dice 차이는 무시할 만합니다 — 하지만 " +
      "B의 돌기가 훨씬 바깥에 있어 HD95는 훨씬 큽니다. 동일한 겹침 순위가 큰 경계 품질 " +
      "격차를 숨길 수 있습니다.",
    reference: "Metrics Reloaded — overlap and boundary metrics answer different questions.",
  },
  {
    id: "empty-negative-case",
    title: "빈 사례: 병변은 없지만 위양성 하나",
    clinical: {
      situation:
        "진정으로 정상인 검사에는 대상 병변이 전혀 없는데도, 모델이 엉뚱한 검출 하나를 " +
        "내놓습니다.",
      modality: "뇌 MRI (선별, 음성 사례)",
      atStake:
        "정답이 비어 있는 사례는 퇴화(degenerate) 지표 정책 결정이 위력을 발휘하는 " +
        "지점입니다. Dice, HD95, NSD가 통상의 공식에서 모두 정의되지 않습니다.",
      consequence:
        "지표를 어떻게 채점하느냐(Dice는 one / zero / NaN, 거리는 undefined / 대각선 / " +
        "고정값)는 모델에 관한 사실이 아니라 정책 선택입니다.",
    },
    state: stateFor("empty-negative-case"),
    teachingPoint:
      "정답이 비어 있고 예측이 위양성인 경우, 모든 겹침·거리 지표가 퇴화 분기로 빠집니다. " +
      "플레이그라운드에서 empty-Dice와 empty-distance 정책을 바꿔 보면, 마스크는 그대로인데 " +
      "보고되는 숫자가 달라지는 것을 볼 수 있습니다 — 정책은 반드시 명시되어야 합니다.",
    reference: "Metrics Reloaded — handling of empty / negative cases and degenerate metrics.",
  },
  {
    id: "broken-vessel-topology",
    title: "끊어진 혈관 위상 (clDice 맛보기)",
    clinical: {
      situation:
        "혈관 분할 모델이 픽셀 겹침은 좋은 마스크를 만들어 내지만, 중심선(centerline)이 " +
        "끊겨 있습니다 — 한 분지가 두 조각으로 분리되어 있습니다.",
      modality: "CT 혈관조영 (관 모양 구조)",
      atStake:
        "혈관과 기도에서는 연결성(connectivity)이 중요합니다. 끊어진 중심선은 실제로는 " +
        "없는 폐색(occlusion)을 시사할 수 있습니다.",
      consequence:
        "대부분의 픽셀이 겹치므로 Dice와 IoU는 멀쩡해 보이지만, 위상은 틀렸습니다 — 바로 " +
        "겹침 지표가 볼 수 없는 부분입니다.",
    },
    state: stateFor("broken-vessel-topology"),
    teachingPoint:
      "예측 A는 혈관 가운데에 작은 틈을 떨어뜨립니다. 복셀 Dice는 거의 영향을 받지 않지만, " +
      "구조는 이제 끊어진 두 조각입니다. clDice / 중심선 Dice 같은 위상 인식(topology-aware) " +
      "지표는 겹침 지표가 놓치는 바로 이 단절을 잡아내기 위해 설계되었습니다.",
    reference: "Shit et al., clDice (CVPR 2021) — topology-preserving tubular metric.",
  },
];

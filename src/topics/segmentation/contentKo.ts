/**
 * Korean Learn content for the image-segmentation topic.
 *
 * This mirrors {@link segmentationLearn} EXACTLY in structure — the same section
 * ids, the same KaTeX `formula` strings, and the same `miniSim` configs — but
 * with the prose (intro / title / meaning / features / caveats) translated into
 * natural, technically-accurate Korean for the Korean-student audience.
 *
 * The mini-sim configs are imported and reused from `content.ts` rather than
 * re-declared, so the interactive demos behind every section are byte-for-byte
 * identical to the English version; only the surrounding text differs.
 */

import type { LearnContent, MetricSection, MiniSimConfig } from "../../types/topic";
import { segmentationLearn } from "./content";

/**
 * Look up the English section's mini-sim by id so the Korean section reuses the
 * exact same `kind`, `spotlightMetric`, and seeded `initialState`.
 *
 * @param id - The section id shared between the English and Korean content.
 * @returns The matching mini-sim config, or undefined when the section has none.
 */
function miniSimFor(id: string): MiniSimConfig | undefined {
  return segmentationLearn.sections.find((section) => section.id === id)?.miniSim;
}

/** Carry over the English section's KaTeX formula unchanged (never translate it). */
function formulaFor(id: string): string | undefined {
  return segmentationLearn.sections.find((section) => section.id === id)?.formula;
}

/** Carry over the English section's figure key unchanged (a render dispatch key, never translated). */
function figureFor(id: string): string | undefined {
  return segmentationLearn.sections.find((section) => section.id === id)?.figure;
}

const sections: MetricSection[] = [
  {
    id: "dice",
    title: "Dice 계수 (DSC)",
    formula: formulaFor("dice"),
    meaning:
      "Dice는 예측 마스크가 정답(ground-truth) 마스크와 얼마나 겹치는지를 " +
      "측정합니다. 의료 영상 분할에서 가장 널리 쓰이는 겹침(overlap) 지표입니다.",
    features: [
      "의료 영상 분할에서 가장 널리 사용됩니다.",
      "해석이 직관적입니다.",
      "이진(binary) 및 다중 클래스 분할 모두에 적용할 수 있습니다.",
      "클래스별 Dice 또는 평균 Dice로 보고하는 경우가 많습니다.",
    ],
    caveats: [
      "Dice는 영역 겹침을 요약할 뿐, 경계 오차를 직접 측정하지는 않습니다.",
      "아주 작은 구조에서는 불안정합니다. 몇 픽셀(voxel)의 오차만으로도 값이 크게 흔들립니다.",
      "큰 구조에서는 경계의 일부가 부정확해도 Dice가 높게 나올 수 있습니다.",
    ],
    figure: figureFor("dice"),
    complements:
      "HD95/NSD와 함께 보고하세요. Dice는 겹침을 요약할 뿐 경계 오차에는 눈을 감습니다.",
    miniSim: miniSimFor("dice"),
  },
  {
    id: "iou",
    title: "IoU / Jaccard 지수",
    formula: formulaFor("iou"),
    meaning:
      "IoU는 예측과 정답의 교집합을 두 영역의 합집합으로 나눈 값입니다. " +
      "일반 컴퓨터 비전과 객체 검출에서 흔히 쓰이며, 검출에서는 박스 겹침을 정의합니다.",
    features: [
      "일반 컴퓨터 비전과 검출에서 박스 겹침을 정의할 때 흔히 사용됩니다.",
      "Dice와 비슷하지만, 같은 예측에 대해 항상 수치가 더 낮게 나옵니다.",
      "Dice = 2·IoU / (1 + IoU) 관계로 Dice와 연결되어, 단일 사례에서는 두 지표가 예측의 순위를 동일하게 매깁니다. 다만 데이터셋 전체의 Dice 평균과 IoU 평균은 두 모델의 순위를 다르게 매길 수 있습니다.",
    ],
    caveats: [
      "같은 마스크에 대해 IoU는 항상 Dice 이하이므로, IoU 값을 Dice 값과 직접 비교해서는 안 됩니다.",
      "Dice와 마찬가지로 IoU도 영역 겹침 지표라서, 오차가 경계의 어디에 있는지는 보지 못합니다.",
    ],
    figure: figureFor("iou"),
    complements:
      "단일 사례에서는 Dice와 순위가 동일합니다. 경계 오차를 보려면 경계 지표(HD95/NSD/ASSD)와 짝지으세요.",
    miniSim: miniSimFor("iou"),
  },
  {
    id: "sensitivity",
    title: "민감도(Sensitivity) / 재현율(Recall)",
    formula: formulaFor("sensitivity"),
    meaning:
      "민감도는 실제 대상 영역 중 얼마나 검출했는지를 측정합니다. " +
      "모델이 놓친 픽셀, 즉 위음성(false negative)에 초점을 맞춥니다.",
    features: [
      "구조물을 놓치는 비용이 클 때 유용합니다.",
      "작은 병변, 혈관, 선별(screening) 관련 분할 과제에서 중요합니다.",
      "민감도가 높다는 것은 위음성이 적다는 뜻입니다.",
    ],
    caveats: [
      "민감도만으로는 위양성(false positive)의 부담을 알 수 없습니다.",
      "모델은 단순히 과다 분할하는 것만으로도 민감도를 부풀릴 수 있으므로, 정밀도와 함께 읽어야 합니다.",
    ],
    figure: figureFor("sensitivity"),
    complements:
      "정밀도(Precision)와 함께 보고하세요. 높은 민감도는 과다 분할(많은 위양성)을 가릴 수 있습니다.",
    miniSim: miniSimFor("sensitivity"),
  },
  {
    id: "precision",
    title: "정밀도(Precision) / 양성예측도(PPV)",
    formula: formulaFor("precision"),
    meaning:
      "정밀도는 예측한 양성 영역 중 실제로 맞은 비율을 측정합니다. " +
      "위양성(false positive), 즉 배경으로의 과다 분할에 초점을 맞춥니다.",
    features: [
      "과다 분할을 점검할 때 유용합니다.",
      "정밀도가 낮다는 것은 위양성 픽셀이나 영역이 많다는 뜻입니다.",
      "정밀도가 높다는 것은 위양성이 적다는 뜻입니다.",
    ],
    caveats: [
      "보수적인 모델은 정밀도는 높지만 민감도가 낮을 수 있습니다.",
      "정밀도와 민감도는 단독이 아니라 함께 해석합니다.",
    ],
    figure: figureFor("precision"),
    complements:
      "민감도/재현율(Sensitivity/Recall)과 함께 보고하세요. 높은 정밀도는 대상을 많이 놓치는 보수적 모델을 가릴 수 있습니다.",
    miniSim: miniSimFor("precision"),
  },
  {
    id: "hd",
    title: "Hausdorff 거리 (HD)",
    formula: formulaFor("hd"),
    meaning:
      "Hausdorff 거리는 한 경계에서 다른 경계까지의 가장 큰 거리입니다. " +
      "예측과 정답 표면 사이의 최악(worst-case) 경계 불일치를 포착합니다.",
    features: [
      "최악의 경계 불일치를 포착합니다.",
      "단 하나의 큰 국소 경계 오차가 임상적으로 중요할 때 유용합니다.",
    ],
    caveats: [
      "이상치(outlier)에 매우 민감합니다.",
      "멀리 떨어진 단 하나의 위양성 영역만으로도 HD가 엄청나게 커질 수 있습니다.",
    ],
    figure: figureFor("hd"),
    complements:
      "Dice와 함께 보고하세요. 경계 거리는 영역이 얼마나 겹치는지는 무시합니다.",
    miniSim: miniSimFor("hd"),
  },
  {
    id: "hd95",
    title: "HD95 (95퍼센타일 Hausdorff)",
    formula: formulaFor("hd95"),
    meaning:
      "HD95는 최댓값 대신 경계 거리들의 95퍼센타일을 사용하므로, " +
      "튀어나온 한 점이 더 이상 점수를 지배하지 않습니다.",
    features: [
      "표준 HD보다 강건(robust)합니다.",
      "의료 분할 논문에서 Dice와 함께 보고되는 경우가 많습니다.",
      "극단적 이상치의 영향은 줄이면서도 경계 오차는 여전히 잡아냅니다.",
    ],
    caveats: [
      "3D CT나 MRI에서는 거리를 복셀(voxel) 수가 아니라 물리 단위(mm)로 계산해야 합니다.",
      "여기서는 단일 2D 슬라이스에서 1 px = 1 mm로 두지만, 실제 임상에서는 mm 단위로 측정되는 3D 표면입니다.",
      "참 경계에서 멀리 떨어진 위양성 덩어리가 생기면 여전히 급격히 커집니다.",
    ],
    figure: figureFor("hd95"),
    complements:
      "Dice와 함께 보고하세요. 경계 거리는 영역이 얼마나 겹치는지는 무시합니다.",
    miniSim: miniSimFor("hd95"),
  },
  {
    id: "assd",
    title: "ASD / ASSD (평균 표면 거리)",
    formula: formulaFor("assd"),
    meaning:
      "평균 표면 거리(Average Surface Distance)는 한 표면에서 다른 표면까지의 " +
      "평균 거리입니다. 평균 대칭 표면 거리(ASSD)는 예측→정답과 정답→예측 " +
      "양방향을 평균하여 하나의 양방향 경계 오차로 나타냅니다.",
    features: [
      "최악의 한 점이 아니라 평균적인 경계 불일치를 포착합니다.",
      "HD보다 단 하나의 극단적인 점에 덜 좌우됩니다.",
      "ASSD는 예측→정답과 정답→예측 거리를 모두 고려합니다.",
    ],
    caveats: [
      "평균을 내기 때문에 국소적으로 큰 오차가 희석될 수 있습니다.",
      "단 하나의 최악 지점보다 전반적인 경계 일치가 더 중요할 때 유용합니다.",
    ],
    figure: figureFor("assd"),
    complements:
      "HD95(최악의 경계 오차) 및 Dice(영역 겹침)와 짝지으세요. 평균을 내면 국소적으로 큰 오차 하나가 희석됩니다.",
    miniSim: miniSimFor("assd"),
  },
  {
    id: "nsd",
    title: "표면 Dice / 정규화 표면 Dice (NSD)",
    formula: formulaFor("nsd"),
    meaning:
      "표면 Dice는 두 표면의 점 가운데, 상대 표면으로부터 미리 정한 허용 거리 τ 이내에 " +
      "있는 점의 비율을 측정합니다 — 예측→정답과 정답→예측을 함께 보는 대칭적 비율입니다(공식과 동일). " +
      "허용 오차가 2mm라면, 상대 표면에서 2mm 이내에 있는 경계 점은 허용됩니다. " +
      "(여기서는 단일 2D 슬라이스에서 1 px = 1 mm로 두지만, 실제 임상에서는 mm 단위로 측정되는 3D 표면입니다.)",
    features: [
      "과제별로 허용 오차를 설정할 수 있습니다.",
      "작은 경계 편차가 임상적으로 허용되는 경우에 유용합니다.",
      "원시 HD나 ASSD보다 해석하기 쉬운 경우가 많습니다.",
      "여러 의료 벤치마크(Medical Segmentation Decathlon, KiTS23)에서 사용됩니다.",
    ],
    caveats: [
      "허용 오차 값을 신중하게 선택해야 합니다.",
      "허용 오차는 장기, 병변 종류, 영상 양식(modality), 임상 용도에 따라 달라질 수 있습니다.",
    ],
    figure: figureFor("nsd"),
    complements:
      "Dice와 함께 보고하세요. 허용 오차 τ는 임상적으로 선택해야 허용 가능한 경계 편차가 부당하게 패널티를 받지 않습니다.",
    miniSim: miniSimFor("nsd"),
  },
  {
    id: "volume",
    title: "부피 차이 (Volume difference)",
    formula: formulaFor("volume"),
    meaning:
      "부피 차이는 예측한 대상 부피를 정답 부피와 비교합니다. 부호 있는 상대 차이로 " +
      "보고하거나, 부피 유사도(volumetric similarity) 점수 1 − |Vp − Vg| / (Vp + Vg)로 " +
      "보고합니다. 부피 차이 / 부피 유사도 지표는 MRBrainS 같은 뇌 조직 벤치마크에서 " +
      "쓰입니다(MRBrainS는 부피 유사도를 채점합니다).",
    features: [
      "모델이 부피를 과소 또는 과대 추정하는지를 직접 측정합니다.",
      "부호 있는 상대 부피 차이는 오차의 방향을 보여줍니다.",
      "조직 부피가 임상적으로 중요할 때 부피 차이 / 부피 유사도 지표를 Dice, HD95와 함께 보고합니다.",
    ],
    caveats: [
      "부피 일치가 공간적 일치를 의미하지는 않습니다. 위치가 어긋난 마스크도 부피는 맞으면서 공간적으로는 빗나갈 수 있습니다.",
      "상대 부피 차이는 정답 부피가 0일 때 정의되지 않습니다.",
    ],
    figure: figureFor("volume"),
    complements:
      "Dice/HD95와 함께 보고하세요. 부피가 같아도 위치가 어긋난 마스크는 부피만 맞고 공간적으로는 빗나갈 수 있습니다.",
    miniSim: miniSimFor("volume"),
  },
  {
    id: "lesionwise",
    title: "병변 단위(Lesion-wise) Dice & HD95",
    formula: formulaFor("lesionwise"),
    meaning:
      "픽셀 단위 Dice는 큰 병변에 좌우될 수 있습니다. 병변 단위 지표는 정답과 " +
      "예측을 연결 성분(connected component)으로 나누고 일대일로 매칭한 뒤, " +
      "병변별로 Dice와 HD95를 평가합니다. 이를 통해 픽셀 평균이 가려버리는 " +
      "놓친 작은 병변과 위양성 병변을 드러냅니다. 특히 병변 단위 Dice와 HD95는 " +
      "놓친(FN) 병변과 엉뚱한(FP) 병변에 대한 패널티를 포함합니다. 매칭되지 않은 " +
      "병변은 각각 Dice 0과 최악(worst-case) 거리로 계산되어 병변별 평균을 끌어내립니다. " +
      "이것이 BraTS / BraTS-METS의 평가 관점입니다.",
    features: [
      "분할을 개별 병변 수준에서 평가합니다.",
      "병변 단위 민감도/정밀도와 함께 TP/FP/FN 병변 개수를 더해 줍니다.",
      "놓친(FN) 병변과 엉뚱한(FP) 병변은 Dice 0 / 최악 거리로 패널티를 받습니다(BraTS-METS 방식).",
    ],
    caveats: [
      "픽셀 Dice가 높아도 완전히 놓친 작은 병변(낮은 병변 단위 민감도)을 숨길 수 있습니다.",
      "매칭은 선택한 기준(IoU 대 무게중심)과 임계값에 따라 달라집니다.",
    ],
    figure: figureFor("lesionwise"),
    complements:
      "복셀 단위 Dice와 함께 보고하세요. 복셀 평균은 큰 구조가 놓친 작은 병변을 가리게 만듭니다.",
    miniSim: miniSimFor("lesionwise"),
  },
  {
    id: "cldice",
    title: "clDice / 중심선 Dice",
    formula: formulaFor("cldice"),
    meaning:
      "clDice는 혈관이나 기도처럼 관 모양(tubular) 구조를 위한 위상·연결성 인식 " +
      "겹침 지표입니다. 위상 정밀도(예측 중심선이 정답 마스크 안에 있는 정도)와 위상 " +
      "민감도(정답 중심선이 예측 마스크 안에 있는 정도)를 조화 평균하므로, 어떤 혈관은 " +
      "Dice가 높더라도 중심선이 끊겨 있으면 점수가 낮게 나올 수 있습니다.",
    features: [
      "연결성에 민감합니다. 단순한 픽셀 겹침이 아니라 끊기지 않은 중심선을 보상합니다.",
      "관 모양·나무 모양 구조(혈관, 기도, 신경)를 위해 설계되었습니다.",
      "위상 인식 보완 지표로서 Dice와 자연스럽게 짝을 이룹니다.",
    ],
    caveats: [
      "중심선 추출(골격화, skeletonization)은 마스크의 작은 변화에 민감할 수 있습니다.",
      "연결성을 겨냥한 지표이므로, 영역 겹침이나 경계 지표를 대체하지는 못합니다.",
      "덩어리 모양(관 모양이 아닌) 구조에서는 의미가 덜합니다.",
    ],
    figure: figureFor("cldice"),
    complements:
      "Dice와 짝지으세요. Dice는 끊어진 연결성에 눈을 감습니다.",
  },
];

export const segmentationLearnKo: LearnContent = {
  intro:
    "의미론적 분할(semantic segmentation)은 어떤 픽셀 또는 복셀이 대상 클래스 — " +
    "간, 신장, 종양, 혈관, 뇌 조직 — 에 속하는지를 묻습니다. 평가의 초점은 " +
    "예측 마스크가 정답과 얼마나 겹치는지, 경계가 얼마나 정확한지, 작은 구조를 " +
    "놓치지는 않는지, 그리고 모델이 배경까지 과다 분할하지는 않는지에 맞춰집니다. " +
    "Metrics Reloaded를 따라, 아래 지표들은 겹침 기반, 경계·표면 기반, 부피 기반, " +
    "병변 단위 계열로 묶입니다. 단 하나의 숫자로는 충분하지 않습니다. 각 계열은 " +
    "서로 다른 실패 양상에 대해 눈을 감고 있기 때문에, 의료 벤치마크는 겹침 지표를 " +
    "경계·표면·부피·병변 단위 지표와 짝지어 보고합니다.",
  sections,
  complementarity: {
    intro:
      "Metrics Reloaded의 핵심 주장은 단 하나의 지표로는 충분하지 않다는 것입니다. " +
      "모든 지표는 어떤 실패 양상에 대해 눈을 감고 있으므로, 서로의 사각지대를 " +
      "메워 주는 지표를 짝지어 보고해야 합니다 — 겹침 지표를 경계·표면·부피·병변 " +
      "단위 지표와 함께 보고하세요.",
    pairs: [
      {
        blindSpot: "경계 오차 — 겹침이 높아도 경계가 부정확할 수 있습니다.",
        blindMetric: "Dice / IoU",
        caughtBy: "HD95 / NSD / ASSD",
      },
      {
        blindSpot: "최악의 이상치 — 멀리 떨어진 단 하나의 영역이 평균으로 희석됩니다.",
        blindMetric: "ASSD / Dice",
        caughtBy: "HD / HD95",
      },
      {
        blindSpot: "놓친 작은 병변 — 복셀 평균은 큰 구조가 지배하게 만듭니다.",
        blindMetric: "복셀 Dice",
        caughtBy: "병변 단위 민감도",
      },
      {
        blindSpot: "과다 분할 / 위양성 — 재현율은 위양성 부담을 무시합니다.",
        blindMetric: "민감도(Sensitivity)",
        caughtBy: "정밀도(Precision)",
      },
      {
        blindSpot: "부피 오차 — 모양이 다르면 겹침이 같아도 부피가 다를 수 있습니다.",
        blindMetric: "Dice (모양이 다를 때)",
        caughtBy: "부피 차이",
      },
      {
        blindSpot: "위상(topology) 단절 — 끊기거나 분리된 구조도 겹침은 좋을 수 있습니다.",
        blindMetric: "Dice",
        caughtBy: "clDice / centerline Dice",
      },
    ],
    benchmarks: [
      {
        name: "Medical Segmentation Decathlon",
        task: "다중 장기·다중 과제 분할",
        combination: "Dice + NSD",
        perspective: "영역 겹침 + 표면 일치",
      },
      {
        name: "KiTS23",
        task: "신장·종양·낭종 분할",
        combination: "Dice + Surface Dice",
        perspective: "영역 겹침 + 표면 품질",
      },
      {
        name: "MRBrainS",
        task: "뇌 조직 분할",
        combination: "Dice + HD95 + 부피",
        perspective: "겹침 + 경계 + 부피 일치",
      },
      {
        name: "BraTS 2023",
        task: "뇌종양 분할",
        combination: "병변 단위 Dice + 병변 단위 HD95",
        perspective: "병변 단위 겹침 + 병변 단위 경계",
      },
      {
        name: "BraTS-METS",
        task: "뇌 전이 분할",
        combination: "병변 단위 Dice + 병변 단위 HD95 + 위양성/위음성 패널티",
        perspective: "명시적 FP/FN 패널티가 있는 다중 병변 평가",
      },
    ],
  },
};

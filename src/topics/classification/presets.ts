import type { ClassificationCase } from "../../types/engine";

export interface ClassificationPreset {
  readonly id: string;
  readonly label: string;
  readonly labelKo: string;
  readonly description: string;
  readonly descriptionKo: string;
  readonly threshold: number;
  readonly cases: readonly ClassificationCase[];
}

function repeatCases(
  count: number,
  actual: ClassificationCase["actual"],
  score: number,
): ClassificationCase[] {
  return Array.from({ length: count }, () => ({ actual, score }));
}

export const CLS_PRESETS: readonly ClassificationPreset[] = [
  {
    id: "empty-start",
    label: "Tiny balanced set",
    labelKo: "작은 균형 세트",
    description: "Two positives and two negatives make every confusion-matrix cell easy to inspect.",
    descriptionKo: "양성 둘, 음성 둘로 각 혼동행렬 칸을 바로 확인할 수 있습니다.",
    threshold: 0.5,
    cases: [
      { actual: "positive", score: 0.9 },
      { actual: "positive", score: 0.35 },
      { actual: "negative", score: 0.7 },
      { actual: "negative", score: 0.2 },
    ],
  },
  {
    id: "rare-all-negative",
    label: "Rare positives",
    labelKo: "희귀 양성",
    description: "A 5 percent prevalence set where predicting negative for everyone hides every positive.",
    descriptionKo: "유병률 5% 세트에서 모두 음성으로 두면 양성을 전부 놓칩니다.",
    threshold: 0.5,
    cases: [...repeatCases(5, "positive", 0.1), ...repeatCases(95, "negative", 0.1)],
  },
  {
    id: "screening-threshold",
    label: "Screening threshold",
    labelKo: "선별 임계값",
    description: "A low threshold catches nearly every positive while admitting more false positives.",
    descriptionKo: "낮은 임계값은 양성을 거의 모두 잡지만 위양성을 더 받아들입니다.",
    threshold: 0.5,
    cases: [
      ...repeatCases(19, "positive", 0.75),
      ...repeatCases(1, "positive", 0.2),
      ...repeatCases(24, "negative", 0.65),
      ...repeatCases(56, "negative", 0.1),
    ],
  },
  {
    id: "confirmatory-threshold",
    label: "Confirmatory threshold",
    labelKo: "확진 임계값",
    description: "A high threshold reduces false positives before a downstream invasive decision.",
    descriptionKo: "높은 임계값은 침습적 결정을 앞두고 위양성을 줄입니다.",
    threshold: 0.8,
    cases: [
      ...repeatCases(10, "positive", 0.9),
      ...repeatCases(10, "positive", 0.45),
      ...repeatCases(1, "negative", 0.85),
      ...repeatCases(79, "negative", 0.2),
    ],
  },
];

export const DEFAULT_CLS_PRESET_ID = "empty-start";

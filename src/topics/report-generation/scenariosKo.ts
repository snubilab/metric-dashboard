import type { EngineState } from "../../types/engine";
import type { Scenario } from "../../types/topic";
import {
  ENTITY_SWAP,
  ERROR_CATEGORY_CONTEXT,
  LABEL_GRANULARITY,
  LATERALITY_SWAP,
  NEGATION_FLIP,
  PARAPHRASE_METEOR,
  TEMPORAL_CHANGE,
} from "./reportExamples";
import type { ReportExample } from "./reportExamples";

const EMPTY_GEOMETRY = {
  grid: { width: 256, height: 256, spacingMm: [1, 1] },
  gt: [],
  predictions: [],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
} satisfies Omit<EngineState, "reportGeneration">;

function state(example: ReportExample): EngineState {
  return {
    ...EMPTY_GEOMETRY,
    reportGeneration: {
      reference: example.reference,
      candidateA: example.candidateA,
      candidateB: example.candidateB,
    },
  };
}

export const reportGenerationScenariosKo: Scenario[] = [
  {
    id: "negation-hallucination",
    title: "Negation hallucination: 익숙한 단어, 위험한 assertion",
    clinical: {
      situation: "일상적인 CXR report generation",
      modality: "Chest X-ray report",
      atStake:
        "pneumothorax나 pleural effusion hallucination은 불필요한 urgent follow-up을 만들 수 있습니다.",
      consequence: "단어가 비슷해도 false finding이 숨어 있을 수 있습니다.",
    },
    state: state(NEGATION_FLIP),
    teachingPoint:
      "Candidate B는 reference 단어를 더 많이 재사용하지만 absent finding을 present finding으로 뒤집습니다. Lexical overlap은 B를 앞세울 수 있고 assertion-aware row는 A를 앞세웁니다.",
    reference: "PPTX slides 7-9: NLG metric failure example.",
  },
  {
    id: "laterality-swap",
    title: "Laterality swap: 문장 틀은 같고 방향은 반대",
    clinical: {
      situation: "CXR impression에서 pneumonia 위치를 생성하는 상황",
      modality: "Chest X-ray report",
      atStake: "wrong-side localization은 follow-up과 임상 커뮤니케이션을 바꿉니다.",
      consequence: "높은 word overlap이 실제 병변 방향 오류를 가릴 수 있습니다.",
    },
    state: state(LATERALITY_SWAP),
    teachingPoint:
      "Candidate B는 phrase template을 유지하지만 right를 left로 바꿉니다. Lexical overlap이 비슷해도 laterality-aware row는 A를 앞세워야 합니다.",
    reference: "PPTX slide 9: laterality failure example.",
  },
  {
    id: "temporal-direction",
    title: "Temporal direction: improved와 worsened",
    clinical: {
      situation: "치료 후 follow-up CXR",
      modality: "Serial chest X-ray report",
      atStake: "improved와 worsened는 치료 urgency를 반대로 만듭니다.",
      consequence: "temporal direction error는 report의 clinical message를 뒤집습니다.",
    },
    state: state(TEMPORAL_CHANGE),
    teachingPoint:
      "Candidate B는 comparison 구조를 반복하지만 improved를 worsened로 뒤집습니다. Temporal F1은 A를 앞세우고 Lexical overlap은 B에 높게 남을 수 있습니다.",
    reference: "PPTX slide 11: Temporal F1.",
  },
  {
    id: "entity-assertion-swap",
    title: "Entity assertion swap: 단어는 맞지만 연결이 틀림",
    clinical: {
      situation: "두 개의 중요한 entity가 있는 짧은 CXR report",
      modality: "Chest X-ray report",
      atStake: "pneumothorax와 pleural effusion은 management implication이 다릅니다.",
      consequence: "entity 단어가 모두 있어도 present/absent 연결이 바뀌면 임상 의미가 달라집니다.",
    },
    state: state(ENTITY_SWAP),
    teachingPoint:
      "Candidate B는 필요한 vocabulary를 포함하지만 presence와 absence를 잘못된 entity에 붙입니다. Entity/assertion row는 A를 앞세워야 하며, 이 예시는 RaTEscore가 보려는 방향을 보여줍니다.",
    reference: "PPTX slides 15-16: BERTScore vs RaTEscore entity example.",
  },
  {
    id: "paraphrase-tolerance",
    title: "Paraphrase tolerance: 내용은 같고 표현만 다름",
    clinical: {
      situation: "생성 report가 흔한 radiology synonym을 쓰는 상황",
      modality: "Chest X-ray report",
      atStake: "표현 차이가 clinical contradiction처럼 벌점 처리되면 안 됩니다.",
      consequence: "BLEU/ROUGE는 떨어져도 METEOR-style matching은 더 관대할 수 있습니다.",
    },
    state: state(PARAPHRASE_METEOR),
    teachingPoint:
      "Candidate A는 effusion을 fluid로, improved를 decreased로 바꿉니다. METEOR-style matching은 순수 lexical row보다 이런 paraphrase에 관대하고, clinical row는 여전히 정렬된 상태로 남습니다.",
    reference: "PPTX slides 3-6: BLEU, ROUGE, METEOR comparison.",
  },
  {
    id: "label-granularity",
    title: "Label granularity: finding은 같지만 attribute가 틀림",
    clinical: {
      situation: "CXR report에서 finding label을 추출하는 상황",
      modality: "Chest X-ray report",
      atStake: "coarse finding agreement는 wrong side나 wrong change direction을 가릴 수 있습니다.",
      consequence: "넓은 label/attribute proxy는 coarse CheXbert-style F1과 분리되어 움직입니다.",
    },
    state: state(LABEL_GRANULARITY),
    teachingPoint:
      "Candidate B도 opacity를 언급하므로 coarse finding label은 높게 남을 수 있습니다. 하지만 SRR-BERT-style, temporal, laterality, graph row는 side와 change attribute가 바뀌었기 때문에 움직입니다.",
    reference: "PPTX slides 12-14: CheXbert and SRR-BERT label F1.",
  },
  {
    id: "error-category-context",
    title: "Error category: reference에 없는 새 finding",
    clinical: {
      situation: "AI-generated impression을 safety review하는 상황",
      modality: "Chest X-ray report",
      atStake: "candidate-only pneumothorax는 urgent action을 유발할 수 있습니다.",
      consequence: "error-category row는 fluent wording 보상보다 unsupported finding count를 봅니다.",
    },
    state: state(ERROR_CATEGORY_CONTEXT),
    teachingPoint:
      "Candidate B는 reference가 지지하지 않는 new right pneumothorax를 추가합니다. 다른 text overlap이 남아 있어도 GREEN/CRIMSON-style row는 이 unsupported finding 때문에 움직입니다.",
    reference: "PPTX slides 17-19: GREEN and CRIMSON error categories.",
  },
];

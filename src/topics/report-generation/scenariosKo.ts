import type { EngineState } from "../../types/engine";
import type { Scenario } from "../../types/topic";
import {
  ENTITY_SWAP,
  LATERALITY_SWAP,
  NEGATION_FLIP,
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
];

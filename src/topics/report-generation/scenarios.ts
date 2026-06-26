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

export const reportGenerationScenarios: Scenario[] = [
  {
    id: "negation-hallucination",
    title: "Negation hallucination: familiar words, unsafe assertion",
    clinical: {
      situation: "Routine CXR report generation",
      modality: "Chest X-ray report",
      atStake: "Hallucinating pneumothorax or pleural effusion can trigger urgent follow-up.",
      consequence: "Lexical similarity can hide a false finding.",
    },
    state: state(NEGATION_FLIP),
    teachingPoint:
      "Candidate B reuses more reference terms, but flips absent findings into present findings. Lexical overlap can lead B while assertion-aware rows lead A.",
    reference: "PPTX slides 7-9: NLG metric failure example.",
  },
  {
    id: "laterality-swap",
    title: "Laterality swap: same phrase, wrong side",
    clinical: {
      situation: "Pneumonia location in a generated CXR impression",
      modality: "Chest X-ray report",
      atStake: "Wrong-side localization changes follow-up and communication.",
      consequence: "High word overlap can still point clinicians to the wrong side.",
    },
    state: state(LATERALITY_SWAP),
    teachingPoint:
      "Candidate B keeps the phrase template but changes right to left. Laterality-aware rows lead A even when lexical overlap is close.",
    reference: "PPTX slide 9: laterality failure example.",
  },
  {
    id: "temporal-direction",
    title: "Temporal direction: improved versus worsened",
    clinical: {
      situation: "Follow-up CXR after treatment",
      modality: "Serial chest X-ray report",
      atStake: "Improved versus worsened changes treatment urgency.",
      consequence: "A temporal direction error can invert the clinical message.",
    },
    state: state(TEMPORAL_CHANGE),
    teachingPoint:
      "Candidate B repeats the comparison structure but reverses improved to worsened. Temporal F1 leads A while lexical overlap remains high for B.",
    reference: "PPTX slide 11: Temporal F1.",
  },
  {
    id: "entity-assertion-swap",
    title: "Entity assertion swap: right vocabulary, wrong attachment",
    clinical: {
      situation: "Short report with two clinically important entities",
      modality: "Chest X-ray report",
      atStake: "Pneumothorax and pleural effusion have different management implications.",
      consequence: "Entity words are present but attached to the wrong assertion.",
    },
    state: state(ENTITY_SWAP),
    teachingPoint:
      "Candidate B contains the right vocabulary but assigns presence and absence to the wrong entities. Entity/assertion rows lead A.",
    reference: "PPTX slides 15-16: BERTScore vs RaTEscore entity example.",
  },
];

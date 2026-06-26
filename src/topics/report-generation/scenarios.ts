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
  {
    id: "paraphrase-tolerance",
    title: "Paraphrase tolerance: same content, different wording",
    clinical: {
      situation: "Generated report uses common radiology synonyms",
      modality: "Chest X-ray report",
      atStake: "A wording change should not be treated like a clinical contradiction.",
      consequence: "BLEU/ROUGE can drop while METEOR-style matching stays more forgiving.",
    },
    state: state(PARAPHRASE_METEOR),
    teachingPoint:
      "Candidate A replaces effusion with fluid and improved with decreased. METEOR-style matching is more tolerant than pure lexical rows, while clinical rows remain aligned.",
    reference: "PPTX slides 3-6: BLEU, ROUGE, METEOR comparison.",
  },
  {
    id: "label-granularity",
    title: "Label granularity: same finding, wrong attributes",
    clinical: {
      situation: "Finding label extraction for CXR reports",
      modality: "Chest X-ray report",
      atStake: "Coarse finding agreement can hide wrong side or wrong change direction.",
      consequence: "A broader label/attribute proxy separates from coarse CheXbert-style F1.",
    },
    state: state(LABEL_GRANULARITY),
    teachingPoint:
      "Candidate B still mentions opacity, so a coarse finding label can remain high. SRR-BERT-style, temporal, laterality, and graph rows move because attributes changed.",
    reference: "PPTX slides 12-14: CheXbert and SRR-BERT label F1.",
  },
  {
    id: "error-category-context",
    title: "Error category: unsupported new finding",
    clinical: {
      situation: "Safety review of an AI-generated impression",
      modality: "Chest X-ray report",
      atStake: "A candidate-only pneumothorax can trigger urgent action.",
      consequence: "Error-category rows count unsupported findings instead of rewarding fluent wording.",
    },
    state: state(ERROR_CATEGORY_CONTEXT),
    teachingPoint:
      "Candidate B adds a new right pneumothorax that is not supported by the reference. GREEN/CRIMSON-style rows move even if other text overlaps.",
    reference: "PPTX slides 17-19: GREEN and CRIMSON error categories.",
  },
];

import type { Scenario } from "../../types/topic";
import {
  classificationState,
  confirmatoryCases,
  rareDiseaseCases,
  rocPrCases,
  screeningCases,
} from "./scenarioData";

export const classificationScenarios: Scenario[] = [
  {
    id: "rare-disease-accuracy-trap",
    title: "Rare disease: all-negative accuracy trap",
    clinical: {
      situation: "Low-prevalence disease screening cohort",
      modality: "Chest CT triage classifier",
      atStake: "Positive cases are rare, but missed positives drive follow-up risk.",
      consequence: "Accuracy can stay high while sensitivity stays at zero.",
    },
    state: classificationState(rareDiseaseCases),
    teachingPoint:
      "Model A predicts negative for everyone and leads on accuracy/specificity; Model B catches most positives and leads on sensitivity, balanced accuracy, PPV, NPV, and F1.",
    reference: "Slides 3-5: confusion matrix, Accuracy, Balanced Accuracy, class imbalance.",
  },
  {
    id: "screening-high-recall",
    title: "Screening: prioritize recall at a liberal operating point",
    clinical: {
      situation: "First-pass cancer screening",
      modality: "Mammography classifier",
      atStake: "The screen feeds a second review step rather than a final diagnosis.",
      consequence: "A lower threshold moves misses into false alarms.",
    },
    state: classificationState(screeningCases),
    teachingPoint:
      "Model A leads on sensitivity and NPV; Model B leads on specificity, PPV, accuracy, and F1. The operating goal decides which row matters.",
    reference: "Slide 12: screening uses Sensitivity, NPV, and F2-style recall emphasis.",
  },
  {
    id: "confirmatory-high-specificity",
    title: "Confirmatory test: prioritize specificity before biopsy",
    clinical: {
      situation: "Confirmatory triage before an invasive procedure",
      modality: "Ultrasound malignancy classifier",
      atStake: "False positives can send patients to unnecessary biopsy.",
      consequence: "A stricter threshold trades away sensitivity for specificity and PPV.",
    },
    state: classificationState(confirmatoryCases),
    teachingPoint:
      "Model A leads on sensitivity and balanced accuracy; Model B leads on specificity, PPV, accuracy, and F1.",
    reference: "Slide 12: confirmatory decisions emphasize Specificity, PPV, and F0.5.",
  },
  {
    id: "roc-pr-imbalance",
    title: "ROC versus PR under class imbalance",
    clinical: {
      situation: "Rare positive retrieval from a large normal pool",
      modality: "Retinal disease risk classifier",
      atStake: "The positive class is the clinical target.",
      consequence: "ROC and PR summaries can rank the same scores differently.",
    },
    state: classificationState(rocPrCases),
    teachingPoint:
      "Model A leads on AUROC by ranking most negatives lower; Model B leads on AP because positives occupy the earliest retrieval positions before many negatives.",
    reference: "Slides 8-10: ROC/AUROC and PR/AUPRC/AP, with prevalence-sensitive PR baseline.",
  },
];

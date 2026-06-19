/**
 * Learn content for the Image Detection topic.
 *
 * One section per detection metric, ported faithfully from the SegAndDect
 * reference (parts 7-10: matching & IoU, precision/recall/F1, AP/mAP, the IoU
 * thresholds AP50 / AP75 / AP@[.5:.95], and the medical detection metrics FROC
 * and sensitivity at a fixed false-positive budget). Each section carries a
 * KaTeX formula where applicable plus faithful meaning / features / caveats.
 *
 * Interactive mini-sims are attached to the sections the existing detection
 * widgets teach: one-to-one matching -> matching-duplicate-fp, AP ->
 * ap-reorder, FROC -> froc-add-fp. The widgets drive their own internal
 * fixtures, so each `initialState` is just a minimal valid EngineState that
 * satisfies the type.
 */

import type { LearnContent, MiniSimConfig } from "../../types/topic";
import type { EngineState } from "../../types/engine";

/** Minimal valid EngineState: default grid, default policy, no shapes/detections. */
function emptyState(): EngineState {
  return {
    grid: { width: 256, height: 256, spacingMm: [1, 1] },
    gt: [],
    predictions: [
      { id: "A", shapes: [] },
      { id: "B", shapes: [] },
    ],
    policy: { emptyDice: "one", emptyDistance: "undefined" },
  };
}

/** Builds a mini-sim config for a detection widget against an empty engine state. */
function detectionSim(kind: string, spotlightMetric: string): MiniSimConfig {
  return { kind, spotlightMetric, initialState: emptyState() };
}

export const detectionLearn: LearnContent = {
  intro:
    "Detection metrics answer two coupled questions: where is the object, and " +
    "how confident is the model? Before any number can be computed you must " +
    "fix the matching rules — a localization criterion (IoU or distance " +
    "threshold), a confidence threshold, and a one-to-one pairing of " +
    "predictions to ground-truth objects. From those matches come precision, " +
    "recall, F1, and the threshold-free summaries AP and mAP. Medical lesion " +
    "detection adds FROC and sensitivity reported at a fixed false-positive " +
    "budget, because in screening the cost of a missed lesion and the cost of " +
    "an extra false alarm are not symmetric.",
  sections: [
    {
      id: "matching",
      title: "Matching & IoU (one-to-one)",
      formula: "\\mathrm{IoU} = \\frac{|A \\cap B|}{|A \\cup B|}",
      meaning:
        "Detection metrics start by deciding whether a prediction matches a " +
        "ground-truth object. For box detection the localization criterion is " +
        "the intersection-over-union of the predicted box A and the ground-truth " +
        "box B: at an IoU threshold of 0.5, a prediction with IoU >= 0.5 is a " +
        "true positive and one with IoU < 0.5 is a false positive (unmatched). " +
        "Matching is one-to-one: one ground-truth object can be matched to only " +
        "one prediction — the highest-scoring or best-overlapping one — and any " +
        "duplicate prediction on the same object is counted as a false positive.",
      features: [
        "IoU is the standard localization criterion for box-based detection.",
        "Point or candidate detection can use a distance threshold instead of IoU.",
        "Matching must also fix a confidence threshold and an evaluation unit (lesion-, image-, or scan-level).",
        "Greedy matching assigns the highest-confidence prediction first.",
      ],
      caveats: [
        "Duplicate boxes on one object earn no extra credit — they become false positives.",
        "A single ground-truth object cannot be split across two true positives.",
        "Changing the IoU threshold changes which predictions count as matched, and therefore every downstream metric.",
      ],
      miniSim: detectionSim("matching-duplicate-fp", "matching"),
    },
    {
      id: "precision",
      title: "Precision",
      formula: "\\mathrm{Precision} = \\frac{TP}{TP + FP}",
      meaning:
        "Precision measures how many of the predicted objects are correct. Low " +
        "precision means the model produces many false-positive detections.",
      features: [
        "Sensitive to false positives.",
        "Computed at a fixed confidence threshold after matching.",
      ],
      caveats: [
        "High precision alone does not show how many objects were missed.",
        "A conservative model can post high precision while missing many lesions.",
      ],
    },
    {
      id: "recall",
      title: "Recall / Sensitivity",
      formula: "\\mathrm{Recall} = \\mathrm{Sensitivity} = \\frac{TP}{TP + FN}",
      meaning:
        "Recall measures how many of the ground-truth objects were detected. " +
        "Low recall means many missed objects — the count that matters most in " +
        "screening, where a missed lesion is the costly error.",
      features: [
        "Sensitive to false negatives (missed objects).",
        "Identical to sensitivity in detection.",
      ],
      caveats: [
        "Recall says nothing about false-positive burden on its own.",
        "Recall can be inflated by predicting many boxes, which destroys precision.",
      ],
    },
    {
      id: "f1",
      title: "F1 score",
      formula:
        "F_1 = \\frac{2 \\times \\mathrm{Precision} \\times \\mathrm{Recall}}{\\mathrm{Precision} + \\mathrm{Recall}}",
      meaning:
        "F1 is the harmonic mean of precision and recall, summarizing both at a " +
        "single fixed confidence threshold.",
      features: [
        "Balances precision and recall in one number.",
        "Useful when a single operating threshold is meaningful.",
      ],
      caveats: [
        "F1 depends on the chosen confidence threshold.",
        "It does not summarize behavior across all thresholds the way AP does.",
      ],
    },
    {
      id: "ap",
      title: "Average Precision (AP)",
      formula: "\\mathrm{AP} = \\int_0^1 p(r)\\,dr",
      meaning:
        "Average Precision summarizes the entire precision-recall curve across " +
        "confidence thresholds, where p(r) is precision at recall r. It combines " +
        "confidence ranking with localization correctness into one " +
        "threshold-free score.",
      features: [
        "The dominant summary metric in object-detection benchmarks.",
        "Rewards a model that ranks correct detections above false ones by confidence.",
        "Depends on the IoU threshold (or localization criterion) used for matching.",
      ],
      caveats: [
        "AP depends on the IoU threshold — quote AP50, AP75, or AP@[.5:.95] explicitly.",
        "Interpolation differs (VOC 11-point, all-points, COCO 101-point), so the method must be stated.",
        "AP integrates the whole curve, so it is invariant to a single operating threshold.",
      ],
      miniSim: detectionSim("ap-reorder", "ap"),
    },
    {
      id: "map",
      title: "mean Average Precision (mAP)",
      formula:
        "\\mathrm{mAP} = \\frac{1}{N}\\sum_{i=1}^{N} \\mathrm{AP}_i",
      meaning:
        "mAP is the mean of AP, averaged over object classes, over multiple IoU " +
        "thresholds, or over both. It condenses per-class and per-threshold " +
        "detection quality into one headline number.",
      features: [
        "Averages AP across classes and/or IoU thresholds.",
        "The headline ranking metric for most detection challenges.",
      ],
      caveats: [
        "Averaging hides which class or IoU threshold drives the score.",
        "The averaging axis (classes vs IoU thresholds) must be specified.",
      ],
    },
    {
      id: "ap50",
      title: "AP50 (loose localization)",
      formula: "\\mathrm{AP50} = \\mathrm{AP}\\,|_{\\mathrm{IoU}=0.50}",
      meaning:
        "AP50 is AP computed at an IoU threshold of 0.50 — a relatively loose " +
        "localization criterion under which approximate box placement is still " +
        "counted as correct.",
      features: [
        "Forgiving of imprecise box placement.",
        "Often the most reported single AP value.",
      ],
      caveats: [
        "A high AP50 does not guarantee accurate localization.",
        "Compare against AP75 to see how tight the boxes really are.",
      ],
    },
    {
      id: "ap75",
      title: "AP75 (strict localization)",
      formula: "\\mathrm{AP75} = \\mathrm{AP}\\,|_{\\mathrm{IoU}=0.75}",
      meaning:
        "AP75 is AP computed at an IoU threshold of 0.75 — a stricter criterion " +
        "that requires more accurate box placement to count a detection as " +
        "correct.",
      features: [
        "Rewards tight, well-localized boxes.",
        "Read together with AP50 to judge localization quality.",
      ],
      caveats: [
        "If AP50 is high but AP75 is low, the model finds objects but localizes them loosely.",
        "AP75 can drop sharply on small or hard-to-bound structures.",
      ],
    },
    {
      id: "apRange",
      title: "AP@[.5:.95] (COCO)",
      formula:
        "\\mathrm{AP}_{[.5:.95]} = \\frac{1}{10}\\sum_{t \\in \\{.5,.55,\\dots,.95\\}} \\mathrm{AP}\\,|_{\\mathrm{IoU}=t}",
      meaning:
        "AP@[.5:.95] averages AP across the ten IoU thresholds from 0.50 to 0.95 " +
        "in steps of 0.05. By sweeping the IoU threshold it evaluates " +
        "localization quality across the whole range rather than at one cutoff.",
      features: [
        "The primary COCO metric; rewards consistent localization.",
        "Penalizes models that match only at loose thresholds.",
      ],
      caveats: [
        "More demanding than AP50, so absolute values look lower.",
        "Recomputes the PR curve at each IoU threshold, which is more expensive.",
      ],
    },
    {
      id: "froc",
      title: "FROC (Free-response ROC)",
      formula: "y = \\mathrm{Sensitivity}, \\quad x = \\frac{\\#\\,FP}{\\text{image or scan}}",
      meaning:
        "The FROC curve plots lesion-level sensitivity (y) against the number of " +
        "false positives per image or per scan (x). It evaluates how many " +
        "lesions are caught while making the false-positive burden explicit — " +
        "the right framing when one image or scan can contain several lesions.",
      features: [
        "Standard for medical lesion detection and CAD.",
        "Handles multiple lesions per image or scan.",
        "Lets you read off sensitivity at any chosen false-positive level.",
      ],
      caveats: [
        "Adding more candidate detections raises sensitivity but also raises FP/scan.",
        "A curve must be reported alongside any single sensitivity number.",
        "FP/image and FP/scan are different units — do not conflate them.",
      ],
      miniSim: detectionSim("froc-add-fp", "froc"),
    },
    {
      id: "sensAtFp",
      title: "Sensitivity at fixed FP/image or FP/scan",
      formula:
        "\\mathrm{Score} = \\frac{1}{|F|}\\sum_{f \\in F} \\mathrm{Sensitivity}\\,(\\mathrm{FP} \\le f)",
      meaning:
        "Reading the FROC curve at one or more predefined false-positive budgets " +
        "reports detection sensitivity under a fixed false-positive condition. " +
        "LUNA16, for example, averages sensitivity across the seven FP/scan " +
        "levels {1/8, 1/4, 1/2, 1, 2, 4, 8}; DeepLesion reports sensitivity at " +
        "5 false positives per image.",
      features: [
        "Directly states performance under a clinically meaningful FP budget.",
        "Easier to interpret than a single threshold-free summary in CAD settings.",
        "Averaging several FP levels gives a single challenge-ranking score.",
      ],
      caveats: [
        "The chosen FP budget must match the clinical workflow it represents.",
        "FP/image and FP/scan budgets are not interchangeable.",
        "A score at one FP level hides behavior at the others.",
      ],
    },
  ],
};

export default detectionLearn;

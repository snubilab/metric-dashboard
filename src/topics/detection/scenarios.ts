/**
 * Clinically grounded detection scenarios.
 *
 * Each scenario carries a full ClinicalContext, a teaching point, a reference,
 * and an EngineState whose `detections = { boxes, gtObjects }` holds the
 * detection scene. The scenes are constructed so the stated teaching point is
 * numerically true under the engine's detection metrics:
 *
 *   - LUNA16 lung-nodule CAD: catching the last nodules costs many FP/scan.
 *   - RSNA pneumonia boxes: AP50 high, AP75 low (loose localization).
 *   - DeepLesion universal lesion detection: sensitivity reported at 5 FP/image.
 *   - CAMELYON16 metastasis detection: sensitivity vs FP/image on slides.
 *
 * Several scenarios are inherently multi-scan (FROC averages over scans). The
 * `detections` field holds a single flattened scene for the board UI; the
 * matching per-scan grouping used to reproduce the published FROC behavior is
 * exported alongside as `*Scans` so tests can validate the engine directly.
 */

import type { DetBox, EngineState } from "../../types/engine";
import type { Scenario } from "../../types/topic";

const DEFAULT_GRID = { width: 256, height: 256, spacingMm: [1, 1] as [number, number] };
const DEFAULT_POLICY = { emptyDice: "one" as const, emptyDistance: "undefined" as const };

/** Wraps a detection scene in an otherwise-empty EngineState. */
function detectionState(gtObjects: DetBox[], boxes: DetBox[]): EngineState {
  return {
    grid: DEFAULT_GRID,
    gt: [],
    predictions: [
      { id: "A", shapes: [] },
      { id: "B", shapes: [] },
    ],
    detections: { boxes, gtObjects },
    policy: DEFAULT_POLICY,
  };
}

/** Flattens per-scan boxes into one list (for the single-scene board view). */
function flatten(scans: DetBox[][]): DetBox[] {
  return scans.flat();
}

// --- (a) LUNA16 lung-nodule CAD: too many FP/scan ----------------------------
// Five CT scans, one nodule each. Four nodules are caught at reasonable
// confidence; the fifth is subtle and only surfaces at a very low score (0.18).
// That low threshold also admits a flood of low-confidence false marks, so
// reaching full sensitivity costs ~5.4 FP/scan. Sensitivity is 0.8 from 1 FP/scan
// through 4 FP/scan and hits 1.0 only well past 4 FP/scan — the
// radiologist-fatigue tradeoff LUNA16 quantifies.
export const luna16Scans = {
  gtPerScan: [
    [{ x: 50, y: 50, w: 20, h: 20 }],
    [{ x: 80, y: 90, w: 18, h: 18 }],
    [{ x: 30, y: 120, w: 22, h: 22 }],
    [{ x: 100, y: 100, w: 16, h: 16 }],
    [{ x: 160, y: 60, w: 14, h: 14 }],
  ] as DetBox[][],
  detectionsPerScan: [
    [
      // Easy nodule, plus a cluster of low-confidence false marks.
      { x: 50, y: 50, w: 20, h: 20, confidence: 0.95 },
      { x: 10, y: 200, w: 12, h: 12, confidence: 0.34 },
      { x: 210, y: 20, w: 10, h: 10, confidence: 0.3 },
      { x: 120, y: 210, w: 10, h: 10, confidence: 0.26 },
      { x: 200, y: 120, w: 8, h: 8, confidence: 0.22 },
      { x: 230, y: 230, w: 8, h: 8, confidence: 0.19 },
      { x: 5, y: 130, w: 8, h: 8, confidence: 0.18 },
    ],
    [
      { x: 80, y: 90, w: 18, h: 18, confidence: 0.85 },
      { x: 20, y: 20, w: 10, h: 10, confidence: 0.33 },
      { x: 200, y: 200, w: 10, h: 10, confidence: 0.29 },
      { x: 220, y: 70, w: 10, h: 10, confidence: 0.24 },
      { x: 60, y: 220, w: 8, h: 8, confidence: 0.21 },
      { x: 130, y: 30, w: 8, h: 8, confidence: 0.19 },
      { x: 240, y: 140, w: 8, h: 8, confidence: 0.18 },
    ],
    [
      { x: 30, y: 120, w: 22, h: 22, confidence: 0.7 },
      { x: 90, y: 30, w: 10, h: 10, confidence: 0.32 },
      { x: 5, y: 5, w: 8, h: 8, confidence: 0.28 },
      { x: 200, y: 30, w: 8, h: 8, confidence: 0.23 },
      { x: 150, y: 210, w: 8, h: 8, confidence: 0.2 },
      { x: 240, y: 200, w: 8, h: 8, confidence: 0.19 },
      { x: 110, y: 240, w: 8, h: 8, confidence: 0.18 },
    ],
    [
      { x: 100, y: 100, w: 16, h: 16, confidence: 0.55 },
      { x: 30, y: 200, w: 10, h: 10, confidence: 0.31 },
      { x: 220, y: 100, w: 8, h: 8, confidence: 0.27 },
      { x: 10, y: 80, w: 8, h: 8, confidence: 0.22 },
      { x: 180, y: 230, w: 8, h: 8, confidence: 0.2 },
      { x: 240, y: 40, w: 8, h: 8, confidence: 0.18 },
    ],
    [
      // Subtle nodule: its only matching detection is very low confidence, so it
      // surfaces only once the study is already flooded with false marks.
      { x: 160, y: 60, w: 14, h: 14, confidence: 0.18 },
      { x: 40, y: 40, w: 10, h: 10, confidence: 0.35 },
      { x: 210, y: 200, w: 10, h: 10, confidence: 0.25 },
      { x: 70, y: 190, w: 8, h: 8, confidence: 0.21 },
      { x: 230, y: 120, w: 8, h: 8, confidence: 0.19 },
    ],
  ] as DetBox[][],
};

// --- (b) RSNA pneumonia boxes: AP50 high, AP75 low ---------------------------
// Three pneumonia opacities on a chest X-ray. Every predicted box is shifted ~10
// px (IoU ~0.60 with its target), so all three match at IoU 0.50 (AP50 high) but
// none match at IoU 0.75 (AP75 collapses) — approximate vs precise localization.
const RSNA_GT: DetBox[] = [
  { x: 20, y: 20, w: 40, h: 40 },
  { x: 120, y: 30, w: 40, h: 40 },
  { x: 60, y: 120, w: 40, h: 40 },
];
export const rsnaPreds: DetBox[] = [
  { x: 30, y: 20, w: 40, h: 40, confidence: 0.95 },
  { x: 130, y: 30, w: 40, h: 40, confidence: 0.9 },
  { x: 70, y: 120, w: 40, h: 40, confidence: 0.85 },
  { x: 200, y: 200, w: 40, h: 40, confidence: 0.3 },
];
export const rsnaGt = RSNA_GT;

// --- (c) DeepLesion universal lesion detection: sensitivity at 5 FP/image ----
// A single CT slice with four lesions of varying conspicuity and a spray of
// false positives. At 5 FP/image the model reaches full sensitivity; tightening
// to 1 FP/image drops it to 0.5 — DeepLesion's fixed-FP-budget framing.
export const deepLesionScans = {
  gtPerScan: [
    [
      { x: 40, y: 40, w: 30, h: 30 },
      { x: 120, y: 60, w: 24, h: 24 },
      { x: 70, y: 140, w: 20, h: 20 },
      { x: 180, y: 160, w: 18, h: 18 },
    ],
  ] as DetBox[][],
  detectionsPerScan: [
    [
      { x: 40, y: 40, w: 30, h: 30, confidence: 0.92 },
      { x: 120, y: 60, w: 24, h: 24, confidence: 0.8 },
      { x: 70, y: 140, w: 20, h: 20, confidence: 0.5 },
      { x: 180, y: 160, w: 18, h: 18, confidence: 0.3 },
      { x: 10, y: 200, w: 12, h: 12, confidence: 0.7 },
      { x: 200, y: 20, w: 12, h: 12, confidence: 0.6 },
      { x: 150, y: 200, w: 10, h: 10, confidence: 0.45 },
      { x: 220, y: 120, w: 10, h: 10, confidence: 0.4 },
      { x: 90, y: 200, w: 10, h: 10, confidence: 0.35 },
      { x: 30, y: 100, w: 10, h: 10, confidence: 0.25 },
    ],
  ] as DetBox[][],
};

// --- (d) CAMELYON16 metastasis detection: FP/image ---------------------------
// Three whole-slide images with lymph-node metastases. Sensitivity is read
// against average false positives per image; subtle metastases require lower
// thresholds, raising FP/image.
export const camelyon16Scans = {
  gtPerScan: [
    [{ x: 60, y: 60, w: 24, h: 24 }],
    [
      { x: 100, y: 120, w: 20, h: 20 },
      { x: 160, y: 50, w: 16, h: 16 },
    ],
    [{ x: 40, y: 160, w: 18, h: 18 }],
  ] as DetBox[][],
  detectionsPerScan: [
    [
      { x: 60, y: 60, w: 24, h: 24, confidence: 0.9 },
      { x: 10, y: 200, w: 10, h: 10, confidence: 0.5 },
      { x: 200, y: 30, w: 10, h: 10, confidence: 0.4 },
    ],
    [
      { x: 100, y: 120, w: 20, h: 20, confidence: 0.85 },
      { x: 160, y: 50, w: 16, h: 16, confidence: 0.4 },
      { x: 20, y: 20, w: 10, h: 10, confidence: 0.55 },
      { x: 210, y: 210, w: 10, h: 10, confidence: 0.45 },
    ],
    [
      { x: 40, y: 160, w: 18, h: 18, confidence: 0.75 },
      { x: 180, y: 90, w: 10, h: 10, confidence: 0.5 },
    ],
  ] as DetBox[][],
};

export const detectionScenarios: Scenario[] = [
  {
    id: "luna16-nodule-fp-burden",
    title: "LUNA16: lung-nodule CAD drowning in false positives",
    clinical: {
      situation:
        "A lung-nodule CAD system flags candidates on screening chest CT. To " +
        "catch the subtle, low-contrast nodules it must lower its threshold, " +
        "which floods each scan with extra marks the radiologist must dismiss.",
      modality: "Chest CT",
      atStake:
        "A missed malignant nodule delays a cancer diagnosis; an excess of " +
        "false marks per scan slows reading and breeds alert fatigue.",
      consequence:
        "At a tolerable 1 FP/scan sensitivity is about 0.8, and it stays 0.8 " +
        "even at 4 FP/scan; the subtle nodule surfaces only at a very low " +
        "threshold, so full sensitivity costs well past 4 FP/scan (about 5.4). " +
        "The LUNA16 score averages this tradeoff across the seven FP/scan " +
        "budgets {1/8, 1/4, 1/2, 1, 2, 4, 8}.",
    },
    state: detectionState(
      flatten(luna16Scans.gtPerScan),
      flatten(luna16Scans.detectionsPerScan),
    ),
    teachingPoint:
      "FROC makes the false-positive burden explicit: every gain in lesion " +
      "sensitivity is bought with more false marks per scan. A single " +
      "sensitivity number is meaningless without the FP/scan it was measured at.",
    reference:
      "Setio AAA, et al. Validation, comparison, and combination of algorithms " +
      "for automatic detection of pulmonary nodules in CT images: the LUNA16 " +
      "challenge. Medical Image Analysis. 2017.",
  },
  {
    id: "rsna-ap50-vs-ap75",
    title: "RSNA pneumonia: AP50 high, AP75 low",
    clinical: {
      situation:
        "A model draws bounding boxes around pneumonia opacities on chest " +
        "X-rays. Every box lands on the right opacity but sits slightly off " +
        "center, overlapping the reference box at roughly IoU 0.60.",
      modality: "Chest X-ray",
      atStake:
        "Whether 'detected the opacity' should also mean 'localized it " +
        "tightly'. A loose box still points the reader to the right region; a " +
        "tight box matters more when the finding guides a follow-up measurement.",
      consequence:
        "At IoU 0.50 all three opacities count as detected, so AP50 is high. At " +
        "IoU 0.75 none of the boxes qualify, so AP75 collapses — the same model, " +
        "judged by localization tightness.",
    },
    state: detectionState(RSNA_GT, rsnaPreds),
    teachingPoint:
      "A high AP50 paired with a low AP75 is the signature of a model that " +
      "finds objects but localizes them loosely. Always read AP50, AP75, and " +
      "AP@[.5:.95] together rather than quoting one in isolation.",
    reference: "RSNA Pneumonia Detection Challenge. 2018.",
  },
  {
    id: "deeplesion-sensitivity-at-fixed-fp",
    title: "DeepLesion: sensitivity at 5 false positives per image",
    clinical: {
      situation:
        "A universal lesion detector marks lesions of any type on a CT slice. " +
        "Conspicuous lesions are flagged confidently; the subtle one surfaces " +
        "only at a low score, alongside several false positives.",
      modality: "CT (universal lesion detection)",
      atStake:
        "How many lesions are caught once the reviewer agrees to tolerate a " +
        "fixed number of false positives per image — DeepLesion reports " +
        "sensitivity at 5 FP/image.",
      consequence:
        "At 5 FP/image sensitivity reaches 1.0, but at a stricter 1 FP/image it " +
        "falls to 0.5. The headline number is only meaningful with its FP budget.",
    },
    state: detectionState(
      flatten(deepLesionScans.gtPerScan),
      flatten(deepLesionScans.detectionsPerScan),
    ),
    teachingPoint:
      "Sensitivity at a fixed FP/image fixes the false-positive budget so two " +
      "detectors can be compared fairly — but the budget must match the " +
      "clinical workflow, and FP/image is not interchangeable with FP/scan.",
    reference:
      "Yan K, Wang X, Lu L, Summers RM. DeepLesion: automated mining of " +
      "large-scale lesion annotations and universal lesion detection with deep " +
      "learning. Journal of Medical Imaging. 2018.",
  },
  {
    id: "camelyon16-metastasis-fp-per-image",
    title: "CAMELYON16: metastasis detection vs FP/image",
    clinical: {
      situation:
        "A detector localizes lymph-node metastases in whole-slide images. " +
        "Large metastatic foci are detected confidently; a small one is " +
        "borderline, and benign mimics generate scattered false positives.",
      modality: "Whole-slide histopathology",
      atStake:
        "Lesion-level detection sensitivity weighed against the average number " +
        "of false positives per slide a pathologist must review.",
      consequence:
        "Sensitivity is about 0.75 at 1 FP/image and only reaches 1.0 once the " +
        "small metastasis is admitted at a higher FP/image, mirroring the " +
        "CAMELYON16 FROC evaluation.",
    },
    state: detectionState(
      flatten(camelyon16Scans.gtPerScan),
      flatten(camelyon16Scans.detectionsPerScan),
    ),
    teachingPoint:
      "On whole-slide images the FROC is plotted against FP/image: lesion-level " +
      "sensitivity is meaningful only once the per-image false-positive load a " +
      "pathologist would tolerate is fixed.",
    reference:
      "Ehteshami Bejnordi B, et al. Diagnostic assessment of deep learning " +
      "algorithms for detection of lymph node metastases in women with breast " +
      "cancer (CAMELYON16). JAMA. 2017.",
  },
];

export default detectionScenarios;

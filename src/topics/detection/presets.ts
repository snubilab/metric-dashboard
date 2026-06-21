/**
 * One-click, well-configured starting points for the Object Detection Playground.
 *
 * Each preset is a complete detection scene — a set of ground-truth lesions plus
 * a set of predicted boxes — laid out with explicit coordinates on the shared
 * 256x256 grid so that the matching table (TP / FP / FN, precision, recall)
 * immediately shows a clear, instructive contrast. The counts in each preset's
 * doc-comment were sanity-checked against the real engine (`matchDetections` at
 * IoU 0.5, with every box counted) so the stated teaching point is literally
 * true when the table recomputes.
 *
 * Conventions mirror the Segmentation `presets.ts`: `gtObjects` is the reference
 * (ground-truth boxes never carry a confidence), and `boxes` are the model's
 * predictions (always with a confidence so the confidence-threshold slider has
 * something to sweep). All presets match at IoU 0.5.
 *
 * All values are plain data; no colors or fonts live here.
 */

import type { DetBox } from "../../types/engine";

/** Shared match IoU threshold for every preset. */
export const DET_IOU_THRESHOLD = 0.5;

/** A named, one-click Object Detection Playground starting point. */
export interface DetPreset {
  /** Stable identifier, used as a React key and for the active-preset highlight. */
  id: string;
  /** Short button label (English). */
  label: string;
  /** Short button label (Korean), shown when the UI language is Korean. */
  labelKo: string;
  /** One-sentence explanation of the contrast the preset demonstrates (English). */
  description: string;
  /** Korean explanation, shown when the UI language is Korean. */
  descriptionKo: string;
  /** IoU threshold at which predictions are matched to ground truth. */
  iouThreshold: number;
  /** Ground-truth lesion boxes; these never carry a confidence. */
  gtObjects: DetBox[];
  /** Predicted boxes, each with a confidence for the threshold slider to sweep. */
  boxes: DetBox[];
}

/**
 * Well-configured presets covering the canonical detection contrasts. Ordered
 * from the friendliest teaching case to the subtler ones. Every preset matches
 * at IoU 0.5 on the shared 256x256 grid.
 */
export const DET_PRESETS: DetPreset[] = [
  {
    id: "clean-detection",
    label: "Clean detection",
    labelKo: "깔끔한 검출",
    description:
      "Every lesion is found with a tight, confident box — precision and recall " +
      "both 1.0.",
    descriptionKo:
      "모든 병변을 신뢰도 높은 정확한 상자로 찾아냅니다 — 정밀도·재현율 모두 1.0.",
    iouThreshold: DET_IOU_THRESHOLD,
    gtObjects: [
      { x: 60, y: 60, w: 40, h: 40 },
      { x: 160, y: 70, w: 40, h: 40 },
      { x: 90, y: 160, w: 50, h: 34 },
    ],
    boxes: [
      { x: 62, y: 62, w: 40, h: 40, confidence: 0.95 },
      { x: 160, y: 72, w: 40, h: 40, confidence: 0.9 },
      { x: 92, y: 160, w: 50, h: 34, confidence: 0.88 },
    ],
  },
  {
    id: "missed-low-recall",
    label: "Missed detections (low recall)",
    labelKo: "놓친 검출 (낮은 재현율)",
    description:
      "Two lesions are caught but the third is missed entirely — precision stays " +
      "high while recall falls.",
    descriptionKo:
      "두 병변은 잡지만 세 번째는 완전히 놓칩니다 — 정밀도는 높은데 재현율이 떨어집니다.",
    iouThreshold: DET_IOU_THRESHOLD,
    gtObjects: [
      { x: 60, y: 60, w: 40, h: 40 },
      { x: 160, y: 70, w: 40, h: 40 },
      { x: 100, y: 170, w: 40, h: 30 },
    ],
    boxes: [
      { x: 60, y: 60, w: 40, h: 40, confidence: 0.95 },
      { x: 160, y: 70, w: 40, h: 40, confidence: 0.9 },
    ],
  },
  {
    id: "over-detection-low-precision",
    label: "Over-detection (low precision)",
    labelKo: "과검출 (낮은 정밀도)",
    description:
      "Both lesions are found, but three spurious boxes fire elsewhere — recall " +
      "is perfect while precision collapses.",
    descriptionKo:
      "두 병변을 모두 찾지만 엉뚱한 곳에 상자 세 개가 더 켜집니다 — 재현율은 완벽하지만 " +
      "정밀도가 무너집니다.",
    iouThreshold: DET_IOU_THRESHOLD,
    gtObjects: [
      { x: 70, y: 70, w: 44, h: 44 },
      { x: 150, y: 120, w: 44, h: 44 },
    ],
    boxes: [
      { x: 70, y: 70, w: 44, h: 44, confidence: 0.9 },
      { x: 150, y: 120, w: 44, h: 44, confidence: 0.85 },
      { x: 20, y: 200, w: 24, h: 24, confidence: 0.6 },
      { x: 210, y: 30, w: 24, h: 24, confidence: 0.55 },
      { x: 210, y: 200, w: 24, h: 24, confidence: 0.5 },
    ],
  },
  {
    id: "loose-localization",
    label: "Loose localization (AP50 high, AP75 low)",
    labelKo: "느슨한 위치 (AP50↑, AP75↓)",
    description:
      "Every box overlaps its lesion enough to count at IoU 0.5 but is visibly " +
      "offset, so AP50 is high while the stricter AP@[.5:.95] drops.",
    descriptionKo:
      "모든 상자가 IoU 0.5 기준으로는 병변과 겹치지만 눈에 띄게 어긋나 있어, AP50은 " +
      "높지만 더 엄격한 AP@[.5:.95]는 떨어집니다.",
    iouThreshold: DET_IOU_THRESHOLD,
    gtObjects: [
      { x: 60, y: 60, w: 50, h: 50 },
      { x: 150, y: 150, w: 50, h: 50 },
      { x: 170, y: 40, w: 40, h: 40 },
    ],
    boxes: [
      { x: 66, y: 66, w: 50, h: 50, confidence: 0.9 },
      { x: 156, y: 156, w: 50, h: 50, confidence: 0.85 },
      { x: 176, y: 46, w: 40, h: 40, confidence: 0.8 },
    ],
  },
  {
    id: "mixed-confidence",
    label: "Confidence threshold matters",
    labelKo: "신뢰도 임계값의 영향",
    description:
      "Three correct high-confidence boxes plus two low-confidence false " +
      "positives — raising the threshold trades recall for precision.",
    descriptionKo:
      "신뢰도 높은 정답 상자 셋에 신뢰도 낮은 위양성 둘이 섞여 있어, 임계값을 올리면 " +
      "재현율을 내주고 정밀도를 얻습니다.",
    iouThreshold: DET_IOU_THRESHOLD,
    gtObjects: [
      { x: 60, y: 60, w: 40, h: 40 },
      { x: 150, y: 70, w: 40, h: 40 },
      { x: 100, y: 160, w: 40, h: 36 },
    ],
    boxes: [
      { x: 60, y: 60, w: 40, h: 40, confidence: 0.9 },
      { x: 150, y: 70, w: 40, h: 40, confidence: 0.85 },
      { x: 100, y: 160, w: 40, h: 36, confidence: 0.8 },
      { x: 20, y: 200, w: 22, h: 22, confidence: 0.3 },
      { x: 210, y: 30, w: 22, h: 22, confidence: 0.25 },
    ],
  },
];

/** The preset the Playground loads on first render — a strong, instructive default. */
export const DEFAULT_DET_PRESET_ID = "clean-detection";

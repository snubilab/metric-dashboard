/**
 * Detection topic Playground.
 *
 * Seeds the shared DetectionBoard with a small, hand-built scene — a few
 * ground-truth lesion boxes and predicted boxes with confidence scores, plus
 * one stray low-confidence false positive. The board itself supplies the
 * confidence-threshold slider, the PR and FROC charts, the AP interpolation
 * selector, and the live TP/FP/FN, precision, recall, F1, AP, and AP@[.5:.95]
 * numerals. A short intro frames what to watch for.
 *
 * All visual values come from design-system tokens; no colors or fonts are
 * hardcoded.
 */

import type { CSSProperties } from "react";
import type { DetBox } from "../../types/engine";
import { DetectionBoard } from "../../components/DetectionBoard";

/** Three ground-truth lesion boxes for the seeded scene. */
const SEED_GT: DetBox[] = [
  { x: 30, y: 40, w: 44, h: 44 },
  { x: 140, y: 60, w: 40, h: 40 },
  { x: 80, y: 150, w: 36, h: 36 },
];

/**
 * Seeded predictions: two confident, well-placed boxes; one lower-confidence
 * box that is slightly loose on its lesion; and one stray false positive far
 * from any ground truth. Sliding the threshold reorders the operating point and
 * separates F1 (moves) from AP (fixed).
 */
const SEED_PREDS: DetBox[] = [
  { x: 31, y: 41, w: 44, h: 44, confidence: 0.94 },
  { x: 141, y: 61, w: 40, h: 40, confidence: 0.82 },
  { x: 90, y: 158, w: 36, h: 36, confidence: 0.46 },
  { x: 210, y: 200, w: 30, h: 30, confidence: 0.33 },
];

const rootStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-6)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const introStyle: CSSProperties = {
  maxWidth: "60ch",
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

export function DetectionPlayground() {
  return (
    <div style={rootStyle}>
      <p style={introStyle}>
        Three ground-truth lesions and four predicted boxes — three real
        detections plus one stray false positive. Drag the confidence threshold
        to slide the operating point: precision, recall, and F1 move with it,
        while AP integrates the entire curve and stays fixed (changing only when
        you switch the interpolation method). The PR and FROC charts make the
        tradeoff visible.
      </p>
      <DetectionBoard gt={SEED_GT} preds={SEED_PREDS} iouThreshold={0.5} />
    </div>
  );
}

export default DetectionPlayground;

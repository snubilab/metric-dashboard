/**
 * DetectionBoard — a thin stateful adapter over the controlled
 * DetectionMetricsPanel.
 *
 * The board owns the operating confidence threshold and the AP interpolation
 * method as local state, then delegates ALL rendering to
 * DetectionMetricsPanel. Existing callers (Scenarios etc.) keep their
 * <DetectionBoard gt preds iouThreshold /> contract unchanged; the metric
 * logic and copy now live in the panel so a playground can share one threshold
 * across the panel and a canvas.
 */

import { useState } from "react";
import type { DetBox } from "../types/engine";
import type { ApMethod } from "../engine/metrics/detection";
import { DetectionMetricsPanel } from "./DetectionMetricsPanel";

export interface DetectionBoardProps {
  /** Ground-truth objects (no confidence). */
  gt: DetBox[];
  /** Predicted boxes with confidences. */
  preds: DetBox[];
  /** IoU threshold for a match. Defaults to 0.5. */
  iouThreshold?: number;
}

export function DetectionBoard({ gt, preds, iouThreshold = 0.5 }: DetectionBoardProps) {
  const [threshold, setThreshold] = useState(0);
  const [apMethod, setApMethod] = useState<ApMethod>("coco101");

  return (
    <DetectionMetricsPanel
      gt={gt}
      preds={preds}
      iouThreshold={iouThreshold}
      threshold={threshold}
      apMethod={apMethod}
      onThresholdChange={setThreshold}
      onApMethodChange={setApMethod}
    />
  );
}

export default DetectionBoard;

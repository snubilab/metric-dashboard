/**
 * Detection Playground — a draw-from-scratch GUIDED sandbox for the detection
 * metric suite.
 *
 * Detection is GROUND-TRUTH vs PREDICTIONS-WITH-A-CONFIDENCE-THRESHOLD, never
 * A-vs-B. The Playground boots EMPTY (gt:[], preds:[]) so every box on the
 * canvas is something the student drew. A pure `detectionStage(state)` helper
 * derives the stage ("gt" | "preds" | "compare") from box counts and drives the
 * whole experience: a STEP n of 2 pill, a layer-colored per-step prompt inside
 * the canvas, which layer is active/locked, and whether the right column (the
 * metrics panel) renders. The student draws the truth (GT), then predicted
 * boxes with confidences; only when both are non-empty does the comparison
 * unlock.
 *
 * The keystone: the SAME confidence threshold feeds BOTH the DetectionCanvas
 * (which recolors every box via classifyDetections) AND the DetectionMetricsPanel
 * (whose counts come from matchDetections(aboveThreshold(preds,T),gt)). Dragging
 * the threshold therefore recolors the picture AND moves the numerals/PR dot
 * from one shared T — and because classifyDetections' counts are asserted
 * byte-identical to matchDetections', the picture and the numbers can never
 * disagree. AP integrates the whole ordering and stays fixed under T. NO metric
 * is graded good/bad.
 *
 * All visual values come from the design-system token custom properties; no
 * color or font is hardcoded.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { DetBox, Grid } from "../../types/engine";
import { DetectionCanvas } from "../../components/canvas/DetectionCanvas";
import { DetectionMetricsPanel } from "../../components/DetectionMetricsPanel";
import type { ApMethod } from "../../engine/metrics/detection";
import { useFirstVisit } from "../../components/useFirstVisit";
import { useLang } from "../../i18n/LanguageContext";
import {
  detectionStage,
  lockedLayersFor,
  stageLayer,
  stageStep,
} from "./detFlowStage";
import type { DetLayer, DetState } from "./detFlowStage";
import {
  LOAD_EXAMPLE,
  RESET_TO_EMPTY,
  SHOW_GUIDE_AGAIN,
  STAGE_GATING_LINE,
  STAGE_PROMPT,
  THESIS_BANNER,
  stepPill,
} from "./detGuidedCopy";

/** The board scale shared with the detection scenes (a 256-cell square grid). */
const GRID: Grid = { width: 256, height: 256, spacingMm: [1, 1] };

/** IoU threshold for a match (advanced concept; fixed at the standard 0.5). */
const IOU_THRESHOLD = 0.5;

/** Default operating threshold — 0 so compare first shows ALL preds visible. */
const DEFAULT_THRESHOLD = 0;

/** Default AP interpolation method. */
const DEFAULT_AP_METHOD: ApMethod = "coco101";

/** localStorage key for the one-time compare (thesis) banner's dismissed flag. */
const GUIDE_SEEN_KEY = "md-detection-playground-guide-seen";

/**
 * The FIXED "Load an example" seed. Three ground-truth lesions; four predictions
 * — two confident matches, one genuine MID-confidence match (the third pred,
 * IoU 0.653 >= 0.5 at confidence 0.60), and one stray false positive. Raising
 * the threshold past 0.60 converts that real TP into a ghost (recall down,
 * precision up, F1 moves) while AP and the PR curve stay fixed — the lesson.
 */
const SEED_GT: DetBox[] = [
  { x: 30, y: 40, w: 44, h: 44 },
  { x: 140, y: 60, w: 40, h: 40 },
  { x: 80, y: 150, w: 36, h: 36 },
];

const SEED_PREDS: DetBox[] = [
  { x: 31, y: 41, w: 44, h: 44, confidence: 0.94 },
  { x: 141, y: 61, w: 40, h: 40, confidence: 0.82 },
  { x: 84, y: 154, w: 36, h: 36, confidence: 0.6 },
  { x: 210, y: 200, w: 30, h: 30, confidence: 0.33 },
];

/** Bilingual copy for the editing-action row and framing affordances. */
const L = {
  ko: {
    actions: "편집 동작",
    undo: "실행취소",
    metrics: "지표 (정답 대 예측)",
    dismiss: "닫기",
    presetsLabel: "검출 예시",
  },
  en: {
    actions: "Edit actions",
    undo: "Undo",
    metrics: "Metrics (ground truth vs predictions)",
    dismiss: "Dismiss",
    presetsLabel: "Detection examples",
  },
} as const;

/** Unicode info / dismiss glyphs (NOT emoji). */
const INFO_GLYPH = "ⓘ"; // ⓘ CIRCLED LATIN SMALL LETTER I
const DISMISS_GLYPH = "✕"; // ✕ MULTIPLICATION X

/** Deep-ish clone of a box list so undo snapshots never alias live state. */
function cloneBoxes(boxes: DetBox[]): DetBox[] {
  return boxes.map((b) => ({ ...b }));
}

/**
 * Scoped layout rules for the canvas-first split. All visual values stay in
 * inline token styles; this stylesheet only governs flex ordering so the canvas
 * sits on the LEFT side by side, but the metrics column rises ABOVE the canvas
 * once the columns stack at narrow widths.
 */
const RESPONSIVE_ORDER_CSS = `
.dpg-canvas-col { order: 1; }
.dpg-metrics-col { order: 2; }
@media (max-width: 720px) {
  .dpg-canvas-col { order: 2; }
  .dpg-metrics-col { order: 1; }
}
`;

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const splitStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-5)",
  alignItems: "flex-start",
};

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  flex: "1 1 360px",
  minWidth: "300px",
};

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

const stepPillStyle: CSSProperties = {
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  padding: "var(--space-1) var(--space-3)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-pill, var(--radius-sm))",
};

const gatingLineStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

const thesisBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--space-2)",
  padding: "var(--space-2) var(--space-3)",
  background: "var(--c-surface-2)",
  color: "var(--c-text-dim)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.4,
};

const bannerGlyphStyle: CSSProperties = {
  flex: "0 0 auto",
  color: "var(--c-text-dim)",
};

const bannerTextStyle: CSSProperties = {
  flex: "1 1 auto",
};

const bannerDismissStyle: CSSProperties = {
  flex: "0 0 auto",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
};

const actionButtonStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2) var(--space-3)",
  cursor: "pointer",
};

const actionButtonDisabledStyle: CSSProperties = {
  ...actionButtonStyle,
  color: "var(--c-text-dim)",
  cursor: "not-allowed",
  opacity: 0.6,
};

const showGuideStyle: CSSProperties = {
  alignSelf: "flex-start",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
};

const detailsStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

const exampleButtonStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2) var(--space-3)",
  cursor: "pointer",
};

/** A single undo snapshot: the full drawn state at a point in time. */
interface Snapshot {
  gt: DetBox[];
  preds: DetBox[];
}

export function DetectionPlayground() {
  const { lang } = useLang();
  const t = L[lang];

  const [gt, setGt] = useState<DetBox[]>([]);
  const [preds, setPreds] = useState<DetBox[]>([]);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [apMethod, setApMethod] = useState<ApMethod>(DEFAULT_AP_METHOD);
  /** The active drawing layer. Auto-advances with the guided stage (GT → PRED)
   * via the effect below; the user can also override it by clicking a layer chip. */
  const [manualLayer, setManualLayer] = useState<DetLayer>("GT");
  /** Undo stack of prior snapshots; the last entry is the most recent. */
  const [history, setHistory] = useState<Snapshot[]>([]);
  const { seen, markSeen, reset: resetGuide } = useFirstVisit(GUIDE_SEEN_KEY);

  const state: DetState = { gt, preds };
  const stage = detectionStage(state);
  /** The active layer IS the manual layer; the effect below auto-advances it on a
   * stage change so drawing the first prediction never snaps it back to GT (which
   * would send the next box into `gt` and corrupt TP/FP/FN). */
  const activeLayer: DetLayer = manualLayer;
  const isCompare = stage === "compare";

  // Auto-advance the active layer when the guided stage changes (draw GT → draw
  // PRED). In compare, stageLayer is null so we keep the user's last layer —
  // crucially, the first prediction (preds-stage layer was already PRED) stays on
  // PRED. Between stage changes the user's manual chip clicks persist.
  useEffect(() => {
    const layer = stageLayer(stage);
    if (layer) setManualLayer(layer);
  }, [stage]);

  /** Snapshot the current drawn state onto the undo history before mutating.
   * Called once per edit GESTURE (via the canvas onEditStart / parent actions),
   * not on every emitted change, so one drag or slider sweep is a single Undo. */
  const pushHistory = () =>
    setHistory((prev) => [...prev, { gt: cloneBoxes(gt), preds: cloneBoxes(preds) }]);

  const handleChangeGt = (next: DetBox[]) => setGt(next);
  const handleChangePreds = (next: DetBox[]) => setPreds(next);

  /** Pop the last snapshot off the history stack, restoring it. */
  const handleUndo = () => {
    if (history.length === 0) return;
    const restored = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGt(restored.gt);
    setPreds(restored.preds);
  };

  /** Reset-to-empty: clear the canvas, restart at STEP 1, recorded for Undo. */
  const handleReset = () => {
    pushHistory();
    setGt([]);
    setPreds([]);
    setThreshold(DEFAULT_THRESHOLD);
    setManualLayer("GT");
  };

  /** Re-arm the guided flow: show the thesis banner again AND clear to empty. */
  const handleShowGuideAgain = () => {
    resetGuide();
    handleReset();
  };

  /** Load the fixed seed scene, jumping straight to compare. */
  const handleLoadExample = () => {
    pushHistory();
    setGt(cloneBoxes(SEED_GT));
    setPreds(cloneBoxes(SEED_PREDS));
    setThreshold(DEFAULT_THRESHOLD);
    setManualLayer("GT");
  };

  const canUndo = history.length > 0;

  return (
    <div style={pageStyle}>
      <style>{RESPONSIVE_ORDER_CSS}</style>

      <div style={splitStyle}>
        <div style={columnStyle} className="dpg-canvas-col">
          <span style={stepPillStyle}>{stepPill(stageStep(stage), lang)}</span>

          <DetectionCanvas
            grid={GRID}
            gt={gt}
            preds={preds}
            activeLayer={activeLayer}
            iouThreshold={IOU_THRESHOLD}
            confidenceThreshold={threshold}
            onChangeGt={handleChangeGt}
            onChangePreds={handleChangePreds}
            onEditStart={pushHistory}
            lockedLayers={lockedLayersFor(stage)}
            prompt={
              stage !== "compare"
                ? { text: STAGE_PROMPT[stage][lang], layer: stageLayer(stage)! }
                : undefined
            }
            onSelectLayer={setManualLayer}
          />

          <section style={panelStyle}>
            <h3 style={headingStyle}>{t.actions}</h3>
            <div style={actionRowStyle} role="group" aria-label={t.actions}>
              <button
                type="button"
                style={canUndo ? actionButtonStyle : actionButtonDisabledStyle}
                disabled={!canUndo}
                onClick={handleUndo}
              >
                {t.undo}
              </button>
              <button type="button" style={actionButtonStyle} onClick={handleReset}>
                {RESET_TO_EMPTY[lang]}
              </button>
            </div>
            <button type="button" style={showGuideStyle} onClick={handleShowGuideAgain}>
              {SHOW_GUIDE_AGAIN[lang]}
            </button>
          </section>

          <details style={detailsStyle}>
            <summary style={summaryStyle}>{LOAD_EXAMPLE[lang]}</summary>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                paddingTop: "var(--space-2)",
              }}
            >
              <div role="group" aria-label={t.presetsLabel}>
                <button type="button" style={exampleButtonStyle} onClick={handleLoadExample}>
                  {LOAD_EXAMPLE[lang]}
                </button>
              </div>
            </div>
          </details>
        </div>

        <div style={columnStyle} className="dpg-metrics-col">
          {isCompare ? (
            <>
              {!seen ? (
                <aside role="note" style={thesisBannerStyle}>
                  <span aria-hidden="true" style={bannerGlyphStyle}>
                    {INFO_GLYPH}
                  </span>
                  <span style={bannerTextStyle}>{THESIS_BANNER[lang]}</span>
                  <button
                    type="button"
                    style={bannerDismissStyle}
                    aria-label={t.dismiss}
                    onClick={markSeen}
                  >
                    <span aria-hidden="true">{DISMISS_GLYPH}</span>
                  </button>
                </aside>
              ) : null}

              <section style={panelStyle}>
                <h3 style={headingStyle}>{t.metrics}</h3>
                <DetectionMetricsPanel
                  gt={gt}
                  preds={preds}
                  iouThreshold={IOU_THRESHOLD}
                  threshold={threshold}
                  apMethod={apMethod}
                  onThresholdChange={setThreshold}
                  onApMethodChange={setApMethod}
                />
              </section>
            </>
          ) : (
            <section style={panelStyle}>
              <h3 style={headingStyle}>{t.metrics}</h3>
              <p style={gatingLineStyle}>{STAGE_GATING_LINE[stage][lang]}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetectionPlayground;

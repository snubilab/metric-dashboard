/**
 * Segmentation Playground — a draw-from-scratch GUIDED sandbox for the
 * segmentation metric suite.
 *
 * The Playground boots EMPTY (gt:[], A:[], B:[]) so every pixel on the canvas is
 * something the student drew. A pure `flowStage(state)` helper derives the
 * stage ("gt" | "a" | "b" | "compare") from shape counts and drives the whole
 * experience: a STEP n of 3 pill, a layer-colored per-step prompt inside the
 * canvas, which layer is active/unlocked, and whether the right column (verdict
 * + table + chart) renders. The student draws the truth (GT), then guess A,
 * then guess B; only when all three are non-empty does the comparison unlock.
 *
 * Product thesis preserved verbatim: NO metric is graded good/bad; the verdict
 * only ever says which side each metric calls "closer", and the winner depends
 * on the metric.
 *
 * All visual values come from the design-system token custom properties; no
 * color or font is hardcoded.
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import type {
  DegeneratePolicy,
  EmptyDicePolicy,
  EmptyDistancePolicy,
  EngineState,
  Shape,
} from "../../types/engine";
import { CanvasEditor } from "../../components/canvas/CanvasEditor";
import type { Layer } from "../../components/canvas/CanvasEditor";
import { UnitsBanner } from "../../components/UnitsBanner";
import { MetricTable } from "../../components/MetricTable";
import { PredictionLegend } from "../../components/PredictionLegend";
import type { PredictionLegendItem } from "../../components/PredictionLegend";
import { DisagreementInsight } from "../../components/DisagreementInsight";
import { MetricBarChart } from "../../components/charts/MetricBarChart";
import { useEngineMetrics } from "../../components/metrics/useEngineMetrics";
import { useFirstVisit } from "../../components/useFirstVisit";
import { useLang } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import { SEG_PRESETS, GRID, POLICY, NSD_TOLERANCE_MM } from "./presets";
import type { SegPreset } from "./presets";
import { flowStage, lockedLayersFor, stageLayer, stageStep } from "./flowStage";
import {
  LOAD_EXAMPLE,
  LOAD_EXAMPLE_CAPTION,
  RESET_TO_EMPTY,
  SHOW_GUIDE_AGAIN,
  STAGE_GATING_LINE,
  STAGE_PROMPT,
  THESIS_BANNER,
  stepPill,
} from "./guidedCopy";

/** Layers shown on the canvas by default — all three. */
const DEFAULT_VISIBLE_LAYERS: Layer[] = ["GT", "A", "B"];

/** localStorage key for the one-time compare (thesis) banner's dismissed flag. */
const GUIDE_SEEN_KEY = "md-playground-guide-seen";

/** Bilingual copy for the editing-action row and the framing affordances. */
const L = {
  ko: {
    actions: "편집 동작",
    undo: "실행취소",
    clearLayer: "레이어 비우기",
    verdict: "결론",
    allMetrics: "지표 (A 대 B)",
    chart: "지표 막대 비교",
    advanced: "고급",
    dismiss: "닫기",
    predictionA: "예측 A",
    predictionB: "예측 B",
  },
  en: {
    actions: "Edit actions",
    undo: "Undo",
    clearLayer: "Clear layer",
    verdict: "Verdict",
    allMetrics: "Metrics (A vs B)",
    chart: "Metric bar comparison",
    advanced: "Advanced",
    dismiss: "Dismiss",
    predictionA: "Prediction A",
    predictionB: "Prediction B",
  },
} as const;

/** Bounds for the NSD tolerance slider, in millimeters. */
const NSD_MIN = 0;
const NSD_MAX = 10;
const NSD_STEP = 0.5;

const EMPTY_DICE_OPTIONS: EmptyDicePolicy[] = ["one", "zero", "nan"];
const EMPTY_DISTANCE_OPTIONS: EmptyDistancePolicy[] = ["undefined", "diagonal", "fixed"];

/**
 * Human-readable, bilingual labels for the degenerate-policy option values.
 * The <option> keeps the raw code as its `value`; only the displayed text is
 * localized so students never see opaque tokens like "nan" or "diagonal".
 */
const EMPTY_DICE_LABELS: Record<EmptyDicePolicy, Record<Lang, string>> = {
  one: { ko: "둘 다 비면 1.0", en: "Both empty → 1.0" },
  zero: { ko: "둘 다 비면 0.0", en: "Both empty → 0.0" },
  nan: { ko: "정의 안 함(NaN)", en: "Undefined (NaN)" },
};

const EMPTY_DISTANCE_LABELS: Record<EmptyDistancePolicy, Record<Lang, string>> = {
  undefined: { ko: "정의 안 함(NaN)", en: "Undefined (NaN)" },
  diagonal: { ko: "대각선 길이로 대체", en: "Image diagonal" },
  fixed: { ko: "고정 페널티", en: "Fixed penalty" },
};

/** A deep-ish clone so editing the canvas never mutates the shared preset data. */
function cloneState(state: EngineState): EngineState {
  return {
    ...state,
    gt: state.gt.map((s) => ({ ...s })),
    predictions: state.predictions.map((p) => ({ ...p, shapes: p.shapes.map((s) => ({ ...s })) })),
    grid: { ...state.grid, spacingMm: [...state.grid.spacingMm] as [number, number] },
    policy: { ...state.policy },
  };
}

/** The empty boot state: nothing drawn, sharing the presets' grid/policy/tolerance. */
function emptyState(): EngineState {
  return {
    grid: GRID,
    gt: [],
    predictions: [
      { id: "A", shapes: [] },
      { id: "B", shapes: [] },
    ],
    policy: POLICY,
    nsdToleranceMm: NSD_TOLERANCE_MM,
  };
}

/**
 * Scoped layout rules for the verdict-first split. All visual values stay in
 * inline token styles; this stylesheet only governs flex ordering so that the
 * canvas sits on the LEFT when the two columns are side by side, but the
 * verdict column rises ABOVE the canvas once the columns stack at narrow widths
 * (so the takeaway is read before the canvas in reading order).
 */
const RESPONSIVE_ORDER_CSS = `
.pg-canvas-col { order: 1; }
.pg-verdict-col { order: 2; }
@media (max-width: 720px) {
  .pg-canvas-col { order: 2; }
  .pg-verdict-col { order: 1; }
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

const controlsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-4)",
  alignItems: "flex-end",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--c-text-dim)",
};

const valueBadgeStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

const selectStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-1) var(--space-2)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

const presetRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
};

const presetButtonBaseStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2) var(--space-3)",
  cursor: "pointer",
};

const presetButtonActiveStyle: CSSProperties = {
  ...presetButtonBaseStyle,
  // Use the full `border` shorthand (not borderColor) so we never mix
  // shorthand + longhand for the same property on a re-render.
  border: "1px solid var(--c-gt)",
  color: "var(--c-gt)",
};

const presetDescriptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
};

const captionStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
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

/** The STEP n of 3 progress pill — a small token-styled chip near the canvas. */
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

/** The calm, dormant gating line shown in the verdict column before compare. */
const gatingLineStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

/** A one-time, dismissible thesis banner shown when the comparison unlocks. */
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

/** Unicode info / dismiss glyphs (NOT emoji). */
const INFO_GLYPH = "ⓘ"; // ⓘ CIRCLED LATIN SMALL LETTER I
const DISMISS_GLYPH = "✕"; // ✕ MULTIPLICATION X

/** Pick a preset's label for the active language. */
function presetLabel(preset: SegPreset, lang: Lang): string {
  return lang === "ko" ? preset.labelKo : preset.label;
}

/** Pick a preset's description for the active language. */
function presetDescription(preset: SegPreset, lang: Lang): string {
  return lang === "ko" ? preset.descriptionKo : preset.description;
}

/**
 * Build the legend's A/B items from the active preset. When a preset is active,
 * its localized name + scene role anchor each prediction; for a hand-edited
 * scene (`activePresetId === ""`) generic names are used with NO role, since the
 * scene no longer matches any preset's described behavior.
 */
function legendItems(
  activePresetId: string,
  lang: Lang,
  t: (typeof L)[Lang],
): { a: PredictionLegendItem; b: PredictionLegendItem } {
  const preset = SEG_PRESETS.find((p) => p.id === activePresetId);
  if (!preset) {
    return {
      a: { name: t.predictionA },
      b: { name: t.predictionB },
    };
  }
  return {
    a: { name: preset.predictionA.name[lang], role: preset.predictionA.role[lang] },
    b: { name: preset.predictionB.name[lang], role: preset.predictionB.role[lang] },
  };
}

/**
 * A collapsed, opt-in "Load an example" disclosure: one button per preset, plus
 * a caption framing examples as someone else's worked scene to edit.
 */
function LoadExample({
  activeId,
  onSelect,
  lang,
}: {
  activeId: string;
  onSelect: (preset: SegPreset) => void;
  lang: Lang;
}) {
  const active = SEG_PRESETS.find((p) => p.id === activeId);
  return (
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
        <p style={captionStyle}>{LOAD_EXAMPLE_CAPTION[lang]}</p>
        <div
          style={presetRowStyle}
          role="group"
          aria-label={lang === "ko" ? "분할 프리셋" : "Segmentation presets"}
        >
          {SEG_PRESETS.map((preset) => {
            const isActive = preset.id === activeId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                style={isActive ? presetButtonActiveStyle : presetButtonBaseStyle}
                onClick={() => onSelect(preset)}
              >
                {presetLabel(preset, lang)}
              </button>
            );
          })}
        </div>
        {active ? (
          <p style={presetDescriptionStyle}>{presetDescription(active, lang)}</p>
        ) : null}
      </div>
    </details>
  );
}

export default function Playground() {
  const { lang } = useLang();
  const t = L[lang];
  const [state, setState] = useState<EngineState>(() => emptyState());
  const [activePresetId, setActivePresetId] = useState<string>("");
  /** User-chosen layer, consulted ONLY once the comparison has unlocked. */
  const [manualLayer, setManualLayer] = useState<Layer>("GT");
  const [visibleLayers, setVisibleLayers] = useState<Layer[]>(() => [...DEFAULT_VISIBLE_LAYERS]);
  /** Undo stack of prior EngineStates; the last entry is the most recent. */
  const [history, setHistory] = useState<EngineState[]>([]);
  const { rows } = useEngineMetrics(state);
  const { seen, markSeen, reset: resetGuide } = useFirstVisit(GUIDE_SEEN_KEY);

  const stage = flowStage(state);
  /** activeLayer is DERIVED from the stage; manualLayer wins only in compare. */
  const activeLayer: Layer = stage === "compare" ? manualLayer : stageLayer(stage)!;
  const isCompare = stage === "compare";

  const legend = legendItems(activePresetId, lang, t);

  /** Push the current state onto the undo history before mutating it. */
  const pushHistory = (current: EngineState) =>
    setHistory((prev) => [...prev, cloneState(current)]);

  /** Replace the entire engine state with the chosen preset and highlight it. */
  const selectPreset = (preset: SegPreset) => {
    pushHistory(state);
    setState(cloneState(preset.state));
    setActivePresetId(preset.id);
  };

  /**
   * Write an EDITED layer's shapes back into the single source-of-truth state.
   * Edit-only: it never sets the active layer (that is derived from the stage)
   * and is never used for a plain layer switch (the canvas uses onSelectLayer
   * for that). Detaching from any preset records the prior state for Undo.
   */
  const handleLayerChange = (layer: Layer, shapes: Shape[]) => {
    setActivePresetId("");
    pushHistory(state);
    setState((prev) => {
      if (layer === "GT") {
        return { ...prev, gt: shapes };
      }
      return {
        ...prev,
        predictions: prev.predictions.map((p) => (p.id === layer ? { ...p, shapes } : p)),
      };
    });
  };

  const setNsdTolerance = (mm: number) => {
    pushHistory(state);
    setState((prev) => ({ ...prev, nsdToleranceMm: mm }));
  };

  const setPolicy = (patch: Partial<DegeneratePolicy>) => {
    pushHistory(state);
    setState((prev) => ({ ...prev, policy: { ...prev.policy, ...patch } }));
  };

  /** Pop the last state off the history stack, restoring it. */
  const handleUndo = () => {
    if (history.length === 0) return;
    const restored = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setState(restored);
    setActivePresetId("");
  };

  /** Reset-to-empty: clear the canvas, restart at STEP 1, recorded for Undo. */
  const handleReset = () => {
    pushHistory(state);
    setState(emptyState());
    setActivePresetId("");
    setManualLayer("GT");
  };

  /** Re-arm the guided flow: show the thesis banner again AND clear to empty. */
  const handleShowGuideAgain = () => {
    resetGuide();
    handleReset();
  };

  /** Empty the active layer's shapes, recording the prior state for Undo. */
  const handleClearLayer = () => {
    pushHistory(state);
    setActivePresetId("");
    setState((prev) => {
      if (activeLayer === "GT") {
        return { ...prev, gt: [] };
      }
      return {
        ...prev,
        predictions: prev.predictions.map((p) =>
          p.id === activeLayer ? { ...p, shapes: [] } : p,
        ),
      };
    });
  };

  /** Toggle whether a layer is drawn on the canvas (does not change metrics). */
  const toggleLayerVisibility = (layer: Layer) =>
    setVisibleLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer],
    );

  const canUndo = history.length > 0;
  const tolerance = state.nsdToleranceMm ?? 2;

  return (
    <div style={pageStyle}>
      <style>{RESPONSIVE_ORDER_CSS}</style>

      <PredictionLegend a={legend.a} b={legend.b} />

      <div style={splitStyle}>
        <div style={columnStyle} className="pg-canvas-col">
          <span style={stepPillStyle}>{stepPill(stageStep(stage), lang)}</span>

          <CanvasEditor
            grid={state.grid}
            gt={state.gt}
            predictions={state.predictions}
            activeLayer={activeLayer}
            onChange={handleLayerChange}
            onSelectLayer={setManualLayer}
            lockedLayers={lockedLayersFor(stage)}
            prompt={
              stage !== "compare"
                ? { text: STAGE_PROMPT[stage][lang], layer: stageLayer(stage)! }
                : undefined
            }
            visibleLayers={visibleLayers}
            onToggleLayerVisibility={toggleLayerVisibility}
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
              <button type="button" style={actionButtonStyle} onClick={handleClearLayer}>
                {t.clearLayer}
              </button>
            </div>
            <button type="button" style={showGuideStyle} onClick={handleShowGuideAgain}>
              {SHOW_GUIDE_AGAIN[lang]}
            </button>
          </section>

          <LoadExample activeId={activePresetId} onSelect={selectPreset} lang={lang} />

          {isCompare ? (
            <details style={detailsStyle}>
              <summary style={summaryStyle}>{t.advanced}</summary>
              <div style={controlsRowStyle}>
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    {lang === "ko" ? "NSD 허용 오차" : "NSD tolerance"}:{" "}
                    <span style={valueBadgeStyle}>{tolerance.toFixed(1)} mm</span>
                  </span>
                  <input
                    type="range"
                    min={NSD_MIN}
                    max={NSD_MAX}
                    step={NSD_STEP}
                    value={tolerance}
                    aria-label="NSD tolerance (mm)"
                    onChange={(e) => setNsdTolerance(Number(e.target.value))}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    {lang === "ko" ? "빈 Dice 정책" : "Empty Dice policy"}
                  </span>
                  <select
                    style={selectStyle}
                    value={state.policy.emptyDice}
                    aria-label="Empty Dice policy"
                    onChange={(e) => setPolicy({ emptyDice: e.target.value as EmptyDicePolicy })}
                  >
                    {EMPTY_DICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {EMPTY_DICE_LABELS[opt][lang]}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    {lang === "ko" ? "빈 거리 정책" : "Empty distance policy"}
                  </span>
                  <select
                    style={selectStyle}
                    value={state.policy.emptyDistance}
                    aria-label="Empty distance policy"
                    onChange={(e) =>
                      setPolicy({ emptyDistance: e.target.value as EmptyDistancePolicy })
                    }
                  >
                    {EMPTY_DISTANCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {EMPTY_DISTANCE_LABELS[opt][lang]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </details>
          ) : null}

          <UnitsBanner spacingMm={[1, 1]} />
        </div>

        <div style={columnStyle} className="pg-verdict-col">
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
                <h3 style={headingStyle}>{t.verdict}</h3>
                <DisagreementInsight rows={rows} />
              </section>

              <section style={panelStyle}>
                <h3 style={headingStyle}>{t.allMetrics}</h3>
                <MetricTable rows={rows} showRelativeCue />
              </section>

              <section style={panelStyle}>
                <h3 style={headingStyle}>{t.chart}</h3>
                <MetricBarChart rows={rows} />
              </section>
            </>
          ) : (
            <section style={panelStyle}>
              <h3 style={headingStyle}>{t.verdict}</h3>
              <p style={gatingLineStyle}>{STAGE_GATING_LINE[stage][lang]}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

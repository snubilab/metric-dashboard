/**
 * Segmentation Playground — a live sandbox for the segmentation metric suite.
 *
 * A single `EngineState` in component state drives everything: the canvas (GT +
 * Prediction A + Prediction B), the A-vs-B metric table, the NSD tolerance, and
 * the degenerate-case policy. Editing any layer, or changing any control, flows
 * back into that one state object, so the table recomputes live and A/B
 * disagreements (rank flips, large gaps) surface immediately.
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
import { DisagreementInsight } from "../../components/DisagreementInsight";
import { MetricBarChart } from "../../components/charts/MetricBarChart";
import { useEngineMetrics } from "../../components/metrics/useEngineMetrics";
import { useLang } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import { SEG_PRESETS, DEFAULT_PRESET_ID } from "./presets";
import type { SegPreset } from "./presets";

/** Layers shown on the canvas by default — all three. */
const DEFAULT_VISIBLE_LAYERS: Layer[] = ["GT", "A", "B"];

/** Bilingual copy for the editing-action row. */
const L = {
  ko: {
    actions: "편집 동작",
    undo: "실행취소",
    reset: "초기화",
    clearLayer: "레이어 비우기",
    insight: "인사이트",
    chart: "지표 막대 비교",
    dragHint: "도형을 드래그하면 오른쪽 지표가 실시간으로 갱신됩니다",
  },
  en: {
    actions: "Edit actions",
    undo: "Undo",
    reset: "Reset",
    clearLayer: "Clear layer",
    insight: "Insight",
    chart: "Metric bar comparison",
    dragHint: "Drag a shape — the metrics on the right update live.",
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

/** The well-configured preset loaded on first render. */
const DEFAULT_PRESET: SegPreset =
  SEG_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? SEG_PRESETS[0];

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

const dragHintStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
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

/** Pick a preset's label for the active language. */
function presetLabel(preset: SegPreset, lang: Lang): string {
  return lang === "ko" ? preset.labelKo : preset.label;
}

/** Pick a preset's description for the active language. */
function presetDescription(preset: SegPreset, lang: Lang): string {
  return lang === "ko" ? preset.descriptionKo : preset.description;
}

/** A labeled row of one-click presets; clicking one loads its full state. */
function PresetBar({
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
    <section style={panelStyle}>
      <h3 style={headingStyle}>{lang === "ko" ? "프리셋" : "Presets"}</h3>
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
      {active ? <p style={presetDescriptionStyle}>{presetDescription(active, lang)}</p> : null}
    </section>
  );
}

export default function Playground() {
  const { lang } = useLang();
  const t = L[lang];
  const [state, setState] = useState<EngineState>(() => cloneState(DEFAULT_PRESET.state));
  const [activePresetId, setActivePresetId] = useState<string>(DEFAULT_PRESET.id);
  const [activeLayer, setActiveLayer] = useState<Layer>("GT");
  const [visibleLayers, setVisibleLayers] = useState<Layer[]>(() => [...DEFAULT_VISIBLE_LAYERS]);
  /** Undo stack of prior EngineStates; the last entry is the most recent. */
  const [history, setHistory] = useState<EngineState[]>([]);
  const { rows } = useEngineMetrics(state);

  /** Push the current state onto the undo history before mutating it. */
  const pushHistory = (current: EngineState) =>
    setHistory((prev) => [...prev, cloneState(current)]);

  /** Replace the entire engine state with the chosen preset and highlight it. */
  const selectPreset = (preset: SegPreset) => {
    pushHistory(state);
    setState(cloneState(preset.state));
    setActivePresetId(preset.id);
  };

  /** Write an edited layer's shapes back into the single source-of-truth state. */
  const handleLayerChange = (layer: Layer, shapes: Shape[]) => {
    setActiveLayer(layer);
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

  /** Re-apply the currently active preset's state (no-op snapshot if none active). */
  const handleReset = () => {
    const preset = SEG_PRESETS.find((p) => p.id === activePresetId) ?? DEFAULT_PRESET;
    pushHistory(state);
    setState(cloneState(preset.state));
    setActivePresetId(preset.id);
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
      <PresetBar activeId={activePresetId} onSelect={selectPreset} lang={lang} />

      <div style={splitStyle}>
        <div style={columnStyle}>
          <p style={dragHintStyle}>{t.dragHint}</p>

          <CanvasEditor
            grid={state.grid}
            gt={state.gt}
            predictions={state.predictions}
            activeLayer={activeLayer}
            onChange={handleLayerChange}
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
                {t.reset}
              </button>
              <button type="button" style={actionButtonStyle} onClick={handleClearLayer}>
                {t.clearLayer}
              </button>
            </div>
          </section>

          <UnitsBanner spacingMm={[1, 1]} />
        </div>

        <div style={columnStyle}>
          <section style={panelStyle}>
            <h3 style={headingStyle}>{lang === "ko" ? "A 대 B 지표" : "A vs B metrics"}</h3>
            <MetricTable rows={rows} />
          </section>

          <section style={panelStyle}>
            <h3 style={headingStyle}>{lang === "ko" ? "컨트롤" : "Controls"}</h3>
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
          </section>

          <section style={panelStyle}>
            <h3 style={headingStyle}>{t.insight}</h3>
            <DisagreementInsight rows={rows} />
          </section>

          <section style={panelStyle}>
            <h3 style={headingStyle}>{t.chart}</h3>
            <MetricBarChart rows={rows} />
          </section>
        </div>
      </div>
    </div>
  );
}

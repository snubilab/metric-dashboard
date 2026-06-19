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
import { useEngineMetrics } from "../../components/metrics/useEngineMetrics";

/** 256x256, 1mm isotropic spacing — the shared default grid. */
const GRID = { width: 256, height: 256, spacingMm: [1, 1] as [number, number] };

/** Bounds for the NSD tolerance slider, in millimeters. */
const NSD_MIN = 0;
const NSD_MAX = 10;
const NSD_STEP = 0.5;

const EMPTY_DICE_OPTIONS: EmptyDicePolicy[] = ["one", "zero", "nan"];
const EMPTY_DISTANCE_OPTIONS: EmptyDistancePolicy[] = ["undefined", "diagonal", "fixed"];

/**
 * A starter state: a ground-truth lesion, an accurate Prediction A, and an
 * over-segmenting Prediction B, so the table immediately shows an A/B contrast.
 */
function initialState(): EngineState {
  const gt: Shape[] = [{ kind: "circle", cx: 110, cy: 128, r: 38 }];
  return {
    grid: GRID,
    gt,
    predictions: [
      { id: "A", shapes: [{ kind: "circle", cx: 116, cy: 128, r: 38 }] },
      { id: "B", shapes: [{ kind: "circle", cx: 110, cy: 128, r: 54 }] },
    ],
    policy: { emptyDice: "one", emptyDistance: "undefined" },
    nsdToleranceMm: 2,
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

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

export default function Playground() {
  const [state, setState] = useState<EngineState>(initialState);
  const [activeLayer, setActiveLayer] = useState<Layer>("GT");
  const { rows } = useEngineMetrics(state);

  /** Write an edited layer's shapes back into the single source-of-truth state. */
  const handleLayerChange = (layer: Layer, shapes: Shape[]) => {
    setActiveLayer(layer);
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

  const setNsdTolerance = (mm: number) =>
    setState((prev) => ({ ...prev, nsdToleranceMm: mm }));

  const setPolicy = (patch: Partial<DegeneratePolicy>) =>
    setState((prev) => ({ ...prev, policy: { ...prev.policy, ...patch } }));

  const tolerance = state.nsdToleranceMm ?? 2;

  return (
    <div style={pageStyle}>
      <div style={splitStyle}>
        <div style={columnStyle}>
          <CanvasEditor
            grid={state.grid}
            gt={state.gt}
            predictions={state.predictions}
            activeLayer={activeLayer}
            onChange={handleLayerChange}
          />
          <UnitsBanner spacingMm={[1, 1]} />
        </div>

        <div style={columnStyle}>
          <section style={panelStyle}>
            <h3 style={headingStyle}>A vs B metrics</h3>
            <MetricTable rows={rows} />
          </section>

          <section style={panelStyle}>
            <h3 style={headingStyle}>Controls</h3>
            <div style={controlsRowStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>
                  NSD tolerance <span style={valueBadgeStyle}>{tolerance.toFixed(1)} mm</span>
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
                <span style={labelStyle}>Empty Dice policy</span>
                <select
                  style={selectStyle}
                  value={state.policy.emptyDice}
                  aria-label="Empty Dice policy"
                  onChange={(e) => setPolicy({ emptyDice: e.target.value as EmptyDicePolicy })}
                >
                  {EMPTY_DICE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Empty distance policy</span>
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
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

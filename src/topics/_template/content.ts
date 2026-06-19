/**
 * TEMPLATE — Learn content for a new metrics topic.
 *
 * Copy this directory to `src/topics/<your-topic>/`, rename the exported
 * symbols, and replace the sample below with your real metric sections. This
 * file shows the *shape* every `LearnContent` must satisfy; it is intentionally
 * minimal (one section) and heavily commented.
 *
 * A `LearnContent` is `{ intro, sections: MetricSection[] }`. Each
 * `MetricSection` is one metric: its meaning, a KaTeX `formula` (optional),
 * `features`, `caveats`, and an optional `miniSim` that drives the interactive
 * widget through the shared `<MiniSim>` dispatcher.
 *
 * Cross-cutting principles to carry into real content (see README.md):
 *   - Real computation: formulas describe what the engine actually computes;
 *     never invent a number a metric does not produce.
 *   - Dimensionality/units honesty: distances are in mm (driven by
 *     `grid.spacingMm`); the UI shows a 2D-slice banner so readers know a
 *     planar demo is a slice through 3D data.
 *   - Threshold-dependence: call out any metric whose value depends on a
 *     tolerance/threshold (e.g. NSD tolerance, IoU/confidence cutoffs).
 *   - Aggregation pitfalls: note where per-case averaging vs pooled vs
 *     lesion-wise scoring changes the verdict.
 *   - Clinical grounding: tie each caveat to a failure mode that matters in
 *     the clinic, not just to the math.
 */

import type { EngineState } from "../../types/engine";
import type { LearnContent, MiniSimConfig } from "../../types/topic";

/**
 * A minimal, valid `EngineState` seed for the mini-sim.
 *
 * `EngineState` requires exactly four fields — `grid`, `gt`, `predictions`,
 * and `policy`. Everything else (`detections`, `nsdToleranceMm`) is optional.
 *
 *   - grid:        a 256x256 canvas at 1mm isotropic spacing. `spacingMm`
 *                  ([sx, sy]) is what makes distance metrics report millimeters
 *                  instead of raw pixel counts — keep it honest.
 *   - gt:          ground-truth shapes (the reference). Here, one circle.
 *   - predictions: one or two layers, ids "A" and "B" (B optional). The
 *                  template ships a single layer "A" offset from the GT so the
 *                  dice-overlap widget has a non-trivial overlap to show.
 *   - policy:      the degenerate-case policy. `emptyDice` decides the Dice
 *                  value when both masks are empty; `emptyDistance` decides how
 *                  boundary distances behave when one mask is empty.
 */
const SAMPLE_STATE: EngineState = {
  grid: { width: 256, height: 256, spacingMm: [1, 1] },
  gt: [{ kind: "circle", cx: 128, cy: 128, r: 30 }],
  predictions: [
    // Prediction A overlaps the GT but is shifted right by 10px, so Dice < 1.
    { id: "A", shapes: [{ kind: "circle", cx: 138, cy: 128, r: 30 }] },
  ],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
  // Optional: tolerance (mm) used by surface-distance metrics such as NSD.
  nsdToleranceMm: 2,
};

/**
 * A `MiniSimConfig` wires a section to one interactive widget.
 *
 *   - kind:            picks the widget in the `<MiniSim>` dispatcher. Reuse an
 *                      existing kind (e.g. "dice-overlap", "hd95-stray-fp",
 *                      "ap-reorder", "froc-add-fp") when one fits your metric.
 *   - initialState:    the `EngineState` the widget seeds from.
 *   - spotlightMetric: the metric key the widget emphasizes / animates.
 */
const sampleMiniSim: MiniSimConfig = {
  kind: "dice-overlap",
  initialState: SAMPLE_STATE,
  spotlightMetric: "dice",
};

/**
 * The exported learn content. Real topics export a descriptively named const
 * (e.g. `classificationLearn`) and reference it from `index.ts`.
 */
export const templateLearn: LearnContent = {
  intro:
    "TEMPLATE intro. Replace this with a 2–4 sentence orientation to the task " +
    "and why no single metric is sufficient. State which metric families the " +
    "sections below cover and which failure mode each one is blind to.",
  sections: [
    {
      // Stable, URL-safe id — used as the section anchor. Keep it kebab/lower.
      id: "example",
      title: "Example metric",
      // KaTeX source (no surrounding $...$). Rendered by KaTeX in the UI.
      formula: "\\mathrm{Example} = \\frac{2\\,TP}{2\\,TP + FP + FN}",
      meaning:
        "One or two sentences on what this metric measures and when it is the " +
        "right summary to trust.",
      // Bullet points: strengths / where this metric is used.
      features: [
        "What the metric is good at.",
        "Where it is commonly reported.",
      ],
      // Bullet points: failure modes — tie each to a clinical consequence.
      caveats: [
        "A failure mode this metric is blind to (pair it with another family).",
        "Any threshold-dependence or aggregation pitfall to disclose.",
      ],
      // Optional: drop the whole `miniSim` field if a section has no widget.
      miniSim: sampleMiniSim,
    },
  ],
};

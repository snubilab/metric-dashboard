/**
 * TEMPLATE — Clinically grounded scenarios for a new metrics topic.
 *
 * A `Scenario[]` holds the worked examples behind the learn content: the cases
 * where *which metric you trust changes the verdict*. Each scenario pairs a
 * real clinical situation (`ClinicalContext`) with a hand-built `EngineState`
 * whose geometry makes the `teachingPoint` literally true once the engine
 * computes the metrics — no faked numbers.
 *
 * This file ships ONE fully-commented scenario showing every field. Replace it
 * with your topic's scenarios and rename the export.
 *
 * Conventions to keep: 256x256 grid, 1mm isotropic spacing, default degenerate
 * policy. GT is the reference; Prediction A is the model under discussion, and
 * Prediction B (optional) contrasts it.
 */

import type { DegeneratePolicy, Vec2 } from "../../types/engine";
import type { Scenario } from "../../types/topic";

/** Shared 256x256, 1mm isotropic grid. The `as Vec2` keeps the tuple type. */
const GRID = { width: 256, height: 256, spacingMm: [1, 1] as Vec2 };

/** Reasonable default degenerate-case policy. */
const POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

/**
 * Exported scenarios. Real topics export a descriptively named const
 * (e.g. `classificationScenarios`) and reference it from `index.ts`.
 */
export const templateScenarios: Scenario[] = [
  {
    // Stable, URL-safe id used as the scenario anchor.
    id: "example-scenario",
    title: "Example: a metric agrees on rank but hides a real error",
    // `ClinicalContext` — all four fields are required. Render via
    // <ClinicalContext context={scenario.clinical} />.
    clinical: {
      // situation: the concrete clinical setup, in plain language.
      situation:
        "Describe the concrete clinical case: what is being segmented/detected, " +
        "and what the model does well versus where it slips.",
      // modality: imaging modality + task, e.g. "Contrast-enhanced abdominal CT".
      modality: "Imaging modality and task (e.g. Brain MRI, tumor segmentation)",
      // atStake: why the chosen metric is being relied on here.
      atStake:
        "Why this metric is the decision-maker in this situation (e.g. it gates " +
        "deployment, or it certifies a surgical margin).",
      // consequence: what goes wrong if you trust the wrong metric.
      consequence:
        "The clinical consequence when the trusted metric looks fine but the " +
        "model is actually wrong.",
    },
    // A minimal, valid EngineState whose geometry proves the teachingPoint.
    // Prediction A is shifted off the GT; B matches the GT to contrast.
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 40 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 138, cy: 128, r: 40 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 40 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: 2,
    },
    // teachingPoint: the single sentence(s) a learner should leave with.
    // It must be true of the numbers the engine computes from `state`.
    teachingPoint:
      "State the lesson the computed metrics demonstrate — e.g. overlap stays " +
      "high while a boundary metric exposes the shift, so the two must be read " +
      "together.",
    // reference: optional citation/benchmark the scenario draws from.
    reference: "Citation or benchmark the scenario is grounded in.",
  },
];

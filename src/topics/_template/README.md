# Adding a new topic

This `_template/` directory is a minimal, compiling skeleton for authoring one
of the remaining metric topics. It is **not** registered in the shell — copy it
to `src/topics/<your-topic>/`, rename the exported symbols, and fill in real
content.

A `Topic` (see `src/types/topic.ts`) is:

```ts
interface Topic {
  id: string;
  group: "discriminative" | "generative" | "language" | "clinical";
  title: string;
  status: "available" | "coming-soon";
  learn?: LearnContent;     // the "Learn" tab
  Playground?: FC;          // the interactive "Playground" tab
  scenarios?: Scenario[];   // clinically grounded worked examples
}
```

## The four steps

### 1. Author `content.ts` (the Learn tab)

Export a `LearnContent` (`{ intro, sections: MetricSection[] }`). Each
`MetricSection` is one metric with its `meaning`, optional KaTeX `formula`,
`features`, `caveats`, and an optional `miniSim`. See `content.ts` here for the
fully-commented shape. The `miniSim.initialState` must be a valid `EngineState`
(at minimum `grid`, `gt`, `predictions`, `policy`).

### 2. Build or reuse a Playground

The Playground is the interactive tab. Prefer **reusing** the shared building
blocks rather than reimplementing:

- `<MiniSim config={section.miniSim} />` — renders the widget for a section.
- `<CanvasEditor grid gt predictions activeLayer onChange showLayers? />` —
  editable masks.
- `<DetectionBoard gt preds iouThreshold? />` — detection boxes.
- `<MetricTable />` + `useEngineMetrics(state)` / `computeSegMetrics(state, predId)` —
  live metric computation. Compute real numbers; never hardcode them.
- `<ClinicalContext />`, `<UnitsBanner />`, `<AnimatedMetric />`.

A topic can ship `status: "coming-soon"` with no Playground while in progress
(as this template does), then add one before going `"available"`.

### 3. Write `scenarios.ts` with `ClinicalContext`

Export a `Scenario[]`. Each scenario pairs a `ClinicalContext`
(`situation` / `modality` / `atStake` / `consequence`) with a hand-built
`EngineState` whose geometry makes the `teachingPoint` literally true once the
engine computes the metrics. Add a `reference` citation where possible. See
`scenarios.ts` here for the commented shape.

### 4. Register it and set `status: "available"`

Add a default-exported `Topic` in your `index.ts`, then **register it in
`src/app/topicRegistry.ts`** so the shell/sidebar can find it. Set
`status: "available"` once the Learn content, Playground, and scenarios are all
in place. (This `_template` is deliberately left unregistered and
`"coming-soon"`.)

## Cross-cutting principles to carry forward

Every topic must uphold the same standards that make this dashboard
trustworthy:

- **Real computation, no fake formulas.** Numbers shown to the user are
  computed by the engine from the actual masks/boxes. A `formula` documents
  what the engine does — it never substitutes for the computation.
- **Dimensionality / units honesty.** Distances are millimeters, driven by
  `grid.spacingMm`, not raw pixel counts. The 2D-slice banner
  (`<UnitsBanner />`) tells the reader a planar demo is a slice through 3D
  data — keep that disclosure.
- **Threshold-dependence.** Surface its presence wherever a value depends on a
  tolerance or cutoff (NSD tolerance `nsdToleranceMm`, IoU/confidence
  thresholds, matching criteria). Let the user vary it where it matters.
- **Aggregation pitfalls.** Be explicit when per-case vs pooled vs lesion-wise
  aggregation changes the verdict (e.g. voxel Dice hiding a missed small
  lesion).
- **Clinical grounding.** Tie each caveat and scenario to a failure mode that
  matters in the clinic, not just to the math.

# Metric Dashboard — Design Spec

- **Date:** 2026-06-19
- **Status:** Draft for review
- **Scope of this spec:** Shared framework + first topic slice (**Image Segmentation + Image Detection**)
- **Audience:** Students and researchers studying medical imaging and LLM/VLM evaluation

---

## 1. Purpose

Build an interactive, browser-based dashboard that lets students **visually compare how different evaluation metrics behave on the same data — like a simulation**. The central teaching thesis (from *Metrics Reloaded*, Nature Methods 2024) is:

> No single metric is sufficient; metrics disagree *by design*. The right metric depends on what clinical error you cannot tolerate.

The dashboard makes this concrete: a student manipulates real predictions and watches many metrics react, sees where metric rankings flip, and connects each behavior to a **real clinical consequence**.

This is fundamentally different from the existing reference doc (`docs/metrics/SegAndDect`), which is explanatory prose. The dashboard adds **real, in-browser computation** as the teaching medium.

### Non-goals (this spec)
- The other 7 topics (Classification, Regression, Image Synthesis, LLM Report Generation, VLM, Risk Prediction, Reader Study). Each gets its own spec/plan cycle later.
- Any backend, accounts, persistence beyond the static bundle.
- 3D volumetric rendering (2.5D multi-slice is an explicit stretch item; see §9).

---

## 2. Guiding principles

1. **Always compute for real.** Every metric value is computed from actual pixels/geometry/scores. No fake formula mimicry.
2. **Disagreement is the lesson.** The most valuable view is two predictions ranked differently by two metrics on the same ground truth.
3. **Be honest about dimensionality and units.** Distance/surface/volume metrics are 3D/mm in practice; the 2D engine must say so and use mm.
4. **Clinical grounding.** Scenarios reflect situations that actually occur in clinical practice, with the clinical stakes made explicit.
5. **One engine, two views.** Learn's per-metric mini-sims and the Playground's all-metrics view are the same engine, configured differently.

---

## 3. Tech stack & deployment

- **React + Vite + TypeScript**, single-page static app. No backend.
- All metric computation runs in-browser (TypeScript + Canvas + typed arrays).
- Deployable as static files (e.g., GitHub Pages). Students open a URL.
- **Code style (per project `CLAUDE.md`):** 2-space indent, semicolons, double quotes, trailing commas, TypeScript everywhere, **organized by feature**.
- **Charts:** lightweight SVG-based custom chart components for PR/FROC/box/relationship plots (full control, small bundle). Canvas editor uses raw HTML canvas. (A library like Recharts is a fallback if custom charts prove costly; decided at plan time.)
- **Testing:** Vitest for engine unit tests; React Testing Library for component interaction tests.

---

## 4. Architecture

### 4.1 Directory structure (feature-organized)

```
src/
  app/
    App.tsx               # shell, routing
    Sidebar.tsx           # grouped topic nav (9 topics, old→new)
    topicRegistry.ts      # registry of topics (available + coming-soon)
  engine/                 # shared simulation + metric computation (pure TS)
    raster/
      Shape.ts            # circle, blob (polygon/brush), box
      rasterize.ts        # shapes -> Uint8Array binary mask on a grid
      grid.ts             # Grid + physical spacing (mm/px), "slice" semantics
    distance/
      edt.ts              # Euclidean distance transform (Felzenszwalb)
    metrics/
      types.ts
      confusion.ts        # TP/FP/FN/TN from two masks
      overlap.ts          # dice, iou, sensitivity, precision (+ empty-case policy)
      boundary.ts         # HD, HD95, ASD, ASSD, surfaceDice, NSD(tolerance)
      volume.ts           # volume/area difference (mm^2 on slice; grounds MRBrainS)
      lesionwise.ts       # connected-component matching, lesion-wise Dice/HD95/sensitivity
      detection.ts        # IoU/distance matching, PR, AP(interp variants), FROC, sens@FP
      cldice.ts           # STRETCH: skeleton/centerline overlap
    policy.ts             # degenerate-case conventions (empty masks), as explicit toggles
  components/
    CanvasEditor.tsx      # editable GT/Pred shapes on grid, tools
    MetricTable.tsx       # live A vs B metric table, disagreement highlight
    MiniSim.tsx           # wrapper: single-metric focused widget
    charts/
      PRCurve.tsx         # raw curve + interpolation envelope overlay
      FROCCurve.tsx       # log x-axis, FP/scan, 7 operating points
      RelationPlot.tsx    # e.g. Dice vs IoU curve
      BoxPlot.tsx         # STRETCH: per-case variability
    ClinicalContext.tsx   # scenario clinical-context block
    UnitsBanner.tsx       # "2D slice; in practice 3D surface in mm" honesty banner
  topics/
    segmentation/
      content.ts          # structured Learn content + mini-sim configs
      Playground.tsx      # comprehensive sandbox
      scenarios.ts        # curated clinical scenario presets
      index.ts            # registers topic
    detection/
      content.ts
      Playground.tsx
      scenarios.ts
      index.ts
    _template/            # template + "how to add a topic" doc
  types/
    topic.ts              # Topic, LearnContent, MetricSection, MiniSimConfig, Scenario
```

### 4.2 Topic contract

```ts
type TopicGroup = "discriminative" | "generative" | "language" | "clinical";
type TopicStatus = "available" | "coming-soon";

interface Topic {
  id: string;
  group: TopicGroup;
  title: string;
  status: TopicStatus;
  learn?: LearnContent;        // sections, each optionally with a mini-sim
  Playground?: React.FC;       // comprehensive sandbox
  scenarios?: Scenario[];
}

interface MetricSection {
  id: string;
  title: string;               // e.g. "3.2 Dice coefficient"
  formula?: string;            // KaTeX
  meaning: string;
  features: string[];
  caveats: string[];           // the "Points to remember" — proven by the mini-sim
  miniSim?: MiniSimConfig;
}

interface Scenario {
  id: string;
  title: string;
  clinical: ClinicalContext;   // real situation, modality, stakes, consequence
  state: EngineState;          // saved GT/Pred/detection setup
  teachingPoint: string;       // what the student should conclude
  reference?: string;          // BraTS / KiTS23 / LUNA16 / DeepLesion / RSNA ...
}

interface ClinicalContext {
  situation: string;           // e.g. "screening brain MRI for metastases"
  modality: string;            // CT / MRI / CXR / WSI ...
  atStake: string;             // what the clinical decision is
  consequence: string;         // why this metric's behavior matters for the patient/workflow
}

// Foundational: the serializable state both views (Learn mini-sims, Playground)
// and Scenarios share. Defining this precisely is the FIRST plan task — it gates
// the engine/topic boundary and the "one engine, two views" principle.
interface EngineState {
  grid: { width: number; height: number; spacingMm: [number, number] };
  gt: Shape[];                                  // ground-truth shapes
  predictions: { id: "A" | "B"; shapes: Shape[] }[];
  detections?: { boxes: DetBox[]; gtObjects: DetBox[] }; // detection sub-mode
  policy: DegeneratePolicy;                     // empty-mask conventions (see §5)
  nsdToleranceMm?: number;
}
```

### 4.3 Topic ordering (sidebar, grouped + old→new)

1. **Discriminative (classical):** Image Classification → Image Regression → **Image Segmentation** → **Image Detection**
2. **Generative:** Image Synthesis
3. **Language & multimodal (newer):** LLM Report Generation → VLM
4. **Clinical evaluation (cross-cutting):** Risk Prediction → Reader Study

Only Segmentation and Detection are `available` in this slice; the rest render as `coming-soon`. Sidebar shows section headers per group.

---

## 5. Simulation engine (the heart)

- **Grid:** 256×256, with a configurable **physical spacing in mm/px** (anisotropy-capable). All distance/surface metrics report **mm**.
- **Dimensionality honesty:** the UI labels the canvas a **"slice"**, and distance/surface/volume metrics carry a persistent banner: *"computed on a 2D slice; in clinical practice this is a 3D surface in mm."*
- **Inputs:** GT and each prediction are sets of editable shapes (filled circle, freeform blob, box) rasterized to binary masks.
- **Overlap metrics** (from confusion counts): Dice, IoU, Sensitivity/Recall, Precision/PPV.
- **Boundary/surface metrics** (via EDT, scaled by spacing → mm): HD, HD95, ASD, ASSD, Surface Dice, NSD@tolerance (tolerance is a **mm slider** with the tolerance band drawn on the boundary).
- **Lesion-wise metrics** (first-class, see §6.3): connected-component extraction + lesion matching → lesion-wise Dice, lesion-wise HD95, lesion-level sensitivity, FP/FN lesion counts.
- **Detection:** predicted boxes/points with confidence + GT objects; **one-to-one matching** (rule and order manipulable); confidence sweep → PR curve; **AP with selectable interpolation** (VOC-11pt / VOC all-points / COCO-101pt) shown as an envelope over the raw PR curve; AP50 / AP75 / AP@[.5:.95]; **FROC** (log x-axis = FP/scan, 7 LUNA16 operating points, score = mean of the 7 sensitivities); sensitivity@fixed FP.
- **Degenerate-case policy** (`policy.ts`): empty GT and/or empty prediction conventions are **explicit, visible, toggleable teaching objects** (e.g., "Dice on empty/empty = 1.0? 0? NaN?"; "HD95 with one empty mask = undefined / fixed penalty / image diagonal"). Different challenges decide differently; the UI surfaces this choice rather than hiding a library default.
- All metric functions are **pure** → unit-testable in isolation.

---

## 6. Learn tab

Per-metric sections ported from `docs/metrics/SegAndDect` into structured TS data. Each section: formula (KaTeX), meaning, features, caveats — and an **inline mini-sim that proves the caveats**.

### 6.1 Segmentation metric sections
Task taxonomy; Dice; IoU (+ live `Dice = 2·IoU/(1+IoU)` relationship plotted as a curve for the *single-case* relationship — the v1 engine is single-case, so the "diverge under averaging" point is stated as text/commentary, not an interactive averaging demo, which is a §9 stretch); Sensitivity; Precision; HD/HD95; ASD/ASSD; Surface Dice/NSD; volume/area difference; lesion-wise (§6.3); clDice (concept; mini-sim deferred to stretch).

### 6.2 Detection metric sections
Detection output & required definitions; IoU for boxes; one-to-one matching; thresholds (AP50 vs AP75); Precision/Recall/F1; AP; mAP; AP@[.5:.95]; FROC; sensitivity@fixed FP. Plus benchmark combination tables (RSNA, LUNA16, CAMELYON16, DeepLesion).

### 6.3 Lesion-wise vs voxel-wise (promoted to a first-class Learn metric)
Per the educator audit, this is the single most important medical-specific idea. Mini-sim: a large organ + a missed small (~5-voxel) lesion → **voxel-Dice ≈ 0.94 while lesion-level sensitivity = 0.5**. Connects to BraTS / small-lesion screening.

### 6.4 Mini-sim designs (key metrics)
- **Dice:** overlap slider for the basic case **plus a "shrink GT" control** showing Dice instability on small structures (the actual teaching point).
- **HD95:** drag a stray FP blob; **HD and HD95 shown side-by-side** so the student sees HD jump to the full distance while HD95 absorbs the single outlier — that contrast is the reason HD95 exists.
- **AP:** a short ranked list of detections (confidence + TP/FP tags) the student can **reorder by confidence**, watching the PR curve and AP recompute — teaching that AP rewards confidence *ranking*, not just counts.
- **FROC:** **add FP detections one at a time** and watch the operating point walk rightward along the (log) curve while sensitivity climbs in steps; the LUNA16 7-point mean updates live.
- **One-to-one matching:** drag a second good box onto a lesion → it becomes a duplicate FP → precision drops.

---

## 7. Playground tab

Comprehensive sandbox:
- Editable canvas with **GT + Prediction A + Prediction B** simultaneously.
- Live `MetricTable` showing **all segmentation metrics for A and B side-by-side**, with **disagreement highlighting** (rank flips and large-magnitude gaps called out).
- Detection sub-mode: confidence-threshold slider with the operating point sliding along the PR/FROC curves; F1 changes while AP stays fixed (teaching threshold-dependent vs threshold-free).
- Tolerance (NSD), spacing (mm/px), and degenerate-case policy are adjustable controls.

---

## 8. Scenarios tab — clinically real

Each scenario is a saved engine state + commentary, grounded in a **real clinical situation** with an explicit `ClinicalContext` block (situation, modality, what's at stake, clinical consequence of the metric behavior).

Initial scenario set (Segmentation + Detection):
- **Missed small brain metastasis (screening MRI):** voxel Dice high, lesion-level sensitivity drops — the patient's metastasis is missed. (BraTS-METS)
- **Lung nodule CAD with too many false positives (chest CT):** sensitivity acceptable but FP/scan high → radiologist fatigue and lost trust. (LUNA16 FROC)
- **Liver tumor margin for surgical planning (CT/MRI):** Dice high but HD95 large → resection-margin decision is wrong. (boundary metric stakes)
- **Stray FP blob wrecks HD95 (any organ):** Dice barely moves, HD95 explodes — worst-case boundary error.
- **Over-segmentation of an organ:** high sensitivity, low precision — over-contouring spills into adjacent structures.
- **Small lesion Dice instability:** a few-pixel error swings Dice dramatically.
- **AP50 high but AP75 low (pneumonia boxes, CXR):** approximate localization passes loose criterion, fails strict. (RSNA)
- **Rank agreement but magnitude disagreement:** A and B agree on which is better, but Dice gap tiny while HD95 gap huge — the everyday over-reading trap.
- **Empty/negative case:** GT has no lesion; model fires one FP — exercises the degenerate-case policy. (BraTS-METS FP penalty)
- **Broken vessel topology (clDice teaser):** good Dice, disconnected centerline — distinct failure mode. (commentary; mini-sim deferred)

---

## 9. Stretch items (explicitly out of v1 unless time allows)
- **2.5D multi-slice engine** so surface/volume metrics are genuinely 3D.
- **Per-case variability / CI:** N cases → boxplot of per-case Dice for A vs B, showing rank flips can be within noise.
- **Aggregation pitfalls scenario:** per-case-mean vs pooled (micro) vs macro averaging flips the ranking.
- **clDice mini-sim** (currently scenario + commentary only).

---

## 10. Error handling
- Division-by-zero guards in all overlap metrics; degenerate behavior governed by the explicit `policy.ts` toggles, never a silent library default.
- Boundary/lesion metrics return a typed "undefined" state when not computable; UI renders it explicitly with a tooltip explaining why.
- Recompute is debounced on shape edits; grid kept at 256² for real-time feel.

---

## 11. Testing strategy (TDD)
- **Engine unit tests (Vitest):** analytic known cases — identical masks → Dice/IoU = 1.0; disjoint → 0; `Dice = 2·IoU/(1+IoU)`; `HD95 ≤ HD`; symmetric metrics symmetric; HD on simple shapes with known geometry; AP on a hand-computed PR table per interpolation variant; FROC 7-point mean on a fixed detection set; lesion matching on synthetic multi-lesion masks.
- **Policy tests:** each degenerate-case convention returns the documented value for the selected policy.
- **Component tests (RTL):** CanvasEditor shape edit → metric recompute; confidence slider → operating point move; mini-sim interactions.

---

## 12. Extensibility (adding the remaining 7 topics later)
- `topics/_template/` provides the skeleton; a short "How to add a topic" doc explains: author `content.ts` (sections + mini-sim configs), build/`reuse` a `Playground`, write `scenarios.ts` (with `ClinicalContext`), register in `topicRegistry`.
- Cross-cutting ideas introduced here (threshold-dependence, aggregation, dimensionality/units honesty, clinical grounding) are framed as **general** so they transfer to later topics.

---

## 13. Open decisions for plan time
- Custom SVG charts vs a chart library (lean custom).
- Blob input: freeform brush vs editable polygon (lean polygon for determinism + testability).
- Lesion matching: **both IoU and centroid-distance criteria, selectable, are in v1 scope** (lesion-wise is a first-class metric in §6.3 and the BraTS-METS scenarios depend on it); default criterion to confirm at plan time.

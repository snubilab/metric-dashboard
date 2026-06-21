# Metric Dashboard — Design Philosophy & Spec

> The contract every new topic, metric, figure, and view must follow. If you are
> adding anything to this app, read this first. The guiding rule is **unification**:
> a new topic is not "done" until it reaches full parity with the existing ones
> across all three views, using the same patterns, tokens, and quality bar.

---

## 1. The product thesis (IMMUTABLE)

This app teaches the [Metrics Reloaded](https://www.nature.com/articles/s41592-023-02151-z)
lesson:

> **No single metric is universally "good" or "bad." Which prediction looks best
> depends entirely on which metric you measure it with.** A prediction that wins
> on overlap (Dice) can lose on boundary accuracy (HD95), and vice versa.

Consequences that are **non-negotiable**:

- **Never render an absolute grade verdict** on a metric or a prediction —
  no `좋음 / 나쁨 / 우수 / 열등 / good / bad / best metric / worst metric`. Show the
  *trade-off* instead (which metric a prediction leads on, and what each metric
  misses). A thesis-guard test enforces this; do not weaken it.
- Comparison chips/leads are colored to the **leading prediction**, not to a
  quality judgement.
- Every metric family is presented as catching a *different* failure mode, which
  is why real benchmarks report several together.

---

## 2. Unification — the three views, identical across topics

Every topic (segmentation, detection, and every future one) exposes the **same
three views** with the **same shape**. When you add a topic, match these exactly.

### Learn (`LearnView`)
- An intro paragraph, then one `MetricSection` per metric: title, optional
  KaTeX formula, an SVG `figure`, a plain-language `meaning`, a `features` list
  (each item prefixed with a ✓ marker), a `caveats` list (each item prefixed
  with a ⚠️ marker), an optional `miniSim`, and an optional `complements` callout.
- Metric mentions in prose (Dice, IoU, HD95, NSD, ASSD, clDice, …) are
  **linkified** — they jump to that metric's section. Keep the metric **token
  text byte-identical** so the links keep resolving (`src/components/metrics/metricTextLinks.ts`).

### Playground (per-topic `Playground.tsx`)
- **Boots EMPTY** and uses a **draw-from-scratch guided flow** (a STEP n-of-N pill,
  a layer-colored in-canvas prompt, locked layers, gated metrics) so every mark
  on the canvas is something the student drew.
- A collapsed **"Load an example"** disclosure offers a **ROW of presets** (one
  button per scene + an active highlight + a one-line description). **Never ship a
  single fixed example** — segmentation has `SEG_PRESETS`, detection has
  `DET_PRESETS`; a new topic needs its own preset list of several instructive scenes.
- Editing the canvas **detaches** from the active preset (clears the highlight).
- Metrics update **live**; a one-time thesis banner frames the lesson.
- Preset scenes are **numerically verified** against the real engine in a
  `presets.test.ts` so the stated teaching point is literally true.

### Scenarios (`ScenariosView`)
- A **read-only** gallery of cards in a **fixed 2-column grid** (collapsing to one
  column only under ~760px; never an auto-fill track count that shifts with
  language width). Each card: clinical context, teaching point, reference, then a
  preview.
- The preview is **calm and read-only** — a **visual** (read-only canvas) + a
  **legend** + a **clean metric table**. **No sliders, no interactive controls** in
  Scenarios (that is the Playground's job). Both topics teach the thesis with an
  **A-vs-B rank-flip comparison**: segmentation uses `ShapeCanvas` +
  `IdentityLegend` + `MetricTable` (prediction A vs B); detection uses **two**
  `DetectionScenePreview` canvases (detector A and detector B on the shared GT) +
  a box-color legend + the **same** `MetricTable` fed by `detComparisonRows`, so
  "which detector wins" visibly flips by metric (e.g. A wins AP50, B wins AP75).
  Every scenario's flip must be numerically true under the engine
  (`comparison.test.ts` guards it). `DetectionMetricTable` (single-detector
  Metric|Value) remains only as a fallback for a scenario with no detector B. A
  new topic mirrors this A-vs-B trio.

---

## 3. Design system — tokens only

- **All visual values come from CSS custom properties** in `src/styles/tokens.css`.
  Never hard-code a color, space, radius, or font in a component (the rare
  exception is the top credit bar's pure black/white, which is theme-keyed in CSS).
- **Data colors are colorblind-safe [Okabe–Ito](https://jfly.uni-koeln.de/color/):**
  `--c-gt` (ground truth / true positive, green), `--c-pred-a` (prediction A, blue),
  `--c-pred-b` (prediction B, amber), `--c-warn` (disagreement / false positive, red).
- **Marks vs. text — the contrast rule:** the bright raw vars (`--c-gt`, `--c-warn`, …)
  are for **shapes/marks/canvas strokes**. For any **`<text>` / label**, use the
  readable **`-text` variant** (`--c-gt-text`, `--c-pred-a-text`, `--c-pred-b-text`,
  `--c-warn-text`) — the raw hues fail WCAG AA on the light `--c-surface-2` card.
- **Theme-aware:** light is the default; a dark override lives under
  `[data-theme="dark"]`. Korean is the default language.
- **Inline styles can't hold media queries or theme selectors and always
  out-specify a class.** Anything responsive or theme-dependent must live in an
  **injected `<style>` block** keyed to a class (see `App.tsx` `SHELL_CSS`,
  `ScenariosView` `GALLERY_GRID_CSS`). This is the fix-pattern for both the mobile
  layout and the per-theme credit color.

---

## 4. Engine purity & correctness

- Metric math lives in `src/engine/**` as **pure, unit-tested functions**. The
  canvas and figures only **render what the engine computes** — they never
  recompute metrics.
- Where a picture and a number both depend on a classification (e.g. detection
  TP/FP/FN coloring vs. counts), the classification used for **drawing must be
  byte-identical** to the one used for **counting**, so the picture and the numbers
  can never disagree.

---

## 5. i18n

- Bilingual **ko / en**, **ko default**. UI strings live in `src/i18n`; long-form
  content is split: `content.ts` / `contentKo.ts` and `scenarios.ts` /
  `scenariosKo.ts` per topic.
- Korean prose is humanized (natural, not translation-ese) but **numbers,
  thresholds, clinical claims, citations, and metric tokens are preserved
  exactly** — metric tokens are load-bearing (the Learn links key on them).

---

## 6. Accessibility & quality bar

- **WCAG AA** text contrast (4.5:1 body, 3:1 large/UI/icon); colorblind-safe palette;
  meaningful `aria-label`s; canvases are `role="img"` with a bilingual name.
- **jsdom safety:** canvas `getContext` returns null in tests — every 2D draw path
  must guard `if (!ctx) return;`. Pure geometry/logic is unit-tested directly.
- **Verification before "done":** build + full test suite green, then **headed
  Playwright on the LIVE deployed URL** (localhost is not reachable from the
  headless browser here) plus an **adversarial UIUX audit** (pixel-level WCAG
  measurement, refute-each-finding) — fix P0/P1 before claiming done. The
  thesis-guard test must pass.

---

## 7. Deploy

- Static SPA on **GitHub Pages** via `.github/workflows/deploy.yml` (push to `main`
  → build → publish `dist/`). `vite.config.ts` sets `base: '/metric-dashboard/'`
  for production builds **only** (dev stays at `/`). Live:
  https://snubilab.github.io/metric-dashboard/

---

## 8. Checklist — adding a new topic (so it "follows along")

1. **Engine:** add pure metric functions under `src/engine/**` + unit tests.
2. **Content:** `content.ts` + `contentKo.ts` (intro + MetricSections with
   formula/figure/meaning/features ✓/caveats ⚠️/miniSim/complements). Linkify
   metric mentions; keep tokens byte-identical.
3. **Figures:** SVG figures using tokens; **text fills use `-text` variants**,
   shape fills use the raw bright vars.
4. **Playground:** boots empty, guided draw-from-scratch flow, **a preset ROW**
   (`<topic>/presets.ts` with several scenes + `presets.test.ts` verifying counts
   against the engine), live metrics, thesis banner. No grade words.
5. **Scenarios:** `scenarios.ts` + `scenariosKo.ts` (clinical context + teaching
   point + reference + a numerically-true scene); render a read-only **visual +
   legend + clean table** — no interactive controls.
6. **i18n + register:** ko default, humanized Korean, preserved numbers/tokens.
7. **Verify:** build + tests green; headed Playwright on the live URL + adversarial
   UIUX audit; thesis-guard passes; commit; deploy.

> When in doubt, open the segmentation topic and the detection topic side by side:
> a new topic should be **indistinguishable in structure and polish** from them.

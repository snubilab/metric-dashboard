---
title: "feat: Make the Segmentation Playground intuitive (A/B identity, relative reading, verdict-first, first-visit banner)"
type: feat
status: completed
created: 2026-06-19
deepened: 2026-06-19
depth: standard
area: segmentation playground
---

# feat: Make the Segmentation Playground intuitive

> **Revised after a 6-persona doc review (2026-06-19).** The original plan proposed an *absolute* good/fair/poor quality-band system. The adversarial and product-lens reviewers showed this **contradicts the dashboard's core thesis** ("no single number is good or bad in isolation; which prediction wins depends on the metric") and would mislabel the 32 shared Scenario cards; the feasibility reviewer showed the "scene-scale" distance grading isn't even computable from a `MetricRow`. **U2 is reframed from absolute quality to relative/contextual reading.** U4 (canvas↔table hover linking) is deferred as gold-plating, and U5 is scoped down from a multi-step coachmark to a one-line dismissible banner. See Scope Boundaries.

## Summary

A student looking at the Segmentation Playground said: *"A·B의 수치가 뭔지도 모르겠고 너무 직관적이지 않아"* — they can't tell what **A** and **B** are, can't tell how to read the numbers, and the screen doesn't guide them. The Playground is functionally complete (presets, canvas edit/draw/resize, A-vs-B metric table, insight, bar chart, undo/reset) but presents **eight bare numbers in two unlabeled columns (A / B)** with no statement of *what A and B represent* or *how to read the comparison*.

This plan makes the Segmentation Playground intuitive **without betraying the product's teaching thesis**: name the two predictions and what each is doing, give every metric a *relative* reading (which prediction leads on this metric, and which direction is better) plus a plain-language "what this measures" line, lead with the verdict and hide the long table behind progressive disclosure, and add a dismissible first-visit banner. It reorganizes and annotates the existing pieces — it does **not** remove presets, drawing, resize, undo, the insight callout, or the bar chart, and it does **not** introduce an absolute "good/bad" grade.

**Scope:** the **Segmentation** Playground (`src/topics/segmentation/Playground.tsx`) and the shared components it composes. The Detection Playground (`DetectionBoard`) has a different single-model shape and is deferred.

**Active units:** U1, U2, U3, U5. (U4 deferred — see Scope Boundaries.)

---

## Problem Frame

From the screenshot and complaint, the concrete failures are:

1. **A/B identity is missing.** Columns are literally "A" and "B". Nothing says "these are two competing predictions of the same lesion" or *what each one does* (in the default preset, A tracks accurately and B over-segments). The student has no anchor.
2. **The numbers have no reference frame.** `Dice 0.97` vs `0.57`, `HD95 2.00mm` vs `22.02mm` — a ↑/↓ direction marker exists, but the student lacks the frame to read them. **Critically, the right frame is *relative* ("A leads here, B leads there — it depends"), not an absolute grade** — an absolute "좋음/나쁨" would teach the misconception the dashboard exists to refute (e.g. voxel Dice 0.85 with a missed lesion is *not* "good").
3. **Information overload.** Eight metric rows + legend land at once, before any takeaway. The verdict (the teaching point) is below the fold.
4. **No onboarding.** Nothing explains, on first arrival, what the Playground is for.

---

## Goals / Success Criteria

- A first-time student can answer, within ~10 seconds and without external help: **(a)** what A and B are, **(b)** which prediction leads on a given metric and that the leader *changes by metric* (the thesis), **(c)** which direction is better for each metric.
- Every metric value carries a **relative** reading: which prediction (A/B) leads, color-coded to the prediction, direction-aware (↑/↓). **No absolute good/bad grade is shown.**
- The verdict/insight is the first thing seen; the full 8-metric table is available but not forced.
- A dismissible first-visit banner states the A/B framing; it is remembered across reloads and never blocks the app.
- The relative cue appears **only in the Playground**, never on the 32 shared Scenario cards (they keep their current minimal look).
- All new UI is bilingual (Korean default), adds zero console errors; existing tests stay green and new behavior is tested.

---

## Requirements Traceability

| Req | Description | Units |
|---|---|---|
| R1 | Name the two predictions and state what each is in the current scene | U1 |
| R2 | A persistent "what am I looking at" legend tying GT/A/B to color + name | U1 |
| R3 | **Relative** per-metric reading (which prediction leads + direction), thesis-consistent, Playground-only | U2 |
| R4 | Verdict-first layout with progressive disclosure of the full table | U3 |
| R5 | Dismissible, remembered first-visit banner | U5 |
| ~~R6~~ | ~~Canvas↔table hover linking~~ — **deferred** (color tie already exists; gold-plating) | — |

(Requirements are defined inline; there is no separate upstream requirements document — this is a greenfield plan from a direct user complaint.)

---

## Key Technical Decisions

- **U2 is a *relative* reading, not an absolute grade.** Per metric row, indicate which prediction **leads** (A 우세 / B 우세 / 비슷) using the existing direction-aware `winner(row)` (`src/components/metrics/detectDisagreements.ts`), color-coded to `--c-pred-a`/`--c-pred-b`, plus the existing ↑/↓ "higher/lower is better". This is computable from `MetricRow.a`/`.b` alone — **no scene geometry needed** (resolving the feasibility blocker) — and it *reinforces* the thesis ("the leader changes by metric") instead of contradicting it. Add a plain-language one-liner per metric ("이 지표는 …를 잰다") so the student knows *what* is being compared. **Never render "좋음/보통/나쁨".** *(see review: adversarial P0, product-lens P0)*
- **The relative cue is Playground-scoped.** `MetricTable` gains an optional `showRelativeCue?: boolean` (default `false`) so the 32 Scenario cards (`src/app/ScenariosView.tsx`) are untouched and their curated teaching points aren't overwritten. *(see review: product-lens P0)*
- **Progressive disclosure by filtering rows at the call site**, not a shared-component mode: `Playground.tsx` computes a fixed core set and passes a sliced `rows` to `MetricTable`; the full table is a second `MetricTable` render inside an expander. No `limitKeys` prop on the shared component. *(see review: scope-guardian P1)*
- **Core metric set is a fixed ordered list — `["dice", "hd95", "sensitivity"]`** (overlap + boundary + recall) so the stray-FP teaching contrast (Dice ties, HD95 explodes) is always visible in the compact view, regardless of which rows happen to rank-flip. *(see review: design P1-B)*
- **First-visit state in `localStorage`** (key `md-playground-guide-seen`) via a small `useFirstVisit` hook, guarded for missing `window`/`localStorage` (mirrors `src/i18n/LanguageContext.tsx` / `ThemeToggle.tsx`). U5 is a single dismissible banner, not a multi-step overlay — sidestepping the undefined-overlay-model risk. *(see review: design P0-A, scope-guardian P1)*
- **U1 legend fallback keys off `activePresetId === ""`** (already set by every edit handler in `Playground.tsx`); look up the preset by id and use generic "예측 A"/"예측 B" when none matches, so the legend never misnames a hand-edited scene. *(see review: coherence P1, feasibility P2)*
- **Reuse the established i18n pattern** (`useLang()` + component-local `const L = { ko, en }`); reuse `localizedMetricLabel` (`src/components/metrics/metricLabel.ts`). Do **not** edit `src/i18n/messages.ts`.
- **Additive, not destructive.** Presets, draw/resize/undo/reset/clear, visibility toggles, insight callout, and bar chart all remain.

---

## High-Level Technical Design

*Directional guidance for review, not implementation specification.*

```
┌───────────────────────── Segmentation Playground ─────────────────────────┐
│ [✕ 첫 방문 배너: "A·B는 같은 정답에 대한 두 예측입니다…"  (U5, dismissible)] │
│ [Presets ▸ 정상 분할 대 과다 분할 | …]   (unchanged)                       │
│                                                                            │
│ ┌── 무엇을 보고 있나 (U1) ───────────────────────────────────────────┐     │
│ │  ● 정답(GT)   ● 예측 A · 정확 추적   ● 예측 B · 과다분할            │     │
│ └────────────────────────────────────────────────────────────────────┘     │
│  ┌── Canvas (edit/draw/resize) ──┐   ┌── 결론 / Verdict (U3, first) ──┐     │
│  │  GT + A + B shapes            │   │  DisagreementInsight           │     │
│  │  (A/B headers already colored │   ├── 핵심 지표 3행 (U2 relative) ─┤     │
│  │   = canvas↔column tie exists) │   │  Dice    ↑  0.97 | 0.57  [A 우세]│   │
│  └───────────────────────────────┘   │  HD95    ↓  2.00 | 22.02 [A 우세]│  │
│  [드래그하면 실시간 갱신]              │  민감도  ↑  0.97 | 1.00  [B 우세]│  │
│  [편집 동작 | 컨트롤: NSD/policy]      │  [ 모든 지표 보기 ▾ ] → full+chart │ │
│  (controls in LEFT column, near canvas)└────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
  Relative cue "A 우세 / B 우세 / 비슷" reinforces the thesis; NO 좋음/나쁨.
```

---

## Implementation Units

> **U4 (Canvas↔table hover linking) is deferred** — see Scope Boundaries. The A/B-column ↔ canvas-shape tie already exists via shared color tokens; hover emphasis is gold-plating relative to the complaint.

### U1. Prediction identity + "what am I looking at" legend

**Goal:** Make A and B concrete — named predictions with a one-phrase role — and add a persistent legend tying 정답(GT)/예측 A/예측 B to their colors.

**Requirements:** R1, R2

**Dependencies:** none

**Files:**
- `src/topics/segmentation/presets.ts` (extend `SegPreset` with bilingual per-prediction `predictionA`/`predictionB` `{ name, role }`; populate all 5 presets)
- `src/components/PredictionLegend.tsx` (new — GT/A/B chips: color swatch + name + role; reuse the swatch/token pattern from `MetricTable.tsx`'s legend; no new visual primitives)
- `src/components/PredictionLegend.test.tsx` (new)
- `src/topics/segmentation/Playground.tsx` (render the legend above the canvas/metrics; source the active preset's prediction meta; when `activePresetId === ""`, fall back to generic "예측 A"/"예측 B" with no role)

**Approach:** Add optional per-prediction descriptors to preset data (bilingual, mirroring `labelKo`/`descriptionKo`). `PredictionLegend` is presentational. The legend's role text drops to empty whenever `activePresetId === ""` (already maintained by the existing edit handlers) so it never describes a hand-edited scene.

**Patterns to follow:** preset bilingual fields in `presets.ts`; legend chip styling in `src/components/MetricTable.tsx`; tokens throughout.

**Test scenarios:**
- Renders three entries (GT, A, B) with correct localized names; role shows when provided. *(happy path)*
- Korean default vs `LanguageProvider initialLang="en"` render the right language. *(i18n)*
- Every preset in `SEG_PRESETS` has non-empty `predictionA`/`predictionB` names in both languages. *(data completeness)*
- Generic-fallback path (no role) renders without crashing when no active preset. *(edge case)*

**Verification:** The legend names A and B; switching presets updates names/roles; editing a shape drops the role.

---

### U2. Relative per-metric reading (which prediction leads + what it measures)

**Goal:** Give every metric a *relative*, thesis-consistent reading — which prediction leads (color-coded), which direction is better, and a one-line "what this metric measures" — so a student can read the comparison without an absolute grade.

**Requirements:** R3

**Dependencies:** none (consumed by U3)

**Files:**
- `src/components/MetricTable.tsx` (add optional `showRelativeCue?: boolean`, default `false`; when on, render a per-row "우세" chip via `winner(row)` colored to the leader's `--c-pred-a`/`--c-pred-b`, and a per-metric plain-language meaning line/tooltip)
- `src/components/metrics/metricMeaning.ts` (new — pure: `metricMeaning(key, lang) -> string`, a short bilingual "what this measures" per metric key; reuse `localizedMetricLabel` conventions)
- `src/components/metrics/metricMeaning.test.ts` (new)
- `src/components/MetricTable.test.tsx` (extend)

**Approach:** Reuse the **existing** direction-aware `winner(row)` (already used for bold accents). The new cue makes the existing relative verdict *explicit and legible*: a small chip "A 우세 / B 우세 / 비슷" in the leader's color, next to the existing ↑/↓. A per-metric one-liner (from `metricMeaning`) answers "what is being compared". **No absolute quality words.** Ties (`winner` → "tie") render "비슷"; a `NaN` value (reachable via Clear-layer / "undefined" distance policy) yields no leader → render a neutral "—"/"비교 불가", never a crash or a misleading chip. The cue is gated by `showRelativeCue` so `ScenariosView` (which omits the prop) is visually unchanged.

**Execution note:** Implement `metricMeaning` and the `winner`→chip mapping test-first; the NaN/tie branches are the risk surface.

**Patterns to follow:** existing `winner`/`detectDisagreements` usage and the ↑/↓ direction glyph already in `MetricTable.tsx`; `localizedMetricLabel`.

**Test scenarios:**
- A-better row → "A 우세" chip in `--c-pred-a`; B-better row → "B 우세" in `--c-pred-b` (direction-aware: a lower-is-better metric where A is smaller → A 우세). *(happy path)*
- Tie → "비슷"; NaN value (e.g. after clear-layer) → neutral "비교 불가", no crash. *(edge / degenerate — first-class, not rare)*
- `metricMeaning` returns a non-empty localized string for every metric key (dice, iou, sensitivity, precision, nsd, hd95, assd, volRel), ko + en. *(coverage)*
- No "좋음/보통/나쁨" (or good/fair/poor) string is rendered anywhere. *(thesis guard — assert absence)*
- `MetricTable` without `showRelativeCue` (the ScenariosView path) renders no "우세" chip. *(scope guard / Scenarios regression)*

**Verification:** Each row shows which prediction leads + direction + a meaning line; Scenario cards are unchanged; no absolute grade appears.

---

### U3. Verdict-first layout + progressive disclosure

**Goal:** Lead with the conclusion and a fixed 3-metric core view; move the full 8-row table + bar chart behind a "모든 지표 보기" expander to cut first-glance overload.

**Requirements:** R4

**Dependencies:** U1, U2

**Files:**
- `src/topics/segmentation/Playground.tsx` (reorder right column: `DisagreementInsight` as the prominent "결론" card → a compact `MetricTable` fed a **filtered** `rows` slice for the fixed core set `["dice","hd95","sensitivity"]` with `showRelativeCue` → an expander revealing a full `MetricTable` + `MetricBarChart`; move the Controls panel into the LEFT column under Edit actions so NSD/policy sit next to the canvas they affect; ensure stacked DOM order keeps the verdict/legend early on narrow widths)
- `src/topics/segmentation/Playground.test.tsx` (extend)

**Approach:** No shared-component mode — `Playground.tsx` slices `rows` to the fixed core for the compact table and passes full `rows` to the expander's table. The fixed core guarantees the overlap/boundary/recall contrast is always shown. Controls move left so adjusting NSD tolerance updates the metrics visibly. On narrow viewports the columns stack; place the verdict/legend block early in DOM order (or use CSS `order`) so "verdict-first" holds when stacked.

**Patterns to follow:** existing `detectDisagreements`/`winner`; existing panel/section styling and the `flex-wrap` columns in `Playground.tsx`.

**Test scenarios:**
- Default render shows the insight first and only the 3 core rows; the full table is not initially visible. *(happy path)*
- Expander reveals the full 8-row table + bar chart. *(interaction)*
- The compact view always includes Dice, HD95, and 민감도 regardless of the active preset. *(fixed-core invariant)*
- After a hand-edit that removes the disagreement, the verdict card re-derives to reflect the new geometry (no stale "disagreement" claim). *(integration — verdict-lies guard, adversarial P2)*
- `MetricTable` rendered elsewhere with full `rows` (Scenarios) is unaffected. *(regression)*

**Verification:** First glance = verdict + 3 meaningful rows; expander reveals the rest; NSD slider visibly changes metrics; Scenarios tab unchanged; narrow-width reading order keeps the verdict early.

---

### U5. First-visit banner

**Goal:** On first arrival, state in one line what A vs B is; dismissible, remembered, never blocking.

**Requirements:** R5

**Dependencies:** U1

**Files:**
- `src/components/useFirstVisit.ts` (new — hook reading/writing `localStorage` key `md-playground-guide-seen`, guarded for missing `window`/`localStorage`)
- `src/components/useFirstVisit.test.ts` (new)
- `src/topics/segmentation/Playground.tsx` (render a dismissible one-line banner above the legend on first visit; a small "도움말" text affordance can re-show it)

**Approach:** A single token-styled banner (no overlay, no focus trap, no animation beyond a CSS transition already covered by `global.css` reduced-motion): *"A·B는 같은 정답(GT)에 대한 두 예측입니다. 도형을 움직여 지표가 어떻게 달라지는지 보세요."* / EN equivalent. Shown when `useFirstVisit` reports unseen; the dismiss "✕" sets the flag. If `localStorage` is unavailable, the banner shows once per mount and is still dismissible (never crashes). A multi-step coachmark tour is explicitly **out of scope** (deferred).

**Patterns to follow:** `localStorage` guarding in `src/i18n/LanguageContext.tsx` / `src/app/ThemeToggle.tsx`; token-styled note like `src/components/UnitsBanner.tsx`.

**Test scenarios:**
- First visit (no flag) renders the banner; dismiss sets the flag and hides it. *(happy path)*
- Second visit (flag set) does not show the banner. *(state)*
- `localStorage`/`window` unavailable → banner shows on mount, is dismissible, never crashes. *(edge case, jsdom)*
- Bilingual copy renders (ko default + en). *(i18n)*

**Verification:** Fresh load shows the one-line banner once; reload doesn't; dismiss works; no focus trap; works without localStorage and with reduced motion.

---

## Scope Boundaries

### In scope
- The Segmentation Playground and the shared components it composes (MetricTable, PredictionLegend, DisagreementInsight) per the active units.

### Deferred to Follow-Up Work
- **U4 — Canvas↔table hover linking.** Gold-plating relative to the complaint; the A/B-column ↔ canvas-shape tie already exists via shared color tokens. Revisit only if user testing shows U1–U3 are insufficient.
- **Multi-step coachmark tour.** U5 ships a one-line banner; a full guided tour (overlay model, spotlight, step controls) is deferred until the banner proves insufficient — and would need its overlay interaction model fully specified first.
- **Detection Playground (`DetectionBoard`) parity** — single-model board, no A/B pair; a separate pass can reuse `metricMeaning`, `useFirstVisit`, and the verdict-first idea.
- **MetricBarChart relative tinting** — leave the bar chart as series-colored; revisit after U2.

### Non-goals (rejected on thesis grounds)
- **Absolute "good/fair/poor" quality grading of metric values.** Rejected: it contradicts the dashboard's core thesis ("no single number is good/bad in isolation; it depends on the metric and task") and would mislabel curated Scenario cards (e.g. voxel Dice 0.85 with a missed lesion is *not* "good"). The intuitiveness need is met by *relative* reading instead. *(see review: adversarial P0, product-lens P0)*
- Removing or redesigning presets, drawing/resize/undo, the insight callout, or the bar chart.
- Changing any engine metric computation.

---

## System-Wide Impact

- **`MetricTable.tsx` is shared** by the Segmentation Playground and `ScenariosView` (`src/app/ScenariosView.tsx`, 32 scenario cards). The new `showRelativeCue` prop defaults `false`, so Scenario cards are unchanged — verified by a regression test (U2) and the layout check. No absolute-quality vocabulary leaks into the curated cards.
- **`PredictionLegend.tsx`** is new and Playground-only.
- **No engine, content, scenario, or i18n-message changes** — all new copy is component-local bilingual.
- **`CanvasEditor.tsx` is untouched** (U4 deferred).

---

## Risks & Mitigations

- **Relative cue accidentally reads as an absolute grade.** → Use comparative wording only ("A 우세 / B 우세 / 비슷"), color it to the *prediction* (not green/red), and assert in tests that no good/fair/poor string is rendered.
- **Relative cue leaking into Scenario cards.** → `showRelativeCue` defaults off; regression test asserts the Scenarios path renders no chip.
- **NaN / degenerate values are first-class** (Clear-layer, "undefined" distance policy). → Defined "비교 불가"/neutral branch, tested against the real clear-layer flow, never color-only, never crash.
- **Verdict goes stale after a hand-edit.** → Tested invariant that the verdict re-derives from live rows on edit (U3).
- **Layout regression / verdict-first lost when stacked on narrow widths.** → Keep existing wrap behavior; place verdict/legend early in DOM order; verify via headed screenshots.

---

## Verification (overall)

- Headed walkthrough (한/영, light/dark): first view shows the banner → a clear A/B legend → verdict + 3 core rows each showing which prediction leads + direction + meaning; "모든 지표 보기" reveals the full table + chart; **no "좋음/나쁨" anywhere**; Scenario cards unchanged.
- `npm run test` green (new `metricMeaning` + `useFirstVisit` + `PredictionLegend` tested; MetricTable scope-guard + Scenarios regression tested); `npm run build` clean; **zero console errors**.

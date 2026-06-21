---
name: Metric Dashboard
last_updated: 2026-06-22
---

# Metric Dashboard Strategy

## Target problem

When learning to evaluate medical-imaging and ML models, students treat one summary
metric (Dice, accuracy) as *the verdict* — "model A is better." But which prediction
"wins" flips depending on the metric, and that dependence is invisible in a single
number or a static paper figure. The result: learners build mismeasured intuition and
report the wrong metric for the clinical question.

## Our approach

Make the metric-dependence **tangible and manipulable**: the learner draws the ground
truth and two rival predictions from scratch and watches every metric recompute live —
so they *feel* one prediction win on overlap (Dice) and lose on boundary (HD95). We win
by interactive, hands-on contrast grounded in the Metrics Reloaded framework, and by
**never grading a metric "good" or "bad"** — the lesson is the trade-off itself, not a
ranking. (Not a static reference, not a formula list, not a model leaderboard.)

## Who it's for

**Primary:** Korean graduate students learning medical-imaging / ML evaluation. They're
hiring Metric Dashboard to build correct intuition for *which metric to trust for a
given failure mode* — without slogging through papers or deriving formulas.

**Secondary:** Instructors and lab leads who want a shared, trustworthy teaching artifact
to point students at.

## Key metrics

> No analytics/tracking ship in the app (it's a static, client-only artifact), so these
> are checkable properties of the artifact and qualitative adoption signals, not a
> telemetry dashboard. Each can regress if the product gets worse.

- **Topic parity** - count of available topics that reach full three-view parity (Learn + Playground + Scenarios) at equal polish. Regresses if a topic ships half-built. _(checked against the codebase / `docs/DESIGN.md`)_
- **Numerical truth** - every scenario and preset's stated teaching point is literally true under the engine. Regresses the moment a scene drifts from its claim. _(enforced by the preset/scenario test suite)_
- **Rank-flip coverage** - each topic demonstrates at least one metric-dependent rank flip (A leads one metric, B another) — the core thesis, delivered. _(checked per topic)_
- **Live quality bar** - the deployed site holds: WCAG-AA contrast, zero console errors, and the thesis-guard (no grade words). _(checked via headed audit on the live URL)_
- **Adoption** _(lagging)_ - number of courses/labs using it as a teaching resource. _(qualitative)_

## Tracks

### Topic breadth

Bring more metric families to full three-view parity — classification, regression,
synthesis, LLM/VLM report generation, clinical risk, reader studies (today: segmentation
+ detection).

_Why it serves the approach:_ more failure modes to contrast means more chances for a
learner to feel a metric flip — the lesson scales with breadth.

### Interactive depth

Richer draw-from-scratch playgrounds: more instructive example presets, live recompute,
and direct manipulation of GT vs. predictions.

_Why it serves the approach:_ the manipulable-visibility bet *is* the product — reading
beats nothing, but drawing-and-watching is where the intuition forms.

### Pedagogical fidelity & trust

Clinically-grounded scenarios, Metrics Reloaded alignment, numerically-true scenes, the
no-grade thesis-guard, and humanized Korean prose.

_Why it serves the approach:_ an interactive lesson that is subtly wrong teaches the
wrong intuition — correctness and honesty are load-bearing, not polish.

### Accessibility & consistency

Design-system tokens, WCAG-AA contrast, responsive + light/dark, and a unified
structure/polish across every topic (codified in `docs/DESIGN.md`).

_Why it serves the approach:_ if a visualization isn't legible or a topic feels
second-class, the visibility lesson never lands.

## Not working on

- User accounts, analytics, or any backend — it stays a static, client-only artifact.
- A model leaderboard / benchmarking tool — it teaches how metrics behave, it does not rank real models.
- Grading any metric as "good" or "bad" — the immutable thesis is that the winner depends on the metric.

## Marketing

**One-liner:** Draw the ground truth and two predictions, then watch which one "wins"
flip as you change the metric — an interactive lesson in why no single metric is the verdict.

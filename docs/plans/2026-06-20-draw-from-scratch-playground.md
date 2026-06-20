# Draw-from-scratch Guided Segmentation Playground

**Created:** 2026-06-20
**Status:** active
**Origin:** user directive — "처음부터 사용자가 그리게해 … 진짜 사용할 수 있게" (the preset-loaded start was confusing; students could not tell what GT/A/B were).

## Problem

The Segmentation Playground booted by cloning a preset (`good-vs-over`), so the
student stared at three pre-drawn overlapping blobs and a full metric table with
no idea what they were looking at. Legends, badges, and a verdict were added on
top but did not fix the root cause: **nothing on the canvas was the student's.**

## Decision

Boot **empty** and have the student **draw the scene from scratch**, guided:

1. **GT → A → B, gated.** A pure `flowStage(state)` returns `"gt" | "a" | "b" |
   "compare"` from shape counts and drives everything: a `STEP n of 3` pill, a
   layer-colored in-canvas prompt, which layer is active, which layers are
   dimmed+locked, and whether the right column (verdict + table + chart) renders.
   Metrics stay hidden until all three layers exist, so the student never sees a
   policy-driven empty-mask number with no story.
2. **One drawing gesture.** Press on the canvas, drag to size, release to commit,
   with a live dashed ghost in the active layer's color. Circle (honest inscribed
   circle, `r = min(w,h)/2`), Rectangle, Pencil all share the pencil's pointer
   scaffold. The old "add a centered circle then resize" buttons are removed. A
   min-size guard discards stray taps.
3. **Presets demoted** to a collapsed "예시 불러오기 / Load an example" `<details>`
   below the canvas (loading jumps straight to `compare`). They are someone
   else's worked scene, not the default.
4. **Reset = reset-to-empty** (clear + restart at STEP 1), never back to a preset.
5. **Thesis preserved verbatim:** no metric is graded good/bad; the verdict only
   ever says which side each metric calls *closer*; the winner flips by metric.

## Key interfaces

- `canvasMath.ts` (new pure helpers): `normalizeBox`, `rectFromDrag`,
  `circleFromDrag`, `isBelowMinSize(…, minGrid)` — drag two grid points → Shape.
- `src/topics/segmentation/flowStage.ts` (new): `flowStage`, `stageLayer`,
  `lockedLayersFor`, `stageStep`.
- `src/topics/segmentation/guidedCopy.ts` (new): bilingual `{ ko, en }` copy maps.
- `CanvasEditor` new props: `lockedLayers?`, `prompt?: {text,layer}`,
  `onSelectLayer?` (separates "switch active layer" from "edit shapes" so the
  parent can DERIVE `activeLayer` from `flowStage` — auto-advance falls out).
- `presets.ts`: export the shared `GRID`/`POLICY`/`NSD_TOLERANCE_MM` for the
  empty boot state.

## Scope boundaries

- Segmentation Playground + its canvas only. **Do not touch the Detection board.**
- No `{kind:"ellipse"}` type this pass — a free non-square drag inscribes a true
  circle (honest given `Shape.circle` has a single `r`). A real ellipse is a
  flagged follow-up (end-to-end Shape/engine/handle change).
- Deferred (proposal 3): the "draw an A that beats B on Dice but loses on
  sensitivity" challenge panel and a count-of-flips line.

## Verification

TDD per unit (canvasMath, flowStage, guidedCopy, CanvasEditor, Playground), then
full suite + build, then a hard headed-playwright-verify with an adversarial
UIUX audit (the standing bar for this project).

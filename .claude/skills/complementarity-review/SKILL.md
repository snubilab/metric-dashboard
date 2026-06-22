---
name: complementarity-review
description: Adversarially fact-check the per-metric "how metrics complement each other" content in the Learn tabs (every `complements:` string + each topic's `complementarity` section), independently confirming each flagged error before changing anything. Use when adding or editing a metric's complementarity advice, adding a new metric/topic, or before shipping Learn-content changes.
---

# Complementarity content review

This project's design philosophy (see `docs/DESIGN.md`, principle 6) requires that
**every metric states how it complements the others — and that content MUST be
reviewed for correctness.** A wrong "pairs well with X" claim teaches the wrong
pairing, so complementarity advice needs a *factual* review (not just "it renders").

This skill runs a small multi-agent workflow that, for both the segmentation and
detection Learn content:

1. **Review** — a medical-imaging metrics domain expert reads each topic's
   `content.ts`, fact-checks every per-metric `complements:` claim and the
   topic-level `complementarity` section (`intro` / `pairs` / `benchmarks`), and
   flags only genuinely wrong / misleading / imprecise claims.
2. **Verify** — every flagged claim is handed to a *second* independent expert who
   tries to **refute** it (default: not a real error). Only claims confirmed by the
   second pass are reported as confirmed errors, with a precise corrected claim.

## How to run

1. Get the absolute repo root (e.g. `pwd` at the repo top, or `git rev-parse --show-toplevel`).
2. Run the bundled workflow, passing that path:

   ```
   Workflow({
     scriptPath: ".claude/skills/complementarity-review/review-workflow.js",
     args: { root: "<absolute repo root>" },
   })
   ```

   It returns `{ topicsReviewed, totalFlagged, confirmedErrors, confirmed[], refuted[] }`.
   `confirmed[]` items carry `{ topic, metric, claim, correctedClaim, why }`.

3. For each **confirmed** error: apply `correctedClaim` to that metric's
   `complements:` (or the `complementarity` section) in **both** the English
   `content.ts` and the Korean `contentKo.ts`, preserving metric tokens
   (Dice/IoU/HD95/NSD/ASSD/AP/AP50/FROC/…) byte-identical so the Learn links still
   resolve, and humanizing the Korean prose. Ignore `refuted[]` (false alarms).
4. `npm run test && npm run build`, then verify per the headed-verification bar
   before shipping.

## Notes

- Adding a new topic? Add its `src/topics/<topic>/content.ts` to the `TOPICS` list
  in `review-workflow.js`.
- This is a CONTENT-correctness pass (are the claims true?), complementary to the
  UI verification bar (is it legible/usable?) — run both for Learn-content work.

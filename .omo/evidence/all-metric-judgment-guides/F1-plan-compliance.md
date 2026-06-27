# F1 Plan Compliance Audit

recommendation: APPROVE

blockers: none for F1 plan compliance.

originalIntent: Add compact bilingual judgment guides to every available Learn metric section so students can judge when each metric is informative, where it is blind, and what to check next.

desiredOutcome: Classification, regression, segmentation, detection, and report-generation Learn sections all have Korean and English guide copy rendered in the existing Learn section layout, with no metric-engine, fake-score, live-LLM, route, dependency, API/model, Playground, or Scenario change caused by this feature.

userOutcomeReview: The F1 outcome is satisfied for the judgment-guide feature. The registry/test path derives available topics from `TOPICS.filter((topic) => topic.status === "available")`; the focused test passed live, covering all current available sections in both languages. Guide rendering is limited to `LearnView`. Existing dirty Playground/Scenarios/report-generation files remain in the worktree, but F4 evidence plus Todo 1 preflight evidence attribute them to unrelated prior work, not this feature.

## Checked Artifact Paths

- `.omo/plans/all-metric-judgment-guides.md`
- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `.omo/evidence/all-metric-judgment-guides/task-2-green.txt`
- `.omo/evidence/all-metric-judgment-guides/task-3-green.txt`
- `.omo/evidence/all-metric-judgment-guides/task-4-green.txt`
- `.omo/evidence/all-metric-judgment-guides/task-5-browser.md`
- `.omo/evidence/all-metric-judgment-guides/final-test.txt`
- `.omo/evidence/all-metric-judgment-guides/final-build.txt`
- `.omo/evidence/all-metric-judgment-guides/final-lint.txt`
- `.omo/evidence/all-metric-judgment-guides/final-diff-check.txt`
- `.omo/evidence/all-metric-judgment-guides/task-6-summary.md`
- `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md`
- `.omo/evidence/all-metric-judgment-guides/F3-real-manual-qa.md`
- `.omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md`
- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `src/app/topicRegistry.ts`

## Direct Verification

- Reread the plan and all checked Todo 1-6 lines.
- Inspected `src/topics/judgmentGuides.ts`, `src/topics/judgmentGuides.test.ts`, and `src/app/topicRegistry.ts`.
- Ran `npm run test -- src/topics/judgmentGuides.test.ts`; it passed with 1 test file and 3 tests.
- Ran `git diff --check`; it returned no diagnostics.
- Ran `git diff --name-only -- package.json package-lock.json pnpm-lock.yaml package-lock.json bun.lock vite.config.ts .github/workflows/deploy.yml src/engine`; it returned no paths.
- Checked Todo 1-6 evidence paths: all required todo-specific files exist.
- Checked Task 5 screenshot paths referenced by `task-5-browser.md`; all four PNGs are present and non-empty.

## F1 Findings

- Guide coverage: confirmed. `judgmentGuides.test.ts` dynamically checks every available topic section, KO/EN section id parity, KO/EN guide existence, nonempty `trustWhen`/`doubtWhen`/`tryThis`, Hangul in KO copy, non-identical KO/EN copy, banned verdict words, and report-generation live-evaluator wording.
- Available topic inventory: confirmed through `TOPICS` and tests. The plan prose says "50" sections, but the enumerated inventory sums to 51; the dynamic test covers the live registry rather than trusting the stale count.
- Must-NOT guardrails: confirmed for the judgment-guide feature scope. No tracked diff in `src/engine`, package/dependency files, Vite/deploy config, or route/config files. Scoped guide files contain no live LLM/API/model download path and no fake numeric scoring surface.
- Playground/Scenarios: current dirty files exist in those areas, but `task-1-red.txt` records them as already dirty during preflight, and `F4-scope-fidelity.md` attributes them to separate report-generation work. They remain a staging risk, not an F1 attribution failure.
- Slop/overfit pass: confirmed. `F2-code-quality.md` explicitly applies `omo:remove-ai-slops` and `omo:programming` perspectives. Direct pass found no deletion-only tests, requested-removal-only tests, tautological tests, implementation-mirroring tests, unnecessary production parsing/normalization, new dependency, route, engine, Playground, or Scenario path. The large registry is pure data and exists because Todo 2 explicitly requires one central table.

## Exact Evidence Gaps

- `.omo/evidence/all-metric-judgment-guides/task-1-green.txt` is listed in the plan's Target GREEN evidence section, but no checked Todo 1-6 line requires it and the file is absent. Todo 1's executable evidence path is `task-1-red.txt`, which exists and contains the expected red failure.
- The worktree remains dirty outside this feature. Final staging must include only the guide feature files and intended evidence, excluding unrelated Playground/Scenarios/report-generation paths.

## AdversarialVerify

```json
{
  "verdict": "confirmed",
  "evidence": [
    "Focused registry verification passed live: npm run test -- src/topics/judgmentGuides.test.ts returned 1 file and 3 tests passed.",
    "Todo 1-6 evidence files referenced by checked todo lines exist: task-1-red, task-2-green, task-3-green, task-4-green, task-5-browser, final-test, final-build, final-lint, final-diff-check.",
    "Task 5 screenshot artifacts referenced by task-5-browser.md are present and non-empty.",
    "Source inspection confirms TOPICS contains the five available implemented topics plus coming-soon stubs, and tests derive coverage from available TOPICS rather than hard-coded counts.",
    "Scoped source inspection confirms src/topics/judgmentGuides.ts exports a central KO/EN registry and lookup, while LearnView only renders a guide callout inside existing Learn sections.",
    "Must-NOT checks passed for feature scope: no diff in src/engine, package/dependency files, Vite/deploy config, or workflow/deploy paths; no live LLM/API/model download/fake score path in the guide scope.",
    "remove-ai-slops/programming direct pass and F2 report coverage found no slop/overfit blocker in the guide scope."
  ],
  "repro": [
    "nl -ba .omo/plans/all-metric-judgment-guides.md",
    "test -f .omo/evidence/all-metric-judgment-guides/task-1-red.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/task-2-green.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/task-3-green.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/task-4-green.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/task-5-browser.md",
    "test -f .omo/evidence/all-metric-judgment-guides/final-test.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/final-build.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/final-lint.txt",
    "test -f .omo/evidence/all-metric-judgment-guides/final-diff-check.txt",
    "npm run test -- src/topics/judgmentGuides.test.ts",
    "git diff --check",
    "git diff --name-only -- package.json package-lock.json pnpm-lock.yaml package-lock.json bun.lock vite.config.ts .github/workflows/deploy.yml src/engine",
    "rg -n \"좋음|나쁨|우수|열등|\\\\bgood\\\\b|\\\\bbad\\\\b|best metric|worst metric|live LLM judge|API call|model download|numeric score|overall score\" src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx"
  ],
  "confidence": 0.91,
  "adversarial_classes": [
    "dirty_worktree",
    "untracked_files",
    "stale_state",
    "misleading_success_output",
    "slop_overfit",
    "scope_drift",
    "missing_evidence_path",
    "forbidden_verdict_words",
    "live_llm_or_api_scope_creep",
    "playground_scenarios_attribution"
  ]
}
```

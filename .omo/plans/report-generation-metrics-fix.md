# report-generation-metrics-fix - Work Plan

## TL;DR (For humans)
**What you'll get:** The LLM report-generation metric topic will stop overclaiming coverage, show the missing evaluator family honestly, make Clinical Acceptance visible without inventing a fake score, and make Playground/Scenarios teach the metric split at a glance in Korean and English.

**Why this approach:** First lock the metric inventory and labels so the product cannot silently substitute one metric for another. Then fix the surfaces that make learners feel the metric behavior: scenarios, Playground summary, and Learn figures/minisims.

**What it will NOT do:** It will not add real BERTScore/RaTEscore/GREEN/CRIMSON/Clinical Acceptance implementations, live LLM judges, model downloads, or new dependencies. It will not redesign unrelated topics.

**Effort:** Large
**Risk:** Medium - multiple UI/content/test surfaces must agree, but all work stays inside existing static React/Vitest patterns.
**Decisions to sanity-check:** VERT/ReFINE/RadOT-Eval are concise related-evaluator coverage only; Clinical Acceptance is a non-numeric endpoint card; seven report scenarios are canonical; miniSims are family-level, not one per metric.

Your next move: approve execution with `$start-work` if this plan is acceptable, or ask for high-accuracy review first. Full execution detail follows below.

---

> TL;DR (machine): Large/medium plan to repair report-generation metric inventory, proxy honesty, Korean scenario parity, cue-disagreement visuals, Playground result visibility, Learn experimentability, and verification evidence without product-code implementation in this planning turn.

## Scope
### Must have
- Report-generation metric inventory must match the PPT-backed audit:
  - Core sections remain: BLEU, ROUGE-L, METEOR, BERTScore, RaTEscore, Temporal F1, CheXbert F1, SRR-BERT F1, RadGraph F1, GREEN, CRIMSON, Clinical Acceptance.
  - Add concise Learn coverage for VERT, ReFINE, and RadOT-Eval as related LLM/learned evaluators, not live metrics.
  - Acknowledge BLEU-(1,2,3,4) as variants in the BLEU section without adding separate live rows.
- Playground rows must stop hiding the Clinical Acceptance gap:
  - No fake numeric Clinical Acceptance row.
  - Add a visible non-numeric Clinical Acceptance endpoint card/summary.
  - Demote Laterality F1 from top-level metric row into cue/detail evidence.
  - Every browser-computed heuristic row that is not a real benchmark implementation uses visible proxy/style wording.
- Korean default surface must match English scenario coverage:
  - Seven Korean scenario IDs exactly match the seven English scenario IDs.
  - Add a parity test that fails if one language drops or reorders a scenario.
- Scenario visuals must show cue disagreement directly:
  - Users should see which candidate flips finding/assertion/laterality/temporal cue without reading prose only.
  - The existing "cue mismatch" legend must correspond to an actual rendered mark or be removed.
- Playground must show result state at the user's work position:
  - Desktop shows a compact summary above the dense table.
  - Mobile does not place newly available results above the active editor after the user types Candidate B.
  - Compact mode retains enough legend/meaning to interpret flags.
- Learn must feel like study/experiment, not only glossary:
  - Add the smallest useful set of report-generation miniSims or interactive teaching blocks.
  - Figures show at least one concrete score movement/count per relevant metric family.
- Verification must be agent-executable:
  - Unit tests cover inventory, labels, scenario parity, cue comparison, and Playground summary behavior.
  - Browser evidence captures desktop and mobile report-generation Playground and Scenario surfaces.
  - Layout audit measures the relevant report-generation surfaces.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add a real LLM judge, live API calls, model downloads, embedding packages, or new dependencies.
- Do not create fake numeric values for Clinical Acceptance, VERT, ReFINE, RadOT-Eval, GREEN, or CRIMSON.
- Do not add a broad metric-family abstraction layer.
- Do not redesign segmentation/detection/classification/regression.
- Do not use absolute grade verdicts such as good/bad/superior/inferior or Korean equivalents.
- Do not cleanup unrelated classification dead code in this plan execution; cleanup is limited to report-generation-adjacent dead code touched by this work.
- Do not use `as any`, `@ts-ignore`, skipped tests, or weakened assertions.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for metric row contract, scenario parity, cue comparison, and mobile/result summary behavior. Tests-after is acceptable only for figure/text-only improvements where a failing-first seam would mirror implementation.
- Required local commands:
  - `npm run test`
  - `npm run build`
  - `npm run lint`
- Required browser evidence directory:
  - `.omo/evidence/report-generation-metrics-fix/`
- Required browser/manual QA:
  - Use Playwright against a local Vite preview or dev server.
  - Capture desktop 1440x1050 Learn, Playground compare state, and Scenarios screenshots.
  - Capture mobile 390x844 Playground after filling all three textareas.
  - Save DOM/layout audit JSON proving report panels, result summary, table/card, and scenario cue visual are present and in viewport.
- Required failure evidence:
  - For every TDD todo, first run the target test command before production edits and save the failing output in `.omo/evidence/report-generation-metrics-fix/task-<N>-red.txt`.
  - After edits, save the passing output in `.omo/evidence/report-generation-metrics-fix/task-<N>-green.txt`.
- Evidence paths:
  - `.omo/evidence/report-generation-metrics-fix/task-1-row-contract-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-1-row-contract-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-5-playground-summary-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-5-playground-summary-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-red.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-7-learn-teaching-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/task-8-cleanup-green.txt`
  - `.omo/evidence/report-generation-metrics-fix/final-test.txt`
  - `.omo/evidence/report-generation-metrics-fix/final-build.txt`
  - `.omo/evidence/report-generation-metrics-fix/final-lint.txt`
  - `.omo/evidence/report-generation-metrics-fix/final-layout-audit.json`
  - `.omo/evidence/report-generation-metrics-fix/final-desktop-playground.png`
  - `.omo/evidence/report-generation-metrics-fix/final-mobile-playground.png`
  - `.omo/evidence/report-generation-metrics-fix/final-scenarios-ko.png`

## Execution strategy
### Parallel execution waves
- Wave 1 locks data contracts and content inventory. Todos 1, 2, and 3 can run in parallel after checking for file conflicts.
- Wave 2 builds shared cue/result UI. Todo 4 blocks Todos 5 and 6 if it creates a shared component; otherwise Todos 5 and 6 may proceed in parallel using existing `ReportCueBoard`.
- Wave 3 improves Learn teaching and trims adjacent report dead code. Todos 7 and 8 can run after Todo 2; Todo 8 must not delete a figure Todo 7 decides to reuse.
- Wave 4 is final verification. Run all final checks and browser/manual QA after all implementation todos pass.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. Metric row contract and proxy labels | none | 5, final QA | 2, 3 |
| 2. Learn inventory for related evaluators | none | 7, 8, final QA | 1, 3 |
| 3. Korean scenario parity | none | 6, final QA | 1, 2 |
| 4. Cue comparison primitive | 1 | 5, 6 | 7 if files do not overlap |
| 5. Playground result summary and mobile order | 1, 4 | final QA | 6, 7 |
| 6. Scenario preview cue visual | 3, 4 | final QA | 5, 7 |
| 7. Learn figures and miniSims | 2 | 8, final QA | 5, 6 |
| 8. Report-generation cleanup | 2, 7 | final QA | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Lock report metric row contract and honest labels
  What to do / Must NOT do: Add a failing exact-key/label test for report comparison rows, then update row labels and row set. Remove `lateralityF1` from the top-level `MetricTable` rows. Keep `lateralityF1` available in extracted cue/detail UI if still useful. Rename misleading visible rows so browser-computed approximations are explicit: `Temporal cue F1 proxy`, `CheXbert finding F1 proxy`, `GREEN-style error count`, `CRIMSON-style weighted errors`. Do not add a numeric Clinical Acceptance row.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5, final QA
  References (executor has NO interview context - be exhaustive): `src/components/metrics/reportComparisonRows.ts:4`, `src/components/metrics/reportComparisonRows.ts:61`, `src/components/metrics/reportComparisonRows.ts:67`, `src/components/metrics/reportComparisonRows.ts:82`, `src/engine/metrics/reportGeneration.ts:21`, `src/engine/metrics/reportGeneration.ts:333`, `src/engine/metrics/reportGeneration.ts:350`, `src/components/metrics/metricLabel.ts:27`, `src/components/metrics/metricMeaning.ts:78`, `src/components/metrics/reportComparisonRows.test.ts:5`, `docs/DESIGN.md:5`
  Acceptance criteria (agent-executable): `npm run test -- src/components/metrics/reportComparisonRows.test.ts src/engine/metrics/reportGeneration.test.ts` exits 0; `reportComparisonRows(...).map(row => row.key)` equals exactly `["bleu1","rougeL","meteor","bertScore","rateScore","chexbertF1","srrBertF1","temporalF1","radGraphF1","greenErrors","crimsonWeightedErrors"]`; no returned row key is `lateralityF1`; labels for Temporal/CheXbert/GREEN/CRIMSON contain `proxy` or `style`.
  QA scenarios (name the exact tool + invocation): Failure: before production edits, run `npm run test -- src/components/metrics/reportComparisonRows.test.ts > .omo/evidence/report-generation-metrics-fix/task-1-row-contract-red.txt 2>&1` and confirm it fails on the exact row contract. Happy: after edits, run `npm run test -- src/components/metrics/reportComparisonRows.test.ts src/engine/metrics/reportGeneration.test.ts > .omo/evidence/report-generation-metrics-fix/task-1-row-contract-green.txt 2>&1` and confirm exit 0.
  Commit: Y | `fix(report-generation): make metric rows honest`

- [x] 2. Add concise Learn coverage for VERT/ReFINE/RadOT-Eval without fake live metrics
  What to do / Must NOT do: Add concise bilingual Learn coverage for `VERT`, `ReFINE`, and `RadOT-Eval` as related LLM/learned evaluator coverage near GREEN/CRIMSON, plus tests. Prefer one compact section such as `llm-evaluator-landscape` over three full metric sections unless a smaller existing pattern clearly supports three. Add metric text links only if they point to a real section. Do not add Playground rows or live scores for these evaluators.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 7, 8, final QA
  References: `/tmp/clinical_report_metrics_audit.md:225`, `/tmp/clinical_report_metrics_audit.md:230`, `/tmp/clinical_report_metrics_audit.md:553`, `src/topics/report-generation/content.ts:185`, `src/topics/report-generation/content.ts:204`, `src/topics/report-generation/contentKo.ts:185`, `src/topics/report-generation/content.test.ts:5`, `src/components/metrics/metricTextLinks.ts:16`, `src/components/figures/MetricFigure.tsx:111`
  Acceptance criteria: `npm run test -- src/topics/report-generation/content.test.ts src/components/metrics/metricTextLinks.test.ts` exits 0; English and Korean Learn section IDs stay identical; content mentions `VERT`, `ReFINE`, and `RadOT-Eval`; the new copy explicitly says they are not live static-dashboard judges; no `reportComparisonRows` key is added for these names.
  QA scenarios: Failure: add the content test first and run `npm run test -- src/topics/report-generation/content.test.ts > .omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-red.txt 2>&1`, confirming it fails before content changes. Happy: after content/link changes, run `npm run test -- src/topics/report-generation/content.test.ts src/components/metrics/metricTextLinks.test.ts > .omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-green.txt 2>&1`.
  Commit: Y | `feat(report-generation): cover evaluator landscape`

- [x] 3. Make Korean report scenarios match the seven English scenarios
  What to do / Must NOT do: Add the three missing Korean scenarios `paraphrase-tolerance`, `label-granularity`, and `error-category-context` to `reportGenerationScenariosKo`. Add a parity test that compares ID order and length between English and Korean scenarios. Keep the same `state(...)` examples as English; author Korean clinical/teaching text, do not machine-dump awkward literal translation if concise bilingual terms are clearer.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 6, final QA
  References: `src/topics/report-generation/scenarios.ts:32`, `src/topics/report-generation/scenarios.ts:90`, `src/topics/report-generation/scenarios.ts:104`, `src/topics/report-generation/scenarios.ts:118`, `src/topics/report-generation/scenariosKo.ts:29`, `src/topics/report-generation/reportExamples.ts:12`, `src/topics/report-generation/comparison.test.ts:6`, `src/topics/report-generation/presets.test.ts:7`, `src/app/ScenariosView.tsx:573`
  Acceptance criteria: `npm run test -- src/topics/report-generation/comparison.test.ts src/topics/report-generation/presets.test.ts` exits 0; `reportGenerationScenariosKo.map(s => s.id)` equals `reportGenerationScenarios.map(s => s.id)`; every Korean scenario has non-empty `clinical.situation`, `clinical.modality`, `clinical.atStake`, `clinical.consequence`, `teachingPoint`, and `reference`.
  QA scenarios: Failure: write the parity test first and run `npm run test -- src/topics/report-generation/comparison.test.ts > .omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-red.txt 2>&1`, confirming current 4-vs-7 mismatch fails. Happy: after adding Korean scenarios, run `npm run test -- src/topics/report-generation/comparison.test.ts src/topics/report-generation/presets.test.ts > .omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-green.txt 2>&1`.
  Commit: Y | `fix(report-generation): restore Korean scenario parity`

- [x] 4. Add the smallest shared cue comparison surface
  What to do / Must NOT do: Create a small report cue comparison UI/helper only if it reduces duplication across Playground and Scenarios. It must compare reference vs Candidate A/B for finding, present/absent assertion, laterality, and temporal cues using existing `extractClinicalCues`. It must expose mismatches with token colors and text labels, and must not introduce a new generic abstraction beyond report generation. If reusing `ReportCueBoard` plus a small pure helper is shorter, do that instead.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5, 6
  References: `src/topics/report-generation/ReportCueBoard.tsx:1`, `src/topics/report-generation/ReportCueBoard.tsx:185`, `src/engine/metrics/reportGeneration.ts:219`, `src/engine/metrics/reportGeneration.ts:251`, `src/engine/metrics/reportGeneration.ts:258`, `src/app/ScenariosView.tsx:443`, `src/topics/report-generation/Playground.tsx:233`
  Acceptance criteria: A new or updated test proves a reference/right/improved/absent report vs left/worsened/present candidate renders at least one mismatch marker and still renders all three report identities. No test uses snapshots as the only assertion.
  QA scenarios: Failure: add a test in `src/topics/report-generation/ReportCueBoard.test.tsx` or adjacent existing test and run `npm run test -- src/topics/report-generation/ReportCueBoard.test.tsx src/topics/report-generation/Playground.test.tsx > .omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-red.txt 2>&1`, confirming mismatch marker is absent before implementation. Happy: after implementation, run the same command and save `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-green.txt`.
  Commit: Y | `feat(report-generation): show cue mismatches`

- [x] 5. Fix Playground at-a-glance results and mobile order
  What to do / Must NOT do: Add a compact result summary above the dense table in report Playground. It must show lexical/semantic/proxy family lead counts, the highest-risk cue mismatch, and the Clinical Acceptance endpoint card. Remove the mobile CSS visual reorder that puts results above the editor after typing; mobile should keep editor then a compact summary/results block within the current work flow. Keep full `MetricTable` available below the summary. Add compact legend or caption so flags and A/B lead chips are understandable.
  Parallelization: Wave 2 | Blocked by: 1, 4 | Blocks: final QA
  References: `src/topics/report-generation/Playground.tsx:66`, `src/topics/report-generation/Playground.tsx:181`, `src/topics/report-generation/Playground.tsx:227`, `src/components/MetricTable.tsx:317`, `src/components/MetricTable.tsx:393`, `src/components/MetricTable.tsx:426`, `src/topics/report-generation/Playground.test.tsx:15`, `/Users/kyh/Downloads/metric-dashboard-report-audit-2026-06-27/04-playground-mobile-after-fill.png`
  Acceptance criteria: `npm run test -- src/topics/report-generation/Playground.test.tsx src/components/MetricTable.test.tsx` exits 0; report Playground compare state renders a summary before the table; Clinical Acceptance text is visible in compare state but not as a numeric row; `RESPONSIVE_CSS` no longer uses mobile `order` to place `.report-pg-results` before `.report-pg-editor`.
  QA scenarios: Failure: write tests first and run `npm run test -- src/topics/report-generation/Playground.test.tsx > .omo/evidence/report-generation-metrics-fix/task-5-playground-summary-red.txt 2>&1`, confirming missing summary/Clinical Acceptance/card behavior fails. Happy: run `npm run test -- src/topics/report-generation/Playground.test.tsx src/components/MetricTable.test.tsx > .omo/evidence/report-generation-metrics-fix/task-5-playground-summary-green.txt 2>&1`. Browser: after final implementation, Playwright action `page.goto(localUrl); page.getByRole("button", { name: "LLM 리포트 생성" }).click(); page.getByRole("tab", { name: "플레이그라운드" }).click(); fill three textareas; screenshot` must save desktop and mobile evidence paths in final wave.
  Commit: Y | `feat(report-generation): summarize playground results`

- [x] 6. Make Scenario preview visually expose report cue disagreement
  What to do / Must NOT do: Update `ReportScenarioPreview` so scenario cards do not rely on raw snippets plus prose only. Reuse the cue comparison from Todo 4 or `ReportCueBoard` if that is smaller. The legend must match actual marks. Add responsive CSS/class rules if needed so the three report snippets/cue panels do not become narrow dense columns in two-column scenario cards. Do not alter non-report scenario preview behavior.
  Parallelization: Wave 2 | Blocked by: 3, 4 | Blocks: final QA
  References: `src/app/ScenariosView.tsx:378`, `src/app/ScenariosView.tsx:402`, `src/app/ScenariosView.tsx:418`, `src/app/ScenariosView.tsx:443`, `src/app/ScenariosView.tsx:554`, `src/app/ScenariosView.tsx:580`, `src/topics/report-generation/scenarios.ts:32`, `src/topics/report-generation/scenariosKo.ts:29`
  Acceptance criteria: `npm run test -- src/app/ScenariosView.test.tsx src/topics/report-generation/comparison.test.ts` exits 0; report scenarios render a cue mismatch visual for at least negation, laterality, and temporal scenarios; Korean Scenarios tab shows seven cards; non-report scenario tests still pass.
  QA scenarios: Failure: add report scenario visual/parity tests first and run `npm run test -- src/app/ScenariosView.test.tsx src/topics/report-generation/comparison.test.ts > .omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-red.txt 2>&1`. Happy: after implementation, run the same command and save `.omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-green.txt`.
  Commit: Y | `feat(report-generation): make scenario cues visible`

- [x] 7. Improve Learn figures and add minimal report miniSims
  What to do / Must NOT do: Add the smallest useful interactive teaching set, not one widget per metric. Preferred set: lexical overlap/paraphrase, entity/assertion swap, temporal direction, label-vs-graph granularity, and GREEN/CRIMSON-style error weighting. Either add one reusable report miniSim widget keyed by scenario kind, or use existing miniSim routing with minimal new kinds if that is shorter. Update figures so each relevant metric family shows concrete movement such as matched counts, TP/FP/FN, same coarse label/wrong side, or error weight. Keep figure text token colors readable and bilingual enough for Korean default users.
  Parallelization: Wave 3 | Blocked by: 2 | Blocks: 8, final QA
  References: `src/components/MiniSim.tsx:33`, `src/types/topic.ts:7`, `src/topics/report-generation/content.ts:6`, `src/topics/report-generation/contentKo.ts:6`, `src/components/figures/ReportGenerationFigures.tsx:76`, `src/components/figures/ReportGenerationFigures.tsx:264`, `src/components/figures/ReportGenerationFigures.tsx:279`, `src/components/figures/ReportGenerationFigures.tsx:354`, `docs/DESIGN.md:37`, `docs/DESIGN.md:87`, `src/topics/report-generation/content.test.ts:26`
  Acceptance criteria: `npm run test -- src/topics/report-generation/content.test.ts src/components/figures/MetricFigure.test.tsx` exits 0; at least 4 report-generation Learn sections include a `miniSim`; no report section renders MiniSim "coming soon"; figures for BLEU/METEOR or lexical, Temporal, CheXbert/SRR/RadGraph, GREEN/CRIMSON show concrete counts or weights; Korean Learn still has identical section IDs and no forbidden verdict words.
  QA scenarios: Tests-after acceptable for figure-only text if no stable failing seam exists. Happy: run `npm run test -- src/topics/report-generation/content.test.ts src/components/figures/MetricFigure.test.tsx > .omo/evidence/report-generation-metrics-fix/task-7-learn-teaching-green.txt 2>&1`. Browser: final wave captures Learn screenshot showing report miniSim/figure content.
  Commit: Y | `feat(report-generation): teach metric movement`

- [x] 8. Trim only report-generation-adjacent dead code made obsolete by the fix
  What to do / Must NOT do: After Todo 7 decides which report figures are reused, delete only unused report-generation figure registry keys/functions that remain unreferenced: candidates are `report-lexical-overlap`, `report-entity-similarity`, `report-label-f1`, and `report-llm-evaluator`. Do not delete unrelated classification dead code in this execution. Remove duplicate unrendered report metric fields only if no tests or UI need them after Todos 1-7; otherwise leave them.
  Parallelization: Wave 3 | Blocked by: 2, 7 | Blocks: final QA
  References: `src/components/figures/MetricFigure.tsx:111`, `src/components/figures/ReportGenerationFigures.tsx:134`, `src/components/figures/ReportGenerationFigures.tsx:219`, `src/components/figures/ReportGenerationFigures.tsx:242`, `src/components/figures/ReportGenerationFigures.tsx:395`, `src/engine/metrics/reportGeneration.ts:32`, `src/components/metrics/metricLabel.ts:27`, `src/components/metrics/metricMeaning.ts:118`
  Acceptance criteria: `rg "report-lexical-overlap|report-entity-similarity|report-label-f1|report-llm-evaluator" src` returns no unused registry-only entries, or each remaining hit is referenced by content/tests. `npm run test -- src/components/figures/MetricFigure.test.tsx src/topics/report-generation/content.test.ts` exits 0.
  QA scenarios: Happy: run `npm run test -- src/components/figures/MetricFigure.test.tsx src/topics/report-generation/content.test.ts > .omo/evidence/report-generation-metrics-fix/task-8-cleanup-green.txt 2>&1`; run `rg "report-lexical-overlap|report-entity-similarity|report-label-f1|report-llm-evaluator" src > .omo/evidence/report-generation-metrics-fix/task-8-rg.txt`.
  Commit: Y | `refactor(report-generation): remove unused report figures`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit
  - Spawn a read-only reviewer with the original audit findings, this plan, and final diff. It must confirm every todo acceptance criterion is satisfied and no scope-out item was implemented.
  - Evidence: `.omo/evidence/report-generation-metrics-fix/final-plan-compliance.md`
- [x] F2. Code quality review
  - Spawn a code-quality reviewer for the final diff. It must check TypeScript safety, no needless abstraction, no broad redesign, and no product-thesis violations.
  - Evidence: `.omo/evidence/report-generation-metrics-fix/final-code-review.md`
- [x] F3. Real manual QA
  - Run:
    - `npm run test > .omo/evidence/report-generation-metrics-fix/final-test.txt 2>&1`
    - `npm run build > .omo/evidence/report-generation-metrics-fix/final-build.txt 2>&1`
    - `npm run lint > .omo/evidence/report-generation-metrics-fix/final-lint.txt 2>&1`
  - Start local Vite (`npm run dev -- --host 127.0.0.1`) or preview if build is available, then run Playwright browser QA:
    - Desktop 1440x1050: navigate to local URL, click `LLM 리포트 생성`, capture Learn, Playground compare state, Scenarios.
    - Mobile 390x844: navigate to local URL, click `LLM 리포트 생성`, open Playground, fill Reference/Candidate A/Candidate B, capture current viewport.
    - Save screenshots to:
      - `.omo/evidence/report-generation-metrics-fix/final-learn-desktop.png`
      - `.omo/evidence/report-generation-metrics-fix/final-desktop-playground.png`
      - `.omo/evidence/report-generation-metrics-fix/final-mobile-playground.png`
      - `.omo/evidence/report-generation-metrics-fix/final-scenarios-ko.png`
  - Inject layout audit for `.report-pg-split`, report summary, metric table, and scenario gallery; save `.omo/evidence/report-generation-metrics-fix/final-layout-audit.json`; issues must be exactly `["CLEAN - no layout issues"]` or the audit must explicitly document intended scroll containers with no offscreen active result summary.
- [x] F4. Scope fidelity
  - Run `git diff --stat` and `git diff --name-only`; confirm changed files are limited to `.omo/evidence`, report-generation topic files, shared components already used by report generation, metric row helpers, and tests.
  - Evidence: `.omo/evidence/report-generation-metrics-fix/final-scope.txt`

## Commit strategy
- Do not auto-commit unless the execution request explicitly authorizes commits.
- If commits are authorized, use one conventional commit per completed wave:
  - `fix(report-generation): make metric coverage honest`
  - `feat(report-generation): expose cue disagreement`
  - `feat(report-generation): teach report metric movement`
  - `refactor(report-generation): trim unused report figures`
- If commits are not authorized, leave changes unstaged and provide the exact suggested commit messages.
- Final commit footer, if a commit is made: `Plan: .omo/plans/report-generation-metrics-fix.md`

## Success criteria
- `.omo/plans/report-generation-metrics-fix.md` remains the source plan for execution.
- No product code is changed by this planning turn.
- During execution, every behavior-changing todo captures RED then GREEN evidence where a failing-first seam exists.
- Final report-generation Learn covers all PPT core metrics and related evaluator family names without fake live implementations.
- Final Playground visibly shows metric row truth, proxy honesty, Clinical Acceptance endpoint context, and first-viewport/mobile result readability.
- Final Scenarios show seven Korean and seven English report scenarios with visual cue disagreement.
- Final Learn includes targeted experiment/figure improvements that show how metric values move.
- `npm run test`, `npm run build`, and `npm run lint` pass.
- Browser screenshots and layout audit evidence are saved under `.omo/evidence/report-generation-metrics-fix/`.

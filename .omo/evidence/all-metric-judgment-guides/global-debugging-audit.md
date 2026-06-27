# Global Runtime Debugging Audit: All-Metric Judgment Guides

recommendation: FAIL
timestamp: 2026-06-27 22:30:13 +0900
repo: `/Users/kyh/Workspace/metric_dashboard`
feature: Static bilingual metric judgment guides render in LearnView for all available topic sections from `src/topics/judgmentGuides.ts`.

## originalIntent

Add static Korean and English judgment guide copy for every available Learn section and render exactly one guide block inside LearnView for each section. The user-visible result should be contextual guide text in Learn only, with no absolute good/bad metric verdicts and no expansion into runtime evaluators, model calls, Playground, Scenarios, engine, package, or deploy scope.

## desiredOutcome

- All available topic Learn sections have KO/EN guide coverage.
- KO/EN Learn section ids stay in parity.
- LearnView renders exactly one guide block per available section in both languages.
- Guide labels are localized: KO `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것`; EN `Informative when`, `Blind spot when`, `Try this`.
- No forbidden verdict terms, live LLM/API/model-download/numeric-score implication, or non-Learn scope change.
- Browser evidence is current relative to source changes and local dev server cleanup is true.

## userOutcomeReview

The core LearnView outcome is supported by direct test/runtime evidence: the targeted Vitest run passed, render tests iterate all available topics/sections/languages, and screenshot artifacts visibly show localized guide blocks for KO/EN classification and report-generation examples. However, the worktree still contains tracked product edits in `src/topics/report-generation/Playground.tsx` and `src/app/ScenariosView.tsx`, which violates the declared scope hypothesis for this audit. Because this audit was asked to catch scope regression, the result is FAIL.

## hypothesesChecked

### H1 coverage mismatch

Status: REFUTED.

Evidence:
- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx` passed: `Test Files 2 passed (2)`, `Tests 4 passed (4)`.
- `src/topics/judgmentGuides.test.ts` checks all `TOPICS.filter((topic) => topic.status === "available")`, requires `learn` and `learnKo`, compares KO section ids to EN section ids, and fails on any missing `metricJudgmentGuide(topic.id, section.id, lang)`.
- Same test verifies nonempty `trustWhen`, `doubtWhen`, and `tryThis` for KO and EN.

### H2 render mismatch

Status: REFUTED.

Evidence:
- `src/app/LearnView.tsx` imports `metricJudgmentGuide`, calls it with `topicId`, `section.id`, and active `lang`, and renders one `[data-testid="metric-judgment-guide"]` when a guide exists.
- `src/app/LearnView.judgmentGuides.test.tsx` renders `LearnView` for every available topic in `ko` and `en`, finds each `#section-${section.id}`, asserts exactly one `[data-testid='metric-judgment-guide']`, and checks all localized labels.
- Targeted Vitest run passed with those assertions.
- Visual spot check opened all four screenshot artifacts and confirmed visible guide blocks/labels for KO/EN classification and KO/EN report-generation.

### H3 thesis/scope regression

Status: CONFIRMED for scope; copy thesis terms REFUTED.

Copy/thesis evidence:
- Required scan:
  `rg -n "좋음|나쁨|우수|열등|\\bgood\\b|\\bbad\\b|best metric|worst metric|live LLM judge|API call|model download|numeric score|overall score" src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx`
- Output only matched the regex definitions in `src/topics/judgmentGuides.test.ts:27` and `src/topics/judgmentGuides.test.ts:29`; no production guide copy or LearnView text matched.

Scope evidence:
- Required scoped diff command output:
  `git diff --name-only -- package.json package-lock.json vite.config.ts .github src/engine src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`
  returned:
  - `src/app/ScenariosView.tsx`
  - `src/topics/report-generation/Playground.tsx`
- `git status --short -- package.json package-lock.json vite.config.ts .github src/engine src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx` returned both as modified.
- The diffs are product behavior edits outside the declared LearnView judgment-guide surface: Playground adds summary/risk cue logic and report metric family UI; ScenariosView replaces report preview snippets with `ReportCueBoard`.

### H4 QA artifact staleness and cleanup

Status: REFUTED.

Evidence:
- Source mtimes predate browser artifacts:
  - `src/topics/judgmentGuides.ts`: `2026-06-27 21:36:23 +0900`
  - `src/app/LearnView.tsx`: `2026-06-27 21:43:10 +0900`
  - screenshots: `2026-06-27 21:52:53/54 +0900`
  - `task-5-browser.md`: `2026-06-27 21:54:16 +0900`
  - `F3-real-manual-qa.md`: `2026-06-27 22:08:50 +0900`
  - `global-review-qa.md`: `2026-06-27 22:16:55 +0900`
- `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png` reported all four screenshots as non-empty `PNG image data, 1440 x 1000, 8-bit/color RGB`.
- `pgrep -fl 'vite --host 127\\.0\\.0\\.1|npm run dev|vite' || true` returned no output.
- `lsof -nP -iTCP:5173 -sTCP:LISTEN || true` returned no output.

### H5 slop/overfit regression

Status: REFUTED for the judgment-guide files; residual size risk noted.

Evidence:
- `omo:remove-ai-slops` and `omo:programming` were loaded and applied directly.
- Existing code review coverage was present in `.omo/evidence/all-metric-judgment-guides/global-review-code.md` and `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md`; both explicitly document remove-ai-slops/programming checks.
- Direct scan found no `any`, `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `console.log`, or `debugger` in the scoped guide files.
- Tests are not deletion-only or tautological: they derive available topics from `TOPICS`, assert section parity/coverage, and assert observable rendered guide blocks.
- `src/topics/judgmentGuides.ts` is 628 pure LOC, but it is a pure data registry with `// allow: SIZE_OK - central pure-data registry required by Todo 2.` This is acceptable as a pure-data exception. `src/app/LearnView.tsx` is 414 pure LOC and remains a residual pre-existing maintainability risk, not introduced as a new abstraction.

## commandsRun

- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`
- `rg -n "좋음|나쁨|우수|열등|\\bgood\\b|\\bbad\\b|best metric|worst metric|live LLM judge|API call|model download|numeric score|overall score" src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx`
- `git diff --name-only -- package.json package-lock.json vite.config.ts .github src/engine src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`
- `git status --short -- package.json package-lock.json vite.config.ts .github src/engine src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`
- `stat -f '%Sm %z %N' -t '%Y-%m-%d %H:%M:%S %z' .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png src/topics/judgmentGuides.ts src/app/LearnView.tsx src/app/topicRegistry.ts src/App.tsx package.json`
- `file .omo/evidence/all-metric-judgment-guides/task-5-*-learn.png`
- `pgrep -fl 'vite --host 127\\.0\\.0\\.1|npm run dev|vite' || true`
- `lsof -nP -iTCP:5173 -sTCP:LISTEN || true`
- `./node_modules/.bin/eslint src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx`
- `git diff --check -- src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx`

## checkedArtifactPaths

- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `src/topics/report-generation/Playground.tsx`
- `src/app/ScenariosView.tsx`
- `.omo/evidence/all-metric-judgment-guides/task-5-browser.md`
- `.omo/evidence/all-metric-judgment-guides/F3-real-manual-qa.md`
- `.omo/evidence/all-metric-judgment-guides/global-review-qa.md`
- `.omo/evidence/all-metric-judgment-guides/global-review-code.md`
- `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md`
- `.omo/evidence/all-metric-judgment-guides/task-5-ko-classification-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-ko-report-generation-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-en-classification-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-en-report-generation-learn.png`

## blockers

1. Scope regression confirmed: tracked diffs exist in `src/topics/report-generation/Playground.tsx` and `src/app/ScenariosView.tsx` under the exact out-of-scope paths requested for inspection. The declared feature is LearnView static guide rendering, so these changes prevent a PASS for this audit.

## evidenceGaps

- No notepad path was provided in the user request; this audit used repository artifacts and direct runtime/source checks instead.
- Existing browser QA covers representative classification and report-generation topics visually. Full all-topic/all-section render coverage is provided by Vitest, not by one screenshot per section.

## finalVerdict

FAIL

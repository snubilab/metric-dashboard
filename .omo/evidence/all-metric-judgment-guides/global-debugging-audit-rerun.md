# Corrected Global Runtime Debugging Audit Rerun: All-Metric Judgment Guides

recommendation: PASS
timestamp: 2026-06-27 22:35:56 +0900
repo: `/Users/kyh/Workspace/metric_dashboard`

## correctedCriterion

`scope regression = forbidden path changed by this feature`, not merely `forbidden path dirty in shared worktree`.

## originalIntent

Add static Korean and English metric judgment guide copy for every available Learn section and render exactly one guide block inside LearnView for each section. The user-visible result should be contextual Learn-only guide text with no absolute metric verdicts and no expansion into runtime evaluators, model calls, Playground, Scenarios, engine, package, or deploy scope.

## desiredOutcome

- All available topic Learn sections have KO/EN guide coverage.
- KO/EN Learn section ids stay in parity.
- LearnView renders exactly one guide block per available section in both languages.
- Guide labels are localized: KO `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것`; EN `Informative when`, `Blind spot when`, `Try this`.
- No forbidden verdict terms, live LLM/API/model-download/numeric-score implication, or feature-attributable non-Learn scope change.

## userOutcomeReview

The LearnView outcome is supported by current source and fresh focused tests. Current forbidden paths are dirty, but attribution evidence shows those paths belong to prior report-generation work, not this guide feature. The original failure mechanism is therefore resolved.

## hypothesesChecked

### H1 real scope regression

Status: REFUTED.

Evidence:

- Current symbol search found `metricJudgmentGuide`, `METRIC_JUDGMENT_GUIDES`, `metric-judgment-guide`, and `LocalizedMetricJudgmentGuide` only in `src/topics/judgmentGuides.ts`, `src/topics/judgmentGuides.test.ts`, `src/app/LearnView.tsx`, and `src/app/LearnView.judgmentGuides.test.tsx`.
- `git diff -- src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx` shows report-generation cue board / at-a-glance summary work, not judgment-guide code.
- `git diff --name-only -- package.json package-lock.json pnpm-lock.yaml yarn.lock bun.lockb bun.lock vite.config.ts tsconfig.json eslint.config.js .github src/engine` returned no paths.

### H2 false-positive attribution

Status: CONFIRMED.

Evidence:

- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt` captured `M src/app/ScenariosView.tsx` and `M src/topics/report-generation/Playground.tsx` during Todo 1 red/preflight before `src/topics/judgmentGuides.ts` existed.
- `.omo/evidence/report-generation-metrics-fix/final-scope.txt`, timestamped `Sat Jun 27 17:34:00 KST 2026`, captured the same two forbidden paths as part of the separate report-generation metrics fix.
- `.omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md` lines 8-15 explicitly document the same attribution distinction and the guide-only symbol footprint.

### H3 stale/generated artifact issue

Status: PARTIALLY CONFIRMED.

Evidence:

- Refuted as stale-state explanation: the failed audit used current dirty worktree checks and fresh tests.
- Confirmed as incomplete-evidence explanation: it used a dirty-path criterion rather than an attribution criterion. This corrected rerun uses current files plus preflight/final-scope artifacts.

## correctedScopeResult

Current forbidden-path dirty status:

```text
src/app/ScenariosView.tsx
src/topics/report-generation/Playground.tsx
```

Feature attribution result:

```text
No evidence that the all-metric judgment-guide feature changed Playground, Scenarios, package/dependency/deploy/config, routes, or engine code.
```

Therefore, under the corrected criterion, there is no scope regression attributable to this feature.

## slopAndOverfitReview

Result: PASS.

- Direct pass found no excessive or useless tests, deletion-only tests, tests that merely verify a requested removal, tautological tests, implementation-mirroring tests, or unnecessary production extraction/parsing/normalization in the judgment-guide feature.
- Prior code review coverage explicitly reports `omo:remove-ai-slops` and `omo:programming` checks:
  - `.omo/evidence/all-metric-judgment-guides/global-review-code.md` lines 27-33 and 81.
  - `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md` lines 18-20 and 51.
  - `.omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md` lines 8-15 and 38.

## verification

Command: `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`

```text
Test Files  2 passed (2)
Tests       4 passed (4)
```

Command: `git diff --check`

```text

```

No whitespace diagnostics were emitted.

## commandsRun

- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/debugging/SKILL.md`
- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/programming/SKILL.md`
- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/remove-ai-slops/SKILL.md`
- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/debugging/references/methodology/00-setup.md`
- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/debugging/references/methodology/02-investigate.md`
- `cat /Users/kyh/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/debugging/references/methodology/09-cleanup.md`
- `git status --short`
- `git diff --name-only -- ':(glob)src/**/Playground.tsx' src/app/ScenariosView.tsx`
- `git diff --name-only`
- `sed -n '1,260p' .omo/evidence/all-metric-judgment-guides/global-debugging-audit.md`
- `sed -n '1,260p' .omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `sed -n '1,260p' .omo/evidence/report-generation-metrics-fix/final-scope.txt`
- `sed -n '1,280p' .omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md`
- `sed -n '1,320p' .omo/plans/all-metric-judgment-guides.md`
- `rg -n "metricJudgmentGuide|METRIC_JUDGMENT_GUIDES|metric-judgment-guide|LocalizedMetricJudgmentGuide" src`
- `git diff --name-only -- package.json package-lock.json pnpm-lock.yaml yarn.lock bun.lockb bun.lock vite.config.ts tsconfig.json eslint.config.js .github src/engine`
- `git diff -- src/app/LearnView.tsx src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`
- `sed -n '1,220p' src/topics/judgmentGuides.test.ts`
- `sed -n '1,220p' src/app/LearnView.judgmentGuides.test.tsx`
- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`
- `git diff --check`
- `git diff --stat -- src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`
- `git diff -- src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`
- `rg -n "ScenariosView\\.tsx|Playground\\.tsx|LearnView\\.tsx|judgmentGuides\\.ts" .omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `rg -n "ScenariosView\\.tsx|Playground\\.tsx|LearnView\\.tsx|judgmentGuides\\.ts" .omo/evidence/report-generation-metrics-fix/final-scope.txt`
- `rg -n "Scope regression|src/app/ScenariosView\\.tsx|src/topics/report-generation/Playground\\.tsx|FAIL|recommendation" .omo/evidence/all-metric-judgment-guides/global-debugging-audit.md`
- `rg -n "forbidden dirty paths|report-generation-metrics-fix|metricJudgmentGuide|git diff --name-only|npm run test|remove-ai-slops|slop_overfit" .omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md`
- `rg -n "remove-ai-slops|programming|slop|overfit|scope|tautological|deletion|implementation-mirroring|abstraction" .omo/evidence/all-metric-judgment-guides/global-review-code.md`
- `rg -n "remove-ai-slops|programming|slop|overfit|scope|tautological|deletion|implementation-mirroring|abstraction" .omo/evidence/all-metric-judgment-guides/F2-code-quality.md`

## checkedArtifactPaths

- `.omo/evidence/all-metric-judgment-guides/global-debugging-audit.md`
- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `.omo/evidence/report-generation-metrics-fix/final-scope.txt`
- `.omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md`
- `.omo/evidence/all-metric-judgment-guides/global-review-code.md`
- `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md`
- `.omo/plans/all-metric-judgment-guides.md`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/topics/report-generation/Playground.tsx`
- `src/app/ScenariosView.tsx`

## blockers

None for corrected scope debugging.

## evidenceGaps

- Current worktree remains dirty from unrelated report-generation work. This does not block the corrected audit result, but final staging must exclude those unrelated paths.
- `git diff` does not list untracked files, so untracked judgment-guide files were checked by `git status`, direct reads/searches, and focused tests.

## productFixRequired

No. The failed audit was caused by false-positive attribution, not a product bug in the judgment-guide implementation.

## finalVerdict

PASS

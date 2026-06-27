# Global Debugging Scope Resolution: All-Metric Judgment Guides

verdict: PASS
timestamp: 2026-06-27 22:35:56 +0900
repo: `/Users/kyh/Workspace/metric_dashboard`

## question

Determine whether the failed audit's scope regression is a real feature bug or a false-positive attribution issue.

## rootCauseMechanism

The failed audit treated "forbidden path is dirty in the shared worktree" as equivalent to "forbidden path was changed by the all-metric judgment-guide feature." That attribution is false. The two forbidden paths were already dirty in Todo 1 preflight evidence and in the separate report-generation final-scope artifact before the judgment-guide product implementation.

## hypothesisStatus

- H1 real scope regression: REFUTED. Current guide symbols and references are limited to the guide registry/tests and LearnView/LearnView test. The dirty Playground and Scenarios diffs contain report-generation cue/summary work, not judgment-guide wiring.
- H2 false-positive attribution: CONFIRMED. `src/app/ScenariosView.tsx` and `src/topics/report-generation/Playground.tsx` predate this feature in `.omo/evidence/all-metric-judgment-guides/task-1-red.txt` and match `.omo/evidence/report-generation-metrics-fix/final-scope.txt`.
- H3 stale/generated artifact issue: PARTIALLY CONFIRMED. The failed audit was not stale about the current dirty worktree, but its scope evidence was incomplete because it checked dirty status rather than feature attribution. A corrected rerun from current files is required and is recorded in `global-debugging-audit-rerun.md`.

## currentGitEvidence

Command: `git status --short`

```text
 M src/App.tsx
 M src/app/LearnView.tsx
 M src/app/ScenariosView.test.tsx
 M src/app/ScenariosView.tsx
 M src/components/MiniSim.test.tsx
 M src/components/MiniSim.tsx
 M src/components/figures/MetricFigure.test.tsx
 M src/components/figures/MetricFigure.tsx
 M src/components/figures/ReportGenerationFigures.tsx
 M src/components/metrics/metricLabel.ts
 M src/components/metrics/metricTextLinks.test.ts
 M src/components/metrics/metricTextLinks.ts
 M src/components/metrics/reportComparisonRows.test.ts
 M src/components/metrics/reportComparisonRows.ts
 M src/topics/report-generation/Playground.test.tsx
 M src/topics/report-generation/Playground.tsx
 M src/topics/report-generation/ReportCueBoard.tsx
 M src/topics/report-generation/comparison.test.ts
 M src/topics/report-generation/content.test.ts
 M src/topics/report-generation/content.ts
 M src/topics/report-generation/contentKo.ts
 M src/topics/report-generation/scenariosKo.ts
?? .agents/
?? .codex/
?? .omo/
?? AGENTS.md
?? src/app/LearnView.judgmentGuides.test.tsx
?? src/components/minisims/ReportMetricSim.tsx
?? src/topics/judgmentGuides.test.ts
?? src/topics/judgmentGuides.ts
?? src/topics/report-generation/ReportCueBoard.test.tsx
?? src/topics/report-generation/reportMetricFamilies.ts
```

Command: `git diff --name-only -- ':(glob)src/**/Playground.tsx' src/app/ScenariosView.tsx`

```text
src/app/ScenariosView.tsx
src/topics/report-generation/Playground.tsx
```

These paths are currently dirty. That fact alone does not establish attribution to the judgment-guide feature.

## priorAttributionEvidence

Task 1 red/preflight evidence already had the forbidden paths before the guide registry existed:

Command: `rg -n "ScenariosView\\.tsx|Playground\\.tsx|LearnView\\.tsx|judgmentGuides\\.ts" .omo/evidence/all-metric-judgment-guides/task-1-red.txt`

```text
6: M src/app/ScenariosView.tsx
18: M src/topics/report-generation/Playground.tsx
70:Error: Expected src/topics/judgmentGuides.ts to export metricJudgmentGuide(topicId, sectionId, lang).
72:     26|   const load = guideModules["./judgmentGuides.ts"];
76:     29|       "Expected src/topics/judgmentGuides.ts to export metricJudgmentG…
```

The separate report-generation scope artifact independently records the same forbidden paths at `Sat Jun 27 17:34:00 KST 2026`, before the all-metric judgment-guide red test at `21:22:12` and before the failed global audit at `22:30:13`:

Command: `rg -n "ScenariosView\\.tsx|Playground\\.tsx|LearnView\\.tsx|judgmentGuides\\.ts" .omo/evidence/report-generation-metrics-fix/final-scope.txt`

```text
6: M src/app/ScenariosView.tsx
18: M src/topics/report-generation/Playground.tsx
36: src/app/ScenariosView.tsx                          |  78 ++-----------
48: src/topics/report-generation/Playground.tsx        | 129 ++++++++++++++++++++-
60:src/app/ScenariosView.tsx
72:src/topics/report-generation/Playground.tsx
```

F4 scope fidelity also made the attribution distinction explicitly:

```text
F4 lines 8-15: forbidden dirty paths were already present before judgment-guide product code; report-generation-metrics-fix/final-scope.txt attributes the same paths to separate work; guide surface is limited to LearnView, judgmentGuides, and tests; rg found guide symbols only in allowed files; package/config/deploy/engine scoped diff returned no paths.
```

## currentFeatureFootprint

Command: `rg -n "metricJudgmentGuide|METRIC_JUDGMENT_GUIDES|metric-judgment-guide|LocalizedMetricJudgmentGuide" src`

```text
src/topics/judgmentGuides.test.ts:16:  readonly METRIC_JUDGMENT_GUIDES: MetricJudgmentGuideRegistry;
src/topics/judgmentGuides.test.ts:17:  readonly metricJudgmentGuide: (
src/topics/judgmentGuides.test.ts:38:      "Expected src/topics/judgmentGuides.ts to export metricJudgmentGuide(topicId, sectionId, lang).",
src/topics/judgmentGuides.test.ts:61:    const { metricJudgmentGuide } = await loadGuides();
src/topics/judgmentGuides.test.ts:68:          const guide = metricJudgmentGuide(topic.id, section.id, lang);
src/topics/judgmentGuides.test.ts:85:    const { METRIC_JUDGMENT_GUIDES, metricJudgmentGuide } = await loadGuides();
src/topics/judgmentGuides.test.ts:88:      JSON.stringify(METRIC_JUDGMENT_GUIDES),
src/topics/judgmentGuides.test.ts:92:      JSON.stringify(METRIC_JUDGMENT_GUIDES["report-generation"]),
src/topics/judgmentGuides.test.ts:100:        const koGuide = metricJudgmentGuide(topic.id, section.id, "ko");
src/topics/judgmentGuides.test.ts:101:        const enGuide = metricJudgmentGuide(topic.id, section.id, "en");
src/topics/judgmentGuides.ts:10:export type LocalizedMetricJudgmentGuide = Readonly<Record<Lang, MetricJudgmentGuide>>;
src/topics/judgmentGuides.ts:12:export const METRIC_JUDGMENT_GUIDES: Readonly<
src/topics/judgmentGuides.ts:13:  Record<string, Readonly<Record<string, LocalizedMetricJudgmentGuide>>>
src/topics/judgmentGuides.ts:627:export function metricJudgmentGuide(
src/topics/judgmentGuides.ts:632:  return METRIC_JUDGMENT_GUIDES[topicId]?.[sectionId]?.[lang];
src/app/LearnView.tsx:25:import { metricJudgmentGuide } from "../topics/judgmentGuides";
src/app/LearnView.tsx:293:  const guide = metricJudgmentGuide(topicId, section.id, lang);
src/app/LearnView.tsx:326:        <div data-testid="metric-judgment-guide" style={calloutStyle}>
src/app/LearnView.judgmentGuides.test.tsx:40:            "[data-testid='metric-judgment-guide']",
```

Allowed feature files:

- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`

No guide symbol appears in `src/topics/report-generation/Playground.tsx`, `src/app/ScenariosView.tsx`, `src/engine`, package files, config files, routes, deploy files, or Scenario/Playground code.

## forbiddenDiffContent

Command: `git diff --stat -- src/topics/report-generation/Playground.tsx src/app/ScenariosView.tsx`

```text
 src/app/ScenariosView.tsx                   |  78 ++---------------
 src/topics/report-generation/Playground.tsx | 129 +++++++++++++++++++++++++++-
 2 files changed, 134 insertions(+), 73 deletions(-)
```

Direct diff inspection shows:

- `src/app/ScenariosView.tsx` imports and renders `ReportCueBoard` for report-generation previews.
- `src/topics/report-generation/Playground.tsx` imports `MetricRow`, `extractClinicalCues`, `ClinicalCues`, and report metric family helpers; adds at-a-glance result and cue mismatch summary UI.
- The forbidden diffs contain no `metricJudgmentGuide`, `METRIC_JUDGMENT_GUIDES`, `metric-judgment-guide`, or `LocalizedMetricJudgmentGuide` references.

## packageDeployEngineEvidence

Command: `git diff --name-only -- package.json package-lock.json pnpm-lock.yaml yarn.lock bun.lockb bun.lock vite.config.ts tsconfig.json eslint.config.js .github src/engine`

```text

```

No package, dependency, build config, deploy config, or engine path is currently dirty in the tracked diff.

## verification

Command: `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`

```text
Test Files  2 passed (2)
Tests       4 passed (4)
```

The jsdom canvas warnings are present but non-fatal and the focused judgment-guide tests pass.

Command: `git diff --check`

```text

```

No whitespace diagnostics were emitted.

## slopAndOverfitPass

Direct `omo:remove-ai-slops` / `omo:programming` pass found no unresolved slop in the judgment-guide scope:

- Tests are dynamic coverage/UI guards over `TOPICS.filter((topic) => topic.status === "available")`, not deletion-only tests, tautological tests, requested-removal-only tests, or implementation-mirroring snapshots.
- Production code adds a central pure data registry and a single LearnView render block; no runtime evaluator, parser, normalization layer, dependency, route, engine path, package/config/deploy file, Playground path, or Scenario path was introduced by this feature.
- `src/topics/judgmentGuides.ts` is large, but it is a required pure-data registry and carries the explicit `SIZE_OK` exception noted in prior review.
- Prior review coverage supports the same criteria: `global-review-code.md` lines 27-33 and 81; `F2-code-quality.md` lines 18-20 and 51; `F4-scope-fidelity.md` lines 8-15 and 38.

## conclusion

The original FAIL is resolved as a false-positive attribution issue. The corrected scope rule is:

```text
scope regression = forbidden path changed by this feature,
not merely forbidden path dirty in a shared worktree
```

Under that corrected rule, the all-metric judgment-guide feature passes scope debugging. No product fix is required. The unrelated report-generation dirty files still require staging discipline and must not be folded into the judgment-guide commit.

# F4 Scope Fidelity

```json
{
  "AdversarialVerify": {
    "verdict": "confirmed",
    "evidence": [
      "Current git status is dirty, but the forbidden dirty paths were already present before this judgment-guide feature product code: .omo/evidence/all-metric-judgment-guides/task-1-red.txt captured App, ScenariosView, MiniSim, MetricFigure, report-generation Playground/content/scenarios, reportComparisonRows, ReportCueBoard, and related files as dirty before src/app/LearnView.tsx or src/topics/judgmentGuides.ts changed.",
      ".omo/evidence/report-generation-metrics-fix/final-scope.txt, timestamped Sat Jun 27 17:34:00 KST 2026, independently attributes the same Playground, Scenarios, report-generation, figure, metric-row, App credit, and report cue board changes to the separate report-generation-metrics-fix work.",
      "The judgment-guide feature surface is limited to src/app/LearnView.tsx, src/app/LearnView.judgmentGuides.test.tsx, src/topics/judgmentGuides.ts, src/topics/judgmentGuides.test.ts, and .omo evidence. The LearnView tracked diff only imports metricJudgmentGuide, adds KO/EN labels, passes topic.id into Section, and renders the guide callout after caveats and before complements/MiniSim.",
      "rg over src found metricJudgmentGuide, metric-judgment-guide, METRIC_JUDGMENT_GUIDES, and LocalizedMetricJudgmentGuide only in the allowed guide registry/test files and LearnView/LearnView guide test.",
      "git diff --name-only -- package/dependency files, vite/tsconfig/eslint config, .github, and src/engine returned no paths. No package dependency, deployment config, route, or metric engine change is attributable to this feature.",
      "git diff --name-only over ScenariosView, report-generation Playground, scenariosKo, ReportCueBoard, and reportComparisonRows does return dirty paths, but those paths match the pre-existing report-generation-metrics-fix scope artifact and the Todo 1 preflight dirty status, not the judgment-guide feature scope.",
      "Fresh focused check passed: npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx returned 2 files / 4 tests passed. git diff --check returned no diagnostics.",
      "remove-ai-slops/programming direct pass: new tests are dynamic coverage/UI guards, not deletion-only, tautological, or requested-removal-only tests; they derive available topics from TOPICS and assert visible guide blocks plus registry coverage. The registry is a pure data table with a SIZE_OK comment for the required central bilingual guide table; no new dependency, route, engine, parser, scoring path, or needless production abstraction was added."
    ],
    "repro": [
      "git status --short",
      "cat .omo/evidence/all-metric-judgment-guides/task-1-red.txt",
      "cat .omo/evidence/report-generation-metrics-fix/final-scope.txt",
      "git diff -- src/app/LearnView.tsx",
      "sed -n '1,220p' src/topics/judgmentGuides.test.ts",
      "sed -n '1,240p' src/app/LearnView.judgmentGuides.test.tsx",
      "tail -n 80 src/topics/judgmentGuides.ts",
      "git diff --name-only -- package.json package-lock.json pnpm-lock.yaml yarn.lock bun.lockb bun.lock vite.config.ts tsconfig.json eslint.config.js .github src/engine",
      "git diff --name-only -- src/app/ScenariosView.tsx src/app/ScenariosView.test.tsx src/topics/report-generation/Playground.tsx src/topics/report-generation/Playground.test.tsx src/topics/report-generation/scenariosKo.ts src/topics/report-generation/ReportCueBoard.tsx src/components/metrics/reportComparisonRows.ts",
      "rg \"metricJudgmentGuide|metric-judgment-guide|METRIC_JUDGMENT_GUIDES|LocalizedMetricJudgmentGuide\" src",
      "npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx",
      "git diff --check"
    ],
    "confidence": 0.9,
    "adversarial_classes": {
      "dirty_worktree": "Present and material. Current worktree includes forbidden areas, but preflight and separate report-generation scope artifacts show those edits predate and belong outside this feature. Commit/staging must include only the guide files and intended evidence.",
      "scope_drift": "No judgment-guide symbols or diffs appeared in metric engines, dependency/config/deploy files, routes, Playground scoring, or Scenarios. Existing dirty Playground/Scenarios work is explicitly excluded from this feature.",
      "untracked_files": "Feature files are untracked, so git diff alone is insufficient. Direct sed/tail inspection, rg searches, and focused tests covered the untracked guide registry/tests.",
      "misleading_success_output": "Prior evidence was not trusted by itself; key commands were rerun and source artifacts were inspected directly.",
      "stale_state": "Mitigated by fresh git status, fresh scoped diffs/searches, fresh focused test run, and fresh diff-check.",
      "slop_overfit": "No excessive or useless tests, deletion-only tests, tautological tests, implementation-mirroring tests, or unnecessary production extraction/parsing/normalization found in the judgment-guide scope.",
      "package_or_config_change": "git diff over package/dependency files, vite/tsconfig/eslint config, .github, and src/engine returned empty output.",
      "routes_or_deploy": "No route or deployment config paths changed for this feature.",
      "playground_or_scenarios": "Dirty Playground/Scenarios paths exist but are pre-existing unrelated work, documented in task-1-red and report-generation-metrics-fix/final-scope.txt."
    },
    "blocking_feedback": ""
  }
}
```

Checked artifact paths:
- `.omo/plans/all-metric-judgment-guides.md`
- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `.omo/evidence/all-metric-judgment-guides/task-2-verify.txt`
- `.omo/evidence/all-metric-judgment-guides/task-3-verify.txt`
- `.omo/evidence/all-metric-judgment-guides/task-4-verify.txt`
- `.omo/evidence/all-metric-judgment-guides/task-6-summary.md`
- `.omo/evidence/report-generation-metrics-fix/final-scope.txt`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`

Evidence gaps:
- Current worktree still contains unrelated report-generation dirty files. F4 is confirmed only for attribution to the judgment-guide feature; staging must exclude those unrelated paths.
- Untracked files are not represented by `git diff`; direct reads/searches/tests were used to compensate.

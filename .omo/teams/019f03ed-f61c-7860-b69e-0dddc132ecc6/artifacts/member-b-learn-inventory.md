# Member B Learn Inventory Handoff

Scope: Todo 2 only.

Changed files:
- `src/topics/report-generation/content.ts`
- `src/topics/report-generation/contentKo.ts`
- `src/topics/report-generation/content.test.ts`
- `src/components/metrics/metricTextLinks.ts`
- `src/components/metrics/metricTextLinks.test.ts`

Result:
- Added one compact bilingual Learn section, `llm-evaluator-landscape`, between CRIMSON and Clinical Acceptance.
- Covered `VERT`, `ReFINE`, and `RadOT-Eval` as related learned/LLM evaluators.
- Explicitly states they are related evaluator coverage, not live static-dashboard judges.
- Added metric text links for the three evaluator names to the real Learn section.
- Added a content guard that no live `reportComparisonRows` key is introduced for VERT/ReFINE/RadOT-Eval.

Evidence:
- RED: `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-red.txt`
- GREEN: `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/report-generation-metrics-fix/task-2-learn-inventory-green.txt`
- Build: `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/report-generation-metrics-fix/task-2-build.txt`
- Lint: `/Users/kyh/Workspace/metric_dashboard/.omo/evidence/report-generation-metrics-fix/task-2-lint.txt`

Notes:
- A's row-label lock does not require a Todo 2 change; this slice does not assert label wording.
- Build passes with only Vite's existing chunk-size warning.

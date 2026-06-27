# Task 3 - Korean Scenario Parity

Owner: C / scenario-parity

## Changed files

- `src/topics/report-generation/comparison.test.ts`
- `src/topics/report-generation/scenariosKo.ts`

## What changed

- Added an exact ID-order parity test comparing `reportGenerationScenariosKo` to `reportGenerationScenarios`.
- Added the three missing Korean report-generation scenarios:
  - `paraphrase-tolerance`
  - `label-granularity`
  - `error-category-context`
- Reused the same `state(...)` examples as the English scenarios.

## Evidence

- RED: `.omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-red.txt`
  - Failed on the expected Korean 4-vs-7 ID mismatch.
- GREEN: `.omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-green.txt`
  - `src/topics/report-generation/comparison.test.ts`
  - `src/topics/report-generation/presets.test.ts`
  - 2 files passed, 6 tests passed.
- Build: `.omo/evidence/report-generation-metrics-fix/task-3-scenario-parity-build.txt`
  - `npm run build` exited 0.

# Member A - metric row contract

## Scope

Todo 1 only: `reportComparisonRows`, proxy/style labels, and row/label tests.

## Changed files

- `src/components/metrics/reportComparisonRows.ts`
- `src/components/metrics/metricLabel.ts`
- `src/components/metrics/reportComparisonRows.test.ts`

## Contract now locked

`reportComparisonRows(...).map((row) => row.key)` is exactly:

```ts
[
  "bleu1",
  "rougeL",
  "meteor",
  "bertScore",
  "rateScore",
  "chexbertF1",
  "srrBertF1",
  "temporalF1",
  "radGraphF1",
  "greenErrors",
  "crimsonWeightedErrors",
]
```

- No top-level `lateralityF1` row.
- No numeric `clinicalAcceptance` row.
- Visible heuristic labels are explicit:
  - `CheXbert finding F1 proxy`
  - `Temporal cue F1 proxy`
  - `GREEN-style error count`
  - `CRIMSON-style weighted errors`

## Evidence

- RED: `.omo/evidence/report-generation-metrics-fix/task-1-row-contract-red.txt`
- GREEN: `.omo/evidence/report-generation-metrics-fix/task-1-row-contract-green.txt`

## Verification

Ran with bundled Node in PATH because the system Node lacks `node:util.styleText`.

- `npm run test -- src/components/metrics/reportComparisonRows.test.ts src/engine/metrics/reportGeneration.test.ts` - pass
- `npm run test -- src/topics/report-generation/comparison.test.ts src/topics/report-generation/presets.test.ts` - pass
- `npx eslint src/components/metrics/reportComparisonRows.ts src/components/metrics/metricLabel.ts src/components/metrics/reportComparisonRows.test.ts` - pass
- `npm run build` - pass

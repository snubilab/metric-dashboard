# Todo 6 Handoff - scenario-preview

Member: I / scenario-preview

Scope: Todo 6 only. Report scenario cards now expose actual cue mismatch marks; Playground, Learn content, MiniSim, and figure cleanup were handled by other todos.

## Changes

- `src/app/ScenariosView.tsx`
  - Report scenarios reuse `ReportCueBoard` so cards show reference/candidate cue mismatch chips instead of relying on prose-only snippets.
- `src/app/ScenariosView.test.tsx`
  - Added coverage for assertion/negation, laterality, and temporal cue mismatch marks.
  - Added coverage that Korean report scenarios remain seven cards.

## Evidence

- RED: `.omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-red.txt`
- GREEN: `.omo/evidence/report-generation-metrics-fix/task-6-scenario-preview-green.txt`

## Verification

- `npm run test -- src/app/ScenariosView.test.tsx src/topics/report-generation/comparison.test.ts`: pass.
- Independent verifier `019f0825-653b-79f0-accb-f2b06063f277`: PASS.

## Notes

- Existing jsdom canvas warnings appeared during scenario tests, but the target tests passed.
- Full build/lint/browser QA is owned by the final verification wave.

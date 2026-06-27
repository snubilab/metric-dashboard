# Todo 4 Handoff — cue-comparison

Member: D / cue-comparison
Thread: `019f0812-fc81-79d0-a9a4-861f5aabdcdb`
Scope: Todo 4 only. No Todo 5 Playground summary or Todo 6 Scenario preview integration.

## Changes

- Added `src/topics/report-generation/ReportCueBoard.test.tsx`.
- Updated `src/topics/report-generation/ReportCueBoard.tsx` to keep the existing extracted-cue cards and add a per-candidate cue comparison panel.
- The comparison uses existing `extractClinicalCues` output and compares:
  - findings
  - present/absent assertion cues
  - laterality
  - temporal cues
- Candidate mismatch chips use token colors (`--c-warn`, `--c-warn-text`); matching candidate chips use `--c-gt`, `--c-gt-text`.
- Updated the stale `src/topics/report-generation/Playground.test.tsx` assertions from removed Todo 1 labels to the current proxy/style labels and the new cue mismatch marker.

## Evidence

- RED: `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-red.txt`
  - Initial system `node` failed before Vitest because `node:util.styleText` was unavailable.
  - Re-ran with bundled Codex Node.
  - Confirmed the intended RED failure: `ReportCueBoard.test.tsx` could not find `Cue mismatch`.
  - The paired Playground test also exposed a stale expectation for removed `Laterality F1`.
- GREEN: `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-green.txt`
  - `npm run test -- src/topics/report-generation/ReportCueBoard.test.tsx src/topics/report-generation/Playground.test.tsx`
  - Result: 2 test files passed, 4 tests passed.
- Build: `.omo/evidence/report-generation-metrics-fix/task-4-build.txt`
  - `npm run build`
  - Result: pass.
- Lint: `.omo/evidence/report-generation-metrics-fix/task-4-lint.txt`
  - `npm run lint`
  - Result: pass.

## Verification Fix

Independent verification found the first tests were too weak because they only asserted
the generic `Cue mismatch` section label, which also appears for matching candidates.

Patch scope:

- Tests only.
- No production changes were required; the stronger assertions passed against the existing
  `ReportCueBoard` implementation.

Added concrete mismatch assertions for Candidate B:

- `assertion: missing pleural effusion: absent`
- `assertion: extra pleural effusion: present`
- `laterality: missing right`
- `laterality: extra left`
- `temporal: missing improved`
- `temporal: extra worsened`

Verification-fix evidence:

- Re-green: `.omo/evidence/report-generation-metrics-fix/task-4-cue-comparison-regreen.txt`
  - `npm run test -- src/topics/report-generation/ReportCueBoard.test.tsx src/topics/report-generation/Playground.test.tsx`
  - Result: 2 test files passed, 4 tests passed.
- Build: `.omo/evidence/report-generation-metrics-fix/task-4-verification-fix-build.txt`
  - `npm run build`
  - Result: pass.
- Lint: `.omo/evidence/report-generation-metrics-fix/task-4-verification-fix-lint.txt`
  - `npm run lint`
  - Result: pass.

All successful commands used:

```bash
PATH="/Users/kyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" <command>
```

## Skipped

- Full test suite and browser QA were not run in this slice; final wave owns those.
- Todo 5/6 surfaces were not implemented.

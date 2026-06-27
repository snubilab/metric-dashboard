# Global Code Review: All-Metric Judgment Guides

Verdict: PASS

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: `.omo/evidence/all-metric-judgment-guides/global-review-code.md`

## Scope Reviewed

Goal: code quality review for completed all-metric judgment guide work.

Requested files:
- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`

Notes:
- Worktree contains many other modified/untracked files; this review is limited to the requested files.
- `src/topics/judgmentGuides.ts`, `src/topics/judgmentGuides.test.ts`, and `src/app/LearnView.judgmentGuides.test.tsx` are untracked new files, so their full current source was treated as the diff.
- No notepad path was provided. Prior evidence files were not trusted as proof; I inspected source and ran checks directly.

## Skill-Perspective Check

Ran required perspective checks:
- Loaded `omo:remove-ai-slops` and applied its overfit/slop criteria to production code and tests.
- Loaded `omo:programming` plus the TypeScript reference and applied its strict TypeScript/testing criteria.

Result:
- No `as any`, `@ts-ignore`, `@ts-expect-error`, untyped escape hatch, new dependency, metric math change, or thesis-violating production copy was found in the reviewed diff.
- The central registry is over 250 pure LOC, but this is an explicit pure-data registry and the user constraint states it is large pure data by design.
- `src/app/LearnView.tsx` remains over 250 pure LOC. That is an existing file-size risk under the programming perspective, but the reviewed change is a small integration in the existing Learn section flow. Creating a one-off component only for this block would be a larger abstraction for this lane.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. `src/app/LearnView.judgmentGuides.test.tsx:52` verifies each guide block has the three labels, but does not assert that the actual registry guide text is rendered inside the block. Current production code does render `trustWhen`, `doubtWhen`, and `tryThis`, and `src/topics/judgmentGuides.test.ts` verifies data coverage, so this is not a blocker. A future regression that leaves labeled empty blocks could still pass the UI test.

2. `src/topics/judgmentGuides.test.ts:30` uses `import.meta.glob` plus `loadGuides()` to import a single local module. Static import would be simpler and would still fail on missing exports. This is minor test indirection, not enough to block approval.

3. `src/app/LearnView.tsx` is 414 pure LOC after the change. This is pre-existing architectural weight, but future LearnView changes should consider extracting stable responsibilities if the file keeps growing.

## Review Notes

Correctness:
- `metricJudgmentGuide(topicId, sectionId, lang)` is a pure lookup with no metric math or engine changes.
- `LearnView` passes `topic.id`, `section.id`, and active `lang` into the lookup and renders the guide inside each metric section after caveats and before complements/miniSim. Placement is coherent with the Learn flow.
- Missing guides fail closed by not rendering a block, while tests enforce complete guide coverage for available topic sections.

Scope control:
- No new dependency.
- No metric engine files touched in the scoped diff.
- The production implementation is minimal: one registry, one lookup function, and one callout render path.

Product thesis:
- Direct scan of reviewed files found no production use of forbidden absolute verdict terms (`좋음`, `나쁨`, `우수`, `열등`, `good`, `bad`, `best metric`, `worst metric`).
- The new guide language is framed as context-dependent trust/blind-spot/action guidance, not absolute metric grading.

Maintainability:
- The registry duplicates content intentionally as pure bilingual data.
- The accessor avoids parsing, normalization, or unnecessary transformation.
- The large pure-data file is acceptable under the explicit task constraint. The large LearnView file is the main residual maintainability risk.

Test relevance:
- `src/topics/judgmentGuides.test.ts` checks section parity, complete bilingual guide coverage for every available section, nonempty fields, Korean/English separation, thesis-safety terms, and report-generation no-live-evaluator wording.
- `src/app/LearnView.judgmentGuides.test.tsx` checks one rendered guide block per available Learn section in both languages.
- These tests are relevant and not deletion-only, tautological, or merely verifying requested removal. The UI test could assert one real guide value to improve regression strength.

## Verification Run

Commands run:
- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`
  - PASS: 2 files, 4 tests.
  - Note: jsdom emitted expected `HTMLCanvasElement.getContext()` not implemented messages from rendered MiniSim/canvas paths; tests still passed.
- `./node_modules/.bin/eslint src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx`
  - PASS.
- `./node_modules/.bin/tsc -b --pretty false`
  - PASS.
- Scoped scan for `as any`, ts-ignore, explicit `any`, and forbidden verdict terms.
  - PASS, except the forbidden-term regex definition inside the test file itself, which is expected.

Pure LOC measured:
- `src/topics/judgmentGuides.ts`: 628
- `src/topics/judgmentGuides.test.ts`: 108
- `src/app/LearnView.tsx`: 414
- `src/app/LearnView.judgmentGuides.test.tsx`: 51

## Blockers

None.

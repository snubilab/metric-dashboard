# F2 Code Quality Review

Verdict: APPROVE
Code quality status: CLEAR
Recommendation: APPROVE

## Scope Reviewed

- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- Plan: `.omo/plans/all-metric-judgment-guides.md`
- Prior evidence spot-checked: final test/build/lint/diff-check artifacts under `.omo/evidence/all-metric-judgment-guides/`

## Skill Perspective Check

- `omo:remove-ai-slops`: loaded and applied. No deletion-only tests, tautological tests, implementation-only assertions, unnecessary production parsing/normalization, debug leftovers, or speculative abstractions found.
- `omo:programming`: loaded with TypeScript README, type-patterns, and data-modeling references. No `as any`, `any` annotations, `@ts-ignore`, `@ts-expect-error`, non-null assertions, new untyped escape hatches, or avoidable validation layers found.
- The registry file is 628 pure LOC, but it is a pure data table explicitly required by Todo 2 as the single central registry and is marked with `// allow: SIZE_OK - central pure-data registry required by Todo 2.` This fits the programming skill's pure-data-table exception.

## Verification Run By Reviewer

- `npx eslint src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx` passed.
- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx` passed: 2 files, 4 tests. jsdom emitted existing canvas `getContext()` warnings only.
- `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed.
- `git diff --check -- src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx` passed.
- `rg` checks found no `as any`, `: any`, `@ts-ignore`, `@ts-expect-error`, `as unknown`, `console.log`, or `debugger` in the scoped files. The only non-const type assertion hit is pre-existing `seg.sectionId as string` in `src/app/LearnView.tsx:231`, outside the F2 change.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

None.

## Review Notes

- `src/topics/judgmentGuides.ts` keeps one central guide table plus one lookup function. This is the simplest implementation matching the plan; no duplicated production guide structures were found.
- `src/app/LearnView.tsx` adds only the registry lookup, bilingual labels, `topicId` plumbing, and one reused callout block after caveats. No metric math, engine, Playground, Scenario, route, package, or build config changes appear in the scoped diff.
- `src/topics/judgmentGuides.test.ts` dynamically derives available topics from `TOPICS`, checks KO/EN section parity, field completeness, bilingual copy, banned verdict words, and report-generation live-evaluator wording. These are contract tests rather than implementation mirrors.
- `src/app/LearnView.judgmentGuides.test.tsx` verifies one rendered guide block per available Learn section in KO and EN. It asserts the user-visible labels, not internal registry constants.
- Prior full evidence artifacts were spot-checked: full test artifact ends with 86 files and 700 tests passed; build artifact ends with Vite success and only the existing chunk-size warning; lint artifact has no diagnostics; diff-check artifact has no diagnostics.

## Blockers

None.

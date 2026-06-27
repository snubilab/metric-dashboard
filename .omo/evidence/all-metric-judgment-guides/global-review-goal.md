# Global Review Lane 1 - Goal & Constraint Verification

recommendation: PASS
confidence: HIGH
blockers: None

originalIntent: Add compact bilingual judgment guides to every available metric Learn section across classification, regression, segmentation, detection, and report-generation, so graduate students can understand when each metric is informative, where it is blind, and what to check next.

desiredOutcome: All available Learn metric sections render one Korean or English judgment-guide block with exactly three fields: informative/trust context, blind spot, and next check. The feature stays Learn-only, preserves the no-good/bad metric thesis, does not alter metric engines or scoring behavior, does not introduce fake numeric/LLM evaluation, and keeps unrelated dirty report-generation work outside this feature.

userOutcomeReview: PASS. The shipped judgment-guide surface is visible in Learn, uses the existing Learn section callout style, and is backed by dynamic tests over `TOPICS.filter((topic) => topic.status === "available")`. Fresh focused verification passed, manual screenshot artifacts show the expected KO/EN labels on classification and report-generation Learn pages, and forbidden-scope checks found no engine/dependency/deploy/config changes attributable to this feature. Current unrelated report-generation/Scenarios dirty files remain a staging risk, but evidence shows they predate this judgment-guide work and are not part of the guide implementation.

## Criteria Consulted

- `omo:remove-ai-slops` loaded and applied directly: checked for deletion-only/requested-removal tests, tautological tests, implementation-mirroring tests, needless abstraction, unnecessary parsing/normalization, dead/debug code, and oversized-file misuse.
- `omo:programming` loaded with TypeScript guidance and code-smell criteria: checked strict typing posture, no untyped escape hatches in new guide code, no speculative abstractions, and the 250 LOC rule. `src/topics/judgmentGuides.ts` exceeds 250 LOC but is a pure data registry explicitly required by the plan and marked with a SIZE_OK pure-data justification.

## Fresh Checks

- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx`: PASS, 2 files / 4 tests passed. Existing jsdom canvas warnings only.
- `npm run lint`: PASS, `eslint .` completed with no diagnostics.
- `git diff --check`: PASS, no diagnostics.
- Forbidden wording search over `src/topics/judgmentGuides.ts` and `src/app/LearnView.tsx`: PASS, no matches for absolute verdict terms or live evaluator/fake score terms.
- Manual QA artifacts: all four PNGs are non-empty 1440x1000 screenshots; I directly opened KO classification, KO report-generation, EN classification, and EN report-generation and confirmed visible guide labels.
- Forbidden path diff check: no diff under `src/engine`, dependency/lock/package files, Vite/TS/ESLint config, or `.github`.

## Subrequirements

| subrequirement | status | evidence |
|---|---|---|
| Cover classification, regression, segmentation, detection, and report-generation. | ACHIEVED | `src/topics/judgmentGuides.ts` defines registry keys for all five topic ids at lines 15, 113, 199, 333, and 467. |
| Cover every available `learn.sections` metric section in Korean and English. | ACHIEVED | `src/topics/judgmentGuides.test.ts` derives `availableTopics` from `TOPICS` and checks every section/lang at lines 32 and 60-81; fresh focused test passed. |
| Keep KO/EN Learn section id parity. | ACHIEVED | `src/topics/judgmentGuides.test.ts` checks `learnKo.sections` equals `learn.sections` at lines 39-56. |
| Exactly three guide fields: `trustWhen`, `doubtWhen`, `tryThis`. | ACHIEVED | `MetricJudgmentGuide` has only those fields in `src/topics/judgmentGuides.ts`; tests use `GUIDE_FIELDS` and require nonempty values. |
| Render guides in Learn after caveats and before complements/MiniSim. | ACHIEVED | `src/app/LearnView.tsx` renders `[data-testid="metric-judgment-guide"]` after the caveats `LabeledList` and before `section.complements`/`section.miniSim`. |
| Use existing style patterns. | ACHIEVED | `LearnView` reuses existing `calloutStyle`, `calloutLabelStyle`, and `calloutTextStyle`; no new CSS/dependency route was added. |
| Tests required. | ACHIEVED | Fresh focused tests passed; final evidence records `npm run test` with 86 files / 700 tests passed. |
| Manual QA evidence required. | ACHIEVED | `task-5-browser.md` plus four PNG screenshots document KO default and EN toggled Learn surfaces for classification and report-generation. |
| Dirty prior report-generation work remains excluded from this feature. | ACHIEVED with staging caution | `task-1-red.txt` and `.omo/evidence/report-generation-metrics-fix/final-scope.txt` show those dirty paths predated this feature. Current status still contains them, so final staging must remain scoped. |

## Constraint Check

| constraint | status | evidence |
|---|---|---|
| Preserve no-good/bad metric thesis. | ACHIEVED | Registry tests ban `좋음/나쁨/우수/열등/good/bad/best metric/worst metric`; fresh `rg` over source found no matches. |
| No metric engine changes. | ACHIEVED | Fresh forbidden path diff check returned no paths under `src/engine`. |
| No fake numeric scores. | ACHIEVED | Tests ban `numeric score` / `overall score`; source inspection found only textual guidance and no score computation. |
| No live LLM/API/model. | ACHIEVED | Tests ban `live LLM judge`, `API call`, and `model download`; source adds no API/model/runtime path. |
| No new routes/dependencies/deploy config. | ACHIEVED | No diff in package/lock files, Vite/TS/ESLint config, or `.github`; `LearnView` is the only existing app surface touched by this feature. |
| No Playground/Scenarios changes for this feature. | ACHIEVED with staging caution | Current Playground/Scenarios dirty paths are documented prior report-generation work, not judgment-guide symbols or guide diff. |
| Render in Learn only. | ACHIEVED | Guide symbols appear only in `src/topics/judgmentGuides*` and `src/app/LearnView*`; UI test renders `LearnView` only. |
| Tests and manual QA evidence required. | ACHIEVED | Fresh focused test/lint pass plus inspected final test/build/lint/diff artifacts and manual screenshots. |

## Slop And Overfit Pass

- Production code is minimal: one central registry plus one lookup function, and one Learn-only callout render. No new dependency, route, parser, scoring path, Playground/Scenario hook, or evaluator abstraction.
- Tests are not deletion-only or requested-removal-only. They assert actual behavior: registry coverage for live available topics, bilingual content, thesis-safe text, and one visible guide block per Learn section/lang.
- UI test is not a pure implementation mirror: it asserts user-visible labels and DOM blocks in rendered Learn sections.
- The only large file is the pure data registry required by the plan; this fits the documented pure-data exception.
- F2 and F4 reports explicitly include the same remove-ai-slops/programming perspective, and direct review found no unsupported slop blocker.

## Checked Artifact Paths

- `.omo/plans/all-metric-judgment-guides.md`
- `src/topics/judgmentGuides.ts`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.tsx`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `src/app/topicRegistry.ts`
- `.omo/evidence/all-metric-judgment-guides/F1-plan-compliance.md`
- `.omo/evidence/all-metric-judgment-guides/F2-code-quality.md`
- `.omo/evidence/all-metric-judgment-guides/F3-real-manual-qa.md`
- `.omo/evidence/all-metric-judgment-guides/F4-scope-fidelity.md`
- `.omo/evidence/all-metric-judgment-guides/final-test.txt`
- `.omo/evidence/all-metric-judgment-guides/final-build.txt`
- `.omo/evidence/all-metric-judgment-guides/final-lint.txt`
- `.omo/evidence/all-metric-judgment-guides/final-diff-check.txt`
- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `.omo/evidence/all-metric-judgment-guides/task-5-browser.md`
- `.omo/evidence/all-metric-judgment-guides/task-5-ko-classification-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-ko-report-generation-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-en-classification-learn.png`
- `.omo/evidence/all-metric-judgment-guides/task-5-en-report-generation-learn.png`
- `.omo/evidence/report-generation-metrics-fix/final-scope.txt`

## Exact Evidence Gaps

- No blocking evidence gaps.
- Nonblocking: `.omo/evidence/all-metric-judgment-guides/task-1-green.txt` is mentioned in the plan's target evidence list but not required by the Todo 1 acceptance criteria; `task-1-red.txt` exists and contains the expected red failure.
- Nonblocking: full build was inspected from `final-build.txt` rather than rerun in this read-only gate because `npm run build` writes generated `dist/`; the artifact shows `tsc -b && vite build` succeeded.
- Nonblocking: unrelated report-generation/Scenarios dirty work still exists in the worktree. It is documented as pre-existing and excluded by attribution, but final staging/commit must include only the judgment-guide files/evidence.

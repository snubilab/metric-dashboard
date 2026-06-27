# Todo 1 Gate Review

recommendation: APPROVE

blockers: none

originalIntent: Verify Todo 1 of `.omo/plans/all-metric-judgment-guides.md`: preflight the dirty worktree and add failing RED coverage/UI tests before product code for metric judgment guides.

desiredOutcome: The target tests exist, derive coverage dynamically from available topics, fail for missing guide registry/rendering rather than syntax/setup, and preserve a bounded RED evidence trail.

userOutcomeReview: Confirmed for the Todo 1 RED checkbox. The test suite now fails because `src/topics/judgmentGuides.ts` is absent and `LearnView` renders no `metric-judgment-guide` block for `classification/confusion-matrix/ko`. This is the expected missing-registry/missing-renderer failure path, not a syntax, setup, or runtime infrastructure failure.

checked artifact paths:
- `.omo/plans/all-metric-judgment-guides.md`
- `src/topics/judgmentGuides.test.ts`
- `src/app/LearnView.judgmentGuides.test.tsx`
- `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- `.omo/evidence/all-metric-judgment-guides/task-1-verify.txt`

direct evidence:
- `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx` exited 1 in about 1.2s.
- Failure 1: `Expected src/topics/judgmentGuides.ts to export metricJudgmentGuide(topicId, sectionId, lang).`
- Failure 2: `classification/confusion-matrix/ko should render exactly one judgment guide: expected ... length of 1 but got 0`.
- `git diff --check -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx .omo/evidence/all-metric-judgment-guides/task-1-red.txt` exited 0.
- `git ls-files --others --exclude-standard -- ...` shows the two tests and two evidence notes are untracked.
- Direct whitespace probe over the two tests and evidence notes found no trailing whitespace or tab characters.

Todo 1 criteria review:
- Available topics are derived from `TOPICS.filter((topic) => topic.status === "available")`.
- EN/KO section id parity is compared for every available topic.
- Both languages are checked via `["ko", "en"]`, and guide fields require `trustWhen`, `doubtWhen`, and `tryThis`.
- The UI red path renders every available topic/language and requires one guide block per section with the KO/EN labels.
- Product files were not edited by this verifier.

remove-ai-slops / programming pass:
- No excessive or useless tests found: one registry coverage test file and one UI rendering test file map directly to Todo 1 acceptance criteria.
- No deletion-only, tautological, or request-removal-only tests found.
- The registry test is not implementation-mirroring beyond the planned public export name; it checks observable coverage over `TOPICS`.
- The UI test uses a `data-testid` selector to count a guide block inside each existing Learn section, then asserts user-visible labels. This is acceptable for the planned renderer surface.
- No unnecessary production extraction, parsing, normalization, dependencies, or abstractions were introduced in Todo 1.

adversarial classes:
- dirty_worktree: Present. Many unrelated dirty files exist, but the scoped Todo 1 files are untracked and limited to the two test files plus evidence notes.
- stale_state: Not observed. Plan Todo 1 remains the reviewed target, `src/topics/judgmentGuides.ts` is absent, and the RED failure is current.
- misleading_success_output: Partially applicable. `git diff --check` exits 0 but does not inspect untracked files; this is a non-blocking evidence gap because direct whitespace inspection and Vitest parsing covered the new files.
- flaky_tests: Not observed. The rerun reproduced the same two failures quickly.
- hung_or_long_commands: Not observed. No dev server or background process was started; target test command completed quickly.
- other adversarial classes: Not applicable; Todo 1 is test-only RED coverage, with no browser/manual QA, deployment, network, or product-code behavior to validate yet.

exact evidence gaps:
- No separate worker code-review report or manual QA matrix was provided for Todo 1. For this RED-only test-first checkbox, direct gate review covered the required slop/overfit criteria and manual QA is not part of Todo 1 acceptance.
- The scoped `git diff --check` command is clean but weak because the new files are untracked. Direct whitespace inspection mitigates this gap for this review.

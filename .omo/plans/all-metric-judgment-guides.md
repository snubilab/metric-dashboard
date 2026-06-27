# all-metric-judgment-guides - Work Plan

## TL;DR (For humans)
**What you'll get:** Every available metric page gets a compact bilingual "when this is informative / where it is blind / what to try next" learning guide. It covers classification, regression, segmentation, detection, and LLM report generation, including the metrics students actually see in the Learn tabs.

**Why this approach:** Use one central guide table and render it once in the shared Learn layout. That keeps all tabs visually consistent and avoids editing every topic content file just to add the same teaching surface.

**What it will NOT do:** It will not add new metric math, fake scores, live LLM judging, Playground rows, Scenario redesigns, routes, dependencies, or API calls.

**Effort:** Short
**Risk:** Medium - the main risk is copy quality across 50 metric sections, not architecture.
**Decisions to sanity-check:** The guide wording must avoid "good/bad" metric verdicts and should read like graduate-level experiment judgment: informative when, blind spot when, check next.

Your next move: start work from this plan, or run the optional high-accuracy Momus review first. Full execution detail follows below.

---

> TL;DR (machine): Short / Medium risk; add bilingual central judgment guides for all 50 available Learn metric sections, render them in LearnView, and verify with dynamic coverage tests plus manual QA.

## Scope
### Must have
- Cover every available topic in `src/app/topicRegistry.ts`: classification, regression, segmentation, detection, and report-generation.
- Cover every rendered `learn.sections` metric section for those topics in both Korean and English. Expected current inventory:
  - Classification: `confusion-matrix`, `sensitivity-specificity`, `ppv-npv`, `accuracy-balanced-accuracy`, `precision-recall-f1-fbeta`, `roc-auroc`, `pr-auprc-ap`, `fixed-operating-points`.
  - Regression: `mae`, `mse`, `rmse`, `r2`, `bias`, `pearson`, `spearman`.
  - Segmentation: `dice`, `iou`, `sensitivity`, `precision`, `hd`, `hd95`, `assd`, `nsd`, `volume`, `lesionwise`, `cldice`.
  - Detection: `matching`, `precision`, `recall`, `f1`, `ap`, `map`, `ap50`, `ap75`, `apRange`, `froc`, `sensAtFp`.
  - Report-generation: `bleu`, `rouge-l`, `meteor`, `bertscore`, `ratescore`, `temporal-f1`, `chexbert-f1`, `srr-bert-f1`, `graph-f1`, `green`, `crimson`, `llm-evaluator-landscape`, `clinical-acceptance`.
- Add one central registry keyed by `topicId -> sectionId -> lang`, with exactly three fields per guide: `trustWhen`, `doubtWhen`, `tryThis`.
- Render the guide in every `LearnView` metric section after caveats and before complements / MiniSim.
- Use copy framing that preserves the dashboard thesis: "informative when", "blind spot when", "check next". The UI may label this as trust/doubt/try, but prose must not imply a metric is universally good or bad.
- Add tests that fail when a new available metric section lacks Korean or English guide copy.
- Add UI tests proving every available topic renders one guide block per section in both languages.
- Capture manual QA evidence for Korean default and English toggled Learn surfaces for classification and report-generation.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not edit metric engines, comparison row math, Playground scoring, Scenarios, figures, routes, package dependencies, build config, or deployment config.
- Do not add live LLM judges, API calls, model downloads, hidden evaluator scores, fake numeric scores, or "overall" grades.
- Do not add guide copy for coming-soon topics until those topics have real Learn sections.
- Do not use verdict words banned by the product thesis: `좋음`, `나쁨`, `우수`, `열등`, `good`, `bad`, `best metric`, `worst metric`.
- Do not render the guide as a new top-level tab or separate card grid; it belongs inside existing Learn metric sections.
- Do not revert or fold unrelated dirty worktree changes.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD with Vitest + React Testing Library, then browser manual QA.
- Target RED evidence:
  - `.omo/evidence/all-metric-judgment-guides/task-1-red.txt`
- Target GREEN evidence:
  - `.omo/evidence/all-metric-judgment-guides/task-1-green.txt`
  - `.omo/evidence/all-metric-judgment-guides/task-2-green.txt`
  - `.omo/evidence/all-metric-judgment-guides/task-3-green.txt`
  - `.omo/evidence/all-metric-judgment-guides/task-4-green.txt`
  - `.omo/evidence/all-metric-judgment-guides/task-5-browser.md`
  - `.omo/evidence/all-metric-judgment-guides/final-test.txt`
  - `.omo/evidence/all-metric-judgment-guides/final-build.txt`
  - `.omo/evidence/all-metric-judgment-guides/final-lint.txt`
- If the system Node runtime fails Vitest/Vite with `node:util.styleText`, use the Codex bundled Node path discovered by `codex_app.load_workspace_dependencies`; record that in the evidence file.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: preflight + tests + registry + renderer. Todos 1-4 can be split across workers only if they keep write scopes disjoint; otherwise run sequentially.
- Wave 2: browser QA + integration verification. Todos 5-6 run after Wave 1 is green.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 4 | none |
| 2 | 1 | 3, 4, 5, 6 | none |
| 3 | 1, 2 | 5, 6 | 4 after registry API is stable |
| 4 | 1, 2 | 5, 6 | 3 after registry API is stable |
| 5 | 2, 3, 4 | 6 | none |
| 6 | 2, 3, 4, 5 | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Preflight dirty worktree and add failing coverage/UI tests
  What to do / Must NOT do: Create `.omo/evidence/all-metric-judgment-guides/`; record `git status --short`; add the smallest failing tests before product code. Add `src/topics/judgmentGuides.test.ts` and `src/app/LearnView.judgmentGuides.test.tsx` or equivalent focused files. Do not edit product code in this todo except test-only imports if needed.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3, 4
  References (executor has NO interview context - be exhaustive): `docs/DESIGN.md:10-24`, `src/app/topicRegistry.ts:31-39`, `src/types/topic.ts:13-25`, `src/types/topic.ts:72-83`, `vitest.config.ts:3-8`, `src/app/LearnView.tsx:275-323`, `src/app/LearnView.tsx:386-418`, existing tests at `src/topics/classification/content.test.ts:1-38`, `src/topics/report-generation/content.test.ts:1-85`.
  Acceptance criteria (agent-executable): `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx` fails for missing guide registry/rendering, not for syntax/setup. Test assertions must derive available topics from `TOPICS.filter((topic) => topic.status === "available")`, compare `learn.sections` and `learnKo.sections` ID parity for every available topic, and require all three fields in KO/EN.
  QA scenarios (name the exact tool + invocation): failure: `npm run test -- src/topics/judgmentGuides.test.ts src/app/LearnView.judgmentGuides.test.tsx | tee .omo/evidence/all-metric-judgment-guides/task-1-red.txt`; happy: test files compile and fail for the expected absence of registry/rendering, evidence in the same file.
  Commit: N | Include with final feature commit.

- [x] 2. Add the central bilingual judgment guide registry for all available metric sections
  What to do / Must NOT do: Add `src/topics/judgmentGuides.ts` with typed exports: `MetricJudgmentGuide`, `LocalizedMetricJudgmentGuide`, `METRIC_JUDGMENT_GUIDES`, and `metricJudgmentGuide(topicId, sectionId, lang)`. Fill every current available topic section with KO/EN `trustWhen`, `doubtWhen`, `tryThis`. Use short, concrete experiment language. Do not add fields to every `content.ts` / `contentKo.ts`; do not change metric math.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3, 4, 5, 6
  References (executor has NO interview context - be exhaustive): topic source inventory from `src/app/topicRegistry.ts:31-39`; `MetricSection` shape at `src/types/topic.ts:13-25`; `Topic` language shape at `src/types/topic.ts:72-83`; product thesis at `docs/DESIGN.md:15-24`; existing report-generation non-live evaluator guard at `src/topics/report-generation/content.test.ts:54-73`.
  Acceptance criteria (agent-executable): `npm run test -- src/topics/judgmentGuides.test.ts` passes. The test must assert: every available `topic.learn.sections` ID has KO/EN guide copy; KO/EN section IDs match; each value has `trim().length > 0`; KO guide contains Hangul; KO and EN guide strings are not identical; guide JSON does not match banned verdict terms; report-generation guide JSON does not match `live LLM judge|API call|model download|numeric score|overall score`.
  QA scenarios (name the exact tool + invocation): happy: `npm run test -- src/topics/judgmentGuides.test.ts | tee .omo/evidence/all-metric-judgment-guides/task-2-green.txt`; failure: temporarily remove or misspell one registry key locally, confirm the same command points at the missing `topicId/sectionId/lang`, then restore before continuing and note the check in the evidence file.
  Commit: N | Include with final feature commit.

- [x] 3. Render the guide consistently inside `LearnView`
  What to do / Must NOT do: Import `metricJudgmentGuide` in `src/app/LearnView.tsx`. Add bilingual labels to `L`: KO `정보가 되는 상황`, `놓치는 부분`, `직접 확인할 것`; EN `Informative when`, `Blind spot when`, `Try this`. Pass `topic.id` into `Section`, resolve the guide by `topicId`, `section.id`, and `lang`, and render it after caveats and before complements / MiniSim. Reuse existing token-based style patterns such as `calloutStyle`, `calloutLabelStyle`, `calloutTextStyle`; do not add hard-coded colors or a separate tab.
  Parallelization: Wave 1 | Blocked by: 1, 2 | Blocks: 5, 6
  References (executor has NO interview context - be exhaustive): section render location at `src/app/LearnView.tsx:275-323`; language selection at `src/app/LearnView.tsx:386-389`; section map at `src/app/LearnView.tsx:405-410`; existing callout styles at `src/app/LearnView.tsx:159-184`; Learn structure contract at `docs/DESIGN.md:37-44`; token rules at `docs/DESIGN.md:79-90`.
  Acceptance criteria (agent-executable): `npm run test -- src/app/LearnView.judgmentGuides.test.tsx src/topics/judgmentGuides.test.ts` passes. The UI test must render every available topic in `ko` and `en` and assert each section contains exactly one guide block with all three labels for that language.
  QA scenarios (name the exact tool + invocation): happy: `npm run test -- src/app/LearnView.judgmentGuides.test.tsx src/topics/judgmentGuides.test.ts | tee .omo/evidence/all-metric-judgment-guides/task-3-green.txt`; failure: temporarily change one label in `L`, confirm the UI test fails, restore before continuing and note it in evidence.
  Commit: N | Include with final feature commit.

- [x] 4. Tighten copy/thesis guard tests around the new guide surface
  What to do / Must NOT do: Extend the registry/content tests only as needed so the new guide copy cannot reintroduce absolute metric verdicts or report-generation live-evaluator implications. Do not weaken existing thesis-guard tests. Do not add a generic "grade" or "winner" column.
  Parallelization: Wave 1 | Blocked by: 1, 2 | Blocks: 5, 6
  References (executor has NO interview context - be exhaustive): thesis guard rule at `docs/DESIGN.md:15-24`; existing classification content-test style at `src/topics/classification/content.test.ts:16-38`; report-generation live-evaluator guard at `src/topics/report-generation/content.test.ts:54-73`; current package test command at `package.json:6-12`.
  Acceptance criteria (agent-executable): `npm run test -- src/topics/judgmentGuides.test.ts src/topics/report-generation/content.test.ts src/topics/classification/content.test.ts` passes and includes assertions covering the new registry JSON.
  QA scenarios (name the exact tool + invocation): happy: `npm run test -- src/topics/judgmentGuides.test.ts src/topics/report-generation/content.test.ts src/topics/classification/content.test.ts | tee .omo/evidence/all-metric-judgment-guides/task-4-green.txt`; failure: locally insert one banned term into one guide, confirm failure, restore before continuing and note it in evidence.
  Commit: N | Include with final feature commit.

- [x] 5. Drive the feature through the real Learn surface in Korean and English
  What to do / Must NOT do: Start the dev server, open the dashboard, verify default Korean Learn pages and English toggled Learn pages for classification and report-generation. Capture screenshots or a concise browser evidence markdown. Do not use this todo to change layout unless the guide visibly overlaps, disappears, or violates the unified tab design.
  Parallelization: Wave 2 | Blocked by: 2, 3, 4 | Blocks: 6
  References (executor has NO interview context - be exhaustive): `package.json:6-12` for dev command; LearnView render path at `src/app/LearnView.tsx:405-415`; default language behavior from existing app context; design unification rule at `docs/DESIGN.md:32-44`.
  Acceptance criteria (agent-executable): Browser evidence proves the classification and report-generation Learn tabs show all three guide labels in KO default and EN after language toggle. Evidence must include the URL, viewport, selected topic, selected tab, language, and visible labels.
  QA scenarios (name the exact tool + invocation): happy: `npm run dev -- --host 127.0.0.1` plus Playwright or app browser screenshots saved under `.omo/evidence/all-metric-judgment-guides/`; failure: navigate to a topic with a section expected by the registry and confirm missing labels would be visible in the screenshot/evidence. Write summary to `.omo/evidence/all-metric-judgment-guides/task-5-browser.md`.
  Commit: N | Include with final feature commit.

- [x] 6. Integration verification, lint, and final scoped diff check
  What to do / Must NOT do: Run the full verification commands and inspect the scoped diff. Allowed product files should be limited to the registry, LearnView, and tests needed for this feature. Do not revert unrelated dirty worktree files.
  Parallelization: Wave 2 | Blocked by: 2, 3, 4, 5 | Blocks: final verification
  References (executor has NO interview context - be exhaustive): scripts at `package.json:6-12`; dirty-worktree warning from preflight `git status --short`; scope guardrails in this plan.
  Acceptance criteria (agent-executable): `npm run test`, `npm run build`, and `npm run lint` exit 0 or any pre-existing failure is isolated with exact command/output and unrelated path. `git diff --check` passes for changed files. `git diff -- src/topics/judgmentGuides.ts src/topics/judgmentGuides.test.ts src/app/LearnView.tsx src/app/LearnView.judgmentGuides.test.tsx` shows no unrelated UI redesign or metric math change.
  QA scenarios (name the exact tool + invocation): happy: `npm run test | tee .omo/evidence/all-metric-judgment-guides/final-test.txt`, `npm run build | tee .omo/evidence/all-metric-judgment-guides/final-build.txt`, `npm run lint | tee .omo/evidence/all-metric-judgment-guides/final-lint.txt`, `git diff --check | tee .omo/evidence/all-metric-judgment-guides/final-diff-check.txt`; failure: if any command fails, record exact failure and whether it is introduced by this plan's files.
  Commit: Y | `feat(learn): add metric judgment guides`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit: reviewer checks every available topic section has KO/EN guides, every todo evidence path exists, and no Must-NOT item was violated.
- [x] F2. Code quality review: reviewer checks type safety, no `as any`, no unused abstractions, no duplicated guide structures, and no unnecessary files.
- [x] F3. Real manual QA: reviewer opens the running app and confirms KO/EN guide blocks on classification and report-generation Learn surfaces with screenshots.
- [x] F4. Scope fidelity: reviewer checks the diff did not touch metric engines, Playground scoring, Scenarios, package dependencies, routes, or deployment config.

## Commit strategy
- One final commit after all verification passes: `feat(learn): add metric judgment guides`.
- Stage only files created or intentionally changed for this feature.
- Expected changed files:
  - `src/topics/judgmentGuides.ts`
  - `src/topics/judgmentGuides.test.ts`
  - `src/app/LearnView.tsx`
  - `src/app/LearnView.judgmentGuides.test.tsx`
  - optional existing tests only if needed to guard the new guide registry.
- Do not stage `.omo/evidence/**` unless project convention explicitly wants evidence committed.

## Success criteria
- Every available `learn.sections` metric section across classification, regression, segmentation, detection, and report-generation has Korean and English guide copy.
- The guide renders in the shared Learn section layout with consistent labels and token-based styling.
- Copy teaches conditional judgment, not absolute metric quality.
- Tests dynamically fail on missing guide coverage, language mismatch, forbidden verdict terms, or accidental live-LLM/numeric-evaluator wording.
- Browser QA shows the feature working in Korean and English on representative Learn tabs without scrolling to a separate page or changing Playground/Scenarios.
- Full test, build, lint, and diff checks pass or pre-existing unrelated failures are documented precisely.

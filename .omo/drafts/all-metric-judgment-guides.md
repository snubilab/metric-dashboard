---
slug: all-metric-judgment-guides
status: plan-written
intent: clear
pending-action: ask user whether to start work or run high-accuracy Momus review
approach: central topic/section judgment-guide registry rendered by LearnView
---

# Draft: all-metric-judgment-guides

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| registry | One central `topicId + sectionId + lang` registry covers every available Learn metric section. | active | `src/app/topicRegistry.ts`, `src/topics/*/content.ts` |
| learn-render | `LearnView` renders the guide inside every metric section without editing all topic content files. | active | `src/app/LearnView.tsx` |
| coverage-tests | Tests fail if any available topic section lacks KO/EN trust/doubt/try guide text. | active | `src/topics/*/content.test.ts`, new registry test |
| surface-qa | Browser QA proves at least classification and report-generation Learn tabs display the guide blocks. | active | planned `.omo/evidence/all-metric-judgment-guides/` |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
| guide copy shape | Use one short string each for `trustWhen`, `doubtWhen`, `tryThis`, not arrays. | Graduate students need fast decision criteria; this avoids bloating each section. | yes |
| data placement | Use a central `src/topics/judgmentGuides.ts` registry instead of adding fields to all content files. | Covers all topics with fewer edits and one coverage test. | yes |
| scope | Cover available topics only: classification, regression, segmentation, detection, report-generation. | Coming-soon topics have no Learn metric sections to render. | yes |
| old docs plan | Supersede the earlier `docs/superpowers/plans/2026-06-27-all-metric-judgment-guides.md` draft. | `omo:ulw-plan` requires plan artifacts under `.omo/`. | yes |

## Findings (cited - path:lines)
- `src/app/topicRegistry.ts` registers five available topics with Learn content: classification, regression, segmentation, detection, and report-generation; remaining topics are coming-soon stubs.
- `src/app/LearnView.tsx` renders every metric section from `learn.sections` through a single `Section` component, so one renderer change can cover all tabs.
- Current available metric section inventory from `src/topics/*/content.ts`: classification 8, regression 7, segmentation 11, detection 11, report-generation 13; total 50.
- Existing content tests already lock section IDs for classification, segmentation, detection, and report-generation; regression has no content test yet, so registry coverage should use `TOPICS` rather than per-topic constants.
- Existing report-generation work already solved fake metric-score issues; this plan must add prose guidance only, no new metric math.

## Decisions (with rationale)
- Plan type: CLEAR. The outcome is explicit: include classification and every other available metric tab, not just report generation.
- Tier: LIGHT. The eventual implementation is a narrow Learn-render/content-data addition inside existing layers; no engine, route, DB, auth, dependency, or API change.
- Use central registry. This is the smallest faithful implementation and avoids churn across 10 content files.
- Use TDD for registry coverage and UI rendering. The first failing test should prove missing guide coverage before product code changes.
- Metis adjustment accepted: guide copy must frame metrics as "informative when / blind spot when / check next", not "good/bad"; the registry test must ban absolute verdict terms and live-LLM/numeric-evaluator implications.
- Metis adjustment accepted: UI rendering must be tested across every available topic and both languages, not only by registry coverage.
- Metis adjustment accepted: manual QA must include KO default and EN toggled Learn surfaces for classification and report-generation.

## Scope IN
- Add KO/EN trust/doubt/try guidance for all 50 available metric sections.
- Render the guide in Learn sections for all available topics.
- Add tests that dynamically fail on any available section without guide text.
- Add browser QA evidence for at least classification and report-generation Learn surfaces.

## Scope OUT (Must NOT have)
- No implementation before plan approval.
- No new metric engine logic.
- No new route, dependency, API call, model download, or live LLM judge.
- No fake numeric scores.
- No guide coverage for coming-soon topics until those topics have real Learn sections.
- No broad redesign of cards, nav, Playground, or Scenarios.

## Open questions
- None for planning. User approved the central-registry approach.

## Approval gate
status: approved and written
pending action: user chooses execution now or optional high-accuracy Momus review first
approval received: "승인"

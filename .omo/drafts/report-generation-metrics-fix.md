---
slug: report-generation-metrics-fix
status: plan-written
intent: clear
pending-action: hand off to execution only after user explicitly starts work
approach: Correct report-generation metric coverage and teaching surfaces in small dependent waves: inventory/row truth first, scenario parity and visual cue legibility second, Playground first-viewport result visibility third, Learn figures/miniSims fourth, then verification and ponytail cleanup.
---

# Draft: report-generation-metrics-fix

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 metric inventory and row truth | PPT-backed metric inventory is represented honestly across Learn and Playground rows, with proxy labels explicit and Clinical Acceptance no longer silently missing. | active | /tmp/clinical_report_metrics_audit.md; /Users/kyh/Downloads/metric-dashboard-report-audit-2026-06-27/layout-audit.json |
| C2 scenario parity and clinical visuals | Korean default scenarios match English coverage and report scenario cards make cue mismatches visible without prose-only inference. | active | /Users/kyh/Downloads/metric-dashboard-report-audit-2026-06-27/03-scenarios-desktop.png |
| C3 Playground result visibility | Desktop and mobile Playground show a compact result summary at the user's work position; mobile no longer hides new results above the active editor. | active | /Users/kyh/Downloads/metric-dashboard-report-audit-2026-06-27/02-playground-desktop.png; /Users/kyh/Downloads/metric-dashboard-report-audit-2026-06-27/04-playground-mobile-after-fill.png |
| C4 Learn experimentability | Learn figures/miniSims show concrete score movement, not only static glossary descriptions. | active | src/topics/report-generation/content.ts; src/components/figures/ReportGenerationFigures.tsx |
| C5 verification and cleanup | Tests, build, lint, layout audit, browser screenshots, and small dead-code cleanup keep the fix shippable without adding new abstraction. | active | package.json; docs/DESIGN.md |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
| PPT landscape-only metrics | Add VERT, ReFINE, and RadOT-Eval as a short "related LLM evaluators" Learn subsection/section cluster, not as live Playground rows. | They appear in PPT slide 10 as landscape items, while the recommendation slide emphasizes GREEN/CRIMSON for implementation. This keeps coverage honest without fake live metrics. | yes |
| Clinical Acceptance in Playground | Show Clinical Acceptance as a non-computed workflow endpoint card/row summary, not a numeric fake score. | It is an acceptability/edit-time/reader-study endpoint, not derivable from the report text in the static app. | yes |
| Laterality F1 | Demote from top-level metric row to cue/detail summary unless used as supporting evidence under RadGraph/SRR-BERT/Temporal explanation. | It is clinically useful but not one of the PPT metric names. | yes |
| Proxy wording | Every heuristic row that is not a real implementation keeps "proxy" or "style" in the visible label. | Prevents overclaiming benchmark-grade implementations. | yes |
| Dependencies | Add no new dependencies. Use existing React/Vitest/Playwright availability and existing components. | Ponytail mode: shortest working diff; current deps cover it. | yes |
| Scenario canonical count | Treat the 7 English report-generation scenarios as canonical; expand Korean to match rather than rolling English back to 4. | Audit found Korean default hides coverage, and current English already covers the missing metric-teaching cases. | yes |
| Cue comparison component | Prefer one small shared report cue comparison surface reused by Playground summary and Scenarios, rather than separate one-off mismatch renderers. | Keeps the fix smaller than two divergent visual systems while solving both surfaces. | yes |

## Findings (cited - path:lines)
- PPT extracted metrics include BLEU/ROUGE/METEOR, BERTScore/RaTEscore, Temporal F1, CheXbert F1, SRR-BERT F1, RadGraph F1, GREEN/CRIMSON, Clinical Acceptance, and landscape mentions VERT/ReFINE/RadOT-Eval in `/tmp/clinical_report_metrics_audit.md:49`, `/tmp/clinical_report_metrics_audit.md:225`, `/tmp/clinical_report_metrics_audit.md:265`, `/tmp/clinical_report_metrics_audit.md:371`, `/tmp/clinical_report_metrics_audit.md:419`, `/tmp/clinical_report_metrics_audit.md:518`.
- Learn currently has 12 report sections ending at Clinical Acceptance in `src/topics/report-generation/content.ts:6` and `src/topics/report-generation/content.ts:223`, but no VERT/ReFINE/RadOT-Eval coverage.
- Playground rows omit Clinical Acceptance and include Laterality F1 as a top-level row in `src/components/metrics/reportComparisonRows.ts:10` and `src/components/metrics/reportComparisonRows.ts:67`.
- GREEN/CRIMSON row labels are not visibly marked as proxy/style in `src/components/metrics/reportComparisonRows.ts:82`, while engine implementations are deterministic cue counts in `src/engine/metrics/reportGeneration.ts:310` and `src/engine/metrics/reportGeneration.ts:318`.
- CheXbert proxy uses finding mention F1, not assertion/presence agreement, via `src/engine/metrics/reportGeneration.ts:333`.
- Korean scenarios include 4 examples, while English includes 7, in `src/topics/report-generation/scenarios.ts:32` and `src/topics/report-generation/scenariosKo.ts:29`.
- Report scenario preview renders raw snippets plus a cue mismatch legend but no actual mismatch mark in `src/app/ScenariosView.tsx:402`, `src/app/ScenariosView.tsx:418`, and `src/app/ScenariosView.tsx:443`.
- Playground mobile CSS visually orders results before editor while DOM order stays editor then results in `src/topics/report-generation/Playground.tsx:66`, `src/topics/report-generation/Playground.tsx:186`, and `src/topics/report-generation/Playground.tsx:227`.
- Existing report Playground tests check several rows but not exact expected row keys or mobile/result visibility in `src/topics/report-generation/Playground.test.tsx:23` and `src/components/metrics/reportComparisonRows.test.ts:6`.
- Available verification commands are `npm run test`, `npm run build`, and `npm run lint` in `package.json:6`.
- Metis review found historical scope tension between broad evaluator inventory and the earlier MVP principle of fewer metrics with stronger experiments; resolve by adding VERT/ReFINE/RadOT-Eval as concise evaluator-family coverage, not full fake live metrics.
- Metis review found that adding rows blindly can worsen the mobile complaint; row/inventory fixes must be planned in the same or earlier wave as a compact result summary and mobile order fix.
- Metis review found any added Learn sections require deliberate updates to `content.test.ts`, `contentKo.ts`, and `metricTextLinks.ts` if they become linkable metric sections.

## Decisions (with rationale)
- Route as CLEAR intent: the desired outcome is to fix known audit gaps; no broad product discovery is needed.
- Tier is HEAVY: planned changes cross metric engine/table, topic content, scenarios, scenario preview, Playground layout, figures, and tests.
- Plan will require TDD/tests-first for row inventory, scenario parity, and mobile/result behavior where feasible; figure copy-only/visual additions can use tests-after plus browser/layout evidence.
- Plan will not add full external implementations of BERTScore, RaTEscore, GREEN, CRIMSON, VERT, ReFINE, or RadOT-Eval.
- Plan will treat Clinical Acceptance as an endpoint explanation/card, never as a computed numeric `MetricTable` row.
- Plan will use 7 report scenarios as the canonical parity target.
- Plan will specify one shared cue-comparison UI primitive only if it reduces duplication across Playground and Scenarios; otherwise reuse `ReportCueBoard` directly.

## Scope IN
- Report-generation topic only, plus shared components only where they are already used by report-generation surfaces.
- PPT metric inventory truth: coverage, visible labels, proxy honesty, and missing landscape metric mentions.
- Playground first-viewport readability: compact summary, row truth, mobile visual/DOM order alignment, accessibility labels.
- Scenario parity: Korean default must expose every English scenario ID and preview must show cue disagreement visibly.
- Learn experimentability: targeted figure/miniSim improvements that make score movement visible.
- Tests and browser evidence for every changed behavior.
- Small cleanup only when directly adjacent to touched report-generation files.

## Scope OUT (Must NOT have)
- No real LLM judge, no live API calls, no model downloads, no new embedding/model dependency.
- No broad redesign of all topics.
- No new abstraction layer for metric families.
- No fake numeric Clinical Acceptance score.
- No absolute good/bad verdict language that violates `docs/DESIGN.md`.
- No cleanup of unrelated classification figure dead code unless the user explicitly expands cleanup scope.

## Open questions
- Q1. Scope choice: should the execution plan include the landscape-only PPT metrics `VERT`, `ReFINE`, and `RadOT-Eval` as brief Learn coverage now? Recommended: yes, short non-live related-evaluator coverage only.
- Q2. Clinical Acceptance surface: should it appear in Playground as a non-numeric endpoint card rather than a metric table row? Recommended: yes, because a generated static report pair cannot compute reader acceptability.
- Q3. Learn miniSim depth: should the first implementation add a minimal set of 4-5 targeted miniSims rather than one miniSim per metric? Recommended: yes, because fewer shared experiments teach the metric families without bloating the topic.
- Q4. Cue visual implementation: should the plan prefer one shared cue-comparison component for Playground summary and Scenarios? Recommended: yes, only if it remains smaller than separate implementations.

## Approval gate
status: approved-and-written
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
User approved on this thread. Plan written to `.omo/plans/report-generation-metrics-fix.md`. Approval authorized plan writing only, not product-code implementation.

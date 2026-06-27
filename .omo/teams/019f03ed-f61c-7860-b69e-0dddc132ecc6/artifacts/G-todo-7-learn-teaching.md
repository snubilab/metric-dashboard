G Todo 7 learn-teaching result

Scope:
- Implemented Todo 7 only.
- Did not touch Playground, Scenarios, or ReportCueBoard behavior for Todo 4/5/6.
- Did not delete figure registry keys; Todo 8 cleanup remains untouched.

Changed by G:
- src/components/minisims/ReportMetricSim.tsx
- src/components/MiniSim.tsx
- src/components/MiniSim.test.tsx
- src/components/figures/ReportGenerationFigures.tsx
- src/components/figures/MetricFigure.test.tsx
- src/topics/report-generation/content.ts
- src/topics/report-generation/contentKo.ts
- src/topics/report-generation/content.test.ts

What changed:
- Added one reusable report Learn miniSim widget with five scenario kinds:
  - report-lexical-paraphrase
  - report-entity-assertion
  - report-temporal-direction
  - report-label-graph-granularity
  - report-error-weighting
- Wired those miniSims into BLEU, RaTEscore, Temporal F1, SRR-BERT F1, and GREEN in both English and Korean Learn content.
- Added concrete count/weight text to existing report figures for BLEU, Temporal F1, CheXbert/SRR, RadGraph, GREEN, and CRIMSON.
- Added tests proving report miniSims are present, dispatch to a real widget instead of coming soon, and report figures render concrete counts/weights.

Evidence:
- RED: .omo/evidence/report-generation-metrics-fix/task-7-learn-teaching-red.txt
- GREEN: .omo/evidence/report-generation-metrics-fix/task-7-learn-teaching-green.txt
- Screenshot: .omo/evidence/report-generation-metrics-fix/task-7-learn-desktop.png

Verification:
- npm run test -- src/topics/report-generation/content.test.ts src/components/MiniSim.test.tsx src/components/figures/MetricFigure.test.tsx: pass
- npm run test: pass, 84 files / 692 tests
- npm run build: pass
- npm run lint: pass
- TypeScript no-excuse checker on G-touched files: pass
- Chrome local surface check: pass; LLM report Learn shows five report miniSims plus concrete figure counts/weights.

Notes:
- The shared worktree contains unrelated changes from other members, including ReportCueBoard and Playground test files. G did not edit those surfaces.
- Existing topic content and report figure files are large content/figure collections; this Todo kept them in place to avoid cross-scope refactoring.

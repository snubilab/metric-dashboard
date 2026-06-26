# Clinical Report Generation Topic UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the extracted `Clinical_Report_Generation_Metrics.pptx` material into a full Metric Dashboard topic with concrete Learn sections, a text-based Playground, and read-only A-vs-B Scenarios.

**Architecture:** Add a new `report-generation` topic under `src/topics/report-generation/` and replace the current coming-soon stub. Keep the live engine intentionally small and deterministic: compute lexical overlap proxies plus toy clinical cue extraction for finding, negation, laterality, and temporal-change errors. Explain real metrics such as BLEU, ROUGE, METEOR, BERTScore, RaTEscore, CheXbert F1, RadGraph F1, GREEN, and CRIMSON in Learn, but do not pretend the static browser app runs external labelers or LLM judges.

**Tech Stack:** React 19, TypeScript strict, Vite, Vitest, existing `MetricTable`, existing topic registry, existing design tokens, pure TypeScript metric engine.

---

## Scope Check

This is a topic UX/content implementation plan, not a real CheXbert, RadGraph, GREEN, or CRIMSON implementation. The MVP must answer one narrow question:

> When a generated radiology report is lexically similar but clinically wrong, which metric family catches the failure?

Anything beyond that is over-analysis. Do not add API calls, model inference, new dependencies, or uploaded report files. Use built-in textareas and deterministic examples.

## Source Mapping From PPTX

- Slides 1-2: motivation and dataset context.
- Slides 3-6: BLEU, ROUGE, METEOR as lexical baselines.
- Slides 7-9: the core worked example: same meaning/different wording, negation flip, laterality error.
- Slide 10: four-level landscape from lexical overlap to LLM/learned evaluator.
- Slides 11-14: Temporal F1, CheXbert F1, SRR-BERT F1, RadGraph F1.
- Slides 15-16: BERTScore vs RaTEscore.
- Slides 17-20: GREEN and CRIMSON.
- Slides 21-23: clinical acceptance, recommendation, and modality expansion.

## UX Decision

Do not mirror slide order. Slides are lecture flow; the app needs metric-learning flow.

The new topic should have this shape:

1. **Learn:** metric families, each with a specific report-pair example.
2. **Playground:** reference, Candidate A, Candidate B text editors plus live cue extraction and A-vs-B metric rows.
3. **Scenarios:** four read-only clinical cards, each demonstrating a true rank flip.

## Existing Dashboard Patterns To Match

The report-generation topic must feel like the existing metric topics, not like a pasted lecture note.

### Segmentation Pattern

Existing behavior:

- Learn uses one `MetricSection` per metric with a figure and, where useful, a miniSim seeded by a concrete `EngineState`.
- Playground boots empty, forces the learner to draw GT then prediction layers, and only unlocks comparison after the user has created the objects.
- Presets are not the main experience; they are a row of instructive shortcuts.
- Scenarios prove A-vs-B rank flips with `comparison.test.ts`.

Report-generation translation:

- Replace drawing masks with editing report text.
- Empty boot means all three report boxes start blank.
- The learner must create or load Reference, Candidate A, and Candidate B before metric rows unlock.
- The row winner must change when the user flips `No pneumothorax` to `pneumothorax is present`.

### Detection Pattern

Existing behavior:

- Playground exposes threshold-sensitive behavior and shows live metric changes as boxes/confidence change.
- Scenarios render read-only visuals plus a clean table, not interactive controls.
- Detection cards show why AP50, AP75, and FROC can disagree.

Report-generation translation:

- The live “threshold” analogue is the clinical cue unit: lexical tokens, findings, assertions, laterality, and temporal cues.
- Scenarios must show read-only report snippets plus extracted cue chips before the table.
- The table must make disagreement visible: `Lexical overlap proxy` can lead B while `Assertion F1`, `Laterality F1`, or `Temporal F1` leads A.

### Classification Pattern

Existing behavior:

- Classification makes the metric tactile by changing threshold/prevalence and watching confusion-matrix-derived rows move.
- Learn sections explicitly say which denominator each metric reads.

Report-generation translation:

- Learn must say what each metric family “counts”: token overlap, entity labels, entity/assertion pairs, graph relations, error categories, or radiologist acceptance.
- Playground must show the extracted units beside the metric table, so the learner sees why a row moved.

### Regression Pattern

Existing behavior:

- Regression makes metric sensitivity visible by showing how outliers, bias, rank order, and squared error react differently.

Report-generation translation:

- The Playground must make single-edit sensitivity visible:
  - Change `No pleural effusion` to `Pleural effusion is present` and `assertionF1` / `safetyErrors` react.
  - Change `right` to `left` and `lateralityF1` reacts.
  - Change `improved` to `worsened` and `temporalF1` reacts.
  - Rephrase `cardiomegaly` as `cardiac silhouette is mildly enlarged` and lexical overlap drops while clinical cue matching can remain stable.

## Experiential Learning Requirement

The key requirement is not “include many metrics.” The key requirement is that each metric becomes something the learner can feel by editing or comparing reports.

Acceptance criteria:

- Every Learn section names the unit that metric family observes.
- Every Playground preset demonstrates one edit that changes one metric family more than the others.
- The live cue board explains the metric table; no metric row appears without a visible extracted unit behind it.
- Every Scenario contains a true A/B rank flip and a one-sentence explanation of what unit caused the flip.
- No page says one candidate is globally better. It only says which row leads and why.

Report-generation MVP should therefore be fewer metrics with stronger experiments, not more metrics with weaker intuition.

## Concrete Examples To Use

### Example 1: Negation Flip

Reference:

```text
Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.
```

Candidate A:

```text
The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.
```

Candidate B:

```text
Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.
```

Expected teaching use:

- Lexical overlap can favor Candidate B because it reuses many reference words.
- Clinical cue matching favors Candidate A because it preserves absence of consolidation, effusion, and pneumothorax.
- This is the main Playground default preset.

### Example 2: Laterality Swap

Reference:

```text
Right lower lobe opacity suspicious for pneumonia. No pleural effusion.
```

Candidate A:

```text
There is airspace opacity in the right lower lung, concerning for pneumonia. No pleural fluid is present.
```

Candidate B:

```text
Left lower lobe opacity suspicious for pneumonia. No pleural effusion.
```

Expected teaching use:

- Candidate B has high lexical overlap.
- Candidate A preserves laterality.
- Use in Scenarios and one Playground preset.

### Example 3: Temporal Change Error

Reference:

```text
Compared with the prior study, pulmonary edema has improved. Small bilateral pleural effusions are stable.
```

Candidate A:

```text
Pulmonary edema is decreased from prior. Small pleural effusions are unchanged bilaterally.
```

Candidate B:

```text
Compared with the prior study, pulmonary edema has worsened. Small bilateral pleural effusions are stable.
```

Expected teaching use:

- Candidate B shares the phrase structure but flips temporal direction.
- Temporal F1 or a toy temporal-cue row catches the failure.

### Example 4: Entity Swap For RaTEscore

Reference:

```text
Right pneumothorax. No pleural effusion.
```

Candidate A:

```text
A pneumothorax is present on the right. Pleural effusion is absent.
```

Candidate B:

```text
Right pleural effusion. No pneumothorax.
```

Expected teaching use:

- Word-level similarity sees familiar terms.
- Entity-aware matching catches that pneumothorax and pleural effusion swapped assertion status.

---

## File Structure

- Modify `src/types/engine.ts`
  - Add `ReportComparisonState` and optional `reportGeneration` field to `EngineState`.
- Create `src/engine/metrics/reportGeneration.ts`
  - Pure text normalization, lexical overlap proxy, clinical cue extraction, report metric computation.
- Create `src/engine/metrics/reportGeneration.test.ts`
  - Tests for negation, laterality, temporal, and rank-flip examples.
- Create `src/components/metrics/reportComparisonRows.ts`
  - Convert report metrics into shared `MetricRow[]`.
- Create `src/components/metrics/reportComparisonRows.test.ts`
  - Verifies rows are finite and examples produce both A and B winners.
- Create `src/components/figures/ReportGenerationFigures.tsx`
  - Token-based SVG figures for lexical overlap, cue extraction, graph relation, and LLM error taxonomy.
- Modify `src/components/figures/MetricFigure.tsx`
  - Register report figure keys.
- Modify `src/components/metrics/metricLabel.ts`
  - Add Korean labels for report metric rows.
- Modify `src/components/metrics/metricTextLinks.ts`
  - Linkify BLEU, ROUGE, METEOR, BERTScore, RaTEscore, CheXbert F1, SRR-BERT F1, RadGraph F1, GREEN, CRIMSON, Clinical Acceptance.
- Create `src/topics/report-generation/content.ts`
  - English Learn content.
- Create `src/topics/report-generation/contentKo.ts`
  - Korean Learn content, default UX language.
- Create `src/topics/report-generation/reportExamples.ts`
  - Shared reference/candidate strings and preset/scenario builders.
- Create `src/topics/report-generation/presets.ts`
  - Four Playground presets.
- Create `src/topics/report-generation/presets.test.ts`
  - Verifies each preset has a rank flip.
- Create `src/topics/report-generation/Playground.tsx`
  - Textarea-based guided Playground.
- Create `src/topics/report-generation/Playground.test.tsx`
  - Verifies empty boot, preset loading, edit detaches preset, metrics unlock.
- Create `src/topics/report-generation/scenarios.ts`
  - English scenarios.
- Create `src/topics/report-generation/scenariosKo.ts`
  - Korean scenarios.
- Create `src/topics/report-generation/comparison.test.ts`
  - Verifies every Scenario has A and B metric winners.
- Create `src/topics/report-generation/index.ts`
  - Topic export with `status: "available"`.
- Modify `src/app/ScenariosView.tsx`
  - Add report-generation preview branch.
- Modify `src/app/topicRegistry.ts`
  - Import new topic and remove `report-generation` stub.
- Modify `src/app/topicRegistry.test.ts`
  - Expect ten topics total and five available topics.

---

## Learn Page Design

### Page-Level Intro

Korean intro:

```text
Report generation 평가는 문장이 reference와 얼마나 비슷한지보다, finding·negation·laterality·temporal change가 임상적으로 맞는지를 먼저 봐야 합니다. BLEU/ROUGE/METEOR는 기존 연구 비교에는 유용하지만, pneumothorax 부정이 뒤집히거나 좌우가 바뀌는 오류를 안전하게 잡지 못합니다. 그래서 clinical report generation은 lexical overlap, embedding similarity, clinical concept/graph, LLM evaluator, human acceptance를 함께 읽어야 합니다.
```

English intro:

```text
Clinical report generation is not just image captioning with medical words. A report can look close to the reference while flipping negation, laterality, severity, or temporal change. This topic compares lexical overlap, embedding similarity, concept/graph metrics, LLM evaluators, and human acceptance so the failure mode each metric misses stays visible.
```

### Learn Sections

Use these exact section ids and titles:

1. `lexical-overlap`: `BLEU · ROUGE · METEOR`
2. `embedding-similarity`: `BERTScore · RaTEscore`
3. `concept-label-f1`: `Temporal F1 · CheXbert F1 · SRR-BERT F1`
4. `graph-f1`: `RadGraph F1`
5. `llm-evaluators`: `GREEN · CRIMSON`
6. `clinical-acceptance`: `Clinical Acceptance`

Every section must include a `meaning` sentence with this structure:

```text
This metric family observes [unit], so it reacts when [specific report edit] changes.
```

For Korean:

```text
이 metric family는 [unit]을 보기 때문에 [specific report edit]이 바뀔 때 반응합니다.
```

Use these units:

- `lexical-overlap`: surface tokens.
- `embedding-similarity`: contextual tokens or medical entities.
- `concept-label-f1`: finding labels and temporal labels.
- `graph-f1`: entity-relation pairs.
- `llm-evaluators`: clinical error categories.
- `clinical-acceptance`: radiologist workflow decisions.

### Section: BLEU · ROUGE · METEOR

Figure key: `report-lexical-overlap`

Formula:

```text
\mathrm{OverlapProxyF1} = \frac{2|\mathrm{tok}(R)\cap\mathrm{tok}(C)|}{|\mathrm{tok}(R)| + |\mathrm{tok}(C)|}
```

Meaning:

```text
BLEU, ROUGE, and METEOR summarize surface overlap between candidate and reference text. In this dashboard the live Playground uses a simple token-overlap proxy, not the full published implementations, so the failure mode is visible without adding an NLP dependency.
```

Features:

- Useful for legacy comparison with prior report generation papers.
- Cheap, deterministic, and easy to reproduce.
- Highlights whether the candidate reused reference wording.

Caveats:

- Can reward a report that reuses reference terms while flipping negation.
- Usually assumes one reference, although one image can support multiple acceptable reports.
- Does not understand laterality, clinical severity, or temporal direction.

Example shown in the section:

```text
Reference: No pleural effusion or pneumothorax.
Candidate B: Pleural effusion and pneumothorax are present.
```

### Section: BERTScore · RaTEscore

Figure key: `report-entity-similarity`

Formula:

```text
\mathrm{EntityF1} = \frac{2\,TP_{\mathrm{entity}}}{2\,TP_{\mathrm{entity}} + FP_{\mathrm{entity}} + FN_{\mathrm{entity}}}
```

Meaning:

```text
BERTScore compares contextual token embeddings, while RaTEscore narrows the comparison toward medical entities extracted from the report. The dashboard represents this idea with entity/assertion matching, not a transformer model.
```

Features:

- More tolerant of paraphrase than pure n-gram overlap.
- Entity-aware variants focus scoring on clinically relevant terms.
- Helps show why “fluid” and “effusion” can be closer than raw tokens suggest.

Caveats:

- Embedding similarity can still miss assertion swaps such as pneumothorax present versus absent.
- Entity extraction quality becomes part of the metric.
- A high similarity score is not the same as radiologist acceptance.

### Section: Temporal F1 · CheXbert F1 · SRR-BERT F1

Figure key: `report-label-f1`

Formula:

```text
\mathrm{LabelF1} = \frac{2\,TP_{\mathrm{label}}}{2\,TP_{\mathrm{label}} + FP_{\mathrm{label}} + FN_{\mathrm{label}}}
```

Meaning:

```text
Concept-label metrics convert reports into finding labels and compare label presence, absence, or temporal status. They move evaluation from wording toward clinical content.
```

Features:

- Directly measures whether key findings are mentioned.
- Temporal F1 can isolate improved, worsened, stable, new, or resolved statements.
- CheXbert and SRR-BERT style outputs are intuitive for benchmark tables.

Caveats:

- Label vocabularies are limited.
- Location, laterality, severity, and relations can be lost.
- Scores depend on the report labeler, not only on the generator.

### Section: RadGraph F1

Figure key: `report-graph-f1`

Formula:

```text
\mathrm{GraphF1} = \frac{2\,TP_{\mathrm{entity,relation}}}{2\,TP_{\mathrm{entity,relation}} + FP_{\mathrm{entity,relation}} + FN_{\mathrm{entity,relation}}}
```

Meaning:

```text
RadGraph-style metrics compare extracted entities and relations, so the evaluator can see that a finding is negated, located in the right lower lobe, or linked to an anatomical site.
```

Features:

- Better aligned with negation and location errors than label-only metrics.
- Can expose relation mistakes hidden by lexical overlap.
- Useful when entity structure matters more than fluent prose.

Caveats:

- Relation extraction errors propagate into the score.
- Synonyms and severity granularity may still be brittle.
- Graph F1 is still a proxy for clinical acceptability.

### Section: GREEN · CRIMSON

Figure key: `report-llm-evaluator`

Formula:

```text
\mathrm{ErrorScore} = \sum_i w_i\,\mathbf{1}[\mathrm{error}_i]
```

Meaning:

```text
LLM or learned evaluators score reports by detecting clinically meaningful errors such as false findings, omissions, location errors, severity errors, and comparison/change errors. GREEN emphasizes error detection; CRIMSON adds context and severity weighting.
```

Features:

- Can express clinically meaningful error categories.
- Can weight patient-safety impact instead of treating every mismatch equally.
- Useful for reviewer-facing qualitative error analysis.

Caveats:

- Prompt, model version, calibration, and local deployment details affect reproducibility.
- LLM judges can inherit blind spots from their training data.
- For this static dashboard, show precomputed examples only.

### Section: Clinical Acceptance

Figure key: `report-clinical-acceptance`

Formula: omit formula.

Meaning:

```text
Clinical acceptance asks whether radiologists can actually use the generated report in context. It is an endpoint check, not just another automatic metric.
```

Features:

- Captures whether the report is acceptable in a real reading workflow.
- Can include editing time, blinded reader preference, and significant versus insignificant errors.
- Connects metric scores to patient-safety relevance.

Caveats:

- Expensive and slower than automatic metrics.
- Study design matters: reader count, case mix, blinding, ICU/exclusion criteria, and adjudication affect conclusions.
- Human acceptance does not replace automatic benchmark reporting.

---

## Playground Design

### First Screen

The Playground boots empty. No fixed example appears automatically.

Initial layout:

- Top legend: `Reference`, `Candidate A`, `Candidate B`.
- Left column: three stacked textareas.
- Right column: cue extraction preview and metric table.
- A `STEP 1 of 3` pill guides the user:
  - Step 1: write or load a reference report.
  - Step 2: write Candidate A.
  - Step 3: write Candidate B.
  - Compare: metrics unlock.

### Guided Empty State Copy

Korean:

```text
STEP 1/3 · reference report를 먼저 입력하세요.
STEP 2/3 · Candidate A를 입력하세요. 의미는 같지만 표현이 다른 report를 써보세요.
STEP 3/3 · Candidate B를 입력하세요. 단어는 비슷하지만 negation이나 laterality가 틀린 report를 써보세요.
```

English:

```text
STEP 1/3 · Enter the reference report first.
STEP 2/3 · Enter Candidate A. Try a clinically similar paraphrase.
STEP 3/3 · Enter Candidate B. Try similar wording with a negation or laterality error.
```

### Preset Row

Collapsed disclosure title:

- Korean: `예시 불러오기`
- English: `Load an example`

Preset buttons:

1. `negation-flip`
   - KO: `부정 뒤집힘`
   - EN: `Negation flip`
   - Description: lexical overlap can favor the unsafe candidate.
2. `laterality-swap`
   - KO: `좌우 바뀜`
   - EN: `Laterality swap`
   - Description: same terms, wrong side.
3. `temporal-change`
   - KO: `변화 방향 오류`
   - EN: `Temporal change error`
   - Description: worsened versus improved.
4. `entity-swap`
   - KO: `entity/assertion 교환`
   - EN: `Entity/assertion swap`
   - Description: pneumothorax and effusion swap assertion status.

Editing any textarea clears `activePresetId`.

### Live Metric Rows

Use shared `MetricTable` with A/B rows:

- `lexicalOverlap`: higher is better.
- `findingF1`: higher is better.
- `assertionF1`: higher is better.
- `lateralityF1`: higher is better.
- `temporalF1`: higher is better.
- `safetyErrors`: lower is better.

Each row needs a visible cause in the cue board:

- `lexicalOverlap`: overlapping tokens highlighted in the report snippets.
- `findingF1`: extracted finding chips.
- `assertionF1`: finding chips with `present` / `absent` badges.
- `lateralityF1`: right/left/bilateral chips.
- `temporalF1`: improved/worsened/stable/new/resolved chips.
- `safetyErrors`: warning chips for false finding, omission, assertion flip, laterality mismatch, or temporal mismatch.

Important: never label a candidate as good/bad. The insight copy must say:

Korean:

```text
어떤 candidate가 앞서는지는 metric이 보는 단위에 따라 달라집니다. Lexical row와 clinical cue row가 갈라지는 지점을 보세요.
```

English:

```text
The leading candidate changes with the unit the metric can observe. Watch where lexical rows and clinical-cue rows split.
```

### Cue Preview

Render a compact `ReportCueBoard`:

- Three columns: Reference, Candidate A, Candidate B.
- Rows:
  - Findings: cardiomegaly, consolidation, pleural effusion, pneumothorax, opacity, edema.
  - Assertion: present, absent.
  - Laterality: right, left, bilateral, unspecified.
  - Temporal: improved, worsened, stable, new, resolved.
- Use token colors:
  - reference/GT: `--c-gt`
  - Candidate A: `--c-pred-a`
  - Candidate B: `--c-pred-b`
  - mismatch/error cue: `--c-warn`
- Text labels use `--c-*-text` variants.

The cue board is not decorative. It is the explanation layer for the metric table:

- When `assertionF1` changes, a `present` / `absent` badge must visibly differ.
- When `lateralityF1` changes, a laterality chip must visibly differ.
- When `temporalF1` changes, a temporal chip must visibly differ.
- When only wording changes, lexical tokens should move while finding/assertion chips stay stable.

No sliders. No file upload. No external model selector.

---

## Scenario Design

All scenarios are read-only cards in the existing fixed 2-column grid. Each card must show:

1. Clinical context.
2. Teaching point.
3. Reference citation or source-slide note.
4. Read-only report preview with Reference/A/B text snippets.
5. Cue legend.
6. Clean metric table.

### Scenario 1: Negation Hallucination

Clinical context:

- Situation: CXR report generation for a routine chest radiograph.
- Modality: Chest X-ray report.
- At stake: hallucinating pneumothorax or pleural effusion can trigger urgent follow-up.
- Consequence: lexical similarity hides a false finding.

Reference/A/B: use Example 1.

Teaching point:

```text
Candidate B reuses more reference terms, but flips absent findings into present findings. Lexical overlap can lead B while assertion-aware rows lead A.
```

### Scenario 2: Laterality Swap

Clinical context:

- Situation: pneumonia location in a generated CXR impression.
- Modality: Chest X-ray report.
- At stake: wrong-side localization changes follow-up and clinical communication.
- Consequence: high word overlap can still point clinicians to the wrong side.

Reference/A/B: use Example 2.

Teaching point:

```text
Candidate B keeps the phrase template but changes right to left. Laterality-aware rows should lead A even when lexical overlap is close.
```

### Scenario 3: Temporal Change Direction

Clinical context:

- Situation: follow-up CXR after treatment.
- Modality: Serial chest X-ray report.
- At stake: improved versus worsened changes treatment urgency.
- Consequence: a temporal direction error can invert the clinical message.

Reference/A/B: use Example 3.

Teaching point:

```text
Candidate B repeats the comparison structure but reverses improved to worsened. Temporal F1 should lead A while lexical overlap may stay high for B.
```

### Scenario 4: Entity Assertion Swap

Clinical context:

- Situation: short report with two clinically important entities.
- Modality: Chest X-ray report.
- At stake: pneumothorax and pleural effusion have different management implications.
- Consequence: entity words are present but attached to the wrong assertion.

Reference/A/B: use Example 4.

Teaching point:

```text
Candidate B contains the right vocabulary but assigns presence and absence to the wrong entities. Entity/assertion rows should lead A.
```

---

## Task 1: Add Report State And Pure Engine

**Files:**
- Modify: `src/types/engine.ts`
- Create: `src/engine/metrics/reportGeneration.ts`
- Create: `src/engine/metrics/reportGeneration.test.ts`

- [ ] **Step 1: Write the failing engine test**

Create `src/engine/metrics/reportGeneration.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  compareReports,
  extractClinicalCues,
  lexicalOverlapF1,
} from "./reportGeneration";

describe("report generation metrics", () => {
  it("rewards lexical overlap even when negation flips", () => {
    const reference =
      "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.";
    const candidateA =
      "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.";
    const candidateB =
      "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.";

    expect(lexicalOverlapF1(reference, candidateB)).toBeGreaterThan(
      lexicalOverlapF1(reference, candidateA),
    );

    const result = compareReports(reference, candidateA, candidateB);
    expect(result.a.assertionF1).toBeGreaterThan(result.b.assertionF1);
    expect(result.a.safetyErrors).toBeLessThan(result.b.safetyErrors);
  });

  it("extracts laterality and temporal cues deterministically", () => {
    const cues = extractClinicalCues(
      "Compared with prior, right lower lobe opacity has improved. No pleural effusion.",
    );

    expect(cues.findings).toContain("opacity");
    expect(cues.laterality).toContain("right");
    expect(cues.temporal).toContain("improved");
    expect(cues.absentFindings).toContain("pleural effusion");
  });

  it("makes single clinical edits visible in the intended metric family", () => {
    const reference = "Right pneumothorax has improved. No pleural effusion.";
    const same = "Right pneumothorax has improved. No pleural effusion.";
    const assertionFlip = "Right pneumothorax has improved. Pleural effusion is present.";
    const lateralityFlip = "Left pneumothorax has improved. No pleural effusion.";
    const temporalFlip = "Right pneumothorax has worsened. No pleural effusion.";

    expect(compareReports(reference, same, assertionFlip).a.assertionF1).toBeGreaterThan(
      compareReports(reference, same, assertionFlip).b.assertionF1,
    );
    expect(compareReports(reference, same, lateralityFlip).a.lateralityF1).toBeGreaterThan(
      compareReports(reference, same, lateralityFlip).b.lateralityF1,
    );
    expect(compareReports(reference, same, temporalFlip).a.temporalF1).toBeGreaterThan(
      compareReports(reference, same, temporalFlip).b.temporalF1,
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm run test -- src/engine/metrics/reportGeneration.test.ts
```

Expected: fail because `reportGeneration.ts` does not exist.

- [ ] **Step 3: Add report state types**

Modify `src/types/engine.ts` by adding these types before `EngineState`:

```typescript
export interface ReportComparisonState {
  reference: string;
  candidateA: string;
  candidateB: string;
}
```

Then add this optional field inside `EngineState`:

```typescript
  reportGeneration?: ReportComparisonState;
```

- [ ] **Step 4: Implement the pure toy engine**

Create `src/engine/metrics/reportGeneration.ts`:

```typescript
export type Finding =
  | "cardiomegaly"
  | "consolidation"
  | "pleural effusion"
  | "pneumothorax"
  | "opacity"
  | "edema";

export type Laterality = "right" | "left" | "bilateral";
export type TemporalCue = "improved" | "worsened" | "stable" | "new" | "resolved";

export interface ClinicalCues {
  findings: Finding[];
  presentFindings: Finding[];
  absentFindings: Finding[];
  laterality: Laterality[];
  temporal: TemporalCue[];
}

export interface ReportMetricValues {
  lexicalOverlap: number;
  findingF1: number;
  assertionF1: number;
  lateralityF1: number;
  temporalF1: number;
  safetyErrors: number;
}

export interface ReportComparison {
  a: ReportMetricValues;
  b: ReportMetricValues;
}

const FINDING_PATTERNS: readonly [Finding, RegExp][] = [
  ["cardiomegaly", /\b(cardiomegaly|cardiac silhouette is mildly enlarged|heart is mildly enlarged)\b/],
  ["consolidation", /\b(consolidation|airspace consolidation)\b/],
  ["pleural effusion", /\b(pleural effusion|pleural fluid|effusion)\b/],
  ["pneumothorax", /\bpneumothorax\b/],
  ["opacity", /\b(opacity|airspace opacity)\b/],
  ["edema", /\b(edema|pulmonary edema)\b/],
];

const NEGATION_RE = /\b(no|without|absent|absence of|clear of)\b/;

const LATERALITY_PATTERNS: readonly [Laterality, RegExp][] = [
  ["right", /\bright\b/],
  ["left", /\bleft\b/],
  ["bilateral", /\b(bilateral|bilaterally)\b/],
];

const TEMPORAL_PATTERNS: readonly [TemporalCue, RegExp][] = [
  ["improved", /\b(improved|decreased|decrease|better)\b/],
  ["worsened", /\b(worsened|increased|increase|progressed|worse)\b/],
  ["stable", /\b(stable|unchanged)\b/],
  ["new", /\b(new|interval development)\b/],
  ["resolved", /\b(resolved|resolution)\b/],
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function tokens(text: string): string[] {
  const stop = new Set(["the", "a", "an", "is", "are", "of", "or", "and", "with"]);
  return normalize(text).split(" ").filter((token) => token.length > 1 && !stop.has(token));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function f1(reference: readonly string[], candidate: readonly string[]): number {
  const ref = new Set(reference);
  const cand = new Set(candidate);
  if (ref.size === 0 && cand.size === 0) return 1;
  if (ref.size === 0 || cand.size === 0) return 0;
  let tp = 0;
  for (const item of cand) {
    if (ref.has(item)) tp += 1;
  }
  return (2 * tp) / (ref.size + cand.size);
}

function sentenceWindows(text: string): string[] {
  return normalize(text).split(/\s*[.;]\s*/).filter(Boolean);
}

export function lexicalOverlapF1(reference: string, candidate: string): number {
  return f1(tokens(reference), tokens(candidate));
}

export function extractClinicalCues(text: string): ClinicalCues {
  const windows = sentenceWindows(text);
  const findings: Finding[] = [];
  const presentFindings: Finding[] = [];
  const absentFindings: Finding[] = [];

  for (const [finding, pattern] of FINDING_PATTERNS) {
    for (const window of windows) {
      if (!pattern.test(window)) continue;
      findings.push(finding);
      if (NEGATION_RE.test(window)) {
        absentFindings.push(finding);
      } else {
        presentFindings.push(finding);
      }
    }
  }

  return {
    findings: unique(findings),
    presentFindings: unique(presentFindings),
    absentFindings: unique(absentFindings),
    laterality: unique(
      LATERALITY_PATTERNS.filter(([, pattern]) => pattern.test(normalize(text))).map(([cue]) => cue),
    ),
    temporal: unique(
      TEMPORAL_PATTERNS.filter(([, pattern]) => pattern.test(normalize(text))).map(([cue]) => cue),
    ),
  };
}

function assertionKeys(cues: ClinicalCues): string[] {
  return [
    ...cues.presentFindings.map((finding) => `${finding}:present`),
    ...cues.absentFindings.map((finding) => `${finding}:absent`),
  ];
}

function safetyErrors(reference: ClinicalCues, candidate: ClinicalCues): number {
  const refPresent = new Set(reference.presentFindings);
  const refAbsent = new Set(reference.absentFindings);
  let errors = 0;
  for (const finding of candidate.presentFindings) {
    if (refAbsent.has(finding)) errors += 1;
  }
  for (const finding of reference.presentFindings) {
    if (!candidate.presentFindings.includes(finding)) errors += 1;
  }
  for (const finding of refPresent) {
    if (candidate.absentFindings.includes(finding)) errors += 1;
  }
  return errors;
}

function score(referenceText: string, candidateText: string): ReportMetricValues {
  const reference = extractClinicalCues(referenceText);
  const candidate = extractClinicalCues(candidateText);
  return {
    lexicalOverlap: lexicalOverlapF1(referenceText, candidateText),
    findingF1: f1(reference.findings, candidate.findings),
    assertionF1: f1(assertionKeys(reference), assertionKeys(candidate)),
    lateralityF1: f1(reference.laterality, candidate.laterality),
    temporalF1: f1(reference.temporal, candidate.temporal),
    safetyErrors: safetyErrors(reference, candidate),
  };
}

export function compareReports(
  reference: string,
  candidateA: string,
  candidateB: string,
): ReportComparison {
  return {
    a: score(reference, candidateA),
    b: score(reference, candidateB),
  };
}
```

- [ ] **Step 5: Verify the engine test passes**

Run:

```bash
npm run test -- src/engine/metrics/reportGeneration.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/engine.ts src/engine/metrics/reportGeneration.ts src/engine/metrics/reportGeneration.test.ts
git commit -m "feat: add report generation toy metrics"
```

---

## Task 2: Add Shared Report Metric Rows

**Files:**
- Create: `src/components/metrics/reportComparisonRows.ts`
- Create: `src/components/metrics/reportComparisonRows.test.ts`
- Modify: `src/components/metrics/metricLabel.ts`
- Modify: `src/components/metrics/metricMeaning.ts`

- [ ] **Step 1: Write the row test**

Create `src/components/metrics/reportComparisonRows.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { winner } from "./detectDisagreements";
import { reportComparisonRows } from "./reportComparisonRows";

describe("reportComparisonRows", () => {
  it("creates finite A-vs-B rows with a rank flip", () => {
    const rows = reportComparisonRows(
      "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.",
      "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.",
      "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.",
    );

    expect(rows.map(winner)).toContain("A");
    expect(rows.map(winner)).toContain("B");
    for (const row of rows) {
      expect(Number.isFinite(row.a)).toBe(true);
      expect(Number.isFinite(row.b)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the row test and verify it fails**

Run:

```bash
npm run test -- src/components/metrics/reportComparisonRows.test.ts
```

Expected: fail because `reportComparisonRows.ts` does not exist.

- [ ] **Step 3: Implement metric rows**

Create `src/components/metrics/reportComparisonRows.ts`:

```typescript
import { compareReports } from "../../engine/metrics/reportGeneration";
import type { MetricRow } from "./types";

export function reportComparisonRows(
  reference: string,
  candidateA: string,
  candidateB: string,
): MetricRow[] {
  const comparison = compareReports(reference, candidateA, candidateB);
  return [
    {
      key: "lexicalOverlap",
      label: "Lexical overlap proxy",
      a: comparison.a.lexicalOverlap,
      b: comparison.b.lexicalOverlap,
      higherIsBetter: true,
    },
    {
      key: "findingF1",
      label: "Finding F1",
      a: comparison.a.findingF1,
      b: comparison.b.findingF1,
      higherIsBetter: true,
    },
    {
      key: "assertionF1",
      label: "Assertion F1",
      a: comparison.a.assertionF1,
      b: comparison.b.assertionF1,
      higherIsBetter: true,
    },
    {
      key: "lateralityF1",
      label: "Laterality F1",
      a: comparison.a.lateralityF1,
      b: comparison.b.lateralityF1,
      higherIsBetter: true,
    },
    {
      key: "temporalF1",
      label: "Temporal F1",
      a: comparison.a.temporalF1,
      b: comparison.b.temporalF1,
      higherIsBetter: true,
    },
    {
      key: "safetyErrors",
      label: "Safety error count",
      a: comparison.a.safetyErrors,
      b: comparison.b.safetyErrors,
      higherIsBetter: false,
    },
  ];
}
```

- [ ] **Step 4: Add Korean metric labels**

Add these entries to `KO_METRIC_LABELS` in `src/components/metrics/metricLabel.ts`:

```typescript
  lexicalOverlap: "Lexical overlap proxy",
  findingF1: "Finding F1",
  assertionF1: "Assertion F1",
  lateralityF1: "Laterality F1",
  temporalF1: "Temporal F1",
  safetyErrors: "Safety error count",
```

- [ ] **Step 5: Add metric meanings**

Add report keys to `src/components/metrics/metricMeaning.ts` using this Korean/English meaning:

```typescript
lexicalOverlap: {
  ko: "reference와 candidate의 표면 단어 겹침입니다.",
  en: "Surface token overlap between reference and candidate.",
},
findingF1: {
  ko: "finding 단위가 reference와 얼마나 맞는지 봅니다.",
  en: "Matches report findings regardless of exact wording.",
},
assertionF1: {
  ko: "finding의 present/absent 상태까지 맞는지 봅니다.",
  en: "Matches whether each finding is present or absent.",
},
lateralityF1: {
  ko: "right/left/bilateral 같은 좌우 정보를 비교합니다.",
  en: "Compares right, left, and bilateral laterality cues.",
},
temporalF1: {
  ko: "improved/worsened/stable 같은 변화 방향을 비교합니다.",
  en: "Compares temporal change cues such as improved, worsened, or stable.",
},
safetyErrors: {
  ko: "없는 소견 생성, 소견 누락, assertion 뒤집힘의 개수입니다.",
  en: "Counts false findings, omissions, and assertion flips.",
},
```

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- src/components/metrics/reportComparisonRows.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/metrics/reportComparisonRows.ts src/components/metrics/reportComparisonRows.test.ts src/components/metrics/metricLabel.ts src/components/metrics/metricMeaning.ts
git commit -m "feat: add report comparison metric rows"
```

---

## Task 3: Add Learn Figures And Content

**Files:**
- Create: `src/components/figures/ReportGenerationFigures.tsx`
- Modify: `src/components/figures/MetricFigure.tsx`
- Modify: `src/components/metrics/metricTextLinks.ts`
- Create: `src/topics/report-generation/content.ts`
- Create: `src/topics/report-generation/contentKo.ts`
- Create: `src/topics/report-generation/content.test.ts`

- [ ] **Step 1: Write content test**

Create `src/topics/report-generation/content.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { reportGenerationLearn } from "./content";
import { reportGenerationLearnKo } from "./contentKo";

const REQUIRED_IDS = [
  "lexical-overlap",
  "embedding-similarity",
  "concept-label-f1",
  "graph-f1",
  "llm-evaluators",
  "clinical-acceptance",
] as const;

describe("report generation Learn content", () => {
  it("keeps English and Korean section parity", () => {
    expect(reportGenerationLearn.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
    expect(reportGenerationLearnKo.sections.map((section) => section.id)).toEqual(REQUIRED_IDS);
  });

  it("provides full section content and figures", () => {
    for (const section of reportGenerationLearn.sections) {
      expect(section.meaning.length).toBeGreaterThan(0);
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.caveats.length).toBeGreaterThan(0);
      expect(section.figure).toBeDefined();
    }
  });

  it("does not use forbidden absolute grade verdicts", () => {
    const text = JSON.stringify([reportGenerationLearn, reportGenerationLearnKo]);
    expect(text).not.toMatch(/좋음|나쁨|우수|열등|best metric|worst metric/);
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm run test -- src/topics/report-generation/content.test.ts
```

Expected: fail because the topic files do not exist.

- [ ] **Step 3: Add report figures**

Create `src/components/figures/ReportGenerationFigures.tsx` with six SVG components:

```tsx
const svgStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  height: "auto",
  display: "block",
};

const textStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "13px",
  fill: "var(--c-text)",
};

const dimTextStyle: React.CSSProperties = {
  ...textStyle,
  fill: "var(--c-text-dim)",
};

function Box({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={8} fill={color} fillOpacity={0.16} stroke={color} />;
}

export function ReportLexicalOverlapFigure() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="Lexical overlap can miss negation" style={svgStyle}>
      <Box x={20} y={24} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={55} style={textStyle}>No pneumothorax</text>
      <Box x={280} y={24} w={220} h={54} color="var(--c-pred-b)" />
      <text x={294} y={55} style={textStyle}>pneumothorax present</text>
      <line x1={240} y1={51} x2={280} y2={51} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="5 4" />
      <text x={34} y={116} style={dimTextStyle}>same key term</text>
      <text x={294} y={116} style={dimTextStyle}>opposite assertion</text>
    </svg>
  );
}

export function ReportEntitySimilarityFigure() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="Entity assertion matching" style={svgStyle}>
      <Box x={20} y={24} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={55} style={textStyle}>pneumothorax: present</text>
      <Box x={280} y={24} w={220} h={54} color="var(--c-warn)" />
      <text x={294} y={55} style={textStyle}>pneumothorax: absent</text>
      <Box x={20} y={96} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={127} style={textStyle}>effusion: absent</text>
      <Box x={280} y={96} w={220} h={54} color="var(--c-warn)" />
      <text x={294} y={127} style={textStyle}>effusion: present</text>
    </svg>
  );
}

export function ReportLabelF1Figure() {
  return (
    <svg viewBox="0 0 520 150" role="img" aria-label="Label F1 extraction" style={svgStyle}>
      {["cardiomegaly", "edema", "pneumothorax"].map((label, index) => (
        <g key={label}>
          <circle cx={56 + index * 160} cy={56} r={24} fill="var(--c-pred-a)" fillOpacity={0.18} stroke="var(--c-pred-a)" />
          <text x={56 + index * 160} y={102} textAnchor="middle" style={textStyle}>{label}</text>
        </g>
      ))}
    </svg>
  );
}

export function ReportGraphF1Figure() {
  return (
    <svg viewBox="0 0 520 160" role="img" aria-label="RadGraph-style relation" style={svgStyle}>
      <Box x={30} y={52} w={140} h={48} color="var(--c-pred-a)" />
      <text x={100} y={81} textAnchor="middle" style={textStyle}>opacity</text>
      <Box x={340} y={52} w={140} h={48} color="var(--c-gt)" />
      <text x={410} y={81} textAnchor="middle" style={textStyle}>right lower lobe</text>
      <line x1={170} y1={76} x2={340} y2={76} stroke="var(--c-text-dim)" strokeWidth={2} markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--c-text-dim)" />
        </marker>
      </defs>
      <text x={255} y={62} textAnchor="middle" style={dimTextStyle}>located_at</text>
    </svg>
  );
}

export function ReportLlmEvaluatorFigure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="LLM evaluator error taxonomy" style={svgStyle}>
      {["false finding", "omission", "location", "severity", "comparison"].map((label, index) => (
        <g key={label}>
          <Box x={24 + (index % 3) * 164} y={24 + Math.floor(index / 3) * 72} w={140} h={46} color={index < 2 ? "var(--c-warn)" : "var(--c-pred-a)"} />
          <text x={94 + (index % 3) * 164} y={53 + Math.floor(index / 3) * 72} textAnchor="middle" style={textStyle}>{label}</text>
        </g>
      ))}
    </svg>
  );
}

export function ReportClinicalAcceptanceFigure() {
  return (
    <svg viewBox="0 0 520 160" role="img" aria-label="Clinical acceptance workflow" style={svgStyle}>
      {["AI draft", "radiologist edit", "accepted report"].map((label, index) => (
        <g key={label}>
          <Box x={24 + index * 166} y={48} w={130} h={50} color={index === 2 ? "var(--c-gt)" : "var(--c-pred-a)"} />
          <text x={89 + index * 166} y={79} textAnchor="middle" style={textStyle}>{label}</text>
          {index < 2 && <line x1={154 + index * 166} y1={73} x2={190 + index * 166} y2={73} stroke="var(--c-text-dim)" strokeWidth={2} />}
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Register report figure keys**

Modify `src/components/figures/MetricFigure.tsx`:

```tsx
import {
  ReportClinicalAcceptanceFigure,
  ReportEntitySimilarityFigure,
  ReportGraphF1Figure,
  ReportLabelF1Figure,
  ReportLexicalOverlapFigure,
  ReportLlmEvaluatorFigure,
} from "./ReportGenerationFigures";
```

Add to `FIGURES`:

```tsx
  "report-lexical-overlap": ReportLexicalOverlapFigure,
  "report-entity-similarity": ReportEntitySimilarityFigure,
  "report-label-f1": ReportLabelF1Figure,
  "report-graph-f1": ReportGraphF1Figure,
  "report-llm-evaluator": ReportLlmEvaluatorFigure,
  "report-clinical-acceptance": ReportClinicalAcceptanceFigure,
```

- [ ] **Step 5: Add metric text links**

Add these tokens to `METRIC_TOKENS` in `src/components/metrics/metricTextLinks.ts` before shorter overlapping tokens:

```typescript
  { token: "Clinical Acceptance", sectionIds: ["clinical-acceptance"] },
  { token: "SRR-BERT F1", sectionIds: ["concept-label-f1"] },
  { token: "CheXbert F1", sectionIds: ["concept-label-f1"] },
  { token: "Temporal F1", sectionIds: ["concept-label-f1"] },
  { token: "RadGraph F1", sectionIds: ["graph-f1"] },
  { token: "BERTScore", sectionIds: ["embedding-similarity"] },
  { token: "RaTEscore", sectionIds: ["embedding-similarity"] },
  { token: "METEOR", sectionIds: ["lexical-overlap"] },
  { token: "ROUGE", sectionIds: ["lexical-overlap"] },
  { token: "BLEU", sectionIds: ["lexical-overlap"] },
  { token: "CRIMSON", sectionIds: ["llm-evaluators"] },
  { token: "GREEN", sectionIds: ["llm-evaluators"] },
```

- [ ] **Step 6: Create Learn content**

Create `src/topics/report-generation/content.ts` and `contentKo.ts` with the six section ids from “Learn Sections.” Keep formulas and figure keys exactly as listed. Do not add miniSims in this first implementation; the Playground carries interactivity.

For `contentKo.ts`, use these Korean section meanings:

```typescript
const KO_MEANINGS = {
  "lexical-overlap":
    "BLEU, ROUGE, METEOR는 candidate와 reference 사이의 표면 단어 겹침을 요약합니다. 이 dashboard의 Playground는 전체 published metric이 아니라 dependency 없는 token-overlap proxy를 써서 실패 양상을 보여줍니다.",
  "embedding-similarity":
    "BERTScore는 contextual token embedding을 비교하고, RaTEscore는 medical entity 중심으로 비교 범위를 좁힙니다. 여기서는 transformer를 돌리지 않고 entity/assertion matching으로 같은 직관을 보여줍니다.",
  "concept-label-f1":
    "Temporal F1, CheXbert F1, SRR-BERT F1 계열은 report를 finding label이나 temporal status로 바꾼 뒤 reference와 비교합니다.",
  "graph-f1":
    "RadGraph F1은 entity와 relation을 함께 비교해서 negation, location, anatomical site 연결 오류를 더 직접적으로 드러냅니다.",
  "llm-evaluators":
    "GREEN과 CRIMSON 같은 LLM/learned evaluator는 false finding, omission, location error, severity error, comparison/change error처럼 임상적으로 의미 있는 오류 category를 탐지합니다.",
  "clinical-acceptance":
    "Clinical Acceptance는 자동 metric 점수가 아니라 radiologist가 실제 workflow에서 report를 받아들일 수 있는지를 묻는 endpoint 평가입니다.",
} as const;
```

Use these Korean section caveat anchors so the content remains honest:

```typescript
const KO_CAVEAT_ANCHORS = {
  "lexical-overlap": [
    "negation이 뒤집힌 report도 reference 단어를 많이 재사용하면 높게 나올 수 있습니다.",
    "하나의 CXR에 clinically acceptable한 report가 여러 개일 수 있지만 single reference 비교는 이를 좁게 봅니다.",
  ],
  "embedding-similarity": [
    "embedding similarity가 assertion swap을 항상 안전하게 잡는 것은 아닙니다.",
    "entity extractor 품질이 metric 품질에 직접 섞입니다.",
  ],
  "concept-label-f1": [
    "label vocabulary 밖의 severity/location/laterality는 사라질 수 있습니다.",
    "labeler 성능이 report generator 성능처럼 보일 수 있습니다.",
  ],
  "graph-f1": [
    "relation extractor가 틀리면 score도 같이 틀립니다.",
    "동의어와 severity granularity는 여전히 취약할 수 있습니다.",
  ],
  "llm-evaluators": [
    "prompt, model version, calibration, local deployment 조건에 따라 재현성이 흔들립니다.",
    "static dashboard에서는 precomputed example만 보여주고 live LLM judge는 돌리지 않습니다.",
  ],
  "clinical-acceptance": [
    "reader 수, case mix, blinding, adjudication 설계가 결론에 큰 영향을 줍니다.",
    "human acceptance는 자동 benchmark reporting을 대체하지 않습니다.",
  ],
} as const;
```

- [ ] **Step 7: Verify**

Run:

```bash
npm run test -- src/topics/report-generation/content.test.ts src/components/figures/MetricFigure.test.tsx src/components/metrics/metricTextLinks.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/figures/ReportGenerationFigures.tsx src/components/figures/MetricFigure.tsx src/components/metrics/metricTextLinks.ts src/topics/report-generation/content.ts src/topics/report-generation/contentKo.ts src/topics/report-generation/content.test.ts
git commit -m "feat: add report generation learn content"
```

---

## Task 4: Add Playground Presets And Text Playground

**Files:**
- Create: `src/topics/report-generation/reportExamples.ts`
- Create: `src/topics/report-generation/presets.ts`
- Create: `src/topics/report-generation/presets.test.ts`
- Create: `src/topics/report-generation/Playground.tsx`
- Create: `src/topics/report-generation/Playground.test.tsx`

- [ ] **Step 1: Write preset tests**

Create `src/topics/report-generation/presets.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { winner } from "../../components/metrics/detectDisagreements";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import { REPORT_PRESETS } from "./presets";

describe("report generation presets", () => {
  it("ships four instructive preset examples", () => {
    expect(REPORT_PRESETS.map((preset) => preset.id)).toEqual([
      "negation-flip",
      "laterality-swap",
      "temporal-change",
      "entity-swap",
    ]);
  });

  it("each preset produces an A-vs-B rank flip", () => {
    for (const preset of REPORT_PRESETS) {
      const winners = reportComparisonRows(
        preset.reference,
        preset.candidateA,
        preset.candidateB,
      ).map(winner);
      expect(winners).toContain("A");
      expect(winners).toContain("B");
    }
  });

  it("each preset declares the learner action that should be felt", () => {
    for (const preset of REPORT_PRESETS) {
      expect(preset.description.length).toBeGreaterThan(20);
      expect(preset.descriptionKo.length).toBeGreaterThan(10);
    }
  });
});
```

- [ ] **Step 2: Add shared examples**

Create `src/topics/report-generation/reportExamples.ts`:

```typescript
export interface ReportExample {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  descriptionKo: string;
  reference: string;
  candidateA: string;
  candidateB: string;
}

export const NEGATION_FLIP: ReportExample = {
  id: "negation-flip",
  label: "Negation flip",
  labelKo: "부정 뒤집힘",
  description: "Lexical overlap can favor the unsafe candidate.",
  descriptionKo: "단어 겹침은 위험한 candidate를 앞세울 수 있습니다.",
  reference: "Mild cardiomegaly. No focal airspace consolidation, pleural effusion, or pneumothorax.",
  candidateA: "The cardiac silhouette is mildly enlarged. The lungs are clear. No pleural fluid or pneumothorax is seen.",
  candidateB: "Mild cardiomegaly. Focal airspace consolidation, pleural effusion, and pneumothorax are present.",
};

export const LATERALITY_SWAP: ReportExample = {
  id: "laterality-swap",
  label: "Laterality swap",
  labelKo: "좌우 바뀜",
  description: "The phrase template stays close while the side changes.",
  descriptionKo: "문장 틀은 비슷하지만 병변 방향이 바뀝니다.",
  reference: "Right lower lobe opacity suspicious for pneumonia. No pleural effusion.",
  candidateA: "There is airspace opacity in the right lower lung, concerning for pneumonia. No pleural fluid is present.",
  candidateB: "Left lower lobe opacity suspicious for pneumonia. No pleural effusion.",
};

export const TEMPORAL_CHANGE: ReportExample = {
  id: "temporal-change",
  label: "Temporal change error",
  labelKo: "변화 방향 오류",
  description: "Improved versus worsened changes the clinical message.",
  descriptionKo: "호전과 악화는 임상 메시지를 반대로 만듭니다.",
  reference: "Compared with the prior study, pulmonary edema has improved. Small bilateral pleural effusions are stable.",
  candidateA: "Pulmonary edema is decreased from prior. Small pleural effusions are unchanged bilaterally.",
  candidateB: "Compared with the prior study, pulmonary edema has worsened. Small bilateral pleural effusions are stable.",
};

export const ENTITY_SWAP: ReportExample = {
  id: "entity-swap",
  label: "Entity/assertion swap",
  labelKo: "entity/assertion 교환",
  description: "The right entities appear, but presence and absence attach to the wrong finding.",
  descriptionKo: "entity 단어는 맞지만 present/absent가 잘못 붙습니다.",
  reference: "Right pneumothorax. No pleural effusion.",
  candidateA: "A pneumothorax is present on the right. Pleural effusion is absent.",
  candidateB: "Right pleural effusion. No pneumothorax.",
};
```

- [ ] **Step 3: Add presets**

Create `src/topics/report-generation/presets.ts`:

```typescript
import {
  ENTITY_SWAP,
  LATERALITY_SWAP,
  NEGATION_FLIP,
  TEMPORAL_CHANGE,
} from "./reportExamples";

export const REPORT_PRESETS = [
  NEGATION_FLIP,
  LATERALITY_SWAP,
  TEMPORAL_CHANGE,
  ENTITY_SWAP,
] as const;
```

- [ ] **Step 4: Implement Playground**

Create `src/topics/report-generation/Playground.tsx` implementing this concrete surface:

- `useState` for `reference`, `candidateA`, `candidateB`, and `activePresetId`.
- Empty initial values.
- A `stage` derived from which fields are non-empty.
- Three textareas with labels.
- Collapsed `details` preset row.
- Live `MetricTable` only when all three fields are non-empty.
- `ReportCueBoard` SVG/HTML preview below the textareas.

Use this minimum state logic exactly:

```tsx
function stage(reference: string, candidateA: string, candidateB: string) {
  if (!reference.trim()) return "reference";
  if (!candidateA.trim()) return "candidateA";
  if (!candidateB.trim()) return "candidateB";
  return "compare";
}
```

Use `reportComparisonRows(reference, candidateA, candidateB)` for rows. Render the three textareas with these stable accessible labels:

```typescript
const FIELD_LABELS = {
  ko: {
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
  },
  en: {
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
  },
} as const;
```

Render this exact compare-unlocked note above the table:

```typescript
const COMPARE_NOTE = {
  ko:
    "어떤 candidate가 앞서는지는 metric이 보는 단위에 따라 달라집니다. Lexical row와 clinical cue row가 갈라지는 지점을 보세요.",
  en:
    "The leading candidate changes with the unit the metric can observe. Watch where lexical rows and clinical-cue rows split.",
} as const;
```

Use these inline UI constraints:

- Textareas: `minHeight: 110`, full width, no monospace requirement.
- Preset buttons: `aria-pressed={preset.id === activePresetId}`.
- Metrics panel: render only when `stage(...) === "compare"`.
- Cue board: render whenever any field has text; empty fields show `No cues yet` / `아직 cue 없음`.
- No sliders, upload buttons, model selectors, or external API controls.

- [ ] **Step 5: Write Playground behavior test**

Create `src/topics/report-generation/Playground.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Playground from "./Playground";

describe("report generation Playground", () => {
  it("boots empty and gates metrics until all three reports exist", () => {
    render(<Playground />);
    expect(screen.getByLabelText(/Reference/i)).toHaveValue("");
    expect(screen.queryByText(/Lexical overlap proxy/i)).not.toBeInTheDocument();
  });

  it("loads a preset and clears the active highlight after manual edit", async () => {
    const user = userEvent.setup();
    render(<Playground />);

    await user.click(screen.getByText(/Load an example|예시 불러오기/i));
    await user.click(screen.getByRole("button", { name: /Negation flip|부정 뒤집힘/i }));
    expect(screen.getByText(/Lexical overlap proxy/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Candidate A/i), " edited");
    expect(screen.getByRole("button", { name: /Negation flip|부정 뒤집힘/i })).not.toHaveAttribute("aria-pressed", "true");
  });

  it("lets a single report edit change the visible clinical cue rows", async () => {
    const user = userEvent.setup();
    render(<Playground />);

    await user.type(screen.getByLabelText(/Reference/i), "Right pneumothorax has improved. No pleural effusion.");
    await user.type(screen.getByLabelText(/Candidate A/i), "Right pneumothorax has improved. No pleural effusion.");
    await user.type(screen.getByLabelText(/Candidate B/i), "Left pneumothorax has worsened. Pleural effusion is present.");

    expect(screen.getByText(/Laterality F1/i)).toBeInTheDocument();
    expect(screen.getByText(/Temporal F1/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety error count/i)).toBeInTheDocument();
    expect(screen.getAllByText(/right|left|improved|worsened|present|absent/i).length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 6: Verify**

Run:

```bash
npm run test -- src/topics/report-generation/presets.test.ts src/topics/report-generation/Playground.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/topics/report-generation/reportExamples.ts src/topics/report-generation/presets.ts src/topics/report-generation/presets.test.ts src/topics/report-generation/Playground.tsx src/topics/report-generation/Playground.test.tsx
git commit -m "feat: add report generation playground"
```

---

## Task 5: Add Read-Only Scenarios

**Files:**
- Create: `src/topics/report-generation/scenarios.ts`
- Create: `src/topics/report-generation/scenariosKo.ts`
- Create: `src/topics/report-generation/comparison.test.ts`
- Modify: `src/app/ScenariosView.tsx`

- [ ] **Step 1: Write scenario comparison test**

Create `src/topics/report-generation/comparison.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { winner } from "../../components/metrics/detectDisagreements";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import { reportGenerationScenarios } from "./scenarios";

describe("report generation scenarios", () => {
  it("each scenario has reportGeneration state and a true rank flip", () => {
    for (const scenario of reportGenerationScenarios) {
      const report = scenario.state.reportGeneration;
      expect(report).toBeDefined();
      if (!report) throw new TypeError("reportGeneration state missing");

      const winners = reportComparisonRows(
        report.reference,
        report.candidateA,
        report.candidateB,
      ).map(winner);
      expect(winners).toContain("A");
      expect(winners).toContain("B");
    }
  });

  it("each scenario explains which metric-observed unit caused the flip", () => {
    const required = /lexical|assertion|laterality|temporal|entity|Lexical|Temporal|RaTEscore/;
    for (const scenario of reportGenerationScenarios) {
      expect(scenario.teachingPoint).toMatch(required);
    }
  });
});
```

- [ ] **Step 2: Add scenarios**

Create `src/topics/report-generation/scenarios.ts` with four scenarios:

```typescript
import type { Scenario } from "../../types/topic";
import {
  ENTITY_SWAP,
  LATERALITY_SWAP,
  NEGATION_FLIP,
  TEMPORAL_CHANGE,
} from "./reportExamples";

const EMPTY_GEOMETRY = {
  grid: { width: 256, height: 256, spacingMm: [1, 1] as [number, number] },
  gt: [],
  predictions: [],
  policy: { emptyDice: "one", emptyDistance: "undefined" } as const,
};

function state(example: typeof NEGATION_FLIP) {
  return {
    ...EMPTY_GEOMETRY,
    reportGeneration: {
      reference: example.reference,
      candidateA: example.candidateA,
      candidateB: example.candidateB,
    },
  };
}

export const reportGenerationScenarios: Scenario[] = [
  {
    id: "negation-hallucination",
    title: "Negation hallucination: familiar words, unsafe assertion",
    clinical: {
      situation: "Routine CXR report generation",
      modality: "Chest X-ray report",
      atStake: "Hallucinating pneumothorax or pleural effusion can trigger urgent follow-up.",
      consequence: "Lexical similarity can hide a false finding.",
    },
    state: state(NEGATION_FLIP),
    teachingPoint:
      "Candidate B reuses more reference terms, but flips absent findings into present findings. Lexical overlap can lead B while assertion-aware rows lead A.",
    reference: "PPTX slides 7-9: NLG metric failure example.",
  },
  {
    id: "laterality-swap",
    title: "Laterality swap: same phrase, wrong side",
    clinical: {
      situation: "Pneumonia location in a generated CXR impression",
      modality: "Chest X-ray report",
      atStake: "Wrong-side localization changes follow-up and communication.",
      consequence: "High word overlap can still point clinicians to the wrong side.",
    },
    state: state(LATERALITY_SWAP),
    teachingPoint:
      "Candidate B keeps the phrase template but changes right to left. Laterality-aware rows lead A even when lexical overlap is close.",
    reference: "PPTX slide 9: laterality failure example.",
  },
  {
    id: "temporal-direction",
    title: "Temporal direction: improved versus worsened",
    clinical: {
      situation: "Follow-up CXR after treatment",
      modality: "Serial chest X-ray report",
      atStake: "Improved versus worsened changes treatment urgency.",
      consequence: "A temporal direction error can invert the clinical message.",
    },
    state: state(TEMPORAL_CHANGE),
    teachingPoint:
      "Candidate B repeats the comparison structure but reverses improved to worsened. Temporal F1 leads A while lexical overlap remains high for B.",
    reference: "PPTX slide 11: Temporal F1.",
  },
  {
    id: "entity-assertion-swap",
    title: "Entity assertion swap: right vocabulary, wrong attachment",
    clinical: {
      situation: "Short report with two clinically important entities",
      modality: "Chest X-ray report",
      atStake: "Pneumothorax and pleural effusion have different management implications.",
      consequence: "Entity words are present but attached to the wrong assertion.",
    },
    state: state(ENTITY_SWAP),
    teachingPoint:
      "Candidate B contains the right vocabulary but assigns presence and absence to the wrong entities. Entity/assertion rows lead A.",
    reference: "PPTX slides 15-16: BERTScore vs RaTEscore entity example.",
  },
];
```

Create `src/topics/report-generation/scenariosKo.ts` with these four scenarios. Preserve metric tokens exactly: `Lexical overlap`, `Temporal F1`, `RaTEscore`.

```typescript
import type { Scenario } from "../../types/topic";
import {
  ENTITY_SWAP,
  LATERALITY_SWAP,
  NEGATION_FLIP,
  TEMPORAL_CHANGE,
} from "./reportExamples";

const EMPTY_GEOMETRY = {
  grid: { width: 256, height: 256, spacingMm: [1, 1] as [number, number] },
  gt: [],
  predictions: [],
  policy: { emptyDice: "one", emptyDistance: "undefined" } as const,
};

function state(example: typeof NEGATION_FLIP) {
  return {
    ...EMPTY_GEOMETRY,
    reportGeneration: {
      reference: example.reference,
      candidateA: example.candidateA,
      candidateB: example.candidateB,
    },
  };
}

export const reportGenerationScenariosKo: Scenario[] = [
  {
    id: "negation-hallucination",
    title: "Negation hallucination: 익숙한 단어, 위험한 assertion",
    clinical: {
      situation: "일상적인 CXR report generation",
      modality: "Chest X-ray report",
      atStake: "pneumothorax나 pleural effusion hallucination은 불필요한 urgent follow-up을 만들 수 있습니다.",
      consequence: "단어가 비슷해도 false finding이 숨어 있을 수 있습니다.",
    },
    state: state(NEGATION_FLIP),
    teachingPoint:
      "Candidate B는 reference 단어를 더 많이 재사용하지만 absent finding을 present finding으로 뒤집습니다. Lexical overlap은 B를 앞세울 수 있고 assertion-aware row는 A를 앞세웁니다.",
    reference: "PPTX slides 7-9: NLG metric failure example.",
  },
  {
    id: "laterality-swap",
    title: "Laterality swap: 문장 틀은 같고 방향은 반대",
    clinical: {
      situation: "CXR impression에서 pneumonia 위치를 생성하는 상황",
      modality: "Chest X-ray report",
      atStake: "wrong-side localization은 follow-up과 임상 커뮤니케이션을 바꿉니다.",
      consequence: "높은 word overlap이 실제 병변 방향 오류를 가릴 수 있습니다.",
    },
    state: state(LATERALITY_SWAP),
    teachingPoint:
      "Candidate B는 phrase template을 유지하지만 right를 left로 바꿉니다. Lexical overlap이 비슷해도 laterality-aware row는 A를 앞세워야 합니다.",
    reference: "PPTX slide 9: laterality failure example.",
  },
  {
    id: "temporal-direction",
    title: "Temporal direction: improved와 worsened",
    clinical: {
      situation: "치료 후 follow-up CXR",
      modality: "Serial chest X-ray report",
      atStake: "improved와 worsened는 치료 urgency를 반대로 만듭니다.",
      consequence: "temporal direction error는 report의 clinical message를 뒤집습니다.",
    },
    state: state(TEMPORAL_CHANGE),
    teachingPoint:
      "Candidate B는 comparison 구조를 반복하지만 improved를 worsened로 뒤집습니다. Temporal F1은 A를 앞세우고 Lexical overlap은 B에 높게 남을 수 있습니다.",
    reference: "PPTX slide 11: Temporal F1.",
  },
  {
    id: "entity-assertion-swap",
    title: "Entity assertion swap: 단어는 맞지만 연결이 틀림",
    clinical: {
      situation: "두 개의 중요한 entity가 있는 짧은 CXR report",
      modality: "Chest X-ray report",
      atStake: "pneumothorax와 pleural effusion은 management implication이 다릅니다.",
      consequence: "entity 단어가 모두 있어도 present/absent 연결이 바뀌면 임상 의미가 달라집니다.",
    },
    state: state(ENTITY_SWAP),
    teachingPoint:
      "Candidate B는 필요한 vocabulary를 포함하지만 presence와 absence를 잘못된 entity에 붙입니다. Entity/assertion row는 A를 앞세워야 하며, 이 예시는 RaTEscore가 보려는 방향을 보여줍니다.",
    reference: "PPTX slides 15-16: BERTScore vs RaTEscore entity example.",
  },
];
```

- [ ] **Step 3: Add report scenario preview branch**

Modify `src/app/ScenariosView.tsx`:

- Import `reportComparisonRows`.
- In `L`, add Korean/English labels for `referenceReport`, `candidateA`, and `candidateB`.
- Add a `ReportScenarioPreview` component before `ScenarioPreview`.
- In `ScenarioPreview`, check `if (state.reportGeneration) return <ReportScenarioPreview scenario={scenario} lang={lang} />;`.

The preview renders exactly:

- Three compact text blocks: Reference, Candidate A, Candidate B.
- A legend using `--c-gt`, `--c-pred-a`, `--c-pred-b`, `--c-warn`.
- `<MetricTable rows={reportComparisonRows(reference, candidateA, candidateB)} />`.

Do not add controls or sliders.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/topics/report-generation/comparison.test.ts src/app/ScenariosView.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/topics/report-generation/scenarios.ts src/topics/report-generation/scenariosKo.ts src/topics/report-generation/comparison.test.ts src/app/ScenariosView.tsx
git commit -m "feat: add report generation scenarios"
```

---

## Task 6: Register Topic

**Files:**
- Create: `src/topics/report-generation/index.ts`
- Modify: `src/app/topicRegistry.ts`
- Modify: `src/app/topicRegistry.test.ts`

- [ ] **Step 1: Add topic index**

Create `src/topics/report-generation/index.ts`:

```typescript
import type { Topic } from "../../types/topic";
import Playground from "./Playground";
import { reportGenerationLearn } from "./content";
import { reportGenerationLearnKo } from "./contentKo";
import { reportGenerationScenarios } from "./scenarios";
import { reportGenerationScenariosKo } from "./scenariosKo";

const reportGenerationTopic: Topic = {
  id: "report-generation",
  group: "language",
  title: "LLM — Report Generation",
  status: "available",
  learn: reportGenerationLearn,
  learnKo: reportGenerationLearnKo,
  Playground,
  scenarios: reportGenerationScenarios,
  scenariosKo: reportGenerationScenariosKo,
};

export default reportGenerationTopic;
```

- [ ] **Step 2: Register topic and remove stub**

Modify `src/app/topicRegistry.ts`:

```typescript
import reportGenerationTopic from "../topics/report-generation";
```

Remove this line from `STUB_TOPICS`:

```typescript
  stub("report-generation", "language", "LLM — Report Generation"),
```

Add `reportGenerationTopic` to `TOPICS` before stubs:

```typescript
  reportGenerationTopic,
```

- [ ] **Step 3: Update registry test**

Modify `src/app/topicRegistry.test.ts`:

```typescript
  it("registers all nine topics", () => {
    expect(TOPICS.length).toBe(9);
  });

  it("marks classification, regression, segmentation, detection, and report generation as available", () => {
    const available = TOPICS.filter((t) => t.status === "available").map((t) => t.id).sort();
    expect(available).toEqual([
      "classification",
      "detection",
      "regression",
      "report-generation",
      "segmentation",
    ]);
  });
```

Keep total count at 9 because a stub is replaced, not added.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/app/topicRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/topics/report-generation/index.ts src/app/topicRegistry.ts src/app/topicRegistry.test.ts
git commit -m "feat: register report generation topic"
```

---

## Task 7: Full Verification

**Files:**
- Verify: all files touched above.

- [ ] **Step 1: Run focused report-generation tests**

Run:

```bash
npm run test -- src/engine/metrics/reportGeneration.test.ts src/components/metrics/reportComparisonRows.test.ts src/topics/report-generation/content.test.ts src/topics/report-generation/presets.test.ts src/topics/report-generation/Playground.test.tsx src/topics/report-generation/comparison.test.ts src/app/topicRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual UI QA**

Run:

```bash
npm run dev
```

Open the local URL Vite prints. Verify:

- Sidebar shows `LLM — Report Generation` under `Language & multimodal`.
- Learn has six sections and Korean default copy.
- Playground boots empty.
- Loading `부정 뒤집힘` fills all three textareas and shows metric rows.
- Editing Candidate A clears the active preset highlight.
- Scenarios show four read-only cards, no controls.
- No text uses absolute grade verdicts.

- [ ] **Step 5: Commit any QA fixes**

If fixes were needed:

```bash
git add src
git commit -m "fix: polish report generation topic"
```

Expected: no remaining report-generation changes.

---

## Self-Review

- Spec coverage: This plan covers how the page is organized, exact examples, Playground behavior, scenario cards, engine constraints, topic registration, and verification.
- Product thesis: The plan forbids absolute grade verdicts and frames every result as metric-dependent.
- Unification: The topic reaches Learn, Playground, and Scenarios parity.
- Engine purity: Live metrics are pure deterministic TypeScript. External clinical metrics are explained, not run.
- YAGNI: No NLP dependency, no LLM API, no upload, no real CheXbert/RadGraph runtime.
- Highest risk: The toy cue extractor can be misunderstood as a real clinical metric. The Learn and Playground copy must repeatedly call it a proxy.

import type { LearnContent } from "../../types/topic";

export const reportGenerationLearn: LearnContent = {
  intro:
    "Clinical report generation is not just image captioning with medical words. A report can look close to the reference while flipping negation, laterality, severity, or temporal change. This topic compares lexical overlap, embedding similarity, concept/graph metrics, LLM evaluators, and human acceptance so the failure mode each metric misses stays visible.",
  sections: [
    {
      id: "lexical-overlap",
      title: "BLEU · ROUGE · METEOR",
      formula:
        "\\mathrm{OverlapProxyF1} = \\frac{2|\\mathrm{tok}(R)\\cap\\mathrm{tok}(C)|}{|\\mathrm{tok}(R)| + |\\mathrm{tok}(C)|}",
      meaning:
        "This metric family observes surface tokens, so it reacts when wording changes. BLEU, ROUGE, and METEOR summarize surface overlap; the live Playground uses a simple token-overlap proxy, not the full published implementations.",
      features: [
        "Useful for legacy comparison with prior report generation papers.",
        "Cheap, deterministic, and easy to reproduce.",
        "Highlights whether the candidate reused reference wording.",
      ],
      caveats: [
        "Can reward a report that reuses reference terms while flipping negation.",
        "Usually assumes one reference, although one image can support multiple acceptable reports.",
        "Does not understand laterality, clinical severity, or temporal direction.",
      ],
      figure: "report-lexical-overlap",
      complements: "Pair lexical rows with assertion, laterality, and temporal cue rows.",
    },
    {
      id: "embedding-similarity",
      title: "BERTScore · RaTEscore",
      formula:
        "\\mathrm{EntityF1} = \\frac{2\\,TP_{\\mathrm{entity}}}{2\\,TP_{\\mathrm{entity}} + FP_{\\mathrm{entity}} + FN_{\\mathrm{entity}}}",
      meaning:
        "This metric family observes contextual tokens or medical entities, so it reacts when the candidate keeps familiar words but attaches them to the wrong entity or assertion. The dashboard represents this idea with entity/assertion matching, not a transformer model.",
      features: [
        "More tolerant of paraphrase than pure n-gram overlap.",
        "Entity-aware variants focus scoring on clinically relevant terms.",
        "Helps show why fluid and effusion can be closer than raw tokens suggest.",
      ],
      caveats: [
        "Embedding similarity can still miss assertion swaps such as pneumothorax present versus absent.",
        "Entity extraction quality becomes part of the metric.",
        "A high similarity score is not the same as radiologist acceptance.",
      ],
      figure: "report-entity-similarity",
      complements: "Pair BERTScore or RaTEscore with relation-aware and safety-error views.",
    },
    {
      id: "concept-label-f1",
      title: "Temporal F1 · CheXbert F1 · SRR-BERT F1",
      formula:
        "\\mathrm{LabelF1} = \\frac{2\\,TP_{\\mathrm{label}}}{2\\,TP_{\\mathrm{label}} + FP_{\\mathrm{label}} + FN_{\\mathrm{label}}}",
      meaning:
        "This metric family observes finding labels and temporal labels, so it reacts when improved, worsened, stable, new, or resolved changes. Concept-label metrics move evaluation from wording toward clinical content.",
      features: [
        "Directly measures whether key findings are mentioned.",
        "Temporal F1 can isolate improved, worsened, stable, new, or resolved statements.",
        "CheXbert and SRR-BERT style outputs are intuitive for benchmark tables.",
      ],
      caveats: [
        "Label vocabularies are limited.",
        "Location, laterality, severity, and relations can be lost.",
        "Scores depend on the report labeler, not only on the generator.",
      ],
      figure: "report-label-f1",
      complements: "Pair label F1 with graph and acceptance checks when location matters.",
    },
    {
      id: "graph-f1",
      title: "RadGraph F1",
      formula:
        "\\mathrm{GraphF1} = \\frac{2\\,TP_{\\mathrm{entity,relation}}}{2\\,TP_{\\mathrm{entity,relation}} + FP_{\\mathrm{entity,relation}} + FN_{\\mathrm{entity,relation}}}",
      meaning:
        "This metric family observes entity-relation pairs, so it reacts when a finding is linked to the wrong assertion, side, or anatomical site. RadGraph-style metrics compare extracted entities and relations.",
      features: [
        "Better aligned with negation and location errors than label-only metrics.",
        "Can expose relation mistakes hidden by lexical overlap.",
        "Useful when entity structure matters more than fluent prose.",
      ],
      caveats: [
        "Relation extraction errors propagate into the score.",
        "Synonyms and severity granularity may still be brittle.",
        "Graph F1 is still a proxy for clinical acceptability.",
      ],
      figure: "report-graph-f1",
      complements: "Pair RadGraph F1 with GREEN or CRIMSON style error categories.",
    },
    {
      id: "llm-evaluators",
      title: "GREEN · CRIMSON",
      formula: "\\mathrm{ErrorScore} = \\sum_i w_i\\,\\mathbf{1}[\\mathrm{error}_i]",
      meaning:
        "This metric family observes clinical error categories, so it reacts when a false finding, omission, location error, severity error, or comparison/change error appears. GREEN emphasizes error detection; CRIMSON adds context and severity weighting.",
      features: [
        "Can express clinically meaningful error categories.",
        "Can weight patient-safety impact instead of treating every mismatch equally.",
        "Useful for reviewer-facing qualitative error analysis.",
      ],
      caveats: [
        "Prompt, model version, calibration, and local deployment details affect reproducibility.",
        "LLM judges can inherit blind spots from their training data.",
        "For this static dashboard, show precomputed examples only.",
      ],
      figure: "report-llm-evaluator",
      complements: "Pair learned evaluators with deterministic concept rows and reader studies.",
    },
    {
      id: "clinical-acceptance",
      title: "Clinical Acceptance",
      meaning:
        "This endpoint observes radiologist workflow decisions, so it reacts when an AI draft changes editing time, acceptability, or significant-error burden. Clinical acceptance asks whether radiologists can actually use the generated report in context.",
      features: [
        "Captures whether the report is acceptable in a real reading workflow.",
        "Can include editing time, blinded reader preference, and significant versus insignificant errors.",
        "Connects metric scores to patient-safety relevance.",
      ],
      caveats: [
        "Expensive and slower than automatic metrics.",
        "Study design matters: reader count, case mix, blinding, ICU/exclusion criteria, and adjudication affect conclusions.",
        "Human acceptance does not replace automatic benchmark reporting.",
      ],
      figure: "report-clinical-acceptance",
      complements: "Use acceptance studies as endpoint evidence after automatic metrics reveal failure modes.",
    },
  ],
  complementarity: {
    intro:
      "Report metrics complement one another because each family observes a different unit: tokens, entities, labels, relations, error categories, or workflow decisions.",
    pairs: [
      {
        blindMetric: "BLEU · ROUGE · METEOR",
        blindSpot: "Negation, laterality, and temporal direction can flip while wording stays similar.",
        caughtBy: "Assertion F1, Laterality F1, Temporal F1, RadGraph F1, GREEN · CRIMSON",
      },
      {
        blindMetric: "CheXbert F1 · SRR-BERT F1",
        blindSpot: "Label matches can hide wrong side, location, or relation.",
        caughtBy: "RadGraph F1 and LLM evaluator error categories",
      },
    ],
    benchmarks: [
      {
        name: "Engineering report-generation paper",
        task: "CXR report generation",
        combination: "BLEU/ROUGE/METEOR + CheXbert F1 + RadGraph F1 + GREEN",
        perspective: "Legacy comparability plus clinical content and error categories",
      },
      {
        name: "Clinical reader study",
        task: "Draft report acceptance",
        combination: "Automatic metrics + blinded radiologist acceptance/editing-time study",
        perspective: "Workflow endpoint and patient-safety relevance",
      },
    ],
  },
};

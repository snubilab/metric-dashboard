import type { LearnContent } from "../../types/topic";

export const reportGenerationLearn: LearnContent = {
  intro:
    "Clinical report generation is not just image captioning with medical words. A report can look close to the reference while flipping negation, laterality, severity, or temporal change. This topic compares lexical overlap, embedding similarity, concept/graph metrics, LLM evaluators, and human acceptance so the failure mode each metric misses stays visible.",
  sections: [
    {
      id: "bleu",
      title: "BLEU",
      formula: "\\mathrm{BLEU}\\text{-}1=\\frac{\\mathrm{matched\\ candidate\\ unigrams}}{\\mathrm{candidate\\ unigrams}}",
      meaning:
        "BLEU observes candidate-side n-gram precision. In report generation it answers: how many words in the generated report also appear in the reference?",
      features: [
        "Useful for legacy comparison with prior report generation papers.",
        "Cheap, deterministic, and easy to reproduce.",
        "Makes reference-word reuse very visible.",
      ],
      caveats: [
        "Precision can stay high when the candidate reuses disease words but flips negation.",
        "Brevity and n-gram settings change the final BLEU variant.",
        "It does not know whether pneumothorax is present or absent.",
      ],
      figure: "report-bleu",
      complements: "Pair BLEU with assertion-aware and error-category rows.",
    },
    {
      id: "rouge-l",
      title: "ROUGE-L",
      formula: "\\mathrm{ROUGE}\\text{-}L=\\frac{\\mathrm{LCS}(R,C)}{|R|}",
      meaning:
        "ROUGE-L observes reference-side recall through the longest common subsequence. It asks how much of the reference wording was recovered, in order.",
      features: [
        "Useful when omission of reference content is the main concern.",
        "Keeps word order more visible than bag-of-word overlap.",
        "Easy to explain as reference recall.",
      ],
      caveats: [
        "A clinically wrong report can recall many reference words.",
        "Paraphrases can be penalized even when the clinical content is preserved.",
        "Laterality and temporal direction are still just tokens.",
      ],
      figure: "report-rouge",
      complements: "Pair ROUGE-L with entity and temporal rows.",
    },
    {
      id: "meteor",
      title: "METEOR",
      formula: "\\mathrm{METEOR}\\approx F_{mean}(P,R)\\,(1-\\mathrm{penalty})",
      meaning:
        "METEOR observes unigram precision and recall, with stemming or synonym matching and a fragmentation penalty. It is more forgiving than BLEU when wording changes.",
      features: [
        "Can connect simple synonyms such as fluid and effusion.",
        "Balances candidate precision and reference recall.",
        "More paraphrase-aware than raw n-gram precision.",
      ],
      caveats: [
        "Synonym matching is not clinical reasoning.",
        "It can still miss assertion swaps and wrong-side findings.",
        "The static Playground uses a small synonym proxy rather than full METEOR.",
      ],
      figure: "report-meteor",
      complements: "Pair METEOR with clinical concept and graph metrics.",
    },
    {
      id: "bertscore",
      title: "BERTScore",
      formula:
        "\\mathrm{F}_{BERT}=\\frac{2P_{BERT}R_{BERT}}{P_{BERT}+R_{BERT}}",
      meaning:
        "BERTScore observes contextual token similarity. It compares every candidate token to the most similar reference token instead of requiring exact word overlap.",
      features: [
        "More tolerant of paraphrase than pure n-gram overlap.",
        "Uses contextual embeddings rather than exact strings.",
        "Explains why semantically close wording can score above raw token overlap.",
      ],
      caveats: [
        "All-token similarity can be distracted by clinically irrelevant wording.",
        "It can still miss entity/assertion swaps.",
        "A high similarity score is not radiologist acceptance.",
      ],
      figure: "report-bertscore",
      complements: "Pair BERTScore with RaTEscore or RadGraph F1.",
    },
    {
      id: "ratescore",
      title: "RaTEscore",
      formula:
        "\\mathrm{RaTEscore}\\approx\\mathrm{BERTScore}(\\mathrm{medical\\ entities})",
      meaning:
        "RaTEscore filters the comparison toward radiology entities before computing semantic similarity. It asks whether the clinically relevant entities line up.",
      features: [
        "Focuses on medical entities instead of every token.",
        "Closer to the PPT example where pneumothorax and pleural effusion swap roles.",
        "Helps separate surface fluency from clinical entity alignment.",
      ],
      caveats: [
        "Entity extraction errors become metric errors.",
        "Assertion and relation errors still need explicit checks.",
        "The Playground represents it with an entity/assertion proxy.",
      ],
      figure: "report-ratescore",
      complements: "Pair RaTEscore with RadGraph F1.",
    },
    {
      id: "temporal-f1",
      title: "Temporal F1",
      formula:
        "\\mathrm{TemporalF1}=\\frac{2\\,TP_{\\mathrm{change}}}{2\\,TP_{\\mathrm{change}}+FP_{\\mathrm{change}}+FN_{\\mathrm{change}}}",
      meaning:
        "Temporal F1 observes change labels such as improved, worsened, stable, new, and resolved. It matters only when a prior comparison exists.",
      features: [
        "Temporal F1 can isolate improved, worsened, stable, new, or resolved statements.",
        "Very intuitive for follow-up CXR reports.",
        "Catches clinical direction changes that lexical metrics can leave high.",
      ],
      caveats: [
        "Single-CXR reports without priors may not contain temporal signal.",
        "Synonym handling matters: improved and decreased should align.",
        "It does not evaluate non-temporal clinical correctness.",
      ],
      figure: "report-temporal-f1",
      complements: "Pair Temporal F1 with concept labels and graph metrics.",
    },
    {
      id: "chexbert-f1",
      title: "CheXbert F1",
      formula:
        "\\mathrm{CheXbertF1}=\\frac{2\\,TP_{\\mathrm{label}}}{2\\,TP_{\\mathrm{label}}+FP_{\\mathrm{label}}+FN_{\\mathrm{label}}}",
      meaning:
        "CheXbert F1 observes a fixed set of chest X-ray finding labels extracted from the reference and candidate reports.",
      features: [
        "Directly measures whether key CXR findings are mentioned.",
        "Easy to read as label presence/absence agreement.",
        "Common in report-generation benchmark tables.",
      ],
      caveats: [
        "The label set is limited.",
        "Severity, location, laterality, and relation detail can disappear.",
        "The labeler performance is mixed into the generator score.",
      ],
      figure: "report-chexbert-f1",
      complements: "Pair CheXbert F1 with RadGraph F1 when location matters.",
    },
    {
      id: "srr-bert-f1",
      title: "SRR-BERT F1",
      formula:
        "\\mathrm{SRR}\\text{-}\\mathrm{BERTF1}=\\frac{2\\,TP_{55\\ labels}}{2\\,TP_{55\\ labels}+FP+FN}",
      meaning:
        "SRR-BERT F1 observes a broader CXR label vocabulary than CheXbert. In this Playground proxy, it also reacts to simple side and change attributes so its granularity differs from coarse finding labels.",
      features: [
        "Broader label coverage than a 14-label setup.",
        "Still intuitive: compare extracted labels and simple attributes between reference and candidate.",
        "Useful when benchmark labels need more granularity.",
      ],
      caveats: [
        "It is still a label-vocabulary metric.",
        "Level mismatch, severity, location, and relation errors can remain hidden.",
        "The extractor's errors are inherited by the metric.",
      ],
      figure: "report-srr-bert-f1",
      complements: "Pair SRR-BERT F1 with graph and error-category metrics.",
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
      id: "green",
      title: "GREEN",
      formula: "\\mathrm{ErrorScore} = \\sum_i w_i\\,\\mathbf{1}[\\mathrm{error}_i]",
      meaning:
        "GREEN observes clinical error categories: false finding, omission, location error, severity error, unsupported comparison/change, and missing comparison/change.",
      features: [
        "Can express clinically meaningful error categories.",
        "Shows matched findings and significant errors in one notation.",
        "Useful for reviewer-facing qualitative error analysis.",
      ],
      caveats: [
        "Prompt, model version, calibration, and local deployment details affect reproducibility.",
        "LLM judges can inherit blind spots from their training data.",
        "For this static dashboard, show precomputed examples only.",
      ],
      figure: "report-green",
      complements: "Pair GREEN with CRIMSON when patient context changes severity.",
    },
    {
      id: "crimson",
      title: "CRIMSON",
      formula: "\\mathrm{CRIMSON}=f(\\mathrm{error},\\mathrm{context},\\mathrm{severity})",
      meaning:
        "CRIMSON observes error categories with patient context and severity weighting. It is an LLM-as-a-judge family aimed at safety relevance rather than raw match count.",
      features: [
        "Uses patient context such as indication, age, sex, and guideline cues.",
        "Can downweight negligible findings and emphasize significant errors.",
        "Frames evaluation around diagnosis accuracy, context fit, and patient safety.",
      ],
      caveats: [
        "Depends on the judging model, prompt, and local calibration.",
        "Harder to reproduce than deterministic label metrics.",
        "The static dashboard shows the structure, not a live LLM judge.",
      ],
      figure: "report-crimson",
      complements: "Pair CRIMSON with deterministic automatic metrics and reader studies.",
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

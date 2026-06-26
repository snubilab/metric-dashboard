import type { LearnContent } from "../../types/topic";

export const reportGenerationLearnKo: LearnContent = {
  intro:
    "Report generation 평가는 문장이 reference와 얼마나 비슷한지보다, finding·negation·laterality·temporal change가 임상적으로 맞는지를 먼저 봐야 합니다. BLEU/ROUGE/METEOR는 기존 연구 비교에는 유용하지만, pneumothorax 부정이 뒤집히거나 좌우가 바뀌는 오류를 안전하게 잡지 못합니다. 그래서 clinical report generation은 lexical overlap, embedding similarity, clinical concept/graph, LLM evaluator, human acceptance를 함께 읽어야 합니다.",
  sections: [
    {
      id: "lexical-overlap",
      title: "BLEU · ROUGE · METEOR",
      formula:
        "\\mathrm{OverlapProxyF1} = \\frac{2|\\mathrm{tok}(R)\\cap\\mathrm{tok}(C)|}{|\\mathrm{tok}(R)| + |\\mathrm{tok}(C)|}",
      meaning:
        "이 metric family는 surface token을 보기 때문에 표현이 바뀔 때 반응합니다. Playground는 전체 published metric이 아니라 dependency 없는 token-overlap proxy를 써서 실패 양상을 보여줍니다.",
      features: [
        "기존 report generation 논문과 비교할 때 유용합니다.",
        "싸고 deterministic하며 재현하기 쉽습니다.",
        "candidate가 reference wording을 얼마나 재사용했는지 드러냅니다.",
      ],
      caveats: [
        "negation이 뒤집힌 report도 reference 단어를 많이 재사용하면 높게 나올 수 있습니다.",
        "하나의 CXR에 clinically acceptable한 report가 여러 개일 수 있지만 single reference 비교는 이를 좁게 봅니다.",
        "laterality, clinical severity, temporal direction을 이해하지 못합니다.",
      ],
      figure: "report-lexical-overlap",
      complements: "Lexical row는 assertion, laterality, temporal cue row와 같이 읽어야 합니다.",
    },
    {
      id: "embedding-similarity",
      title: "BERTScore · RaTEscore",
      formula:
        "\\mathrm{EntityF1} = \\frac{2\\,TP_{\\mathrm{entity}}}{2\\,TP_{\\mathrm{entity}} + FP_{\\mathrm{entity}} + FN_{\\mathrm{entity}}}",
      meaning:
        "이 metric family는 contextual token 또는 medical entity를 보기 때문에 익숙한 단어가 남아 있어도 entity/assertion 연결이 바뀌면 반응합니다. 여기서는 transformer를 돌리지 않고 entity/assertion matching으로 같은 직관을 보여줍니다.",
      features: [
        "순수 n-gram overlap보다 paraphrase에 더 관대합니다.",
        "Entity-aware variant는 clinically relevant term에 비교를 집중합니다.",
        "fluid와 effusion처럼 표면 단어가 달라도 가까운 표현을 다룰 수 있습니다.",
      ],
      caveats: [
        "embedding similarity가 assertion swap을 항상 안전하게 잡는 것은 아닙니다.",
        "entity extractor 품질이 metric 품질에 직접 섞입니다.",
        "높은 similarity score가 radiologist acceptance를 의미하지는 않습니다.",
      ],
      figure: "report-entity-similarity",
      complements: "BERTScore나 RaTEscore는 relation-aware view와 safety-error view와 같이 읽어야 합니다.",
    },
    {
      id: "concept-label-f1",
      title: "Temporal F1 · CheXbert F1 · SRR-BERT F1",
      formula:
        "\\mathrm{LabelF1} = \\frac{2\\,TP_{\\mathrm{label}}}{2\\,TP_{\\mathrm{label}} + FP_{\\mathrm{label}} + FN_{\\mathrm{label}}}",
      meaning:
        "이 metric family는 finding label과 temporal label을 보기 때문에 improved, worsened, stable, new, resolved 같은 변화 표현이 바뀔 때 반응합니다.",
      features: [
        "핵심 finding이 언급됐는지 직접 비교합니다.",
        "Temporal F1은 improved, worsened, stable, new, resolved statement를 따로 볼 수 있습니다.",
        "CheXbert와 SRR-BERT 스타일 출력은 benchmark table에서 직관적으로 읽힙니다.",
      ],
      caveats: [
        "label vocabulary 밖의 severity/location/laterality는 사라질 수 있습니다.",
        "labeler 성능이 report generator 성능처럼 보일 수 있습니다.",
        "relation이 중요한 오류는 label F1만으로 부족합니다.",
      ],
      figure: "report-label-f1",
      complements: "Location이 중요할 때는 label F1을 graph와 acceptance check와 같이 읽어야 합니다.",
    },
    {
      id: "graph-f1",
      title: "RadGraph F1",
      formula:
        "\\mathrm{GraphF1} = \\frac{2\\,TP_{\\mathrm{entity,relation}}}{2\\,TP_{\\mathrm{entity,relation}} + FP_{\\mathrm{entity,relation}} + FN_{\\mathrm{entity,relation}}}",
      meaning:
        "이 metric family는 entity-relation pair를 보기 때문에 finding이 wrong assertion, wrong side, wrong anatomical site에 연결될 때 반응합니다.",
      features: [
        "label-only metric보다 negation과 location error에 더 맞춰져 있습니다.",
        "lexical overlap에 숨어 있는 relation mistake를 드러낼 수 있습니다.",
        "fluent prose보다 entity structure가 중요할 때 유용합니다.",
      ],
      caveats: [
        "relation extractor가 틀리면 score도 같이 틀립니다.",
        "동의어와 severity granularity는 여전히 취약할 수 있습니다.",
        "Graph F1도 clinical acceptability의 proxy입니다.",
      ],
      figure: "report-graph-f1",
      complements: "RadGraph F1은 GREEN 또는 CRIMSON 스타일 error category와 같이 읽어야 합니다.",
    },
    {
      id: "llm-evaluators",
      title: "GREEN · CRIMSON",
      formula: "\\mathrm{ErrorScore} = \\sum_i w_i\\,\\mathbf{1}[\\mathrm{error}_i]",
      meaning:
        "이 metric family는 clinical error category를 보기 때문에 false finding, omission, location error, severity error, comparison/change error가 생길 때 반응합니다.",
      features: [
        "임상적으로 의미 있는 error category를 표현할 수 있습니다.",
        "모든 mismatch를 똑같이 보지 않고 patient-safety impact를 가중할 수 있습니다.",
        "reviewer-facing qualitative error analysis에 유용합니다.",
      ],
      caveats: [
        "prompt, model version, calibration, local deployment 조건에 따라 재현성이 흔들립니다.",
        "LLM judge는 training data의 blind spot을 물려받을 수 있습니다.",
        "static dashboard에서는 precomputed example만 보여주고 live LLM judge는 돌리지 않습니다.",
      ],
      figure: "report-llm-evaluator",
      complements: "Learned evaluator는 deterministic concept row와 reader study와 같이 읽어야 합니다.",
    },
    {
      id: "clinical-acceptance",
      title: "Clinical Acceptance",
      meaning:
        "이 endpoint는 radiologist workflow decision을 보기 때문에 AI draft가 editing time, acceptability, significant-error burden을 바꿀 때 반응합니다.",
      features: [
        "report가 실제 reading workflow에서 받아들여질 수 있는지 포착합니다.",
        "editing time, blinded reader preference, significant versus insignificant error를 포함할 수 있습니다.",
        "metric score를 patient-safety relevance와 연결합니다.",
      ],
      caveats: [
        "자동 metric보다 비싸고 느립니다.",
        "reader 수, case mix, blinding, adjudication 설계가 결론에 큰 영향을 줍니다.",
        "human acceptance는 자동 benchmark reporting을 대체하지 않습니다.",
      ],
      figure: "report-clinical-acceptance",
      complements: "Acceptance study는 자동 metric이 failure mode를 보여준 뒤 endpoint evidence로 써야 합니다.",
    },
  ],
  complementarity: {
    intro:
      "Report metric은 token, entity, label, relation, error category, workflow decision처럼 서로 다른 단위를 보기 때문에 같이 읽어야 합니다.",
    pairs: [
      {
        blindMetric: "BLEU · ROUGE · METEOR",
        blindSpot: "문장이 비슷해도 negation, laterality, temporal direction이 뒤집힐 수 있습니다.",
        caughtBy: "Assertion F1, Laterality F1, Temporal F1, RadGraph F1, GREEN · CRIMSON",
      },
      {
        blindMetric: "CheXbert F1 · SRR-BERT F1",
        blindSpot: "label이 맞아도 wrong side, wrong location, wrong relation이 숨을 수 있습니다.",
        caughtBy: "RadGraph F1과 LLM evaluator error category",
      },
    ],
    benchmarks: [
      {
        name: "Engineering report-generation paper",
        task: "CXR report generation",
        combination: "BLEU/ROUGE/METEOR + CheXbert F1 + RadGraph F1 + GREEN",
        perspective: "기존 연구 비교 가능성과 clinical content/error category를 같이 확보",
      },
      {
        name: "Clinical reader study",
        task: "Draft report acceptance",
        combination: "Automatic metrics + blinded radiologist acceptance/editing-time study",
        perspective: "workflow endpoint와 patient-safety relevance 확인",
      },
    ],
  },
};

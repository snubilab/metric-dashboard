import type { LearnContent } from "../../types/topic";

export const reportGenerationLearnKo: LearnContent = {
  intro:
    "Report generation 평가는 문장이 reference와 얼마나 비슷한지보다, finding·negation·laterality·temporal change가 임상적으로 맞는지를 먼저 봐야 합니다. BLEU/ROUGE/METEOR는 기존 연구 비교에는 유용하지만, pneumothorax 부정이 뒤집히거나 좌우가 바뀌는 오류를 안전하게 잡지 못합니다. 그래서 clinical report generation은 lexical overlap, embedding similarity, clinical concept/graph, LLM evaluator, human acceptance를 함께 읽어야 합니다.",
  sections: [
    {
      id: "bleu",
      title: "BLEU",
      formula: "\\mathrm{BLEU}\\text{-}1=\\frac{\\mathrm{matched\\ candidate\\ unigrams}}{\\mathrm{candidate\\ unigrams}}",
      meaning:
        "BLEU는 candidate 쪽 n-gram precision을 봅니다. 생성 report 안의 단어가 reference에도 얼마나 등장하는지를 묻는 지표입니다.",
      features: [
        "기존 report generation 논문과 비교할 때 유용합니다.",
        "싸고 deterministic하며 재현하기 쉽습니다.",
        "candidate가 reference wording을 얼마나 재사용했는지 직관적으로 보여줍니다.",
      ],
      caveats: [
        "질병 단어를 재사용하면 negation이 뒤집혀도 높게 남을 수 있습니다.",
        "brevity penalty와 n-gram 설정에 따라 최종 BLEU variant가 달라집니다.",
        "pneumothorax가 present인지 absent인지는 이해하지 못합니다.",
      ],
      figure: "report-bleu",
      complements: "BLEU는 assertion-aware row와 error-category row와 같이 읽어야 합니다.",
    },
    {
      id: "rouge-l",
      title: "ROUGE-L",
      formula: "\\mathrm{ROUGE}\\text{-}L=\\frac{\\mathrm{LCS}(R,C)}{|R|}",
      meaning:
        "ROUGE-L은 longest common subsequence를 통해 reference 쪽 recall을 봅니다. reference 표현이 candidate에서 순서를 유지한 채 얼마나 회수됐는지를 묻습니다.",
      features: [
        "reference 내용 누락을 보고 싶을 때 직관적입니다.",
        "단순 bag-of-words보다 단어 순서를 더 드러냅니다.",
        "reference recall로 설명하기 쉽습니다.",
      ],
      caveats: [
        "임상적으로 틀린 report도 reference 단어를 많이 회수할 수 있습니다.",
        "clinical content가 같아도 paraphrase는 낮게 나올 수 있습니다.",
        "laterality와 temporal direction도 여전히 token으로만 봅니다.",
      ],
      figure: "report-rouge",
      complements: "ROUGE-L은 entity row와 temporal row와 같이 읽어야 합니다.",
    },
    {
      id: "meteor",
      title: "METEOR",
      formula: "\\mathrm{METEOR}\\approx F_{mean}(P,R)\\,(1-\\mathrm{penalty})",
      meaning:
        "METEOR은 unigram precision/recall을 함께 보고 stemming 또는 synonym matching, fragmentation penalty를 반영합니다. BLEU보다 표현 변화에 조금 더 관대합니다.",
      features: [
        "fluid와 effusion 같은 단순 동의어를 연결할 수 있습니다.",
        "candidate precision과 reference recall을 같이 봅니다.",
        "순수 n-gram precision보다 paraphrase에 관대합니다.",
      ],
      caveats: [
        "synonym matching은 clinical reasoning이 아닙니다.",
        "assertion swap과 wrong-side finding은 여전히 놓칠 수 있습니다.",
        "Playground는 full METEOR가 아니라 작은 synonym proxy를 씁니다.",
      ],
      figure: "report-meteor",
      complements: "METEOR은 clinical concept metric과 graph metric과 같이 읽어야 합니다.",
    },
    {
      id: "bertscore",
      title: "BERTScore",
      formula:
        "\\mathrm{F}_{BERT}=\\frac{2P_{BERT}R_{BERT}}{P_{BERT}+R_{BERT}}",
      meaning:
        "BERTScore는 contextual token similarity를 봅니다. 정확히 같은 단어가 아니어도 candidate token을 가장 가까운 reference token과 비교합니다.",
      features: [
        "순수 n-gram overlap보다 paraphrase에 더 관대합니다.",
        "exact string 대신 contextual embedding을 씁니다.",
        "표현은 달라도 의미가 가까운 문장을 설명하기 좋습니다.",
      ],
      caveats: [
        "모든 token을 보므로 임상적으로 덜 중요한 표현에 끌릴 수 있습니다.",
        "entity/assertion swap을 항상 안전하게 잡지는 못합니다.",
        "높은 similarity score가 radiologist acceptance를 의미하지는 않습니다.",
      ],
      figure: "report-bertscore",
      complements: "BERTScore는 RaTEscore 또는 RadGraph F1과 같이 읽어야 합니다.",
    },
    {
      id: "ratescore",
      title: "RaTEscore",
      formula:
        "\\mathrm{RaTEscore}\\approx\\mathrm{BERTScore}(\\mathrm{medical\\ entities})",
      meaning:
        "RaTEscore는 radiology entity를 먼저 뽑아 그 entity 중심으로 semantic similarity를 봅니다. clinically relevant entity가 맞게 대응되는지를 묻습니다.",
      features: [
        "모든 단어가 아니라 medical entity에 비교를 집중합니다.",
        "pneumothorax와 pleural effusion이 바뀌는 PPT 예시를 더 잘 설명합니다.",
        "표면 fluency와 clinical entity alignment를 분리해 보여줍니다.",
      ],
      caveats: [
        "entity extractor가 틀리면 metric도 같이 틀립니다.",
        "assertion과 relation 오류는 별도 check가 필요합니다.",
        "Playground는 entity/assertion proxy로 이 직관을 보여줍니다.",
      ],
      figure: "report-ratescore",
      complements: "RaTEscore는 RadGraph F1과 같이 읽어야 합니다.",
    },
    {
      id: "temporal-f1",
      title: "Temporal F1",
      formula:
        "\\mathrm{TemporalF1}=\\frac{2\\,TP_{\\mathrm{change}}}{2\\,TP_{\\mathrm{change}}+FP_{\\mathrm{change}}+FN_{\\mathrm{change}}}",
      meaning:
        "Temporal F1은 improved, worsened, stable, new, resolved 같은 변화 label을 봅니다. prior 비교가 있을 때 의미가 생깁니다.",
      features: [
        "Temporal F1은 improved, worsened, stable, new, resolved statement를 따로 볼 수 있습니다.",
        "follow-up CXR report에서 매우 직관적입니다.",
        "lexical metric이 높게 남는 change-direction 오류를 잡습니다.",
      ],
      caveats: [
        "prior가 없는 single CXR report에서는 signal이 약합니다.",
        "improved와 decreased 같은 동의 표현 처리가 중요합니다.",
        "비시간적 clinical correctness를 평가하지는 않습니다.",
      ],
      figure: "report-temporal-f1",
      complements: "Temporal F1은 concept label과 graph metric과 같이 읽어야 합니다.",
    },
    {
      id: "chexbert-f1",
      title: "CheXbert F1",
      formula:
        "\\mathrm{CheXbertF1}=\\frac{2\\,TP_{\\mathrm{label}}}{2\\,TP_{\\mathrm{label}}+FP_{\\mathrm{label}}+FN_{\\mathrm{label}}}",
      meaning:
        "CheXbert F1은 reference와 candidate report에서 추출한 고정 CXR finding label set을 비교합니다.",
      features: [
        "핵심 CXR finding이 언급됐는지 직접 비교합니다.",
        "label presence/absence agreement로 읽기 쉽습니다.",
        "report-generation benchmark table에서 자주 보입니다.",
      ],
      caveats: [
        "label set이 제한됩니다.",
        "severity, location, laterality, relation detail이 사라질 수 있습니다.",
        "labeler 성능이 generator score에 섞입니다.",
      ],
      figure: "report-chexbert-f1",
      complements: "Location이 중요할 때는 CheXbert F1을 RadGraph F1과 같이 읽어야 합니다.",
    },
    {
      id: "srr-bert-f1",
      title: "SRR-BERT F1",
      formula:
        "\\mathrm{SRR}\\text{-}\\mathrm{BERTF1}=\\frac{2\\,TP_{55\\ labels}}{2\\,TP_{55\\ labels}+FP+FN}",
      meaning:
        "SRR-BERT F1은 CheXbert보다 넓은 CXR label vocabulary를 봅니다. 이 Playground proxy에서는 단순 side/change attribute에도 반응하게 해 coarse finding label보다 더 세밀한 granularity를 보여줍니다.",
      features: [
        "14-label setup보다 더 넓은 label coverage를 제공합니다.",
        "reference와 candidate의 extracted label 및 단순 attribute를 비교하므로 직관적입니다.",
        "benchmark label granularity가 더 필요할 때 유용합니다.",
      ],
      caveats: [
        "여전히 label-vocabulary metric입니다.",
        "level mismatch, severity, location, relation error가 남을 수 있습니다.",
        "extractor 오류를 그대로 물려받습니다.",
      ],
      figure: "report-srr-bert-f1",
      complements: "SRR-BERT F1은 graph metric과 error-category metric과 같이 읽어야 합니다.",
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
      id: "green",
      title: "GREEN",
      formula: "\\mathrm{ErrorScore} = \\sum_i w_i\\,\\mathbf{1}[\\mathrm{error}_i]",
      meaning:
        "GREEN은 false finding, omission, location error, severity error, 없는 comparison/change, comparison/change 누락 같은 clinical error category를 봅니다.",
      features: [
        "임상적으로 의미 있는 error category를 표현할 수 있습니다.",
        "matched finding과 significant error를 한 notation에서 보여줍니다.",
        "reviewer-facing qualitative error analysis에 유용합니다.",
      ],
      caveats: [
        "prompt, model version, calibration, local deployment 조건에 따라 재현성이 흔들립니다.",
        "LLM judge는 training data의 blind spot을 물려받을 수 있습니다.",
        "static dashboard에서는 precomputed example만 보여주고 live LLM judge는 돌리지 않습니다.",
      ],
      figure: "report-green",
      complements: "GREEN은 patient context가 severity를 바꾸는 경우 CRIMSON과 같이 읽어야 합니다.",
    },
    {
      id: "crimson",
      title: "CRIMSON",
      formula: "\\mathrm{CRIMSON}=f(\\mathrm{error},\\mathrm{context},\\mathrm{severity})",
      meaning:
        "CRIMSON은 error category에 patient context와 severity weighting을 붙여 봅니다. 단순 match count보다 patient-safety relevance를 보려는 LLM-as-a-judge 계열입니다.",
      features: [
        "indication, age, sex, guideline 같은 patient context를 입력으로 사용할 수 있습니다.",
        "negligible finding은 낮게 보고 significant error는 더 크게 볼 수 있습니다.",
        "diagnosis accuracy, context fit, patient safety 축으로 평가를 구성합니다.",
      ],
      caveats: [
        "judge model, prompt, local calibration에 의존합니다.",
        "deterministic label metric보다 재현하기 어렵습니다.",
        "static dashboard는 구조만 보여주고 live LLM judge는 돌리지 않습니다.",
      ],
      figure: "report-crimson",
      complements: "CRIMSON은 deterministic automatic metric과 reader study와 같이 읽어야 합니다.",
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

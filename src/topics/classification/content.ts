import type { EngineState } from "../../types/engine";
import type { LearnContent, MiniSimConfig } from "../../types/topic";

const SIM_STATE: EngineState = {
  grid: { width: 1, height: 1, spacingMm: [1, 1] },
  gt: [],
  predictions: [],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
};

function miniSim(kind: string, spotlightMetric: string): MiniSimConfig {
  return { kind, spotlightMetric, initialState: SIM_STATE };
}

export const classificationLearn: LearnContent = {
  intro:
    "Image classification turns each study into a positive-class score, then a threshold turns that score into a positive or negative prediction. The same scores can tell different stories depending on whether you inspect a fixed confusion matrix, a threshold sweep, or a clinical operating point.",
  sections: [
    {
      id: "confusion-matrix",
      title: "Confusion Matrix",
      formula: "\\begin{bmatrix}TP & FN \\\\ FP & TN\\end{bmatrix}",
      meaning:
        "A Confusion Matrix counts actual positive/negative cases against predicted positive/negative labels. TP and TN are diagonal counts; FP is an alarm on an actual negative; FN is a missed actual positive.",
      features: [
        "Every fixed-threshold classification metric starts from TP, FP, FN, and TN.",
        "The matrix keeps false alarms and missed positives separate instead of hiding them in one total.",
      ],
      caveats: [
        "A single threshold creates one matrix; moving the threshold changes every count.",
        "The same Accuracy can come from very different FP/FN mixes.",
      ],
      figure: "cls-confusion",
    },
    {
      id: "sensitivity-specificity",
      title: "Sensitivity / Specificity",
      formula:
        "\\mathrm{Sensitivity}=\\frac{TP}{TP+FN},\\quad \\mathrm{Specificity}=\\frac{TN}{TN+FP}",
      meaning:
        "Sensitivity measures the fraction of actual positives detected. Specificity measures the fraction of actual negatives rejected. Together they describe the two actual-class rows of the Confusion Matrix.",
      features: [
        "Sensitivity tracks missed positives through FN.",
        "Specificity tracks false alarms through FP.",
        "Balanced Accuracy averages Sensitivity and Specificity.",
      ],
      caveats: [
        "Sensitivity alone does not show false-positive burden.",
        "Specificity alone does not show how many positives were missed.",
      ],
      figure: "cls-rows",
      miniSim: miniSim("cls-row-tradeoff", "sensitivity"),
      complements: "Use both rows when class prevalence is skewed.",
    },
    {
      id: "ppv-npv",
      title: "PPV / NPV",
      formula:
        "\\mathrm{PPV}=\\frac{TP}{TP+FP},\\quad \\mathrm{NPV}=\\frac{TN}{TN+FN}",
      meaning:
        "PPV asks: among predicted positives, how many are actual positives? NPV asks: among predicted negatives, how many are actual negatives? These are prediction-column quantities and move with prevalence.",
      features: [
        "PPV is the precision of a positive classification.",
        "NPV is useful when a negative result is used to rule out follow-up.",
      ],
      caveats: [
        "PPV and NPV change when prevalence changes, even if Sensitivity and Specificity stay fixed.",
        "A rare-positive task can have low PPV while Sensitivity remains high.",
      ],
      figure: "cls-columns",
      miniSim: miniSim("cls-prevalence-columns", "ppv"),
    },
    {
      id: "accuracy-balanced-accuracy",
      title: "Accuracy vs Balanced Accuracy",
      formula:
        "\\mathrm{Accuracy}=\\frac{TP+TN}{N},\\quad \\mathrm{Balanced\\ Accuracy}=\\frac{\\mathrm{Sensitivity}+\\mathrm{Specificity}}{2}",
      meaning:
        "Accuracy is the overall fraction of correct labels. Balanced Accuracy gives the positive and negative classes equal row weight by averaging Sensitivity and Specificity.",
      features: [
        "Accuracy is easy to read when classes are close to balanced.",
        "Balanced Accuracy exposes the rare class more directly under imbalance.",
      ],
      caveats: [
        "With 5 percent prevalence, predicting every case negative gives Accuracy 0.95 and Sensitivity 0.",
        "Balanced Accuracy still summarizes two rows into one number, so inspect Sensitivity and Specificity too.",
      ],
      figure: "cls-accuracy",
      miniSim: miniSim("cls-accuracy-imbalance", "accuracy"),
    },
    {
      id: "precision-recall-f1-fbeta",
      title: "Precision / Recall / F1 / F-beta",
      formula:
        "F_\\beta=(1+\\beta^2)\\frac{\\mathrm{Precision}\\cdot\\mathrm{Recall}}{\\beta^2\\mathrm{Precision}+\\mathrm{Recall}}",
      meaning:
        "Precision is PPV, Recall is Sensitivity, F1 is their harmonic mean, and F-beta shifts the weight: beta greater than 1 emphasizes Recall, while beta below 1 emphasizes Precision.",
      features: [
        "F1 summarizes the positive-class prediction column and actual-positive row at one threshold.",
        "F2 fits screening-style recall emphasis; F0.5 fits confirmatory precision emphasis.",
      ],
      caveats: [
        "F1 and F-beta depend on the chosen threshold.",
        "They do not include TN, so they should be paired with Specificity when false alarms matter.",
      ],
      figure: "cls-f1",
      miniSim: miniSim("cls-fbeta-weight", "fBeta"),
    },
    {
      id: "roc-auroc",
      title: "ROC / AUROC",
      formula:
        "\\mathrm{ROC}: (\\mathrm{FPR},\\mathrm{TPR}),\\quad \\mathrm{AUROC}=P(s_+>s_-)",
      meaning:
        "ROC sweeps the threshold and plots false-positive rate against true-positive rate. AUROC summarizes how often a random positive receives a higher score than a random negative.",
      features: [
        "ROC separates threshold choice from score ranking.",
        "AUROC is insensitive to the chosen operating threshold.",
      ],
      caveats: [
        "AUROC can look stable under class imbalance because FPR divides by all negatives.",
        "For rare-positive retrieval, inspect PR and AUPRC/AP alongside ROC.",
      ],
      figure: "cls-curves",
    },
    {
      id: "pr-auprc-ap",
      title: "PR / AUPRC / AP",
      formula: "\\mathrm{AP}=\\sum_k (R_k-R_{k-1})P_k",
      meaning:
        "A PR curve sweeps Recall against Precision from the positive-class point of view. AUPRC and AP summarize how precision changes as more positives are retrieved.",
      features: [
        "PR exposes false positives directly in the precision denominator.",
        "The prevalence baseline is the positive-class prevalence.",
        "AP rewards score order when positives appear early in the ranked list.",
      ],
      caveats: [
        "AUPRC/AP values depend strongly on prevalence.",
        "AP and trapezoidal AUPRC are related summaries, but their interpolation conventions should be stated.",
      ],
      figure: "cls-curves",
    },
    {
      id: "fixed-operating-points",
      title: "Fixed operating points: Sens@Spec / Spec@Sens / partial AUC",
      formula:
        "\\mathrm{Sens@Spec}_{0.90}=\\max_t \\mathrm{Sensitivity}(t)\\;\\mathrm{s.t.}\\;\\mathrm{Specificity}(t)\\ge 0.90",
      meaning:
        "Fixed operating points report the metric value under an explicit clinical constraint, such as Sens@Spec 0.90 or Spec@Sens 0.95. partial AUC integrates only the clinically relevant ROC region.",
      features: [
        "Matches deployment requirements such as minimum specificity before biopsy.",
        "Keeps the threshold constraint visible instead of hiding it inside one global curve area.",
      ],
      caveats: [
        "The target constraint must be reported with the value.",
        "Different target constraints can reverse the apparent model ordering.",
      ],
      figure: "cls-threshold",
    },
  ],
};

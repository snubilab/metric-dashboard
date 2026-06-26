/**
 * Linkify metric-name mentions in Learn prose so a reader can jump straight to
 * that metric's own section. This is a PURE text→segment split (no React) so it
 * is unit-testable; the renderer wraps any token whose target differs from the
 * section it sits in (no self-links).
 *
 * Tokens map to Learn section ids. Some tokens exist in multiple topics, so
 * callers may pass the current topic's section ids to pick the local target.
 */

/**
 * Metric tokens → their section id, ordered longest / most-specific FIRST so the
 * alternation prefers e.g. "HD95" over "HD", "ASSD" over "ASD", and
 * "Surface Dice" / "표면 Dice" over a bare "Dice".
 */
const METRIC_TOKENS: { token: string; sectionIds: readonly string[] }[] = [
  { token: "Clinical Acceptance", sectionIds: ["clinical-acceptance"] },
  { token: "SRR-BERT F1", sectionIds: ["concept-label-f1"] },
  { token: "CheXbert F1", sectionIds: ["concept-label-f1"] },
  { token: "Temporal F1", sectionIds: ["concept-label-f1"] },
  { token: "RadGraph F1", sectionIds: ["graph-f1"] },
  { token: "BERTScore", sectionIds: ["embedding-similarity"] },
  { token: "RaTEscore", sectionIds: ["embedding-similarity"] },
  { token: "Balanced Accuracy", sectionIds: ["accuracy-balanced-accuracy"] },
  { token: "Confusion Matrix", sectionIds: ["confusion-matrix"] },
  { token: "Specificity", sectionIds: ["sensitivity-specificity"] },
  { token: "Sensitivity", sectionIds: ["sensitivity-specificity", "recall", "sensitivity"] },
  { token: "Sens@Spec", sectionIds: ["fixed-operating-points"] },
  { token: "Spec@Sens", sectionIds: ["fixed-operating-points"] },
  { token: "partial AUC", sectionIds: ["fixed-operating-points"] },
  { token: "Accuracy", sectionIds: ["accuracy-balanced-accuracy"] },
  { token: "Precision", sectionIds: ["precision", "precision-recall-f1-fbeta"] },
  { token: "Recall", sectionIds: ["recall", "precision-recall-f1-fbeta"] },
  { token: "AUPRC", sectionIds: ["pr-auprc-ap"] },
  { token: "AUROC", sectionIds: ["roc-auroc"] },
  { token: "F-beta", sectionIds: ["precision-recall-f1-fbeta"] },
  { token: "PPV", sectionIds: ["ppv-npv"] },
  { token: "NPV", sectionIds: ["ppv-npv"] },
  { token: "ROC", sectionIds: ["roc-auroc"] },
  { token: "PR", sectionIds: ["pr-auprc-ap"] },
  { token: "F1", sectionIds: ["f1", "precision-recall-f1-fbeta"] },
  { token: "METEOR", sectionIds: ["lexical-overlap"] },
  { token: "ROUGE", sectionIds: ["lexical-overlap"] },
  { token: "BLEU", sectionIds: ["lexical-overlap"] },
  { token: "CRIMSON", sectionIds: ["llm-evaluators"] },
  { token: "GREEN", sectionIds: ["llm-evaluators"] },
  { token: "AP", sectionIds: ["ap", "pr-auprc-ap"] },
  { token: "Mean signed bias", sectionIds: ["bias"] },
  { token: "평균 부호 편향", sectionIds: ["bias"] },
  { token: "Spearman ρ", sectionIds: ["spearman"] },
  { token: "Pearson r", sectionIds: ["pearson"] },
  { token: "RMSE", sectionIds: ["rmse"] },
  { token: "MSE", sectionIds: ["mse"] },
  { token: "MAE", sectionIds: ["mae"] },
  { token: "R²", sectionIds: ["r2"] },
  { token: "R2", sectionIds: ["r2"] },
  { token: "HD95", sectionIds: ["hd95"] },
  { token: "표면 Dice", sectionIds: ["nsd"] },
  { token: "Surface Dice", sectionIds: ["nsd"] },
  { token: "NSD", sectionIds: ["nsd"] },
  { token: "ASSD", sectionIds: ["assd"] },
  { token: "ASD", sectionIds: ["assd"] },
  { token: "clDice", sectionIds: ["cldice"] },
  { token: "DSC", sectionIds: ["dice"] },
  { token: "Dice", sectionIds: ["dice"] },
  { token: "Jaccard", sectionIds: ["iou"] },
  { token: "IoU", sectionIds: ["iou"] },
  { token: "Hausdorff", sectionIds: ["hd"] },
  { token: "하우스도르프", sectionIds: ["hd"] },
  { token: "HD", sectionIds: ["hd"] },
];

const TOKEN_TO_IDS = new Map(METRIC_TOKENS.map((t) => [t.token, t.sectionIds]));

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A token must not be flush against an ASCII alphanumeric, so "HD" never matches
 * inside "HD95" or a longer word — but a Korean particle attaching directly
 * (e.g. "HD95를") is fine, since it is not [A-Za-z0-9].
 */
const METRIC_RE = new RegExp(
  `(?<![A-Za-z0-9])(${METRIC_TOKENS.map((t) => escapeRe(t.token)).join("|")})(?![A-Za-z0-9])`,
  "g",
);

export interface MetricTextSegment {
  text: string;
  /** When set, this segment is a metric token linking to that section id. */
  sectionId?: string;
}

function sectionForToken(token: string, allowedSectionIds?: ReadonlySet<string>): string | undefined {
  const sectionIds = TOKEN_TO_IDS.get(token);
  if (!sectionIds) return undefined;
  if (!allowedSectionIds) return sectionIds[0];
  return sectionIds.find((id) => allowedSectionIds.has(id));
}

/** Split prose into plain + metric-token segments, preserving order/spacing. */
export function splitMetricText(
  text: string,
  allowedSectionIds?: ReadonlySet<string>,
): MetricTextSegment[] {
  const out: MetricTextSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(METRIC_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i) });
    const sectionId = sectionForToken(m[0], allowedSectionIds);
    out.push(sectionId ? { text: m[0], sectionId } : { text: m[0] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

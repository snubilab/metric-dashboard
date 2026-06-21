/**
 * Linkify metric-name mentions in Learn prose so a reader can jump straight to
 * that metric's own section. This is a PURE text→segment split (no React) so it
 * is unit-testable; the renderer wraps any token whose target differs from the
 * section it sits in (no self-links).
 *
 * Tokens map to the segmentation Learn section ids
 * (dice/iou/sensitivity/precision/hd/hd95/assd/nsd/volume/lesionwise/cldice).
 */

/**
 * Metric tokens → their section id, ordered longest / most-specific FIRST so the
 * alternation prefers e.g. "HD95" over "HD", "ASSD" over "ASD", and
 * "Surface Dice" / "표면 Dice" over a bare "Dice".
 */
const METRIC_TOKENS: { token: string; sectionId: string }[] = [
  { token: "HD95", sectionId: "hd95" },
  { token: "표면 Dice", sectionId: "nsd" },
  { token: "Surface Dice", sectionId: "nsd" },
  { token: "NSD", sectionId: "nsd" },
  { token: "ASSD", sectionId: "assd" },
  { token: "ASD", sectionId: "assd" },
  { token: "clDice", sectionId: "cldice" },
  { token: "DSC", sectionId: "dice" },
  { token: "Dice", sectionId: "dice" },
  { token: "Jaccard", sectionId: "iou" },
  { token: "IoU", sectionId: "iou" },
  { token: "Hausdorff", sectionId: "hd" },
  { token: "하우스도르프", sectionId: "hd" },
  { token: "HD", sectionId: "hd" },
];

const TOKEN_TO_ID = new Map(METRIC_TOKENS.map((t) => [t.token, t.sectionId]));

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

/** Split prose into plain + metric-token segments, preserving order/spacing. */
export function splitMetricText(text: string): MetricTextSegment[] {
  const out: MetricTextSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(METRIC_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i) });
    out.push({ text: m[0], sectionId: TOKEN_TO_ID.get(m[0]) });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

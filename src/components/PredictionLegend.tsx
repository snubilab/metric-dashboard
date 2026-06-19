/**
 * PredictionLegend — a persistent "what am I looking at" legend for the
 * Segmentation Playground.
 *
 * Renders three chips that tie the on-canvas shapes to their meaning:
 *   - 정답(GT) in the ground-truth color (--c-gt),
 *   - prediction A's name (+ optional scene role) in --c-pred-a,
 *   - prediction B's name (+ optional scene role) in --c-pred-b.
 *
 * The component is purely presentational: callers pass already-localized
 * strings (the active preset's prediction meta, or a generic "예측 A" / "예측 B"
 * fallback). The `role` is optional and is simply omitted when absent — no
 * separator is rendered — so the generic, hand-edited-scene case reads cleanly.
 *
 * The swatch + chip styling reuses the token pattern from MetricTable's legend;
 * no new visual primitives are introduced. All colors/fonts come from the
 * design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";

const L = {
  ko: { gt: "정답(GT)" },
  en: { gt: "Ground truth (GT)" },
} as const;

/** One prediction's display text: a short name and an optional scene role. */
export interface PredictionLegendItem {
  /** Short prediction name, already localized (e.g. "예측 A"). */
  name: string;
  /** Optional one-phrase scene role, already localized (e.g. "정확 추적"). */
  role?: string;
}

interface PredictionLegendProps {
  /** Localized ground-truth label; defaults to the built-in "정답(GT)" / "Ground truth (GT)". */
  gtLabel?: string;
  /** Display text for prediction A. */
  a: PredictionLegendItem;
  /** Display text for prediction B. */
  b: PredictionLegendItem;
}

const legendStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-4)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const itemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
};

const swatchStyle = (color: string): React.CSSProperties => ({
  width: "var(--space-3)",
  height: "var(--space-3)",
  borderRadius: "var(--radius-sm)",
  background: color,
  flex: "0 0 auto",
});

const nameStyle = (color: string): React.CSSProperties => ({
  color,
  fontWeight: 600,
});

const roleStyle: React.CSSProperties = {
  color: "var(--c-text-dim)",
};

const separatorStyle: React.CSSProperties = {
  color: "var(--c-text-dim)",
};

/** A single color-swatch chip: swatch + colored name + optional dim role. */
function Chip({ color, name, role }: { color: string; name: string; role?: string }) {
  return (
    <span style={itemStyle}>
      <span aria-hidden="true" data-swatch style={swatchStyle(color)} />
      <span style={nameStyle(color)}>{name}</span>
      {role ? (
        <>
          <span aria-hidden="true" style={separatorStyle}>
            ·
          </span>
          <span style={roleStyle}>{role}</span>
        </>
      ) : null}
    </span>
  );
}

/**
 * The Playground identity legend. Maps 정답(GT) / 예측 A / 예측 B to their
 * design-system colors and names so a first-time student can anchor what each
 * on-canvas shape is before reading any metric.
 */
export function PredictionLegend({ gtLabel, a, b }: PredictionLegendProps) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <div style={legendStyle}>
      <Chip color="var(--c-gt)" name={gtLabel ?? t.gt} />
      <Chip color="var(--c-pred-a)" name={a.name} role={a.role} />
      <Chip color="var(--c-pred-b)" name={b.name} role={b.role} />
    </div>
  );
}

export default PredictionLegend;

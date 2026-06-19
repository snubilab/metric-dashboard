/**
 * Compact, clinical definition block describing the context a metric lives in.
 *
 * Renders four labeled rows — Situation, Modality, At stake, Consequence —
 * drawn from the shared `ClinicalContext` data shape. Labels are dim uppercase
 * micro-type; values read at full text weight. The modality is surfaced as a
 * small inline pill so the imaging source is glanceable.
 *
 * All visual values come from the design-system token custom properties; the
 * component hardcodes no colors or fonts.
 */

import type { ClinicalContext as ClinicalContextData } from "../types/topic";

interface ClinicalContextProps {
  context: ClinicalContextData;
}

const listStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
  columnGap: "var(--space-4)",
  rowGap: "var(--space-3)",
  margin: 0,
  fontFamily: "var(--font-ui)",
};

const labelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--c-text-dim)",
  alignSelf: "baseline",
};

const valueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  lineHeight: 1.4,
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "var(--space-1) var(--space-2)",
  fontSize: "var(--text-xs)",
  fontFamily: "var(--font-mono)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--c-border)",
};

export function ClinicalContext({ context }: ClinicalContextProps) {
  return (
    <dl style={listStyle}>
      <dt style={labelStyle}>Situation</dt>
      <dd style={valueStyle}>{context.situation}</dd>

      <dt style={labelStyle}>Modality</dt>
      <dd style={{ ...valueStyle }}>
        <span style={pillStyle}>{context.modality}</span>
      </dd>

      <dt style={labelStyle}>At stake</dt>
      <dd style={valueStyle}>{context.atStake}</dd>

      <dt style={labelStyle}>Consequence</dt>
      <dd style={valueStyle}>{context.consequence}</dd>
    </dl>
  );
}

export default ClinicalContext;

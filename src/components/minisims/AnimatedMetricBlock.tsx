/**
 * AnimatedMetricBlock — an AnimatedMetric whose numeral is wrapped in a
 * `data-metric` span carrying *only* the value text.
 *
 * The label is rendered as a separate sibling above the numeral rather than via
 * AnimatedMetric's own `label` prop, so the `data-metric` element's text content
 * is purely the formatted number. That keeps the value machine-readable (for
 * tests and tooling) even when a label contains digits — e.g. "LUNA16 score".
 *
 * All visual values come from design-system tokens.
 */

import { AnimatedMetric, type MetricTone } from "../AnimatedMetric";

interface AnimatedMetricBlockProps {
  /** Identifier exposed as the `data-metric` attribute on the numeral span. */
  dataMetric: string;
  /** Small uppercase label shown above the numeral. */
  label: string;
  /** The metric value. */
  value: number;
  /** Decimal places; defaults to 2. */
  decimals?: number;
  /** Optional unit suffix. */
  unit?: string;
  /** Visual tone for the numeral. */
  tone?: MetricTone;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

export function AnimatedMetricBlock({
  dataMetric,
  label,
  value,
  decimals = 2,
  unit,
  tone,
}: AnimatedMetricBlockProps) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <span style={labelStyle}>{label}</span>
      <span data-metric={dataMetric}>
        <AnimatedMetric value={value} decimals={decimals} unit={unit} tone={tone} />
      </span>
    </span>
  );
}

export default AnimatedMetricBlock;

/**
 * Shared chrome for the segmentation mini-sim widgets.
 *
 * These helpers keep each widget a thin wiring layer over engine calls and
 * `AnimatedMetric`: a card frame, a labeled range slider, a labeled toggle, and
 * a metric strip. All visual values come from design tokens — widgets never
 * hardcode colors or fonts.
 */

import type { CSSProperties, ReactNode } from "react";

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const titleStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
  margin: 0,
};

const captionStyle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
  lineHeight: 1.5,
  margin: 0,
};

const controlLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

const valueBadgeStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
  fontVariantNumeric: "tabular-nums",
};

const metricStripStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-6)",
  alignItems: "flex-start",
};

const toggleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

export interface WidgetCardProps {
  title: string;
  caption?: ReactNode;
  children: ReactNode;
}

/** A titled, token-styled card frame shared by every mini-sim. */
export function WidgetCard({ title, caption, children }: WidgetCardProps) {
  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      {children}
      {caption !== undefined && <p style={captionStyle}>{caption}</p>}
    </section>
  );
}

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Trailing unit appended to the live value badge, e.g. "mm". */
  unit?: string;
  /** Decimal places for the value badge. Defaults to 0. */
  decimals?: number;
}

/** A labeled range input whose current value is shown in the mono token. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  decimals = 0,
}: SliderProps) {
  const display = value.toFixed(decimals) + (unit !== undefined ? ` ${unit}` : "");
  return (
    <label style={controlLabelStyle}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <span>{label}</span>
        <span style={valueBadgeStyle} data-role="slider-value">
          {display}
        </span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--c-pred-a)", cursor: "pointer" }}
      />
    </label>
  );
}

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A labeled checkbox toggle styled with tokens. */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label style={toggleRowStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "var(--c-pred-a)", cursor: "pointer" }}
      />
      <span>{label}</span>
    </label>
  );
}

/** A horizontal strip that lays out several `AnimatedMetric`s side by side. */
export function MetricStrip({ children }: { children: ReactNode }) {
  return <div style={metricStripStyle}>{children}</div>;
}

/**
 * Tag a metric with a stable `data-metric` key so it can be located in tests and
 * by surrounding layout. Wraps any metric display (typically `AnimatedMetric`).
 */
export function MetricCell({ metricKey, children }: { metricKey: string; children: ReactNode }) {
  return <div data-metric={metricKey}>{children}</div>;
}

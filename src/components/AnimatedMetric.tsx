/**
 * AnimatedMetric — a numeral display for live metric values.
 *
 * Renders a value in the mono token (tabular numerals so digits stay aligned),
 * with an optional unit (e.g. "mm") and a small uppercase label. On value
 * change the displayed number tweens from the old value to the new one over
 * `--dur-base` via requestAnimationFrame. When the user prefers reduced motion
 * (or rAF is unavailable, as in jsdom) the value updates instantly.
 *
 * All visual values are read from the design-system token custom properties.
 */

import { useEffect, useState } from "react";

/** Em-dash shown when a value is not a finite number. */
const EM_DASH = "—";

/** Tween duration token; mirrors `--dur-base` (250ms) for the rAF fallback timing. */
const TWEEN_DURATION_MS = 250;

export type MetricTone = "default" | "warn";

/** Numeral size. "lg" is the default hero size; "sm" fits dense tables. */
export type MetricSize = "sm" | "md" | "lg";

export interface AnimatedMetricProps {
  /** The metric value to display. NaN renders an em-dash. */
  value: number;
  /** Optional unit suffix, e.g. "mm". */
  unit?: string;
  /** Decimal places to format to. Defaults to 2. */
  decimals?: number;
  /** Optional small uppercase label, e.g. "HD95". */
  label?: string;
  tone?: MetricTone;
  /** Numeral scale. Defaults to "lg" (hero). Use "sm" inside dense tables. */
  size?: MetricSize;
}

/** Token sizes for the numeral and its unit, per scale. */
const SIZE_TOKENS: Record<MetricSize, { numeral: string; unit: string }> = {
  sm: { numeral: "var(--text-lg)", unit: "var(--text-xs)" },
  md: { numeral: "var(--text-xl)", unit: "var(--text-sm)" },
  lg: { numeral: "var(--text-2xl)", unit: "var(--text-base)" },
};

/**
 * Pure formatter for a metric value. Co-located with the component (rather than
 * in its own module) so it can be unit-tested directly alongside it.
 *
 * @param value - The number to format. NaN yields an em-dash.
 * @param decimals - Decimal places to render to.
 * @returns The formatted string (or em-dash for NaN).
 */
// eslint-disable-next-line react-refresh/only-export-components -- intentionally co-located pure helper; HMR fast-refresh is a dev-only concern.
export function formatMetric(value: number, decimals: number): string {
  if (Number.isNaN(value)) {
    return EM_DASH;
  }
  return value.toFixed(decimals);
}

/** True when the environment supports animated tweening (rAF + non-reduced motion). */
function canTween(): boolean {
  if (typeof requestAnimationFrame !== "function") {
    return false;
  }
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const numeralStyle = (tone: MetricTone, size: MetricSize): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: SIZE_TOKENS[size].numeral,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
  color: tone === "warn" ? "var(--c-warn-text)" : "var(--c-text)",
});

const unitStyle = (size: MetricSize): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: SIZE_TOKENS[size].unit,
  color: "var(--c-text-dim)",
});

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

export function AnimatedMetric({
  value,
  unit,
  decimals = 2,
  label,
  tone = "default",
  size = "lg",
}: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(value);
  // `prevValue` mirrors the last `value` prop we reacted to. Comparing the prop
  // against this during render is React's blessed "adjust state during render"
  // pattern, so the instant path (NaN / reduced motion / no rAF) never calls
  // setState inside an effect.
  const [prevValue, setPrevValue] = useState(value);
  // The number the tween should start from, captured at the moment `value`
  // changes (snapshotted so an in-flight tween can be superseded cleanly).
  const [tweenOrigin, setTweenOrigin] = useState(value);

  // `Object.is` so a NaN value is treated as equal to a stored NaN, otherwise the
  // adjust-during-render guard would loop forever (NaN !== NaN).
  if (!Object.is(value, prevValue)) {
    setPrevValue(value);
    if (Number.isNaN(value) || !canTween()) {
      // Instant: skip the tween entirely.
      setDisplayValue(value);
    } else if (Number.isNaN(displayValue)) {
      setDisplayValue(value);
      setTweenOrigin(value);
    } else {
      // Anchor the tween origin to whatever is currently displayed.
      setTweenOrigin(displayValue);
    }
  }

  useEffect(() => {
    if (Number.isNaN(value) || !canTween() || tweenOrigin === value) {
      return;
    }

    let handle: number | null = null;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / TWEEN_DURATION_MS, 1);
      setDisplayValue(tweenOrigin + (value - tweenOrigin) * progress);
      if (progress < 1) {
        handle = requestAnimationFrame(step);
      }
    };

    handle = requestAnimationFrame(step);

    return () => {
      if (handle !== null) {
        cancelAnimationFrame(handle);
      }
    };
  }, [value, tweenOrigin]);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {label !== undefined && <span style={labelStyle}>{label}</span>}
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: "var(--space-1)" }}>
        <span style={numeralStyle(tone, size)}>{formatMetric(displayValue, decimals)}</span>
        {unit !== undefined && <span style={unitStyle(size)}>{unit}</span>}
      </span>
    </div>
  );
}

export default AnimatedMetric;

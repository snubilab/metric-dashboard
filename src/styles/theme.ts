/**
 * Typed mirror of the design-system token contract defined in `tokens.css`.
 *
 * Components must read visual values from CSS custom properties at runtime; this
 * module exists so non-DOM code (canvas drawing, charts, tests) can reference the
 * same source-of-truth values without re-reading the cascade. The data colors are
 * the colorblind-safe Okabe-Ito palette and MUST stay in sync with `tokens.css`.
 */

/** Colorblind-safe Okabe-Ito data colors, used wherever GT / Pred-A / Pred-B / disagreement appear. */
const DATA_COLORS = {
  /** Ground truth — bluish green. */
  gt: "#009E73",
  /** Prediction A — blue. */
  predA: "#0072B2",
  /** Prediction B — orange. */
  predB: "#E69F00",
  /** Disagreement / HD95 spikes — vermillion. */
  warn: "#D55E00",
} as const;

/** Font stacks. Metric numerals use the mono stack so digits align. */
const FONTS = {
  ui: "system-ui, Inter, sans-serif",
  mono: "ui-monospace, JetBrains Mono, SFMono-Regular, monospace",
} as const;

export const theme = {
  colors: DATA_COLORS,
  fonts: FONTS,
} as const;

export type Theme = typeof theme;

/**
 * detPanels — the shared two-panel scaffold for the DET (v2) figures.
 *
 * Every DET figure now shows TWO labeled panels side by side (stacking
 * vertically on narrow widths): a neutral "typical / 정상 예시" panel holding the
 * correct illustration, and a "misleading / 오해 사례" panel showing a case where
 * the metric value looks fine yet the result is clinically/visually wrong. The
 * misleading panel carries a small --c-warn warning mark plus a one-line --c-warn
 * caption naming the trap.
 *
 * The root is role='img' with an aria-label that mentions both the concept and
 * that a misleading case is shown. Tokens only; bilingual labels via useLang at
 * the call site (strings are passed in already localized).
 */

import type { CSSProperties, ReactNode } from "react";

/** Localized chrome strings, resolved by the caller via useLang(). */
export interface PanelStrings {
  /** Root aria-label — must mention the concept AND the misleading case. */
  aria: string;
  /** Tag for the neutral/correct panel (e.g. "정상 예시" / "typical"). */
  typicalTag: string;
  /** Tag for the misleading panel (e.g. "오해 사례" / "misleading"). */
  misleadingTag: string;
  /** One-line --c-warn caption naming the trap shown in the misleading panel. */
  misleadingCaption: string;
}

interface TwoPanelFigureProps {
  strings: PanelStrings;
  /** Centered content of the neutral "typical" panel. */
  typical: ReactNode;
  /** Centered content of the "misleading" panel. */
  misleading: ReactNode;
}

const rootStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-3)",
  alignItems: "stretch",
  justifyContent: "center",
  margin: 0,
  width: "100%",
};

const panelStyle: CSSProperties = {
  flex: "1 1 220px",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "var(--space-1)",
  padding: "var(--space-2)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-1)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  letterSpacing: "0.04em",
};

const bodyStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  flex: 1,
};

const captionStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.3,
  textAlign: "center",
  color: "var(--c-warn)",
};

/**
 * Render two centered panels (typical + misleading) under one role='img' root.
 * The misleading panel is flagged with data-role='misleading' and a --c-warn
 * warning mark so tests can locate the misleading case.
 */
export function TwoPanelFigure({ strings, typical, misleading }: TwoPanelFigureProps) {
  return (
    <figure role="img" aria-label={strings.aria} style={rootStyle}>
      <div style={panelStyle}>
        <div style={{ ...tagRowStyle, color: "var(--c-text-dim)" }}>
          <span>{strings.typicalTag}</span>
        </div>
        <div style={bodyStyle}>{typical}</div>
      </div>

      <div data-role="misleading" style={panelStyle}>
        <div style={{ ...tagRowStyle, color: "var(--c-warn)" }}>
          {/* Small warning mark in the warn token. */}
          <svg
            data-role="misleading-mark"
            width={14}
            height={14}
            viewBox="0 0 14 14"
            aria-hidden="true"
            style={{ flex: "0 0 auto" }}
          >
            <path d="M7 1 L13 12.5 L1 12.5 Z" fill="none" stroke="var(--c-warn)" strokeWidth={1.5} strokeLinejoin="round" />
            <line x1={7} y1={5} x2={7} y2={9} stroke="var(--c-warn)" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={7} cy={11} r={0.8} fill="var(--c-warn)" />
          </svg>
          <span>{strings.misleadingTag}</span>
        </div>
        <div style={bodyStyle}>{misleading}</div>
        <figcaption style={captionStyle}>{strings.misleadingCaption}</figcaption>
      </div>
    </figure>
  );
}

export default TwoPanelFigure;

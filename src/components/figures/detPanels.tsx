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

/**
 * Approximate the rendered width (in px) of one character at `fontSize`.
 *
 * CJK glyphs are roughly full-em wide, Latin/mono glyphs roughly 0.6 em. The
 * estimate only needs to be good enough to decide line breaks for the SEG
 * figure captions, so a two-bucket model is plenty.
 */
function charWidth(ch: string, fontSize: number): number {
  // Hangul, CJK ideographs and fullwidth punctuation occupy a full em.
  const isWide = /[ᄀ-ᇿ　-鿿가-힣＀-￯]/.test(ch);
  return fontSize * (isWide ? 1 : 0.62);
}

/** Estimated rendered width of an entire string at `fontSize`. */
function textWidth(text: string, fontSize: number): number {
  let total = 0;
  for (const ch of text) {
    total += charWidth(ch, fontSize);
  }
  return total;
}

/**
 * Break `text` into lines that each fit within `maxWidth` at `fontSize`.
 *
 * Words (whitespace-delimited) are kept whole when possible; a single word that
 * is itself wider than `maxWidth` is split on character boundaries so it can
 * never overflow the panel half-width.
 */
function wrapToWidth(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  const pushChunked = (word: string) => {
    let chunk = "";
    for (const ch of word) {
      if (chunk && textWidth(chunk + ch, fontSize) > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    current = chunk;
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current) {
      if (textWidth(word, fontSize) > maxWidth) {
        pushChunked(word);
      } else {
        current = word;
      }
    } else if (textWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      if (textWidth(word, fontSize) > maxWidth) {
        current = "";
        pushChunked(word);
      } else {
        current = word;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [text];
}

const CAPTION_LINE_PX = 12;
const CAPTION_MIN_FONT = 9;
const CAPTION_MAX_FONT = 11;
const CAPTION_MAX_LINES = 2;

interface SvgPanelCaptionProps {
  /** The caption text (already localized). */
  text: string;
  /** Horizontal center of the caption within the figure's own coordinate space. */
  x: number;
  /** Baseline y of the LAST caption line; extra lines stack upward from here. */
  y: number;
  /** Maximum width the caption may occupy — the panel half-width. */
  maxWidth: number;
  /** Fill token for the text (e.g. "var(--c-text-dim)" or "var(--c-warn)"). */
  fill: string;
}

/**
 * Render a panel caption centered at `x`, constrained to `maxWidth`.
 *
 * The text wraps onto at most two lines; if it still does not fit, the
 * font-size is reduced (down to a floor) so it never spills past the panel's
 * half-width and never collides with the neighbouring panel's caption. Lines
 * stack UPWARD from the `y` baseline so the block never grows past the figure
 * bottom. Width estimation is approximate but conservative.
 */
export function SvgPanelCaption({ text, x, y, maxWidth, fill }: SvgPanelCaptionProps) {
  let fontSize = CAPTION_MAX_FONT;
  let lines = wrapToWidth(text, maxWidth, fontSize);
  while (lines.length > CAPTION_MAX_LINES && fontSize > CAPTION_MIN_FONT) {
    fontSize -= 1;
    lines = wrapToWidth(text, maxWidth, fontSize);
  }

  const lineHeight = Math.max(CAPTION_LINE_PX, fontSize + 1);
  const topY = y - (lines.length - 1) * lineHeight;

  return (
    <text x={x} y={topY} fill={fill} textAnchor="middle" fontSize={fontSize}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** A small warning triangle + "!" centered at (x, y), for flagging a misleading
 * SVG panel. Positioned independently of the panel title so it never overlaps it. */
export function SvgWarnMark({ x, y, fill = "var(--c-warn)" }: { x: number; y: number; fill?: string }) {
  return (
    <g aria-hidden="true">
      <path d={`M ${x} ${y - 11} l 6 11 l -12 0 z`} fill="none" stroke={fill} strokeWidth={1.5} strokeLinejoin="round" />
      <text x={x} y={y - 1} fill={fill} textAnchor="middle" fontSize="8">!</text>
    </g>
  );
}

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
  width: "100%",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.3,
  textAlign: "center",
  color: "var(--c-warn)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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

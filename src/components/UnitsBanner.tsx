/**
 * Persistent honesty banner shown near distance / surface / volume metrics.
 *
 * It reminds the reader that the rendered canvas is a single 2D slice, while
 * the clinically meaningful quantities are 3D surfaces measured in millimeters.
 * When the acquisition's pixel spacing is known, it is surfaced explicitly so
 * the on-screen pixel grid can be related back to physical millimeters.
 *
 * All visual values come from the design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";

interface UnitsBannerProps {
  /**
   * In-plane pixel spacing as `[row, column]` in millimeters per pixel. When
   * provided, the banner shows e.g. `spacing 1.0 × 1.0 mm/px`.
   */
  spacingMm?: [number, number];
}

const L = {
  ko: {
    honesty:
      "이 캔버스는 2D 슬라이스입니다. 실제 임상에서는 mm 단위로 측정되는 3D 표면입니다.",
    spacing: "픽셀 간격",
  },
  en: {
    honesty:
      "This canvas is a 2D slice. In clinical practice these are 3D surfaces measured in millimeters (mm).",
    spacing: "spacing",
  },
} as const;

/** Unicode information glyph (NOT an emoji) used as a subtle inset marker. */
const INFO_GLYPH = "ⓘ"; // ⓘ CIRCLED LATIN SMALL LETTER I

const noteStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--space-2)",
  padding: "var(--space-2) var(--space-3)",
  background: "var(--c-surface-2)",
  color: "var(--c-text-dim)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.4,
};

const glyphStyle: React.CSSProperties = {
  flex: "0 0 auto",
  color: "var(--c-text-dim)",
};

const spacingStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  color: "var(--c-text)",
  whiteSpace: "nowrap",
};

/** Formats a millimetre-per-pixel value to a single decimal place. */
function formatMm(value: number): string {
  return value.toFixed(1);
}

export function UnitsBanner({ spacingMm }: UnitsBannerProps) {
  const { lang } = useLang();
  return (
    <aside role="note" style={noteStyle}>
      <span aria-hidden="true" style={glyphStyle}>
        {INFO_GLYPH}
      </span>
      <span>
        {L[lang].honesty}
        {spacingMm ? (
          <>
            {" "}
            <span style={spacingStyle}>
              {L[lang].spacing} {formatMm(spacingMm[0])} × {formatMm(spacingMm[1])} mm/px
            </span>
          </>
        ) : null}
      </span>
    </aside>
  );
}

export default UnitsBanner;

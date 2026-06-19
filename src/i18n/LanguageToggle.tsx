/**
 * LanguageToggle — a small accessible segmented control for the UI language.
 *
 * Shows two options, 한 (Korean) and 영 (English); the active language is
 * highlighted in the Pred-A accent color. Clicking an option sets the language
 * via `useLang().setLang`. The control group is labeled "Language", and each
 * option reports its selected state via `aria-pressed` so assistive tech reads
 * the active language correctly.
 *
 * All visual values come from the design-system token custom properties.
 */

import type { Lang } from "./LanguageContext";
import { useLang } from "./LanguageContext";

interface LanguageOption {
  lang: Lang;
  glyph: string;
}

const OPTIONS: readonly LanguageOption[] = [
  { lang: "ko", glyph: "한" },
  { lang: "en", glyph: "영" },
];

const groupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  gap: "var(--space-1)",
  padding: "var(--space-1)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

function optionStyle(isActive: boolean): React.CSSProperties {
  return {
    minWidth: "2rem",
    padding: "var(--space-1) var(--space-3)",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "var(--c-bg)" : "var(--c-text-dim)",
    background: isActive ? "var(--c-pred-a)" : "transparent",
    border: "none",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
  };
}

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div role="group" aria-label="Language" style={groupStyle}>
      {OPTIONS.map((option) => {
        const isActive = option.lang === lang;
        return (
          <button
            key={option.lang}
            type="button"
            aria-pressed={isActive}
            aria-label={option.lang === "ko" ? "Korean" : "English"}
            onClick={() => setLang(option.lang)}
            style={optionStyle(isActive)}
          >
            {option.glyph}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;

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
  label: string;
}

const OPTIONS: readonly LanguageOption[] = [
  { lang: "ko", label: "한국어" },
  { lang: "en", label: "English" },
];

const groupStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  gap: 0,
  padding: 3,
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-xs)",
};

function optionStyle(isActive: boolean): React.CSSProperties {
  return {
    minWidth: "4.6rem",
    padding: "7px 10px",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-xs)",
    lineHeight: 1.2,
    fontWeight: 600,
    color: isActive ? "var(--text-primary)" : "var(--text-quaternary)",
    background: isActive ? "var(--bg-secondary)" : "transparent",
    border: "none",
    borderRadius: "var(--radius-md)",
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
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;

import { useLang } from "../../i18n/LanguageContext";
import { REPORT_PRESETS } from "./presets";
import type { ReportExample } from "./reportExamples";

const L = {
  ko: {
    examples: "예시 불러오기",
    selected: "Selected",
  },
  en: {
    examples: "Load an example",
    selected: "Selected",
  },
} as const;

const labelStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  color: "var(--text-primary)",
};

const noteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.55,
  color: "var(--text-secondary)",
};

const presetRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-3)",
  marginTop: "var(--space-3)",
};

const presetButtonStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  flex: "1 1 180px",
  minWidth: 0,
  padding: "var(--space-3)",
  border: active ? "2px solid var(--c-pred-a)" : "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
  background: active ? "var(--bg-accent)" : "var(--bg-secondary)",
  color: "var(--text-primary)",
  textAlign: "left",
  cursor: "pointer",
});

export function ReportPresetPicker({
  activePresetId,
  onSelect,
}: {
  activePresetId: string;
  onSelect: (example: ReportExample) => void;
}) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <details>
      <summary style={{ ...labelStyle, cursor: "pointer" }}>{t.examples}</summary>
      <div style={presetRowStyle}>
        {REPORT_PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              style={presetButtonStyle(active)}
              aria-pressed={active}
              onClick={() => onSelect(preset)}
            >
              <strong>{lang === "ko" ? preset.labelKo : preset.label}</strong>
              <span style={noteStyle}>
                {lang === "ko" ? preset.descriptionKo : preset.description}
              </span>
              {active && <span style={noteStyle}>{t.selected}</span>}
            </button>
          );
        })}
      </div>
    </details>
  );
}

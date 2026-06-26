import { extractClinicalCues } from "../../engine/metrics/reportGeneration";
import type { ClinicalCues } from "../../engine/metrics/reportGeneration";
import { useLang } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";

const L = {
  ko: {
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
    cues: "Extracted cues",
    noCues: "아직 cue 없음",
    findings: "findings",
    present: "present",
    absent: "absent",
    laterality: "laterality",
    temporal: "temporal",
  },
  en: {
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
    cues: "Extracted cues",
    noCues: "No cues yet",
    findings: "findings",
    present: "present",
    absent: "absent",
    laterality: "laterality",
    temporal: "temporal",
  },
} as const;

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  color: "var(--c-text)",
};

const noteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.55,
  color: "var(--c-text-dim)",
};

const cueGridStyle = (compact: boolean): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: compact ? "repeat(auto-fit, minmax(130px, 1fr))" : undefined,
  gap: compact ? "var(--space-2)" : "var(--space-3)",
});

const cueCardStyle = (compact: boolean): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  gap: compact ? "var(--space-1)" : "var(--space-2)",
  padding: compact ? "var(--space-2)" : "var(--space-3)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
});

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
};

const chipStyle = (color: string, textColor: string): React.CSSProperties => ({
  padding: "2px 6px",
  borderRadius: "var(--radius-full)",
  border: `1px solid ${color}`,
  color: textColor,
  background: "var(--c-surface)",
  fontSize: "10px",
  fontWeight: 700,
});

function CueChips({
  label,
  values,
  color,
  textColor,
  empty,
}: {
  label: string;
  values: readonly string[];
  color: string;
  textColor: string;
  empty: string;
}) {
  return (
    <div>
      <div style={{ ...labelStyle, fontSize: "var(--text-xs)" }}>{label}</div>
      <div style={chipRowStyle}>
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} style={chipStyle(color, textColor)}>
              {value}
            </span>
          ))
        ) : (
          <span style={{ ...noteStyle, fontSize: "var(--text-xs)" }}>{empty}</span>
        )}
      </div>
    </div>
  );
}

function cueValues(cues: ClinicalCues, lang: Lang) {
  const t = L[lang];
  return [
    {
      label: t.findings,
      values: cues.findings,
      color: "var(--c-gt)",
      textColor: "var(--c-gt-text)",
    },
    {
      label: t.present,
      values: cues.presentFindings.map((finding) => `${finding}: present`),
      color: "var(--c-pred-a)",
      textColor: "var(--c-pred-a-text)",
    },
    {
      label: t.absent,
      values: cues.absentFindings.map((finding) => `${finding}: absent`),
      color: "var(--c-pred-b)",
      textColor: "var(--c-pred-b-text)",
    },
    {
      label: t.laterality,
      values: cues.laterality,
      color: "var(--c-warn)",
      textColor: "var(--c-warn-text)",
    },
    {
      label: t.temporal,
      values: cues.temporal,
      color: "var(--c-pred-a)",
      textColor: "var(--c-pred-a-text)",
    },
  ];
}

function ReportCueCard({
  title,
  text,
  lang,
  compact,
}: {
  title: string;
  text: string;
  lang: Lang;
  compact: boolean;
}) {
  const t = L[lang];
  const cues = extractClinicalCues(text);
  return (
    <section style={cueCardStyle(compact)}>
      <h4 style={{ ...headingStyle, fontSize: compact ? "var(--text-sm)" : headingStyle.fontSize }}>
        {title}
      </h4>
      {cueValues(cues, lang).map((row) => (
        <CueChips
          key={row.label}
          label={row.label}
          values={row.values}
          color={row.color}
          textColor={row.textColor}
          empty={t.noCues}
        />
      ))}
    </section>
  );
}

export function ReportCueBoard({
  reference,
  candidateA,
  candidateB,
  compact = false,
}: {
  reference: string;
  candidateA: string;
  candidateB: string;
  compact?: boolean;
}) {
  const { lang } = useLang();
  const t = L[lang];
  const hasAnyText = Boolean(reference.trim() || candidateA.trim() || candidateB.trim());

  return (
    <>
      <h3 style={{ ...headingStyle, fontSize: compact ? "var(--text-sm)" : headingStyle.fontSize }}>
        {t.cues}
      </h3>
      {hasAnyText ? (
        <div style={cueGridStyle(compact)}>
          <ReportCueCard title={t.reference} text={reference} lang={lang} compact={compact} />
          <ReportCueCard title={t.candidateA} text={candidateA} lang={lang} compact={compact} />
          <ReportCueCard title={t.candidateB} text={candidateB} lang={lang} compact={compact} />
        </div>
      ) : (
        <p style={noteStyle}>{t.noCues}</p>
      )}
    </>
  );
}

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
  fontSize: "var(--text-base)",
  color: "var(--text-primary)",
};

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

const cueGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "var(--space-3)",
};

const cueCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
  padding: "var(--space-3)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
};

const chipStyle = (color: string): React.CSSProperties => ({
  padding: "3px 8px",
  borderRadius: "var(--radius-full)",
  background: color,
  color: "var(--bg-primary)",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
});

function CueChips({
  label,
  values,
  color,
  empty,
}: {
  label: string;
  values: readonly string[];
  color: string;
  empty: string;
}) {
  return (
    <div>
      <div style={{ ...labelStyle, fontSize: "var(--text-xs)" }}>{label}</div>
      <div style={chipRowStyle}>
        {values.length > 0 ? (
          values.map((value) => (
            <span key={value} style={chipStyle(color)}>
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
    },
    {
      label: t.present,
      values: cues.presentFindings.map((finding) => `${finding}: present`),
      color: "var(--c-pred-a)",
    },
    {
      label: t.absent,
      values: cues.absentFindings.map((finding) => `${finding}: absent`),
      color: "var(--c-pred-b)",
    },
    {
      label: t.laterality,
      values: cues.laterality,
      color: "var(--c-warn)",
    },
    {
      label: t.temporal,
      values: cues.temporal,
      color: "var(--c-pred-a)",
    },
  ];
}

function ReportCueCard({ title, text, lang }: { title: string; text: string; lang: Lang }) {
  const t = L[lang];
  const cues = extractClinicalCues(text);
  return (
    <section style={cueCardStyle}>
      <h4 style={headingStyle}>{title}</h4>
      {cueValues(cues, lang).map((row) => (
        <CueChips
          key={row.label}
          label={row.label}
          values={row.values}
          color={row.color}
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
}: {
  reference: string;
  candidateA: string;
  candidateB: string;
}) {
  const { lang } = useLang();
  const t = L[lang];
  const hasAnyText = Boolean(reference.trim() || candidateA.trim() || candidateB.trim());

  return (
    <>
      <h3 style={headingStyle}>{t.cues}</h3>
      {hasAnyText ? (
        <div style={cueGridStyle}>
          <ReportCueCard title={t.reference} text={reference} lang={lang} />
          <ReportCueCard title={t.candidateA} text={candidateA} lang={lang} />
          <ReportCueCard title={t.candidateB} text={candidateB} lang={lang} />
        </div>
      ) : (
        <p style={noteStyle}>{t.noCues}</p>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { MetricTable } from "../../components/MetricTable";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import type { MetricRow } from "../../components/metrics/types";
import { extractClinicalCues } from "../../engine/metrics/reportGeneration";
import type { ClinicalCues } from "../../engine/metrics/reportGeneration";
import { useLang } from "../../i18n/LanguageContext";
import { ReportCueBoard } from "./ReportCueBoard";
import { ReportPresetPicker } from "./ReportPresetPicker";
import type { ReportExample } from "./reportExamples";
import {
  REPORT_METRIC_FAMILY_LABEL,
  REPORT_METRIC_FAMILY_ORDER,
  reportMetricFamilyForKey,
} from "./reportMetricFamilies";

type Stage = "reference" | "candidateA" | "candidateB" | "compare";

const L = {
  ko: {
    step: {
      reference: "STEP 1/3 · reference report를 먼저 입력하세요.",
      candidateA: "STEP 2/3 · Candidate A를 입력하세요. 의미는 같지만 표현이 다른 report를 써보세요.",
      candidateB:
        "STEP 3/3 · Candidate B를 입력하세요. 단어는 비슷하지만 negation이나 laterality가 틀린 report를 써보세요.",
      compare: "COMPARE · metric이 보는 단위에 따라 앞서는 candidate가 달라집니다.",
    },
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
    metrics: "Live metrics",
    summary: "At-a-glance results",
    clinicalAcceptance: "Clinical Acceptance endpoint",
    endpoint: "non-numeric endpoint",
    riskCue: "Highest-risk cue mismatch",
    noCueRisk: "No cue mismatch detected",
    summaryLegend:
      "A/B counts tally rows where that candidate leads; warning flags mark ranking or large-gap disagreements.",
    compareNote:
      "어떤 candidate가 앞서는지는 metric이 보는 단위에 따라 달라집니다. Lexical row와 clinical cue row가 갈라지는 지점을 보세요.",
  },
  en: {
    step: {
      reference: "STEP 1/3 · Enter the reference report first.",
      candidateA: "STEP 2/3 · Enter Candidate A. Try a clinically similar paraphrase.",
      candidateB:
        "STEP 3/3 · Enter Candidate B. Try similar wording with a negation or laterality error.",
      compare: "COMPARE · The leading candidate changes with the unit the metric can observe.",
    },
    reference: "Reference report",
    candidateA: "Candidate A",
    candidateB: "Candidate B",
    metrics: "Live metrics",
    summary: "At-a-glance results",
    clinicalAcceptance: "Clinical Acceptance endpoint",
    endpoint: "non-numeric endpoint",
    riskCue: "Highest-risk cue mismatch",
    noCueRisk: "No cue mismatch detected",
    summaryLegend:
      "A/B counts tally rows where that candidate leads; warning flags mark ranking or large-gap disagreements.",
    compareNote:
      "The leading candidate changes with the unit the metric can observe. Watch where lexical rows and clinical-cue rows split.",
  },
} as const;

function stage(reference: string, candidateA: string, candidateB: string): Stage {
  if (!reference.trim()) return "reference";
  if (!candidateA.trim()) return "candidateA";
  if (!candidateB.trim()) return "candidateB";
  return "compare";
}

const pageStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  color: "var(--c-text)",
  fontFamily: "var(--font-ui)",
};

const splitStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-5)",
  alignItems: "flex-start",
};

const RESPONSIVE_CSS = `
.report-pg-editor { flex: 0.8 1 340px; min-width: 300px; }
.report-pg-results { flex: 1.2 1 420px; min-width: 340px; }
.report-pg-results { position: sticky; top: var(--space-4); max-height: calc(100vh - 190px); overflow: auto; }
@media (max-width: 860px) {
  .report-pg-editor, .report-pg-results { flex-basis: 100%; min-width: 0; }
  .report-pg-results { position: static; max-height: none; }
}
`;

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  color: "var(--c-text)",
};

const textareaStyle: React.CSSProperties = {
  minHeight: 72,
  width: "100%",
  resize: "vertical",
  boxSizing: "border-box",
  padding: "var(--space-3)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface-2)",
  color: "var(--c-text)",
  font: "inherit",
  lineHeight: 1.5,
};

const stepPillStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  padding: "var(--space-1) var(--space-3)",
  borderRadius: "var(--radius-pill, var(--radius-sm))",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "var(--c-text)",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

const noteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  lineHeight: 1.55,
  color: "var(--c-text-dim)",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "var(--space-2)",
};

const summaryStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "var(--space-2)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
};

function lead(row: MetricRow): "A" | "B" | "tie" {
  if (row.a === row.b) return "tie";
  const aLeads = row.higherIsBetter ? row.a > row.b : row.a < row.b;
  return aLeads ? "A" : "B";
}

function assertionValues(cues: ClinicalCues): string[] {
  return [
    ...cues.presentFindings.map((finding) => `${finding}: present`),
    ...cues.absentFindings.map((finding) => `${finding}: absent`),
  ];
}

function mismatchLabels(reference: readonly string[], candidate: readonly string[], label: string): string[] {
  const candidateSet = new Set(candidate);
  const referenceSet = new Set(reference);
  return [
    ...reference.filter((value) => !candidateSet.has(value)).map((value) => `${label}: missing ${value}`),
    ...candidate.filter((value) => !referenceSet.has(value)).map((value) => `${label}: extra ${value}`),
  ];
}

function topCueMismatch(reference: string, candidateA: string, candidateB: string): string | undefined {
  const ref = extractClinicalCues(reference);
  const candidates = [
    { name: "Candidate A", cues: extractClinicalCues(candidateA) },
    { name: "Candidate B", cues: extractClinicalCues(candidateB) },
  ];
  for (const [label, values] of [
    ["assertion", assertionValues(ref)],
    ["laterality", ref.laterality],
    ["temporal", ref.temporal],
    ["findings", ref.findings],
  ] as const) {
    for (const candidate of candidates) {
      const candidateValues = label === "assertion" ? assertionValues(candidate.cues) : candidate.cues[label];
      const [first] = mismatchLabels(values, candidateValues, label);
      if (first) return `${candidate.name}: ${first}`;
    }
  }
  return undefined;
}

function setExample(
  example: ReportExample,
  setters: {
    readonly setReference: (value: string) => void;
    readonly setCandidateA: (value: string) => void;
    readonly setCandidateB: (value: string) => void;
    readonly setActivePresetId: (value: string) => void;
  },
) {
  setters.setReference(example.reference);
  setters.setCandidateA(example.candidateA);
  setters.setCandidateB(example.candidateB);
  setters.setActivePresetId(example.id);
}

export default function Playground() {
  const { lang } = useLang();
  const t = L[lang];
  const [reference, setReference] = useState("");
  const [candidateA, setCandidateA] = useState("");
  const [candidateB, setCandidateB] = useState("");
  const [activePresetId, setActivePresetId] = useState("");
  const currentStage = stage(reference, candidateA, candidateB);
  const rows = useMemo(
    () =>
      currentStage === "compare"
        ? reportComparisonRows(reference, candidateA, candidateB)
        : [],
    [candidateA, candidateB, currentStage, reference],
  );
  const familyCounts = useMemo(() => {
    const counts = {
      lexical: { A: 0, B: 0, tie: 0 },
      semantic: { A: 0, B: 0, tie: 0 },
      proxy: { A: 0, B: 0, tie: 0 },
    };
    for (const row of rows) {
      const family = reportMetricFamilyForKey(row.key);
      counts[family][lead(row)] += 1;
    }
    return counts;
  }, [rows]);
  const riskCue = useMemo(
    () =>
      currentStage === "compare"
        ? topCueMismatch(reference, candidateA, candidateB)
        : undefined,
    [candidateA, candidateB, currentStage, reference],
  );

  const handleEdit = (setter: (value: string) => void, value: string) => {
    setter(value);
    setActivePresetId("");
  };

  return (
    <div style={pageStyle}>
      <style>{RESPONSIVE_CSS}</style>
      <span style={stepPillStyle}>{t.step[currentStage]}</span>
      <div className="report-pg-split" style={splitStyle}>
        <section className="report-pg-editor" style={panelStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t.reference}</span>
            <textarea
              style={textareaStyle}
              aria-label={t.reference}
              value={reference}
              onChange={(event) => handleEdit(setReference, event.currentTarget.value)}
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t.candidateA}</span>
            <textarea
              style={textareaStyle}
              aria-label={t.candidateA}
              value={candidateA}
              onChange={(event) => handleEdit(setCandidateA, event.currentTarget.value)}
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>{t.candidateB}</span>
            <textarea
              style={textareaStyle}
              aria-label={t.candidateB}
              value={candidateB}
              onChange={(event) => handleEdit(setCandidateB, event.currentTarget.value)}
            />
          </label>
          <ReportPresetPicker
            activePresetId={activePresetId}
            onSelect={(preset) =>
              setExample(preset, {
                setReference,
                setCandidateA,
                setCandidateB,
                setActivePresetId,
              })
            }
          />
        </section>

        <section className="report-pg-results" style={panelStyle}>
          {currentStage === "compare" ? (
            <>
              <h3 style={headingStyle}>{t.metrics}</h3>
              <p style={noteStyle}>{t.compareNote}</p>
              <section data-testid="report-pg-summary" style={summaryStyle}>
                <h3 style={headingStyle}>{t.summary}</h3>
                <div style={summaryGridStyle}>
                  {REPORT_METRIC_FAMILY_ORDER.map((family) => (
                    <div key={family} style={summaryCardStyle}>
                      <strong>{REPORT_METRIC_FAMILY_LABEL[family]}</strong>
                      <p style={noteStyle}>
                        A {familyCounts[family].A} · B {familyCounts[family].B} · tie{" "}
                        {familyCounts[family].tie}
                      </p>
                    </div>
                  ))}
                  <div style={summaryCardStyle}>
                    <strong>{t.riskCue}</strong>
                    <p style={noteStyle}>{riskCue ?? t.noCueRisk}</p>
                  </div>
                  <div style={summaryCardStyle}>
                    <strong>{t.clinicalAcceptance}</strong>
                    <p style={noteStyle}>{t.endpoint}</p>
                  </div>
                </div>
                <p style={noteStyle}>{t.summaryLegend}</p>
              </section>
              <MetricTable rows={rows} showRelativeCue showBars compact />
              <ReportCueBoard
                reference={reference}
                candidateA={candidateA}
                candidateB={candidateB}
                compact
              />
            </>
          ) : (
            <ReportCueBoard
              reference={reference}
              candidateA={candidateA}
              candidateB={candidateB}
              compact
            />
          )}
        </section>
      </div>
    </div>
  );
}

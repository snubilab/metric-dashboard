import { useMemo, useState } from "react";
import { MetricTable } from "../../components/MetricTable";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import { useLang } from "../../i18n/LanguageContext";
import { ReportCueBoard } from "./ReportCueBoard";
import { ReportPresetPicker } from "./ReportPresetPicker";
import type { ReportExample } from "./reportExamples";

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
  gap: "var(--space-4)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-ui)",
};

const splitStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
  gap: "var(--space-5)",
  alignItems: "start",
};

const RESPONSIVE_CSS = `
.report-pg-split { grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr); }
@media (max-width: 860px) {
  .report-pg-split { grid-template-columns: minmax(0, 1fr); }
}
`;

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-xl)",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  color: "var(--text-primary)",
};

const textareaStyle: React.CSSProperties = {
  minHeight: 110,
  width: "100%",
  resize: "vertical",
  boxSizing: "border-box",
  padding: "var(--space-3)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  font: "inherit",
  lineHeight: 1.5,
};

const stepPillStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "6px 10px",
  borderRadius: "var(--radius-full)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-secondary)",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  color: "var(--text-secondary)",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-base)",
  color: "var(--text-primary)",
};

const noteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.55,
  color: "var(--text-secondary)",
};

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

  const handleEdit = (setter: (value: string) => void, value: string) => {
    setter(value);
    setActivePresetId("");
  };

  return (
    <div style={pageStyle}>
      <style>{RESPONSIVE_CSS}</style>
      <span style={stepPillStyle}>{t.step[currentStage]}</span>
      <div className="report-pg-split" style={splitStyle}>
        <section style={panelStyle}>
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

        <section style={panelStyle}>
          <ReportCueBoard reference={reference} candidateA={candidateA} candidateB={candidateB} />
          {currentStage === "compare" ? (
            <>
              <h3 style={headingStyle}>{t.metrics}</h3>
              <p style={noteStyle}>{t.compareNote}</p>
              <MetricTable rows={rows} showRelativeCue showBars />
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

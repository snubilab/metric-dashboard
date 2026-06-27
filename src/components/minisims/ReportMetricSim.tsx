import { useState } from "react";
import type { MiniSimConfig } from "../../types/topic";
import { useLang } from "../../i18n/LanguageContext";
import { Slider, WidgetCard } from "./widgetChrome";

type ReportSimKind =
  | "report-lexical-paraphrase"
  | "report-entity-assertion"
  | "report-temporal-direction"
  | "report-label-graph-granularity"
  | "report-error-weighting";

interface ReportMetricSimProps {
  config: MiniSimConfig;
}

interface SignalRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly tone: "hit" | "warn" | "info";
}

interface Copy {
  readonly title: string;
  readonly caption: string;
  readonly note: string;
  readonly control: string;
  readonly before: string;
  readonly after: string;
}

const KINDS: Record<ReportSimKind, true> = {
  "report-lexical-paraphrase": true,
  "report-entity-assertion": true,
  "report-temporal-direction": true,
  "report-label-graph-granularity": true,
  "report-error-weighting": true,
};

const L: Record<"ko" | "en", Record<ReportSimKind, Copy>> = {
  ko: {
    "report-lexical-paraphrase": {
      title: "표현을 바꾸면 lexical metric과 semantic metric이 다르게 움직입니다",
      caption: "같은 임상 의미라도 단어가 바뀌면 BLEU는 내려가고, METEOR/BERTScore 계열은 일부 회복합니다.",
      note: "정성 teaching cue만 보여줍니다. 실제 proxy 값은 Playground의 live metric row에서 계산됩니다.",
      control: "Paraphrase 정도",
      before: "no pleural effusion",
      after: "pleural fluid is absent",
    },
    "report-entity-assertion": {
      title: "Entity는 같아도 assertion이 뒤집히면 entity-aware row가 반응합니다",
      caption: "pneumothorax라는 단어가 맞아도 present/absent가 바뀌면 clinical entity alignment는 깨집니다.",
      note: "정성 teaching cue만 보여줍니다. 실제 proxy 값은 Playground의 live metric row에서 계산됩니다.",
      control: "Assertion swap",
      before: "pneumothorax: absent",
      after: "pneumothorax: present",
    },
    "report-temporal-direction": {
      title: "Follow-up 문장에서는 변화 방향 자체가 metric 대상입니다",
      caption: "improved와 worsened는 둘 다 change token이지만, Temporal F1에서는 방향 mismatch입니다.",
      note: "정성 teaching cue만 보여줍니다. 실제 proxy 값은 Playground의 live metric row에서 계산됩니다.",
      control: "Wrong direction 비율",
      before: "edema improved",
      after: "edema worsened",
    },
    "report-label-graph-granularity": {
      title: "Coarse label은 맞아도 side/relation graph는 흔들릴 수 있습니다",
      caption: "opacity label만 맞으면 CheXbert/SRR 계열은 높게 남고, RadGraph-style relation은 떨어집니다.",
      note: "정성 teaching cue만 보여줍니다. 실제 proxy 값은 Playground의 live metric row에서 계산됩니다.",
      control: "Relation detail 오류",
      before: "right lower lobe opacity",
      after: "left lower lobe opacity",
    },
    "report-error-weighting": {
      title: "GREEN/CRIMSON 계열은 오류 개수와 임상 가중을 분리해서 봅니다",
      caption: "같은 error count라도 ICU follow-up처럼 맥락이 민감하면 weighted burden이 커집니다.",
      note: "정성 teaching cue만 보여줍니다. 실제 proxy 값은 Playground의 live metric row에서 계산됩니다.",
      control: "Error severity",
      before: "minor wording issue",
      after: "unsupported worsening",
    },
  },
  en: {
    "report-lexical-paraphrase": {
      title: "Changing wording moves lexical and semantic metrics differently",
      caption: "When the clinical meaning stays close but words change, BLEU drops while METEOR/BERTScore-style matching recovers part of it.",
      note: "Qualitative teaching cues only; the live proxy values are computed in the Playground metric rows.",
      control: "Paraphrase strength",
      before: "no pleural effusion",
      after: "pleural fluid is absent",
    },
    "report-entity-assertion": {
      title: "Same entity, flipped assertion: entity-aware rows react",
      caption: "The pneumothorax token can match while present/absent alignment breaks.",
      note: "Qualitative teaching cues only; the live proxy values are computed in the Playground metric rows.",
      control: "Assertion swap",
      before: "pneumothorax: absent",
      after: "pneumothorax: present",
    },
    "report-temporal-direction": {
      title: "Follow-up reports make change direction measurable",
      caption: "Improved and worsened are both change words, but Temporal F1 treats direction mismatch as an error.",
      note: "Qualitative teaching cues only; the live proxy values are computed in the Playground metric rows.",
      control: "Wrong direction share",
      before: "edema improved",
      after: "edema worsened",
    },
    "report-label-graph-granularity": {
      title: "A coarse label can match while side/relation detail fails",
      caption: "CheXbert/SRR-style labels can stay high while RadGraph-style relations fall.",
      note: "Qualitative teaching cues only; the live proxy values are computed in the Playground metric rows.",
      control: "Relation detail error",
      before: "right lower lobe opacity",
      after: "left lower lobe opacity",
    },
    "report-error-weighting": {
      title: "GREEN/CRIMSON-style rows separate error count from clinical weight",
      caption: "The same error count can carry more burden when patient context makes the error significant.",
      note: "Qualitative teaching cues only; the live proxy values are computed in the Playground metric rows.",
      control: "Error severity",
      before: "minor wording issue",
      after: "unsupported worsening",
    },
  },
};

const caseRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "var(--space-2)",
};

const caseCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  padding: "var(--space-3)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface-2)",
};

const caseLabelStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const caseTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
};

const signalStripStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
  alignItems: "stretch",
};

const signalBoxStyle: React.CSSProperties = {
  minWidth: "128px",
  flex: "1 1 160px",
  padding: "var(--space-3)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface-2)",
};

const signalLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "var(--space-1)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const signalValueStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  fontWeight: 700,
  lineHeight: 1.4,
};

const noteStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

function isReportSimKind(kind: string): kind is ReportSimKind {
  return kind in KINDS;
}

function initialLevel(kind: ReportSimKind): number {
  switch (kind) {
    case "report-lexical-paraphrase":
      return 45;
    case "report-entity-assertion":
      return 60;
    case "report-temporal-direction":
      return 50;
    case "report-label-graph-granularity":
      return 70;
    case "report-error-weighting":
      return 55;
  }
}

function levelBand(level: number): "low" | "medium" | "high" {
  if (level < 35) return "low";
  if (level < 70) return "medium";
  return "high";
}

function signalRows(kind: ReportSimKind, level: number): readonly SignalRow[] {
  const band = levelBand(level);
  switch (kind) {
    case "report-lexical-paraphrase":
      return [
        { key: "wording", label: "Token overlap cue", value: `${band} wording shift`, tone: "warn" },
        { key: "meaning", label: "Semantic cue", value: "clinical meaning held", tone: "hit" },
      ];
    case "report-entity-assertion":
      return [
        { key: "entity", label: "Entity mention cue", value: "same finding named", tone: "info" },
        { key: "assertion", label: "Assertion cue", value: `${band} present/absent conflict`, tone: "warn" },
      ];
    case "report-temporal-direction":
      return [
        { key: "temporal", label: "Temporal cue", value: `${band} direction conflict`, tone: "warn" },
        { key: "review", label: "Review focus", value: "change word is not enough", tone: "info" },
      ];
    case "report-label-graph-granularity":
      return [
        { key: "label", label: "Coarse label cue", value: "opacity still named", tone: "hit" },
        { key: "graph", label: "Relation cue", value: `${band} side/detail conflict`, tone: "warn" },
      ];
    case "report-error-weighting":
      return [
        { key: "count", label: "Error count cue", value: "count can miss context", tone: "info" },
        { key: "weight", label: "Clinical weight cue", value: `${band} context burden`, tone: "warn" },
      ];
  }
}

function SignalBox({ row }: { row: SignalRow }) {
  const color =
    row.tone === "hit" ? "var(--c-gt-text)" : row.tone === "warn" ? "var(--c-warn-text)" : "var(--c-pred-a-text)";

  return (
    <div style={signalBoxStyle} data-signal={row.key}>
      <span style={signalLabelStyle}>{row.label}</span>
      <span style={{ ...signalValueStyle, color }}>{row.value}</span>
    </div>
  );
}

export function ReportMetricSim({ config }: ReportMetricSimProps) {
  const kind = isReportSimKind(config.kind) ? config.kind : "report-lexical-paraphrase";
  const { lang } = useLang();
  const copy = L[lang][kind];
  const [level, setLevel] = useState(initialLevel(kind));

  return (
    <WidgetCard title={copy.title} caption={copy.caption}>
      <Slider label={copy.control} value={level} min={0} max={100} step={5} unit="%" onChange={setLevel} />
      <div style={caseRowStyle} role="img" aria-label={`${copy.before} to ${copy.after}`}>
        <span style={caseCardStyle}>
          <span style={caseLabelStyle}>Reference</span>
          <span style={caseTextStyle}>{copy.before}</span>
        </span>
        <span style={caseCardStyle}>
          <span style={caseLabelStyle}>Candidate</span>
          <span style={caseTextStyle}>{copy.after}</span>
        </span>
      </div>
      <div style={signalStripStyle}>
        {signalRows(kind, level).map((row) => (
          <SignalBox key={row.key} row={row} />
        ))}
      </div>
      <p style={noteStyle}>{copy.note}</p>
    </WidgetCard>
  );
}

export default ReportMetricSim;

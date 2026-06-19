/**
 * ScenariosView — the worked-examples tab for a topic.
 *
 * Renders a gallery of scenario cards. Each card pairs the clinical context, the
 * teaching point, and the literature reference with a read-only preview of the
 * scenario state: a DetectionBoard when the state carries `detections`, else a
 * MetricTable of the A-vs-B segmentation metrics. The preview is purely
 * illustrative here, so it never mutates the scenario.
 *
 * Cards guard against missing optional fields and never crash on a sparse
 * scenario (e.g. one with no Prediction B).
 *
 * All visual values come from the design-system token custom properties.
 */

import type { Scenario, Topic } from "../types/topic";
import { ClinicalContext } from "../components/ClinicalContext";
import { DetectionBoard } from "../components/DetectionBoard";
import { MetricTable } from "../components/MetricTable";
import { useEngineMetrics } from "../components/metrics/useEngineMetrics";
import { useLang } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/LanguageContext";

interface ScenariosViewProps {
  topic: Topic;
}

const L = {
  ko: {
    teachingPoint: "핵심",
    empty: "이 주제에 대한 시나리오가 아직 없습니다.",
  },
  en: {
    teachingPoint: "Teaching point",
    empty: "No scenarios available for this topic yet.",
  },
} as const;

const galleryStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 32rem), 1fr))",
  gap: "var(--space-6)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-6)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
};

const teachingLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const teachingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.55,
  color: "var(--c-text)",
};

const referenceStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  lineHeight: 1.5,
  color: "var(--c-text-dim)",
};

const previewStyle: React.CSSProperties = {
  paddingTop: "var(--space-4)",
  borderTop: "1px solid var(--c-border)",
};

const emptyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
};

/** Read-only metric-table preview; safe even when the state lacks a Pred B. */
function MetricTablePreview({ state }: { state: Scenario["state"] }) {
  const { rows } = useEngineMetrics(state);
  return <MetricTable rows={rows} />;
}

function ScenarioPreview({ scenario }: { scenario: Scenario }) {
  const detections = scenario.state.detections;
  if (detections) {
    return (
      <DetectionBoard gt={detections.gtObjects} preds={detections.boxes} />
    );
  }
  return <MetricTablePreview state={scenario.state} />;
}

function ScenarioCard({ scenario, lang }: { scenario: Scenario; lang: Lang }) {
  return (
    <article style={cardStyle}>
      <h3 style={cardTitleStyle}>{scenario.title}</h3>
      <ClinicalContext context={scenario.clinical} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <h4 style={teachingLabelStyle}>{L[lang].teachingPoint}</h4>
        <p style={teachingStyle}>{scenario.teachingPoint}</p>
      </div>
      {scenario.reference && <p style={referenceStyle}>{scenario.reference}</p>}
      <div style={previewStyle}>
        <ScenarioPreview scenario={scenario} />
      </div>
    </article>
  );
}

export function ScenariosView({ topic }: ScenariosViewProps) {
  const { lang } = useLang();
  const scenarios =
    (lang === "ko" && topic.scenariosKo ? topic.scenariosKo : topic.scenarios) ?? [];
  if (scenarios.length === 0) {
    return <p style={emptyStyle}>{L[lang].empty}</p>;
  }
  return (
    <div style={galleryStyle}>
      {scenarios.map((scenario) => (
        <ScenarioCard key={scenario.id} scenario={scenario} lang={lang} />
      ))}
    </div>
  );
}

export default ScenariosView;

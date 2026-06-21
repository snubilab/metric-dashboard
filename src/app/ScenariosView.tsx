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
import { ShapeCanvas } from "../components/canvas/ShapeCanvas";
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
    canvasLabel: "분할 미리보기",
    gt: "정답(GT)",
    predA: "예측 A",
    predB: "예측 B",
  },
  en: {
    teachingPoint: "Teaching point",
    empty: "No scenarios available for this topic yet.",
    canvasLabel: "Segmentation preview",
    gt: "Ground truth (GT)",
    predA: "Prediction A",
    predB: "Prediction B",
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

const segPreviewStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
};

const legendStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--space-4)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const legendItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
};

const swatchStyle = (color: string): React.CSSProperties => ({
  width: "var(--space-3)",
  height: "var(--space-3)",
  borderRadius: "var(--radius-sm)",
  background: color,
  flex: "0 0 auto",
});

const nameStyle = (color: string): React.CSSProperties => ({
  color,
  fontWeight: 600,
});

/** A compact GT/A/B identity legend that only labels the layers present. */
function IdentityLegend({
  lang,
  hasA,
  hasB,
}: {
  lang: Lang;
  hasA: boolean;
  hasB: boolean;
}) {
  const t = L[lang];
  return (
    <div style={legendStyle}>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-gt)")} />
        <span style={nameStyle("var(--c-gt-text)")}>{t.gt}</span>
      </span>
      {hasA && (
        <span style={legendItemStyle}>
          <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-a)")} />
          <span style={nameStyle("var(--c-pred-a)")}>{t.predA}</span>
        </span>
      )}
      {hasB && (
        <span style={legendItemStyle}>
          <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-b)")} />
          <span style={nameStyle("var(--c-pred-b-text)")}>{t.predB}</span>
        </span>
      )}
    </div>
  );
}

/** Read-only metric-table preview; safe even when the state lacks a Pred B. */
function MetricTablePreview({ state }: { state: Scenario["state"] }) {
  const { rows } = useEngineMetrics(state);
  return <MetricTable rows={rows} />;
}

/** Max rendered canvas width in CSS px; keeps the scenario card compact. */
const PREVIEW_MAX_PX = 300;

function ScenarioPreview({ scenario, lang }: { scenario: Scenario; lang: Lang }) {
  const { state } = scenario;
  const detections = state.detections;
  if (detections) {
    return (
      <DetectionBoard gt={detections.gtObjects} preds={detections.boxes} />
    );
  }

  // Segmentation scenario: show the GT/A/B shapes (visual) before the numbers.
  const hasA = state.predictions.some((p) => p.id === "A");
  const hasB = state.predictions.some((p) => p.id === "B");
  return (
    <div style={segPreviewStyle}>
      <ShapeCanvas
        grid={state.grid}
        gt={state.gt}
        predictions={state.predictions}
        maxPx={PREVIEW_MAX_PX}
        ariaLabel={L[lang].canvasLabel}
      />
      <IdentityLegend lang={lang} hasA={hasA} hasB={hasB} />
      <MetricTablePreview state={state} />
    </div>
  );
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
        <ScenarioPreview scenario={scenario} lang={lang} />
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

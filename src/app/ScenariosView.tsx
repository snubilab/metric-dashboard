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
import { DetectionMetricTable } from "../components/DetectionMetricTable";
import { DetectionScenePreview } from "../components/canvas/DetectionScenePreview";
import { MetricTable } from "../components/MetricTable";
import { ShapeCanvas } from "../components/canvas/ShapeCanvas";
import { useEngineMetrics } from "../components/metrics/useEngineMetrics";
import { detComparisonRows } from "../components/metrics/detComparisonRows";
import { classificationComparisonRows } from "../components/metrics/classificationComparisonRows";
import { useLang } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/LanguageContext";
import { RegressionMetricTable } from "../topics/regression/RegressionMetricTable";
import { RegressionPlot } from "../topics/regression/RegressionPlot";
import { regressionComparisonRows } from "../topics/regression/scenarioRows";

interface ScenariosViewProps {
  topic: Topic;
}

const L = {
  ko: {
    teachingPoint: "핵심",
    empty: "이 주제에 대한 시나리오가 아직 없습니다.",
    canvasLabel: "분할 미리보기",
    detectionCanvasLabel: "검출 미리보기",
    gt: "정답(GT)",
    predA: "예측 A",
    predB: "예측 B",
    detectorA: "검출기 A",
    detectorB: "검출기 B",
    gtBox: "정답(GT)",
    tpBox: "일치(TP)",
    fpBox: "위양성(FP)",
    clsCanvasLabel: "분류 점수 미리보기",
    clsModelA: "모델 A",
    clsModelB: "모델 B",
    actualPositive: "실제 양성",
    actualNegative: "실제 음성",
    threshold: "임계값",
    regressionCanvasLabel: "회귀 산점도",
    targetLine: "목표=예측",
  },
  en: {
    teachingPoint: "Teaching point",
    empty: "No scenarios available for this topic yet.",
    canvasLabel: "Segmentation preview",
    detectionCanvasLabel: "Detection preview",
    gt: "Ground truth (GT)",
    predA: "Prediction A",
    predB: "Prediction B",
    detectorA: "Detector A",
    detectorB: "Detector B",
    gtBox: "ground truth (GT)",
    tpBox: "matched (TP)",
    fpBox: "false positive (FP)",
    clsCanvasLabel: "Classification score preview",
    clsModelA: "Model A",
    clsModelB: "Model B",
    actualPositive: "actual positive",
    actualNegative: "actual negative",
    threshold: "threshold",
    regressionCanvasLabel: "Regression scatter plot",
    targetLine: "target=prediction",
  },
} as const;

const galleryStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

/**
 * Fixed TWO-column gallery (collapsing to one only on narrow screens), so the
 * layout is identical between Korean and English — an auto-fill track count
 * would otherwise shift with the language's content width. `minmax(0, 1fr)`
 * lets wide canvases/tables shrink instead of forcing a third implied column.
 */
const GALLERY_GRID_CSS = `
.scen-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 760px) {
  .scen-gallery { grid-template-columns: minmax(0, 1fr); }
}
`;

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "22px 24px",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-2xl)",
  boxShadow: "var(--shadow-xs)",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-lg)",
  color: "var(--text-primary)",
};

const teachingLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: "var(--text-quaternary)",
};

const teachingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.55,
  color: "var(--text-secondary)",
};

const referenceStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  lineHeight: 1.5,
  color: "var(--text-quaternary)",
};

const previewStyle: React.CSSProperties = {
  paddingTop: "var(--space-4)",
  borderTop: "1px solid var(--border-secondary)",
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
  color: "var(--text-quaternary)",
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

/** Per-canvas cap when the A/B detector pair sits side by side. */
const DET_PAIR_MAX_PX = 220;

const detPairStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-4)",
};

const detFigureStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
  flex: "1 1 160px",
  minWidth: 0,
};

const detCaptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: "var(--text-quaternary)",
  fontFamily: "var(--font-ui)",
};

/** Box-color legend for the detection scene canvases (GT / TP / FP). */
function DetectionBoxLegend({ lang }: { lang: Lang }) {
  const t = L[lang];
  return (
    <div style={legendStyle}>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-gt)")} />
        <span style={nameStyle("var(--c-gt-text)")}>{t.gtBox}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-a)")} />
        <span style={nameStyle("var(--c-pred-a)")}>{t.tpBox}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-warn)")} />
        <span style={nameStyle("var(--c-warn-text)")}>{t.fpBox}</span>
      </span>
    </div>
  );
}

function ClassificationLegend({ lang }: { lang: Lang }) {
  const t = L[lang];
  return (
    <div style={legendStyle}>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-gt)")} />
        <span style={nameStyle("var(--c-gt-text)")}>{t.actualPositive}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-b)")} />
        <span style={nameStyle("var(--c-pred-b-text)")}>{t.actualNegative}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-warn)")} />
        <span style={nameStyle("var(--c-warn-text)")}>{t.threshold}</span>
      </span>
    </div>
  );
}

function ClassificationScorePreview({ scenario, lang }: { scenario: Scenario; lang: Lang }) {
  const data = scenario.state.classification;
  if (!data) return null;
  const rows = classificationComparisonRows(data.cases, data.thresholdA, data.thresholdB);
  const width = 300;
  const height = 126;
  const scaleX = (score: number) => 44 + score * 220;
  return (
    <div style={segPreviewStyle}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={L[lang].clsCanvasLabel}
        style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)" }}
      >
        {[44, 264].map((x) => (
          <line key={x} x1={x} y1={20} x2={x} y2={100} stroke="var(--c-border)" />
        ))}
        <line x1={44} y1={42} x2={264} y2={42} stroke="var(--c-border)" />
        <line x1={44} y1={84} x2={264} y2={84} stroke="var(--c-border)" />
        <line x1={scaleX(data.thresholdA)} y1={26} x2={scaleX(data.thresholdA)} y2={58} stroke="var(--c-warn)" strokeDasharray="4 3" />
        <line x1={scaleX(data.thresholdB)} y1={68} x2={scaleX(data.thresholdB)} y2={100} stroke="var(--c-warn)" strokeDasharray="4 3" />
        <text x={18} y={46} fill="var(--c-pred-a-text)" textAnchor="start">
          {L[lang].clsModelA}
        </text>
        <text x={18} y={88} fill="var(--c-pred-b-text)" textAnchor="start">
          {L[lang].clsModelB}
        </text>
        {data.cases.map((item, index) => {
          const color = item.actual === "positive" ? "var(--c-gt)" : "var(--c-pred-b)";
          const yA = 42 + ((index % 5) - 2) * 2.5;
          const yB = 84 + ((index % 5) - 2) * 2.5;
          return (
            <g key={index}>
              <circle cx={scaleX(item.scoreA)} cy={yA} r={2.5} fill={color} fillOpacity={0.72} />
              <circle cx={scaleX(item.scoreB)} cy={yB} r={2.5} fill={color} fillOpacity={0.72} />
            </g>
          );
        })}
        <text x={44} y={118} fill="var(--c-text-dim)" textAnchor="middle">0</text>
        <text x={264} y={118} fill="var(--c-text-dim)" textAnchor="middle">1</text>
      </svg>
      <ClassificationLegend lang={lang} />
      <MetricTable rows={rows} />
    </div>
  );
}

function RegressionLegend({ lang }: { lang: Lang }) {
  const t = L[lang];
  return (
    <div style={legendStyle}>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-gt)")} />
        <span style={nameStyle("var(--c-gt-text)")}>{t.targetLine}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-a)")} />
        <span style={nameStyle("var(--c-pred-a-text)")}>{t.predA}</span>
      </span>
      <span style={legendItemStyle}>
        <span aria-hidden="true" data-swatch style={swatchStyle("var(--c-pred-b)")} />
        <span style={nameStyle("var(--c-pred-b-text)")}>{t.predB}</span>
      </span>
    </div>
  );
}

function ScenarioPreview({ scenario, lang }: { scenario: Scenario; lang: Lang }) {
  const { state } = scenario;
  if (state.classification) {
    return <ClassificationScorePreview scenario={scenario} lang={lang} />;
  }
  const regression = state.regression;
  if (regression) {
    const pointsB = regression.pointsB ?? [];
    return (
      <div style={segPreviewStyle}>
        <RegressionPlot
          points={regression.points}
          pointsB={pointsB}
          ariaLabel={L[lang].regressionCanvasLabel}
        />
        <RegressionLegend lang={lang} />
        <RegressionMetricTable rows={regressionComparisonRows(regression.points, pointsB)} />
      </div>
    );
  }
  const detections = state.detections;
  if (detections) {
    const { gtObjects, boxes, boxesB } = detections;
    // A-vs-B detection scenario: mirror segmentation's thesis. Two detectors on
    // the SAME GT, side by side (each box-colored GT/TP/FP), above the SAME
    // rank-flip MetricTable segmentation uses — so "which detector is better"
    // visibly depends on which metric you read.
    if (boxesB) {
      const rows = detComparisonRows(gtObjects, boxes, boxesB);
      return (
        <div style={segPreviewStyle}>
          <div style={detPairStyle}>
            <figure style={detFigureStyle}>
              <figcaption style={detCaptionStyle}>{L[lang].detectorA}</figcaption>
              <DetectionScenePreview
                grid={state.grid}
                gt={gtObjects}
                preds={boxes}
                maxPx={DET_PAIR_MAX_PX}
                ariaLabel={L[lang].detectorA}
              />
            </figure>
            <figure style={detFigureStyle}>
              <figcaption style={detCaptionStyle}>{L[lang].detectorB}</figcaption>
              <DetectionScenePreview
                grid={state.grid}
                gt={gtObjects}
                preds={boxesB}
                maxPx={DET_PAIR_MAX_PX}
                ariaLabel={L[lang].detectorB}
              />
            </figure>
          </div>
          <DetectionBoxLegend lang={lang} />
          <MetricTable rows={rows} />
        </div>
      );
    }
    // Single-detector fallback: a calm read-only visual + Metric | Value table.
    return (
      <div style={segPreviewStyle}>
        <DetectionScenePreview
          grid={state.grid}
          gt={gtObjects}
          preds={boxes}
          maxPx={PREVIEW_MAX_PX}
          ariaLabel={L[lang].detectionCanvasLabel}
        />
        <DetectionMetricTable gt={gtObjects} preds={boxes} />
      </div>
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
        fit
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
    <>
      <style>{GALLERY_GRID_CSS}</style>
      <div className="scen-gallery" style={galleryStyle}>
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} lang={lang} />
        ))}
      </div>
    </>
  );
}

export default ScenariosView;

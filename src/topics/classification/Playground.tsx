import { useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { ClassificationCase } from "../../types/engine";
import { AnimatedMetricBlock } from "../../components/minisims/AnimatedMetricBlock";
import {
  classificationMetrics,
  confusionFromScores,
} from "../../engine/metrics/classification";
import { useLang } from "../../i18n/LanguageContext";
import { CLS_PRESETS } from "./presets";
import type { ClassificationPreset } from "./presets";
import {
  L,
  buttonStyle,
  cellStyle,
  columnStyle,
  headingStyle,
  mutedStyle,
  pageStyle,
  panelStyle,
  promptText,
  rowStyle,
  scoreStripStyle,
  splitStyle,
  stepStyle,
  stepText,
  tableStyle,
} from "./playgroundUi";
import type { Stage } from "./playgroundUi";

const presetGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
  gap: "var(--space-2)",
};

const presetCardStyle: CSSProperties = {
  ...buttonStyle,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--space-2)",
  minHeight: "132px",
  padding: "var(--space-2)",
  textAlign: "left",
  border: "2px solid var(--c-border)",
  boxShadow: "0 1px 0 color-mix(in srgb, var(--c-text) 10%, transparent)",
};

const activePresetCardStyle: CSSProperties = {
  ...presetCardStyle,
  background: "var(--bg-brand-primary)",
  border: "2px solid var(--c-gt)",
  color: "var(--c-gt-text)",
  boxShadow: "0 0 0 3px color-mix(in srgb, var(--c-gt) 18%, transparent)",
};

const presetLabelStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontWeight: 700,
};

const thumbnailStyle: CSSProperties = {
  width: "100%",
  height: "64px",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
};

const presetMetaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "var(--space-1)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text-dim)",
};

const presetMetaItemStyle: CSSProperties = {
  padding: "var(--space-1)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  textAlign: "center",
  background: "var(--c-surface)",
};

const presetStatusStyle: CSSProperties = {
  position: "absolute",
  top: "var(--space-3)",
  right: "var(--space-3)",
  padding: "3px 9px",
  borderRadius: "var(--radius-full)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  color: "var(--c-text)",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
};

const activePresetStatusStyle: CSSProperties = {
  ...presetStatusStyle,
  background: "var(--c-gt)",
  border: "1px solid var(--c-gt)",
  color: "var(--c-surface)",
};

const loadedSummaryStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
  alignItems: "center",
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
};

function stageFor(cases: readonly ClassificationCase[]): Stage {
  const hasPositive = cases.some((item) => item.actual === "positive");
  const hasNegative = cases.some((item) => item.actual === "negative");
  if (!hasPositive) return "positive";
  if (!hasNegative) return "negative";
  return "compare";
}

function cloneCases(cases: readonly ClassificationCase[]): ClassificationCase[] {
  return cases.map((item) => ({ ...item }));
}

function prediction(score: number, threshold: number): "positive" | "negative" {
  return score >= threshold ? "positive" : "negative";
}

interface ScoreGroup {
  readonly actual: ClassificationCase["actual"];
  readonly score: number;
  readonly count: number;
}

function scoreGroups(cases: readonly ClassificationCase[]): ScoreGroup[] {
  const groups = new Map<string, ScoreGroup>();
  for (const item of cases) {
    const key = `${item.actual}:${item.score}`;
    const current = groups.get(key);
    groups.set(key, {
      actual: item.actual,
      score: item.score,
      count: (current?.count ?? 0) + 1,
    });
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.actual !== b.actual) return a.actual === "positive" ? -1 : 1;
    return b.score - a.score;
  });
}

function countActual(cases: readonly ClassificationCase[], actual: ClassificationCase["actual"]): number {
  return cases.filter((item) => item.actual === actual).length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dataSummary(cases: readonly ClassificationCase[], t: typeof L[keyof typeof L]): string {
  const positives = countActual(cases, "positive");
  const negatives = countActual(cases, "negative");
  return `${t.total} ${cases.length} · ${t.positives} ${positives} · ${t.negatives} ${negatives}`;
}

function ClassificationPresetThumbnail({ preset }: { readonly preset: ClassificationPreset }) {
  const { lang } = useLang();
  const t = L[lang];
  const groups = scoreGroups(preset.cases);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 64"
      preserveAspectRatio="none"
      style={thumbnailStyle}
    >
      <line x1="10" y1="20" x2="110" y2="20" stroke="var(--c-border)" strokeWidth="1" />
      <line x1="10" y1="44" x2="110" y2="44" stroke="var(--c-border)" strokeWidth="1" />
      <line
        x1={10 + preset.threshold * 100}
        y1="8"
        x2={10 + preset.threshold * 100}
        y2="56"
        stroke="var(--c-warn)"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <text x="6" y="23" fill="var(--c-gt-text)" fontSize="7" textAnchor="start">
        {t.positiveShort}
      </text>
      <text x="6" y="47" fill="var(--c-pred-b-text)" fontSize="7" textAnchor="start">
        {t.negativeShort}
      </text>
      {groups.map((group) => {
        const x = 10 + group.score * 100;
        const y = group.actual === "positive" ? 20 : 44;
        const radius = Math.min(8, 3 + Math.sqrt(group.count));
        const fill = group.actual === "positive" ? "var(--c-gt)" : "var(--c-pred-b)";
        const textFill = group.actual === "positive" ? "var(--c-gt-text)" : "var(--c-pred-b-text)";

        return (
          <g key={`${group.actual}-${group.score}`}>
            <circle cx={x} cy={y} r={radius} fill={fill} opacity="0.86" />
            {group.count > 1 ? (
              <text x={x + radius + 2} y={y + 3} fill={textFill} fontSize="8">
                {group.count}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function ClassificationPlayground() {
  const { lang } = useLang();
  const t = L[lang];
  const [cases, setCases] = useState<ClassificationCase[]>([]);
  const [threshold, setThreshold] = useState(0.5);
  const [activePresetId, setActivePresetId] = useState("");
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const stage = stageFor(cases);
  const isCompare = stage === "compare";
  const counts = confusionFromScores(cases, threshold);
  const metrics = classificationMetrics(counts);
  const activePreset = CLS_PRESETS.find((preset) => preset.id === activePresetId);
  const groups = scoreGroups(cases);

  const addCase = (actual: ClassificationCase["actual"]) => {
    setCases((prev) => [...prev, { actual, score: actual === "positive" ? 0.7 : 0.3 }]);
    setActivePresetId("");
    setShowGroupEditor(true);
  };

  const addCaseFromStrip = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const score = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const actual = event.clientY - rect.top < rect.height / 2 ? "positive" : "negative";
    setCases((prev) => [...prev, { actual, score }]);
    setActivePresetId("");
    setShowGroupEditor(false);
  };

  const updateGroupScore = (group: ScoreGroup, score: number) => {
    setCases((prev) =>
      prev.map((item) => (item.actual === group.actual && item.score === group.score ? { ...item, score } : item)),
    );
    setActivePresetId("");
  };

  const loadPreset = (preset: ClassificationPreset) => {
    setCases(cloneCases(preset.cases));
    setThreshold(preset.threshold);
    setActivePresetId(preset.id);
    setShowGroupEditor(false);
  };

  return (
    <div style={pageStyle}>
      <span style={stepStyle}>{stepText(stage, lang)}</span>
      <section style={panelStyle} aria-label={t.presetsLabel}>
        <h3 style={headingStyle}>{t.examples}</h3>
        <div style={presetGridStyle} role="group" aria-label={t.presetsLabel}>
          {CLS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={preset.id === activePresetId}
              style={preset.id === activePresetId ? activePresetCardStyle : presetCardStyle}
              onClick={() => loadPreset(preset)}
            >
              <span style={preset.id === activePresetId ? activePresetStatusStyle : presetStatusStyle}>
                {preset.id === activePresetId ? t.selected : t.choose}
              </span>
              <ClassificationPresetThumbnail preset={preset} />
              <span style={presetLabelStyle}>{lang === "ko" ? preset.labelKo : preset.label}</span>
              <span style={presetMetaStyle} aria-hidden="true">
                <span style={presetMetaItemStyle}>{t.casesLabel} {preset.cases.length}</span>
                <span style={presetMetaItemStyle}>{t.positiveShort} {countActual(preset.cases, "positive")}</span>
                <span style={presetMetaItemStyle}>{t.negativeShort} {countActual(preset.cases, "negative")}</span>
              </span>
            </button>
          ))}
        </div>
        {activePreset ? (
          <div style={loadedSummaryStyle}>
            <strong>{t.loaded}</strong>
            <span>{dataSummary(cases, t)}</span>
            <span>{lang === "ko" ? activePreset.descriptionKo : activePreset.description}</span>
          </div>
        ) : (
          <p style={mutedStyle}>{t.choosePrompt}</p>
        )}
      </section>
      <div style={splitStyle}>
        <div style={columnStyle}>
          <section style={panelStyle} aria-label={t.workspace}>
            <h3 style={headingStyle}>{t.workspace}</h3>
            <p style={mutedStyle}>{promptText(stage, lang)}</p>
            <div style={rowStyle}>
              <button type="button" style={buttonStyle} onClick={() => addCase("positive")}>
                {t.addPositive}
              </button>
              <button type="button" style={buttonStyle} onClick={() => addCase("negative")}>
                {t.addNegative}
              </button>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => {
                  setCases([]);
                  setActivePresetId("");
                  setThreshold(0.5);
                  setShowGroupEditor(false);
                }}
              >
                {t.reset}
              </button>
            </div>
            <div
              style={{ ...scoreStripStyle, cursor: "crosshair" }}
              role="img"
              aria-label={t.workspace}
              onPointerDown={addCaseFromStrip}
            >
              <div
                style={{
                  position: "absolute",
                  left: `${threshold * 100}%`,
                  top: "var(--space-2)",
                  bottom: "var(--space-2)",
                  borderLeft: "2px dashed var(--c-warn)",
                }}
              />
              {cases.map((item, index) => (
                <span
                  key={index}
                  style={{
                    position: "absolute",
                    left: `calc(${item.score * 100}% - var(--space-2))`,
                    top: item.actual === "positive" ? "var(--space-3)" : "var(--space-6)",
                    width: "var(--space-4)",
                    height: "var(--space-4)",
                    borderRadius: item.actual === "positive" ? "50%" : "var(--radius-sm)",
                    background: item.actual === "positive" ? "var(--c-gt)" : "var(--c-pred-b)",
                  }}
                />
              ))}
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <span style={headingStyle}>{t.threshold}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                aria-label={t.threshold}
                onChange={(event) => {
                  setThreshold(Number(event.target.value));
                  setActivePresetId("");
                }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
                {threshold.toFixed(2)}
              </span>
            </label>
            {cases.length > 0 ? (
              <>
                <div style={loadedSummaryStyle}>
                  <span>{dataSummary(cases, t)}</span>
                  <button type="button" style={buttonStyle} onClick={() => setShowGroupEditor((value) => !value)}>
                    {showGroupEditor ? t.closeGroups : t.adjustGroups}
                  </button>
                </div>
                {showGroupEditor ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={cellStyle}>{t.actual}</th>
                        <th style={cellStyle}>{t.count}</th>
                        <th style={cellStyle}>{t.score}</th>
                        <th style={cellStyle}>{t.prediction}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={`${group.actual}-${group.score}`}>
                          <td style={cellStyle}>
                            {group.actual === "positive" ? t.positive : t.negative}
                          </td>
                          <td style={cellStyle}>{group.count}</td>
                          <td style={cellStyle}>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.01}
                              value={group.score}
                              aria-label={`${t.score} ${group.actual} ${group.score.toFixed(2)}`}
                              onChange={(event) => updateGroupScore(group, Number(event.target.value))}
                            />
                          </td>
                          <td style={cellStyle}>
                            {prediction(group.score, threshold) === "positive" ? t.positive : t.negative}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
        <div style={columnStyle}>
          <section style={panelStyle}>
            <h3 style={headingStyle}>{t.metrics}</h3>
            {isCompare ? (
              <>
                <div style={rowStyle}>
                  <AnimatedMetricBlock dataMetric="accuracy" label="Accuracy" value={metrics.accuracy} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="balanced-accuracy" label="Balanced Acc" value={metrics.balancedAccuracy} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="sensitivity" label="Sensitivity" value={metrics.sensitivity} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="specificity" label="Specificity" value={metrics.specificity} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="ppv" label="PPV" value={metrics.ppv} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="npv" label="NPV" value={metrics.npv} decimals={3} size="sm" />
                  <AnimatedMetricBlock dataMetric="f1" label="F1" value={metrics.f1} decimals={3} size="sm" />
                </div>
                <table style={tableStyle} aria-label="Confusion Matrix">
                  <tbody>
                    <tr>
                      <td style={cellStyle}>TP {counts.tp}</td>
                      <td style={cellStyle}>FN {counts.fn}</td>
                    </tr>
                    <tr>
                      <td style={cellStyle}>FP {counts.fp}</td>
                      <td style={cellStyle}>TN {counts.tn}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p style={mutedStyle}>{t.gatedMetrics}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ClassificationPlayground;

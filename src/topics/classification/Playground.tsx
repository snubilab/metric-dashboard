import { useState } from "react";
import type { CSSProperties } from "react";
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
  gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
  gap: "var(--space-2)",
};

const presetCardStyle: CSSProperties = {
  ...buttonStyle,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "var(--space-2)",
  minHeight: "96px",
  padding: "var(--space-2)",
  textAlign: "left",
};

const activePresetCardStyle: CSSProperties = {
  ...presetCardStyle,
  background: "var(--bg-brand-primary)",
  border: "2px solid var(--c-gt)",
  color: "var(--c-gt-text)",
};

const presetLabelStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const thumbnailStyle: CSSProperties = {
  width: "100%",
  height: "48px",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--c-surface)",
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

function ClassificationPresetThumbnail({ preset }: { readonly preset: ClassificationPreset }) {
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
      <text x="6" y="23" fill="var(--c-gt-text)" fontSize="9" textAnchor="start">
        P
      </text>
      <text x="6" y="47" fill="var(--c-pred-b-text)" fontSize="9" textAnchor="start">
        N
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
  const stage = stageFor(cases);
  const isCompare = stage === "compare";
  const counts = confusionFromScores(cases, threshold);
  const metrics = classificationMetrics(counts);
  const activePreset = CLS_PRESETS.find((preset) => preset.id === activePresetId);
  const groups = scoreGroups(cases);

  const addCase = (actual: ClassificationCase["actual"]) => {
    setCases((prev) => [...prev, { actual, score: actual === "positive" ? 0.7 : 0.3 }]);
    setActivePresetId("");
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
              <ClassificationPresetThumbnail preset={preset} />
              <span style={presetLabelStyle}>{lang === "ko" ? preset.labelKo : preset.label}</span>
            </button>
          ))}
        </div>
        {activePreset ? (
          <p style={mutedStyle}>{lang === "ko" ? activePreset.descriptionKo : activePreset.description}</p>
        ) : null}
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
                }}
              >
                {t.reset}
              </button>
            </div>
            <div style={scoreStripStyle} role="img" aria-label={t.workspace}>
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
          </section>
        </div>
        <div style={columnStyle}>
          <section style={panelStyle}>
            <h3 style={headingStyle}>{t.metrics}</h3>
            {isCompare ? (
              <>
                <div style={rowStyle}>
                  <AnimatedMetricBlock dataMetric="accuracy" label="Accuracy" value={metrics.accuracy} decimals={3} />
                  <AnimatedMetricBlock dataMetric="balanced-accuracy" label="Balanced Acc" value={metrics.balancedAccuracy} decimals={3} />
                  <AnimatedMetricBlock dataMetric="sensitivity" label="Sensitivity" value={metrics.sensitivity} decimals={3} />
                  <AnimatedMetricBlock dataMetric="specificity" label="Specificity" value={metrics.specificity} decimals={3} />
                  <AnimatedMetricBlock dataMetric="ppv" label="PPV" value={metrics.ppv} decimals={3} />
                  <AnimatedMetricBlock dataMetric="npv" label="NPV" value={metrics.npv} decimals={3} />
                  <AnimatedMetricBlock dataMetric="f1" label="F1" value={metrics.f1} decimals={3} />
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

/**
 * LearnView — the explanatory tab for a topic.
 *
 * Renders the topic's intro followed by each MetricSection: title, optional
 * KaTeX-rendered formula, plain-language meaning, a "features" list, a "caveats"
 * list, and — when present — the section's interactive MiniSim. The formula is
 * rendered to an HTML string with `throwOnError: false` so a malformed source
 * degrades to red error text rather than crashing the view.
 *
 * All visual values come from the design-system token custom properties.
 */

import katex from "katex";
import "katex/dist/katex.min.css";
import type { MetricSection, Topic } from "../types/topic";
import { MiniSim } from "../components/MiniSim";

interface LearnViewProps {
  topic: Topic;
}

const rootStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-8)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
  maxWidth: "72ch",
};

const introStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-base)",
  lineHeight: 1.6,
  color: "var(--c-text)",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  paddingTop: "var(--space-6)",
  borderTop: "1px solid var(--c-border)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
};

const formulaStyle: React.CSSProperties = {
  margin: 0,
  padding: "var(--space-3) var(--space-4)",
  overflowX: "auto",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--c-text)",
};

const meaningStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-base)",
  lineHeight: 1.6,
  color: "var(--c-text)",
};

const subListLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "var(--space-6)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text)",
};

/** Render a KaTeX formula to a sanitizable HTML string; never throws. */
function renderFormula(formula: string): string {
  return katex.renderToString(formula, { throwOnError: false, displayMode: true });
}

function LabeledList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <h4 style={subListLabelStyle}>{label}</h4>
      <ul style={listStyle}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ section }: { section: MetricSection }) {
  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>{section.title}</h3>
      {section.formula && (
        <div
          style={formulaStyle}
          // KaTeX output is generated locally from trusted content with
          // throwOnError disabled, so injection is safe here.
          dangerouslySetInnerHTML={{ __html: renderFormula(section.formula) }}
        />
      )}
      <p style={meaningStyle}>{section.meaning}</p>
      <LabeledList label="Features" items={section.features} />
      <LabeledList label="Caveats" items={section.caveats} />
      {section.miniSim && <MiniSim config={section.miniSim} />}
    </section>
  );
}

export function LearnView({ topic }: LearnViewProps) {
  const learn = topic.learn;
  if (!learn) {
    return null;
  }
  return (
    <div style={rootStyle}>
      <p style={introStyle}>{learn.intro}</p>
      {learn.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  );
}

export default LearnView;

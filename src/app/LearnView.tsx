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

import { useEffect, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { MetricSection, Topic } from "../types/topic";
import { MiniSim } from "../components/MiniSim";
import { SectionNav } from "./SectionNav";
import { useLang } from "../i18n/LanguageContext";

interface LearnViewProps {
  topic: Topic;
}

/** DOM id for a rendered section wrapper, used by quick-jump navigation. */
function sectionDomId(id: string): string {
  return `section-${id}`;
}

const layoutStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: "var(--space-8)",
  alignItems: "flex-start",
  flexWrap: "wrap",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const navRailStyle: React.CSSProperties = {
  flex: "0 0 200px",
  minWidth: "160px",
};

const rootStyle: React.CSSProperties = {
  flex: "1 1 32rem",
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
    <section id={sectionDomId(section.id)} style={sectionStyle}>
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

/**
 * Track which section is currently in view via IntersectionObserver, falling
 * back to no highlighting where the API is unavailable (e.g. jsdom). Returns
 * the active section id, or undefined when nothing is tracked.
 */
function useActiveSection(sectionIds: string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || sectionIds.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          setActiveId(visible.target.id.replace(/^section-/, ""));
        }
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const id of sectionIds) {
      const element = document.getElementById(sectionDomId(id));
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, [sectionIds.join("|")]);

  return activeId;
}

/** Scroll a section into view; guarded for environments without the API. */
function jumpToSection(id: string): void {
  const element = document.getElementById(sectionDomId(id));
  element?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

export function LearnView({ topic }: LearnViewProps) {
  const { lang } = useLang();
  const learn = lang === "ko" && topic.learnKo ? topic.learnKo : topic.learn;
  const sections = learn?.sections ?? [];
  const activeId = useActiveSection(sections.map((section) => section.id));

  if (!learn) {
    return null;
  }
  return (
    <div style={layoutStyle}>
      <div style={rootStyle}>
        <p style={introStyle}>{learn.intro}</p>
        {learn.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </div>
      <div style={navRailStyle}>
        <SectionNav
          sections={learn.sections.map((section) => ({ id: section.id, title: section.title }))}
          activeId={activeId}
          onJump={jumpToSection}
        />
      </div>
    </div>
  );
}

export default LearnView;

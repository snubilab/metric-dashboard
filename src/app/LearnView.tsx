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
import type { Complementarity, MetricSection, Topic } from "../types/topic";
import { MiniSim } from "../components/MiniSim";
import { MetricFigure } from "../components/figures/MetricFigure";
import { CoverageTable } from "../components/CoverageTable";
import { BenchmarkTable } from "../components/BenchmarkTable";
import { SectionNav } from "./SectionNav";
import { useLang } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/LanguageContext";
import { splitMetricText } from "../components/metrics/metricTextLinks";

interface LearnViewProps {
  topic: Topic;
}

/** DOM id for a rendered section wrapper, used by quick-jump navigation. */
function sectionDomId(id: string): string {
  return `section-${id}`;
}

const rootStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
  maxWidth: "920px",
};

const introStyle: React.CSSProperties = {
  margin: 0,
  padding: "16px 18px",
  fontSize: "var(--text-sm)",
  lineHeight: 1.6,
  color: "var(--text-brand-primary)",
  background: "var(--bg-brand-primary)",
  border: "1px solid var(--border-brand)",
  borderRadius: "var(--radius-xl)",
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  padding: "22px 24px",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "14px",
  boxShadow: "var(--shadow-xs)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-lg)",
  color: "var(--text-primary)",
};

const formulaStyle: React.CSSProperties = {
  margin: 0,
  padding: "12px 15px",
  overflowX: "auto",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
  color: "var(--text-primary)",
};

const meaningStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.6,
  color: "var(--text-secondary)",
};

const subListLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: "var(--text-quaternary)",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "var(--space-6)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--text-secondary)",
};

/** List variant with a leading icon per item (no bullet). */
const iconListStyle: React.CSSProperties = {
  ...listStyle,
  listStyleType: "none",
  paddingLeft: 0,
  gap: "var(--space-2)",
};

const iconItemStyle: React.CSSProperties = {
  display: "flex",
  gap: "var(--space-2)",
  alignItems: "baseline",
};

/** Leading markers: a check on features, a warning on caveats (per request). */
const FEATURE_ICON = "✓";
const CAVEAT_ICON = "⚠";

/** Inline metric link rendered as a reset button styled like a text link. */
const metricLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: "var(--tint-a-fg)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
};

const L = {
  ko: {
    featuresLabel: "특징",
    caveatsLabel: "주의점",
    complementsLabel: "함께 보는 지표",
    complementarityTitle: "지표는 어떻게 서로를 보완하는가",
    complementsNav: "보완책",
  },
  en: {
    featuresLabel: "Features",
    caveatsLabel: "Caveats",
    complementsLabel: "Pairs well with",
    complementarityTitle: "How these metrics complement each other",
    complementsNav: "Complementarity",
  },
} as const;

/** DOM id (and nav id) for the topic-level complementarity section. */
const COMPLEMENTARITY_ID = "complementarity";

const calloutStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
  padding: "var(--space-3) var(--space-4)",
  background: "var(--tint-b-bg)",
  border: "1px solid var(--bg-warning-secondary)",
  borderLeft: "3px solid var(--tint-b-fg)",
  borderRadius: "var(--radius-lg)",
};

const calloutLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: "var(--tint-b-fg)",
};

const calloutTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--text-secondary)",
};

const complementaritySectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-6)",
  padding: "22px 24px var(--space-8)",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "14px",
  boxShadow: "var(--shadow-xs)",
};

/** Render a KaTeX formula to a sanitizable HTML string; never throws. */
function renderFormula(formula: string): string {
  return katex.renderToString(formula, { throwOnError: false, displayMode: true });
}

/**
 * Render prose, turning metric-name mentions (HD95, NSD, ASSD, Dice, …) into
 * links that jump to that metric's section. A token pointing at the section it
 * already sits in (`currentId`) stays plain text — no self-links.
 */
function MetricText({
  text,
  currentId,
  sectionIds,
}: {
  text: string;
  currentId: string;
  sectionIds: ReadonlySet<string>;
}) {
  return (
    <>
      {splitMetricText(text, sectionIds).map((seg, i) =>
        seg.sectionId && seg.sectionId !== currentId ? (
          <button
            key={i}
            type="button"
            style={metricLinkStyle}
            onClick={() => jumpToSection(seg.sectionId as string)}
          >
            {seg.text}
          </button>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function LabeledList({
  label,
  items,
  currentId,
  icon,
  iconColor,
  sectionIds,
}: {
  label: string;
  items: string[];
  currentId: string;
  sectionIds: ReadonlySet<string>;
  icon?: string;
  iconColor?: string;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <h4 style={subListLabelStyle}>{label}</h4>
      <ul style={icon ? iconListStyle : listStyle}>
        {items.map((item, index) => (
          <li key={index} style={icon ? iconItemStyle : undefined}>
            {icon && (
              <span aria-hidden="true" style={{ flex: "0 0 auto", color: iconColor }}>
                {icon}
              </span>
            )}
            <span>
              <MetricText text={item} currentId={currentId} sectionIds={sectionIds} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({
  section,
  lang,
  sectionIds,
}: {
  section: MetricSection;
  lang: Lang;
  sectionIds: ReadonlySet<string>;
}) {
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
      {section.figure && <MetricFigure figure={section.figure} />}
      <p style={meaningStyle}>
        <MetricText text={section.meaning} currentId={section.id} sectionIds={sectionIds} />
      </p>
      <LabeledList
        label={L[lang].featuresLabel}
        items={section.features}
        currentId={section.id}
        sectionIds={sectionIds}
        icon={FEATURE_ICON}
        iconColor="var(--c-gt-text)"
      />
      <LabeledList
        label={L[lang].caveatsLabel}
        items={section.caveats}
        currentId={section.id}
        sectionIds={sectionIds}
        icon={CAVEAT_ICON}
      />
      {section.complements && (
        <div style={calloutStyle}>
          <h4 style={calloutLabelStyle}>{L[lang].complementsLabel}</h4>
          <p style={calloutTextStyle}>
            <MetricText text={section.complements} currentId={section.id} sectionIds={sectionIds} />
          </p>
        </div>
      )}
      {section.miniSim && <MiniSim config={section.miniSim} />}
    </section>
  );
}

function ComplementaritySection({
  complementarity,
  lang,
}: {
  complementarity: Complementarity;
  lang: Lang;
}) {
  return (
    <section id={sectionDomId(COMPLEMENTARITY_ID)} style={complementaritySectionStyle}>
      <h3 style={titleStyle}>{L[lang].complementarityTitle}</h3>
      <CoverageTable intro={complementarity.intro} pairs={complementarity.pairs} />
      <BenchmarkTable benchmarks={complementarity.benchmarks} />
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
  const sectionKey = sectionIds.join("|");

  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("|") : [];
    if (typeof IntersectionObserver === "undefined" || ids.length === 0) {
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
    for (const id of ids) {
      const element = document.getElementById(sectionDomId(id));
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, [sectionKey]);

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
  const sectionIdSet = new Set(sections.map((section) => section.id));
  // The metric sections, plus the topic-level complementarity section ("보완책")
  // when present — so the floating nav can jump to "how metrics complement
  // each other" too, and it highlights when scrolled into view.
  const navSections = [
    ...sections.map((section) => ({ id: section.id, title: section.title })),
    ...(learn?.complementarity
      ? [{ id: COMPLEMENTARITY_ID, title: L[lang].complementsNav }]
      : []),
  ];
  const activeId = useActiveSection(navSections.map((s) => s.id));

  if (!learn) {
    return null;
  }
  return (
    <div style={rootStyle}>
      <p style={introStyle}>{learn.intro}</p>
      {learn.sections.map((section) => (
        <Section key={section.id} section={section} lang={lang} sectionIds={sectionIdSet} />
      ))}
      {learn.complementarity && (
        <ComplementaritySection complementarity={learn.complementarity} lang={lang} />
      )}
      {/* Floating island nav: fixed-position, positions itself (see SectionNav). */}
      <SectionNav sections={navSections} activeId={activeId} onJump={jumpToSection} />
    </div>
  );
}

export default LearnView;

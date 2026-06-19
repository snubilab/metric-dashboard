/**
 * App — the metric-dashboard shell.
 *
 * A two-pane scientific-instrument layout: a Sidebar topic navigator on the left
 * and a main panel on the right. The main panel header carries the active
 * topic's title and a Learn / Playground / Scenarios tab bar; the body renders
 * the matching view for an available topic, or a calm "Coming soon" placeholder
 * for a topic that is not yet built.
 *
 * State is intentionally minimal: the selected topic id and the active tab.
 * All visual values come from the design-system token custom properties.
 */

import { useMemo, useState } from "react";
import type { Topic } from "./types/topic";
import { TOPICS, orderedTopics } from "./app/topicRegistry";
import { Sidebar } from "./app/Sidebar";
import { LearnView } from "./app/LearnView";
import { ScenariosView } from "./app/ScenariosView";
import { ThemeToggle } from "./app/ThemeToggle";
import { LanguageToggle } from "./i18n/LanguageToggle";
import { useT } from "./i18n/messages";

type Tab = "learn" | "playground" | "scenarios";

/** Tab id paired with the dictionary key for its localized label. */
const TABS: { id: Tab; labelKey: string }[] = [
  { id: "learn", labelKey: "tab.learn" },
  { id: "playground", labelKey: "tab.playground" },
  { id: "scenarios", labelKey: "tab.scenarios" },
];

/** Dictionary key for a topic's localized title, falling back to topic.title. */
function topicTitleKey(id: string): string {
  return `topicTitle.${id}`;
}

const DEFAULT_TOPIC_ID = "segmentation";

const shellStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  height: "100svh",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  fontFamily: "var(--font-ui)",
};

const mainStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  height: "100%",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-6) var(--space-8) 0",
  borderBottom: "1px solid var(--c-border)",
  background: "var(--c-bg)",
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};

const titleGroupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "var(--space-3)",
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  color: "var(--c-text)",
};

const groupTagStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  fontFamily: "var(--font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: "var(--space-1)",
};

function tabStyle(isActive: boolean, isEnabled: boolean): React.CSSProperties {
  return {
    padding: "var(--space-2) var(--space-4)",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "var(--c-text)" : "var(--c-text-dim)",
    background: "transparent",
    border: "none",
    borderBottom: `2px solid ${isActive ? "var(--c-pred-a)" : "transparent"}`,
    cursor: isEnabled ? "pointer" : "not-allowed",
    opacity: isEnabled ? 1 : 0.5,
  };
}

const bodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "var(--space-8)",
};

const placeholderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  maxWidth: "48ch",
};

const placeholderTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
};

const placeholderTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-sm)",
  lineHeight: 1.6,
  color: "var(--c-text-dim)",
};

/** Calm placeholder for topics not yet implemented. */
function ComingSoon({ topic }: { topic: Topic }) {
  const t = useT();
  const title = t(topicTitleKey(topic.id)) || topic.title;
  return (
    <div role="tabpanel" style={placeholderStyle}>
      <h2 style={placeholderTitleStyle}>{t("comingSoon")}</h2>
      <p style={placeholderTextStyle}>
        The {title} metric family is being prepared. Its learn content,
        interactive playground, and clinical scenarios will appear here.
      </p>
    </div>
  );
}

/** Body for an available topic, selected by the active tab. */
function TopicBody({ topic, tab }: { topic: Topic; tab: Tab }) {
  if (tab === "playground") {
    const Playground = topic.Playground;
    return (
      <div role="tabpanel">
        {Playground ? <Playground /> : null}
      </div>
    );
  }
  if (tab === "scenarios") {
    return (
      <div role="tabpanel">
        <ScenariosView topic={topic} />
      </div>
    );
  }
  return (
    <div role="tabpanel">
      <LearnView topic={topic} />
    </div>
  );
}

function App() {
  const [selectedId, setSelectedId] = useState(DEFAULT_TOPIC_ID);
  const [activeTab, setActiveTab] = useState<Tab>("learn");
  const t = useT();

  const topics = useMemo(() => orderedTopics(), []);
  const topic = useMemo(
    () => TOPICS.find((candidate) => candidate.id === selectedId) ?? topics[0],
    [selectedId, topics],
  );
  const isAvailable = topic.status === "available";
  const title = t(topicTitleKey(topic.id)) || topic.title;

  return (
    <div style={shellStyle}>
      <Sidebar topics={topics} activeId={topic.id} onSelect={setSelectedId} />
      <main style={mainStyle}>
        <header style={headerStyle}>
          <div style={titleRowStyle}>
            <div style={titleGroupStyle}>
              <h1 style={titleStyle}>{title}</h1>
              <span style={groupTagStyle}>{topic.group}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          <div role="tablist" aria-label="Topic views" style={tabBarStyle}>
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={!isAvailable}
                  onClick={() => setActiveTab(tab.id)}
                  style={tabStyle(isActive, isAvailable)}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </header>
        <div style={bodyStyle}>
          {isAvailable ? (
            <TopicBody topic={topic} tab={activeTab} />
          ) : (
            <ComingSoon topic={topic} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

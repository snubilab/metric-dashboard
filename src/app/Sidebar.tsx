/**
 * Sidebar — the dashboard's topic navigator.
 *
 * Lists every topic grouped under its family header (from `GROUPS`). Available
 * topics are selectable buttons; the active one carries a left accent in the
 * Pred-A color. Coming-soon topics are dimmed, non-interactive, and tagged
 * "soon" so the roadmap is visible without inviting a dead click.
 *
 * All visual values come from the design-system token custom properties.
 */

import type { Topic, TopicGroup } from "../types/topic";
import { GROUPS } from "./groups";
import { useT } from "../i18n/messages";

interface SidebarProps {
  topics: Topic[];
  activeId: string;
  onSelect: (id: string) => void;
}

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-6)",
  padding: "var(--space-4)",
  fontFamily: "var(--font-ui)",
  background: "var(--c-surface)",
  borderRight: "1px solid var(--c-border)",
  minWidth: "15rem",
  height: "100%",
  overflowY: "auto",
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const groupHeaderStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
};

function itemStyle(isActive: boolean, isAvailable: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-2)",
    width: "100%",
    textAlign: "left",
    padding: "var(--space-2) var(--space-3)",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    color: isAvailable ? "var(--c-text)" : "var(--c-text-dim)",
    background: isActive ? "var(--c-surface-2)" : "transparent",
    border: "1px solid transparent",
    borderLeft: `3px solid ${isActive ? "var(--c-pred-a)" : "transparent"}`,
    borderRadius: "var(--radius-sm)",
    cursor: isAvailable ? "pointer" : "not-allowed",
    opacity: isAvailable ? 1 : 0.55,
    fontWeight: isActive ? 600 : 400,
  };
}

const soonTagStyle: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "var(--space-1) var(--space-2)",
  fontSize: "var(--text-xs)",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  lineHeight: 1,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--c-text-dim)",
  background: "var(--c-surface-2)",
  borderRadius: "var(--radius-sm)",
};

/** Topics belonging to one group, preserving the incoming order. */
function topicsForGroup(topics: Topic[], group: TopicGroup): Topic[] {
  return topics.filter((t) => t.group === group);
}

export function Sidebar({ topics, activeId, onSelect }: SidebarProps) {
  const t = useT();
  return (
    <nav aria-label="Topics" style={navStyle}>
      {GROUPS.map((group) => {
        const groupTopics = topicsForGroup(topics, group.id);
        if (groupTopics.length === 0) {
          return null;
        }
        return (
          <section key={group.id} style={groupStyle}>
            <h2 style={groupHeaderStyle}>{t(`group.${group.id}`) || group.label}</h2>
            <ul style={listStyle}>
              {groupTopics.map((topic) => {
                const isAvailable = topic.status === "available";
                const isActive = topic.id === activeId;
                const title = t(`topicTitle.${topic.id}`) || topic.title;
                return (
                  <li key={topic.id}>
                    <button
                      type="button"
                      disabled={!isAvailable}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onSelect(topic.id)}
                      style={itemStyle(isActive, isAvailable)}
                    >
                      <span>{title}</span>
                      {!isAvailable && <span style={soonTagStyle}>{t("soon")}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}

export default Sidebar;

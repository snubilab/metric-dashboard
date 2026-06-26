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
  credit?: string;
}

// Layout props (min-width, height, overflow, border) live in the `.app-sidebar`
// class (see App.tsx SHELL_CSS) so the mobile breakpoint can relax them; keeping
// them out of this inline object lets the media query win.
const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  padding: 0,
  fontFamily: "var(--font-ui)",
  background: "var(--bg-primary)",
};

const brandStyle: React.CSSProperties = {
  padding: "22px 18px",
  display: "flex",
  alignItems: "center",
  gap: "11px",
};

const brandMarkStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9,
  background: "var(--bg-brand-solid)",
  color: "var(--color-white)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
  fontWeight: 700,
  lineHeight: 1,
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.15,
  fontWeight: 600,
  letterSpacing: 0,
  color: "var(--text-primary)",
};

const brandSubStyle: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  lineHeight: 1.3,
  color: "var(--text-quaternary)",
};

const groupsStyle: React.CSSProperties = {
  padding: "6px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
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
  lineHeight: 1,
  color: "var(--text-quaternary)",
  padding: "0 10px 8px",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

function itemStyle(isActive: boolean, isAvailable: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-2)",
    width: "100%",
    textAlign: "left",
    padding: "9px 11px",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    lineHeight: 1,
    color: isActive ? "var(--text-brand-secondary)" : isAvailable ? "var(--text-tertiary)" : "var(--text-quaternary)",
    background: isActive ? "var(--bg-brand-primary)" : "transparent",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: isAvailable ? "pointer" : "not-allowed",
    fontWeight: isActive ? 600 : 400,
  };
}

const soonTagStyle: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "3px 8px",
  fontSize: "11px",
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  lineHeight: 1,
  color: "var(--text-tertiary)",
  background: "var(--bg-secondary)",
  borderRadius: "var(--radius-full)",
};

const itemLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "11px",
  minWidth: 0,
};

const iconStyle: React.CSSProperties = {
  flex: "0 0 auto",
};

const creditStyle: React.CSSProperties = {
  marginTop: "auto",
  padding: "16px 18px",
  borderTop: "1px solid var(--border-secondary)",
  fontSize: "var(--text-xs)",
  lineHeight: 1.5,
  color: "var(--text-quaternary)",
};

/** Topics belonging to one group, preserving the incoming order. */
function topicsForGroup(topics: Topic[], group: TopicGroup): Topic[] {
  return topics.filter((t) => t.group === group);
}

function TopicIcon({ id }: { id: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (id === "segmentation") {
    return (
      <svg {...common} aria-hidden="true" style={iconStyle}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "detection") {
    return (
      <svg {...common} aria-hidden="true" style={iconStyle}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      </svg>
    );
  }
  if (id === "classification") {
    return (
      <svg {...common} aria-hidden="true" style={iconStyle}>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-6" />
      </svg>
    );
  }
  if (id === "regression") {
    return (
      <svg {...common} aria-hidden="true" style={iconStyle}>
        <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
      </svg>
    );
  }
  return null;
}

export function Sidebar({ topics, activeId, onSelect, credit }: SidebarProps) {
  const t = useT();
  return (
    <nav aria-label="Topics" className="app-sidebar" style={navStyle}>
      <div style={brandStyle}>
        <span style={brandMarkStyle}>M</span>
        <div>
          <div style={brandTitleStyle}>지표 대시보드</div>
          <div style={brandSubStyle}>Metrics Reloaded</div>
        </div>
      </div>
      <div style={groupsStyle}>
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
                        <span style={itemLabelStyle}>
                          <TopicIcon id={topic.id} />
                          <span>{title}</span>
                        </span>
                        {!isAvailable && <span style={soonTagStyle}>{t("soon")}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      {credit && <div style={creditStyle}>{credit}</div>}
    </nav>
  );
}

export default Sidebar;

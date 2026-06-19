/**
 * SectionNav — sticky right-rail quick-jump navigation for the Learn view.
 *
 * Renders one small token-styled button per metric section so the reader can
 * jump straight to it. The active section (tracked by the parent) carries a
 * left accent bar in the Pred-A color, mirroring the Sidebar's active styling.
 * A small uppercase "On this page" heading labels the rail.
 *
 * This component is presentational: it reports clicks via `onJump` and lets the
 * parent own scrolling and active-section detection.
 *
 * All visual values come from the design-system token custom properties.
 */

import type { CSSProperties } from "react";
import { useT } from "../i18n/messages";

interface SectionNavItem {
  id: string;
  title: string;
}

interface SectionNavProps {
  sections: SectionNavItem[];
  activeId?: string;
  onJump: (id: string) => void;
}

const navStyle: CSSProperties = {
  position: "sticky",
  top: "var(--space-4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
  fontFamily: "var(--font-ui)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-1)",
};

function itemStyle(isActive: boolean): CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "var(--space-1) var(--space-3)",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.4,
    color: isActive ? "var(--c-text)" : "var(--c-text-dim)",
    background: isActive ? "var(--c-surface-2)" : "transparent",
    border: "1px solid transparent",
    borderLeft: `3px solid ${isActive ? "var(--c-pred-a)" : "transparent"}`,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: isActive ? 600 : 400,
  };
}

export function SectionNav({ sections, activeId, onJump }: SectionNavProps) {
  const t = useT();
  if (sections.length === 0) {
    return null;
  }
  return (
    <nav aria-label="Section navigation" style={navStyle}>
      <h2 style={headingStyle}>{t("onThisPage")}</h2>
      <ul style={listStyle}>
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <button
                type="button"
                aria-current={isActive ? "location" : undefined}
                onClick={() => onJump(section.id)}
                style={itemStyle(isActive)}
              >
                {section.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SectionNav;

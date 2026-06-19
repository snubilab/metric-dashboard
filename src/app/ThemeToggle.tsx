/**
 * ThemeToggle — a small accessible control that flips the document theme.
 *
 * The active theme lives on `document.documentElement.dataset.theme` ("light" |
 * "dark"); tokens.css reads it via the [data-theme="dark"] override. The choice
 * persists to localStorage under "md-theme" and is restored on mount, defaulting
 * to "light". All access to `document` / `localStorage` is guarded so the hook
 * never crashes under jsdom or SSR.
 *
 * All visual values come from the design-system token custom properties.
 */

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "md-theme";
const DEFAULT_THEME: Theme = "light";

/** Read the persisted theme, falling back to the default when unavailable. */
function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Reflect the theme onto <html> and persist it, guarding for jsdom/SSR. */
function applyTheme(theme: Theme): void {
  try {
    document.documentElement.dataset.theme = theme;
  } catch {
    /* document unavailable — nothing to reflect */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — choice is still applied for this session */
  }
}

/**
 * Manage the active theme. Restores the persisted choice on mount and keeps
 * <html> + localStorage in sync whenever the theme changes.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
  padding: "var(--space-2) var(--space-3)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
};

const glyphStyle: React.CSSProperties = {
  fontSize: "var(--text-base)",
  lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      aria-pressed={isDark}
      title={`Switch to ${nextTheme} theme`}
      style={buttonStyle}
    >
      <span aria-hidden="true" style={glyphStyle}>
        {isDark ? "☾" : "☀"}
      </span>
      <span style={labelStyle}>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

export default ThemeToggle;

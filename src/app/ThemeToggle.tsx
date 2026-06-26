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

type Theme = "light" | "dark";

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
function useTheme(): { theme: Theme; toggleTheme: () => void } {
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
  justifyContent: "center",
  width: 38,
  height: 36,
  padding: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--text-tertiary)",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-secondary)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-xs)",
  cursor: "pointer",
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
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v2.2M12 18.8V21M5.64 5.64 7.2 7.2M16.8 16.8l1.56 1.56M3 12h2.2M18.8 12H21M5.64 18.36 7.2 16.8M16.8 7.2l1.56-1.56M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.2 14.2A7.2 7.2 0 0 1 9.8 3.8 8.5 8.5 0 1 0 20.2 14.2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;

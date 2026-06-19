/**
 * LanguageContext — the app-wide UI language (Korean / English).
 *
 * The educational audience is Korean students, so the default language is
 * Korean ("ko"); English ("en") is available via the toggle. The choice
 * persists to localStorage under "md-lang" and is restored on mount; the active
 * language is also reflected onto `document.documentElement.lang` so assistive
 * tech and the browser read the page in the right language.
 *
 * All access to `window` / `localStorage` / `document` is guarded so the
 * provider never crashes under jsdom or SSR. Tests can pass `initialLang` for a
 * deterministic starting language that bypasses storage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Lang = "ko" | "en";

const STORAGE_KEY = "md-lang";
const DEFAULT_LANG: Lang = "ko";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/** Narrow an unknown value to a Lang, or undefined when it is neither. */
function asLang(value: unknown): Lang | undefined {
  return value === "ko" || value === "en" ? value : undefined;
}

/** Read the persisted language, falling back to the default when unavailable. */
function readStoredLang(): Lang {
  try {
    return asLang(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/** Persist the language and reflect it onto <html lang>, guarded for jsdom/SSR. */
function applyLang(lang: Lang): void {
  try {
    document.documentElement.lang = lang;
  } catch {
    /* document unavailable — nothing to reflect */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable — choice is still applied for this session */
  }
}

interface LanguageProviderProps {
  children: ReactNode;
  /** Optional starting language for deterministic tests; bypasses storage. */
  initialLang?: Lang;
}

/**
 * Provide the active UI language to the tree. Restores the persisted choice on
 * mount (unless `initialLang` is given) and keeps <html lang> + localStorage in
 * sync whenever the language changes.
 */
export function LanguageProvider({ children, initialLang }: LanguageProviderProps) {
  const [lang, setLang] = useState<Lang>(() => initialLang ?? readStoredLang());

  useEffect(() => {
    applyLang(lang);
  }, [lang]);

  const value: LanguageContextValue = { lang, setLang };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Safe default returned by `useLang` when no provider is present, so components
 * that consume the context can still render (e.g. in bare unit tests). Korean is
 * the default language and `setLang` is a no-op.
 */
const FALLBACK_VALUE: LanguageContextValue = {
  lang: DEFAULT_LANG,
  setLang: () => {},
};

/**
 * Access the active language and its setter. Outside a LanguageProvider this
 * returns a safe default ({ lang: "ko", setLang: no-op }) so consumers render
 * without a provider rather than throwing.
 */
export function useLang(): LanguageContextValue {
  return useContext(LanguageContext) ?? FALLBACK_VALUE;
}

/** Stable callback that sets the language; convenience over useLang().setLang. */
export function useSetLang(): (lang: Lang) => void {
  const { setLang } = useLang();
  return useCallback((next: Lang) => setLang(next), [setLang]);
}

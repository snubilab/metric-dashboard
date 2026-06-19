/**
 * useFirstVisit — track whether the user has already seen a one-time affordance
 * (e.g. an onboarding banner) keyed by a stable storage key.
 *
 * The "seen" flag persists to localStorage under the given `key` and is restored
 * on mount (seen when the stored value is exactly "true"). `markSeen` records the
 * visit; `reset` clears it so a "show again" affordance can re-display the banner.
 *
 * All access to `window` / `localStorage` is guarded so the hook never crashes
 * under jsdom or SSR — mirroring the pattern in LanguageContext.tsx and
 * ThemeToggle.tsx. When storage is unavailable the hook behaves as not-seen, and
 * `markSeen` still updates in-memory state so the banner can be dismissed for the
 * current session even though the choice cannot be persisted.
 */

import { useCallback, useState } from "react";

const SEEN_VALUE = "true";

/** Read the persisted flag, treating any failure as not-seen. */
function readSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === SEEN_VALUE;
  } catch {
    return false;
  }
}

interface FirstVisitState {
  /** True once the affordance has been seen (persisted or dismissed this session). */
  seen: boolean;
  /** Record that the affordance has been seen, persisting when possible. */
  markSeen: () => void;
  /** Clear the seen flag so the affordance can be shown again. */
  reset: () => void;
}

export function useFirstVisit(key: string): FirstVisitState {
  const [seen, setSeen] = useState<boolean>(() => readSeen(key));

  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(key, SEEN_VALUE);
    } catch {
      /* storage unavailable — dismissed for this session only */
    }
  }, [key]);

  const reset = useCallback(() => {
    setSeen(false);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage unavailable — reset applies for this session only */
    }
  }, [key]);

  return { seen, markSeen, reset };
}

export default useFirstVisit;

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFirstVisit } from "./useFirstVisit";

const KEY = "md-first-visit-test";

describe("useFirstVisit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts unseen when no flag is persisted", () => {
    const { result } = renderHook(() => useFirstVisit(KEY));

    expect(result.current.seen).toBe(false);
  });

  it("markSeen sets seen=true and persists the flag", () => {
    const { result } = renderHook(() => useFirstVisit(KEY));

    act(() => {
      result.current.markSeen();
    });

    expect(result.current.seen).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe("true");
  });

  it("a fresh hook reads the persisted flag as seen", () => {
    window.localStorage.setItem(KEY, "true");

    const { result } = renderHook(() => useFirstVisit(KEY));

    expect(result.current.seen).toBe(true);
  });

  it("reset clears the persisted flag and returns to unseen", () => {
    window.localStorage.setItem(KEY, "true");
    const { result } = renderHook(() => useFirstVisit(KEY));

    act(() => {
      result.current.reset();
    });

    expect(result.current.seen).toBe(false);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("does not crash and starts unseen when localStorage is unavailable", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("localStorage unavailable");
    });

    const { result } = renderHook(() => useFirstVisit(KEY));

    expect(result.current.seen).toBe(false);

    // markSeen must not throw and still dismisses for the session in-memory.
    act(() => {
      result.current.markSeen();
    });

    expect(result.current.seen).toBe(true);
  });
});

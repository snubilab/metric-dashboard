import { describe, expect, it } from "vitest";
import { metricMeaning } from "./metricMeaning";

/** The eight metric keys this dashboard renders. */
const KNOWN_KEYS = ["dice", "iou", "sensitivity", "precision", "nsd", "hd95", "assd", "volRel"] as const;

describe("metricMeaning", () => {
  it("returns a non-empty Korean description for every known key", () => {
    for (const key of KNOWN_KEYS) {
      expect(metricMeaning(key, "ko")).not.toBe("");
    }
  });

  it("returns a non-empty English description for every known key", () => {
    for (const key of KNOWN_KEYS) {
      expect(metricMeaning(key, "en")).not.toBe("");
    }
  });

  it("localizes: Korean and English differ for a known key", () => {
    expect(metricMeaning("dice", "ko")).not.toBe(metricMeaning("dice", "en"));
  });

  it("returns an empty string for an unknown key", () => {
    expect(metricMeaning("unknown", "ko")).toBe("");
    expect(metricMeaning("unknown", "en")).toBe("");
  });

  it("never describes a value as good/fair/poor (relative-only thesis guard)", () => {
    const forbidden = ["좋음", "보통", "나쁨", "good", "fair", "poor"];
    for (const key of KNOWN_KEYS) {
      for (const lang of ["ko", "en"] as const) {
        const text = metricMeaning(key, lang).toLowerCase();
        for (const word of forbidden) {
          expect(text).not.toContain(word.toLowerCase());
        }
      }
    }
  });
});

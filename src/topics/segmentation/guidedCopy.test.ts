import { describe, it, expect } from "vitest";
import {
  STAGE_PROMPT,
  STAGE_GATING_LINE,
  THESIS_BANNER,
  stepPill,
  RESET_TO_EMPTY,
  SHOW_GUIDE_AGAIN,
  LOAD_EXAMPLE,
  LOAD_EXAMPLE_CAPTION,
} from "./guidedCopy";
import type { Bilingual } from "./guidedCopy";

/**
 * Grade words the product thesis forbids as quality judgments. No metric is ever
 * graded good/bad/superior; verdicts only ever say which side is "closer".
 * Matched case-insensitively as whole words so legitimate substrings (none here)
 * cannot trip the guard.
 */
const GRADE_WORDS = ["좋음", "나쁨", "우수", "good", "bad"] as const;

/** Every user-facing string in this module, flattened across both languages. */
function allCopyStrings(): string[] {
  const bilinguals: Bilingual[] = [
    ...Object.values(STAGE_PROMPT),
    ...Object.values(STAGE_GATING_LINE),
    THESIS_BANNER,
    RESET_TO_EMPTY,
    SHOW_GUIDE_AGAIN,
    LOAD_EXAMPLE,
    LOAD_EXAMPLE_CAPTION,
  ];
  const strings = bilinguals.flatMap((b) => [b.ko, b.en]);
  strings.push(
    stepPill(1, "ko"),
    stepPill(1, "en"),
    stepPill(3, "ko"),
    stepPill(3, "en"),
  );
  return strings;
}

describe("stepPill", () => {
  it("renders the Korean pill as 'STEP n / 3'", () => {
    // Arrange / Act
    const pill = stepPill(1, "ko");

    // Assert
    expect(pill).toBe("STEP 1 / 3");
  });

  it("renders the English pill as 'STEP n of 3'", () => {
    // Arrange / Act
    const pill = stepPill(2, "en");

    // Assert
    expect(pill).toBe("STEP 2 of 3");
  });
});

describe("guided copy thesis safety", () => {
  it("never grades a metric good/bad/superior in any copy string", () => {
    // Arrange
    const strings = allCopyStrings();

    // Act / Assert
    for (const text of strings) {
      const lower = text.toLowerCase();
      for (const grade of GRADE_WORDS) {
        const pattern = new RegExp(`\\b${grade}\\b`, "i");
        // Korean words have no \b boundary; fall back to substring for them.
        const hit = /[a-z]/i.test(grade) ? pattern.test(lower) : text.includes(grade);
        expect(hit, `"${text}" must not contain grade word "${grade}"`).toBe(false);
      }
    }
  });
});

describe("guided copy bilingual completeness", () => {
  it("provides both ko and en for every stage prompt and gating line", () => {
    // Arrange
    const stages = ["gt", "a", "b"] as const;

    // Act / Assert
    for (const stage of stages) {
      expect(STAGE_PROMPT[stage].ko.trim().length).toBeGreaterThan(0);
      expect(STAGE_PROMPT[stage].en.trim().length).toBeGreaterThan(0);
      expect(STAGE_GATING_LINE[stage].ko.trim().length).toBeGreaterThan(0);
      expect(STAGE_GATING_LINE[stage].en.trim().length).toBeGreaterThan(0);
    }
  });
});

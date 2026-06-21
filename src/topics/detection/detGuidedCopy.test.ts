import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_LABEL,
  LOAD_EXAMPLE,
  RESET_TO_EMPTY,
  SHOW_GUIDE_AGAIN,
  STAGE_GATING_LINE,
  STAGE_PROMPT,
  THESIS_BANNER,
  stepPill,
} from "./detGuidedCopy";
import type { Bilingual } from "./detGuidedCopy";

/**
 * Grade words the product thesis forbids as quality judgments. Detection has NO
 * good/bad grading — the threshold only moves the operating point. Matched as
 * whole words for Latin, substring for Korean (no \b boundary).
 */
const GRADE_WORDS = ["좋음", "나쁨", "우수", "good", "bad"] as const;

/** Every standalone Bilingual export in this module (excludes the keyed maps). */
const SINGLE_BILINGUALS: Bilingual[] = [
  THESIS_BANNER,
  RESET_TO_EMPTY,
  SHOW_GUIDE_AGAIN,
  LOAD_EXAMPLE,
  CONFIDENCE_LABEL,
];

/** Every Bilingual export, flattened, including the keyed map values. */
function allBilinguals(): Bilingual[] {
  return [
    ...Object.values(STAGE_PROMPT),
    ...Object.values(STAGE_GATING_LINE),
    ...SINGLE_BILINGUALS,
  ];
}

/** Every user-facing string in this module, flattened across both languages. */
function allCopyStrings(): string[] {
  const strings = allBilinguals().flatMap((b) => [b.ko, b.en]);
  strings.push(
    stepPill(1, "ko"),
    stepPill(1, "en"),
    stepPill(2, "ko"),
    stepPill(2, "en"),
  );
  return strings;
}

describe("stepPill", () => {
  it("renders the Korean pill as 'STEP n / 2'", () => {
    // Arrange / Act / Assert
    expect(stepPill(1, "ko")).toBe("STEP 1 / 2");
  });

  it("renders the English pill as 'STEP n of 2'", () => {
    // Arrange / Act / Assert
    expect(stepPill(1, "en")).toBe("STEP 1 of 2");
  });

  it("renders STEP 2 in both languages", () => {
    expect(stepPill(2, "ko")).toBe("STEP 2 / 2");
    expect(stepPill(2, "en")).toBe("STEP 2 of 2");
  });
});

describe("STAGE_PROMPT", () => {
  it("has both gt and preds keys with non-empty ko/en", () => {
    // Arrange
    const stages = ["gt", "preds"] as const;

    // Act / Assert
    for (const stage of stages) {
      expect(STAGE_PROMPT[stage].ko.trim().length).toBeGreaterThan(0);
      expect(STAGE_PROMPT[stage].en.trim().length).toBeGreaterThan(0);
    }
  });

  it("mentions press-and-drag in the gt prompt", () => {
    // Assert — ko mentions 드래그, en mentions drag.
    expect(STAGE_PROMPT.gt.ko).toContain("드래그");
    expect(STAGE_PROMPT.gt.en.toLowerCase()).toContain("drag");
  });

  it("mentions confidence in the preds prompt", () => {
    // Assert — ko mentions 신뢰도, en mentions confidence.
    expect(STAGE_PROMPT.preds.ko).toContain("신뢰도");
    expect(STAGE_PROMPT.preds.en.toLowerCase()).toContain("confidence");
  });

  it("numbers the prompts ① and ②", () => {
    expect(STAGE_PROMPT.gt.ko).toContain("①");
    expect(STAGE_PROMPT.gt.en).toContain("①");
    expect(STAGE_PROMPT.preds.ko).toContain("②");
    expect(STAGE_PROMPT.preds.en).toContain("②");
  });
});

describe("THESIS_BANNER", () => {
  it("mentions the precision<->recall operating-point trade in both languages", () => {
    // Assert — ko names 정밀도 and 재현율; en names precision and recall.
    expect(THESIS_BANNER.ko).toContain("정밀도");
    expect(THESIS_BANNER.ko).toContain("재현율");
    const en = THESIS_BANNER.en.toLowerCase();
    expect(en).toContain("precision");
    expect(en).toContain("recall");
  });

  it("states that AP stays fixed in both languages", () => {
    // Assert — ko names AP and 고정; en names AP and fixed.
    expect(THESIS_BANNER.ko).toContain("AP");
    expect(THESIS_BANNER.ko).toContain("고정");
    const en = THESIS_BANNER.en.toLowerCase();
    expect(en).toContain("ap");
    expect(en).toContain("fixed");
  });

  it("never grades good/bad", () => {
    for (const text of [THESIS_BANNER.ko, THESIS_BANNER.en]) {
      const lower = text.toLowerCase();
      for (const grade of GRADE_WORDS) {
        const hit = /[a-z]/i.test(grade)
          ? new RegExp(`\\b${grade}\\b`, "i").test(lower)
          : text.includes(grade);
        expect(hit, `"${text}" must not grade "${grade}"`).toBe(false);
      }
    }
  });
});

describe("detection guided copy thesis safety", () => {
  it("never grades a metric good/bad/superior in any copy string", () => {
    // Arrange
    const strings = allCopyStrings();

    // Act / Assert
    for (const text of strings) {
      const lower = text.toLowerCase();
      for (const grade of GRADE_WORDS) {
        const pattern = new RegExp(`\\b${grade}\\b`, "i");
        const hit = /[a-z]/i.test(grade) ? pattern.test(lower) : text.includes(grade);
        expect(hit, `"${text}" must not contain grade word "${grade}"`).toBe(false);
      }
    }
  });
});

describe("detection guided copy bilingual completeness", () => {
  it("provides both ko and en non-empty for every Bilingual export", () => {
    // Arrange / Act / Assert
    for (const b of allBilinguals()) {
      expect(b.ko.trim().length).toBeGreaterThan(0);
      expect(b.en.trim().length).toBeGreaterThan(0);
    }
  });
});

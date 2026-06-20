/**
 * guidedCopy — centralized bilingual { ko, en } copy for the guided
 * Segmentation Playground flow.
 *
 * Every new user-facing string the guided flow needs lives here so that
 * Playground and CanvasEditor stay token- and markup-only, and so the strings
 * are unit-assertable in one place. Korean is the default language; English is
 * the secondary toggle (see {@link useLang}).
 *
 * Product thesis (preserved verbatim): NO metric is graded good/bad/superior.
 * Verdicts only ever say which side each metric calls "closer"/"leads"; the
 * winner flips by metric. None of the copy below grades a metric as a quality
 * judgment.
 *
 * The on-canvas prompts are deliberately SHORT imperatives — the longer
 * step rationale (the "why" paragraphs) is design rationale, not on-canvas copy.
 */

import type { FlowStage } from "./flowStage";
import type { Lang } from "../../i18n/LanguageContext";

/** A single user-facing string in both supported languages. */
export interface Bilingual {
  ko: string;
  en: string;
}

/** The drawing stages that show an on-canvas prompt (everything but compare). */
type DrawStage = Exclude<FlowStage, "compare">;

/**
 * Short, layer-colored imperative shown inside the canvas during each drawing
 * stage. Kept terse so it reads as a single on-canvas instruction, never a
 * paragraph.
 */
export const STAGE_PROMPT: Record<DrawStage, Bilingual> = {
  gt: {
    ko: "① 정답(GT)을 그리세요 · 눌러서 드래그",
    en: "① Draw the ground truth (GT) · press & drag",
  },
  a: {
    ko: "② 예측 A를 그리세요 · 정답에 대한 첫 추측",
    en: "② Draw prediction A · a first guess at the truth",
  },
  b: {
    ko: "③ 예측 B를 그리세요 · A와 다르게",
    en: "③ Draw prediction B · make it differ from A",
  },
};

/**
 * Calm, dormant line shown in the verdict column while the comparison is still
 * gated. Names exactly what is still missing without grading anything.
 */
export const STAGE_GATING_LINE: Record<DrawStage, Bilingual> = {
  gt: {
    ko: "정답(GT)을 그린 뒤 A·B를 그리면 여기서 지표를 비교합니다.",
    en: "Draw the ground truth, then A and B to compare metrics here.",
  },
  a: {
    ko: "비교를 시작하려면 예측을 하나 더 그리세요 (A).",
    en: "Draw one more guess (A) to start comparing.",
  },
  b: {
    ko: "비교를 시작하려면 예측을 하나 더 그리세요 (B).",
    en: "Draw one more guess (B) to start comparing.",
  },
};

/**
 * One-time banner shown when the comparison unlocks. States the thesis: two
 * guesses at one truth, each metric calls a different side "closer", and the
 * winner flips by metric — never good/bad.
 */
export const THESIS_BANNER: Bilingual = {
  ko: "하나의 정답에 대한 두 추측입니다 — 각 지표가 어느 쪽을 더 '가깝다'고 부르는지 보세요. 정답인 단일 지표는 없고, 보는 지표에 따라 우열이 바뀝니다.",
  en: "Two guesses at one truth — see which side each metric calls 'closer'. No single metric is the answer; the winner flips by metric.",
};

/** The step-progress pill label, e.g. "STEP 1 / 3" (ko) or "STEP 1 of 3" (en). */
export function stepPill(step: number, lang: Lang): string {
  return lang === "ko" ? `STEP ${step} / 3` : `STEP ${step} of 3`;
}

/** Label for the reset-to-empty button (clears the canvas, restarts at step 1). */
export const RESET_TO_EMPTY: Bilingual = {
  ko: "빈 캔버스로 초기화",
  en: "Reset to empty",
};

/** Label for the link that re-arms the guided flow from an empty canvas. */
export const SHOW_GUIDE_AGAIN: Bilingual = {
  ko: "안내 다시 보기",
  en: "Show guide again",
};

/** Label for the opt-in "load an example" disclosure below the canvas. */
export const LOAD_EXAMPLE: Bilingual = {
  ko: "예시 불러오기",
  en: "Load an example",
};

/** Caption clarifying that examples are someone else's worked scene to edit. */
export const LOAD_EXAMPLE_CAPTION: Bilingual = {
  ko: "예시는 남이 만들어 둔 장면입니다 — 불러온 뒤 직접 도형을 고쳐 보세요.",
  en: "Examples are someone else's worked scene — load one, then edit the shapes yourself.",
};

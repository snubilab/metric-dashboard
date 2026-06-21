/**
 * detGuidedCopy — centralized bilingual { ko, en } copy for the guided
 * Detection Playground flow.
 *
 * Every new user-facing string the guided detection flow needs lives here so
 * that Playground and DetectionCanvas stay token- and markup-only, and so the
 * strings are unit-assertable in one place. Korean is the default language;
 * English is the secondary toggle (see {@link useLang}).
 *
 * Product thesis (preserved verbatim): detection is GROUND-TRUTH vs
 * PREDICTIONS-WITH-A-CONFIDENCE-THRESHOLD, not A-vs-B. The teaching point is
 * that the confidence threshold picks ONE operating point — trading precision
 * against recall — while AP integrates the whole ordering and stays FIXED. NO
 * metric is graded good/bad/superior; none of the copy below grades anything.
 *
 * The on-canvas prompts are deliberately SHORT imperatives — the longer step
 * rationale lives in design rationale, not on-canvas copy.
 */

import type { DetStage } from "./detFlowStage";
import type { Lang } from "../../i18n/LanguageContext";

/** A single user-facing string in both supported languages. */
export interface Bilingual {
  ko: string;
  en: string;
}

/** The drawing stages that show an on-canvas prompt (everything but compare). */
type DrawStage = Exclude<DetStage, "compare">;

/**
 * Short, layer-colored imperative shown inside the canvas during each drawing
 * stage. Kept terse so it reads as a single on-canvas instruction, never a
 * paragraph. Step ① draws ground-truth boxes by press-and-drag; step ② draws
 * predicted boxes, each carrying a confidence.
 */
export const STAGE_PROMPT: Record<DrawStage, Bilingual> = {
  gt: {
    ko: "① 정답 병변 박스를 그리세요 · 눌러서 드래그",
    en: "① Draw the ground-truth lesion boxes · press & drag",
  },
  preds: {
    ko: "② 예측 박스를 그리고 신뢰도를 정하세요",
    en: "② Draw predicted boxes and set each confidence",
  },
};

/**
 * Calm, dormant line shown in the metrics column while the comparison is still
 * gated. Names exactly what is still missing without grading anything.
 */
export const STAGE_GATING_LINE: Record<DrawStage, Bilingual> = {
  gt: {
    ko: "정답 박스를 그린 뒤 예측 박스를 그리면 여기서 지표를 탐색합니다.",
    en: "Draw the ground-truth boxes, then predicted boxes to explore metrics here.",
  },
  preds: {
    ko: "탐색을 시작하려면 예측 박스를 하나 이상 그리세요.",
    en: "Draw at least one predicted box to start exploring.",
  },
};

/**
 * One-time banner shown when the compare/explore stage unlocks. States the
 * thesis: the confidence threshold picks one operating point, trading precision
 * against recall, while AP stays fixed — never good/bad.
 */
export const THESIS_BANNER: Bilingual = {
  ko: "신뢰도 임계값은 하나의 운영점을 고릅니다 — 임계값을 올리면 정밀도와 재현율이 맞바뀌지만(precision↔recall), AP는 전체 순서를 적분하므로 그대로 고정됩니다.",
  en: "The confidence threshold picks one operating point — raising it trades precision against recall, while AP integrates the whole ordering and stays fixed.",
};

/** The step-progress pill label, e.g. "STEP 1 / 2" (ko) or "STEP 1 of 2" (en). */
export function stepPill(step: number, lang: Lang): string {
  return lang === "ko" ? `STEP ${step} / 2` : `STEP ${step} of 2`;
}

/** Label for the reset-to-empty button (clears the canvas, restarts at step 1). */
export const RESET_TO_EMPTY: Bilingual = {
  ko: "빈 캔버스로 초기화",
  en: "Reset to empty",
};

/** Label for the link that re-arms the guided flow / re-shows the thesis. */
export const SHOW_GUIDE_AGAIN: Bilingual = {
  ko: "안내 다시 보기",
  en: "Show guide again",
};

/** Label for the opt-in "load an example" disclosure (the fixed seed scene). */
export const LOAD_EXAMPLE: Bilingual = {
  ko: "예시 불러오기",
  en: "Load an example",
};

/** Label for the per-box confidence control on a selected predicted box. */
export const CONFIDENCE_LABEL: Bilingual = {
  ko: "신뢰도",
  en: "Confidence",
};

/**
 * messages — the SHELL (chrome) string dictionary for the dashboard.
 *
 * Covers only the application shell: tab labels, sidebar group headers, the
 * coming-soon placeholders, the "On this page" rail heading, and the localized
 * topic titles keyed `topicTitle.<id>`. Per-topic Learn / Scenario content is
 * NOT in this dictionary — those units carry their own bilingual content.
 *
 * Korean ("ko") is the primary language for the Korean-student audience; any
 * missing Korean string falls back to English ("en"), and a missing English
 * string falls back to the raw key (so the UI never shows a blank).
 */

import { useCallback } from "react";
import { useLang } from "./LanguageContext";

/** A flat key → string map for one language. */
export type Messages = Record<string, string>;

/** English shell strings — the fallback layer for any missing Korean string. */
const en: Messages = {
  // Tab labels
  "tab.learn": "Learn",
  "tab.playground": "Playground",
  "tab.scenarios": "Scenarios",

  // Sidebar group headers
  "group.discriminative": "Discriminative (classical)",
  "group.generative": "Generative",
  "group.language": "Language & multimodal",
  "group.clinical": "Clinical evaluation",

  // Coming-soon / roadmap chrome
  soon: "soon",
  comingSoon: "Coming soon",

  // Section navigation rail
  onThisPage: "On this page",

  // Topic titles (keyed by topic id)
  "topicTitle.classification": "Image Classification",
  "topicTitle.regression": "Image Regression",
  "topicTitle.segmentation": "Image Segmentation",
  "topicTitle.detection": "Image Detection",
  "topicTitle.synthesis": "Image Synthesis",
  "topicTitle.report-generation": "LLM — Report Generation",
  "topicTitle.vlm": "VLM",
  "topicTitle.risk-prediction": "Risk Prediction",
  "topicTitle.reader-study": "Reader Study",
};

/** Korean shell strings — the primary language for the student audience. */
const ko: Messages = {
  // Tab labels
  "tab.learn": "학습",
  "tab.playground": "플레이그라운드",
  "tab.scenarios": "시나리오",

  // Sidebar group headers
  "group.discriminative": "판별 (고전적)",
  "group.generative": "생성",
  "group.language": "언어 및 멀티모달",
  "group.clinical": "임상 평가",

  // Coming-soon / roadmap chrome
  soon: "준비 중",
  comingSoon: "준비 중",

  // Section navigation rail
  onThisPage: "이 페이지 목차",

  // Topic titles (keyed by topic id)
  "topicTitle.classification": "영상 분류",
  "topicTitle.regression": "영상 회귀",
  "topicTitle.segmentation": "영상 분할",
  "topicTitle.detection": "객체 검출",
  "topicTitle.synthesis": "영상 합성",
  "topicTitle.report-generation": "LLM 리포트 생성",
  "topicTitle.vlm": "VLM",
  "topicTitle.risk-prediction": "위험 예측",
  "topicTitle.reader-study": "판독자 연구",
};

/** The full shell dictionary, one entry per supported language. */
export const messages: { en: Messages; ko: Messages } = { en, ko };

/**
 * A translator bound to the current language.
 *
 * Resolution order: current-language string → English string → the raw key.
 * This guarantees a missing Korean string falls back to English (never a raw
 * key), and a wholly unknown key surfaces as itself rather than blank.
 */
export function useT(): (key: string) => string {
  const { lang } = useLang();
  return useCallback(
    (key: string) => messages[lang][key] ?? messages.en[key] ?? key,
    [lang],
  );
}

import { describe, expect, it } from "vitest";
import { TOPICS } from "../app/topicRegistry";
import type { Lang } from "../i18n/LanguageContext";

type GuideField = "trustWhen" | "doubtWhen" | "tryThis";

type MetricJudgmentGuide = {
  readonly [field in GuideField]: string;
};

type MetricJudgmentGuideRegistry = Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<Lang, MetricJudgmentGuide>>>>>
>;

interface JudgmentGuideModule {
  readonly METRIC_JUDGMENT_GUIDES: MetricJudgmentGuideRegistry;
  readonly metricJudgmentGuide: (
    topicId: string,
    sectionId: string,
    lang: Lang,
  ) => MetricJudgmentGuide | undefined;
}

const GUIDE_FIELDS = ["trustWhen", "doubtWhen", "tryThis"] as const;
const LANGS = ["ko", "en"] as const satisfies readonly Lang[];
const HANGUL = /[가-힣]/;
const BANNED_VERDICT_TERMS = /좋음|나쁨|우수|열등|\bgood\b|\bbad\b|best metric|worst metric/i;
const REPORT_GENERATION_LIVE_EVALUATOR_TERMS =
  /live LLM judge|API call|model download|numeric score|overall score/i;
const guideModules = import.meta.glob<JudgmentGuideModule>("./judgmentGuides.ts");

const availableTopics = TOPICS.filter((topic) => topic.status === "available");

async function loadGuides(): Promise<JudgmentGuideModule> {
  const load = guideModules["./judgmentGuides.ts"];
  if (!load) {
    throw new Error(
      "Expected src/topics/judgmentGuides.ts to export metricJudgmentGuide(topicId, sectionId, lang).",
    );
  }

  return load();
}

describe("metric judgment guide coverage", () => {
  it("keeps English and Korean Learn section ids in parity for every available topic", () => {
    for (const topic of availableTopics) {
      expect(topic.learn, `${topic.id} needs English Learn content`).toBeDefined();
      expect(topic.learnKo, `${topic.id} needs Korean Learn content`).toBeDefined();

      const englishIds = topic.learn?.sections.map((section) => section.id);
      const koreanIds = topic.learnKo?.sections.map((section) => section.id);

      expect(koreanIds, `${topic.id} learnKo.sections must match learn.sections`).toEqual(
        englishIds,
      );
    }
  });

  it("has nonempty Korean and English guide fields for every available section", async () => {
    const { metricJudgmentGuide } = await loadGuides();

    for (const topic of availableTopics) {
      const sections = topic.learn?.sections ?? [];

      for (const section of sections) {
        for (const lang of LANGS) {
          const guide = metricJudgmentGuide(topic.id, section.id, lang);
          if (!guide) {
            throw new Error(`Missing judgment guide: ${topic.id}/${section.id}/${lang}`);
          }

          for (const field of GUIDE_FIELDS) {
            expect(
              guide[field].trim().length,
              `${topic.id}/${section.id}/${lang}.${field} must be nonempty`,
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("keeps guide copy bilingual and thesis-safe", async () => {
    const { METRIC_JUDGMENT_GUIDES, metricJudgmentGuide } = await loadGuides();

    expect(
      JSON.stringify(METRIC_JUDGMENT_GUIDES),
      "guide registry JSON uses a forbidden verdict term",
    ).not.toMatch(BANNED_VERDICT_TERMS);
    expect(
      JSON.stringify(METRIC_JUDGMENT_GUIDES["report-generation"]),
      "report-generation guide registry JSON implies a live evaluator surface",
    ).not.toMatch(REPORT_GENERATION_LIVE_EVALUATOR_TERMS);

    for (const topic of availableTopics) {
      const sections = topic.learn?.sections ?? [];

      for (const section of sections) {
        const koGuide = metricJudgmentGuide(topic.id, section.id, "ko");
        const enGuide = metricJudgmentGuide(topic.id, section.id, "en");
        if (!koGuide || !enGuide) {
          throw new Error(`Missing judgment guide: ${topic.id}/${section.id}`);
        }

        expect(JSON.stringify(koGuide), `${topic.id}/${section.id}/ko must contain Hangul`).toMatch(
          HANGUL,
        );

        for (const field of GUIDE_FIELDS) {
          expect(
            koGuide[field],
            `${topic.id}/${section.id}.${field} must not reuse English copy`,
          ).not.toBe(enGuide[field]);
        }

        const guideJson = JSON.stringify([koGuide, enGuide]);
        expect(guideJson, `${topic.id}/${section.id} uses a forbidden verdict term`).not.toMatch(
          BANNED_VERDICT_TERMS,
        );

        if (topic.id === "report-generation") {
          expect(
            guideJson,
            `${topic.id}/${section.id} implies a live report evaluator surface`,
          ).not.toMatch(REPORT_GENERATION_LIVE_EVALUATOR_TERMS);
        }
      }
    }
  });
});

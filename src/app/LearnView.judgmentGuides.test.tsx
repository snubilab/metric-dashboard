import { cleanup, render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import type { Lang } from "../i18n/LanguageContext";
import type { Topic } from "../types/topic";
import { TOPICS } from "./topicRegistry";
import { LearnView } from "./LearnView";

const LABELS = {
  ko: ["정보가 되는 상황", "놓치는 부분", "직접 확인할 것"],
  en: ["Informative when", "Blind spot when", "Try this"],
} as const satisfies Record<Lang, readonly string[]>;

const availableTopics = TOPICS.filter((topic) => topic.status === "available");

function renderLearn(topic: Topic, lang: Lang): HTMLElement {
  const { container } = render(
    <LanguageProvider initialLang={lang}>
      <LearnView topic={topic} />
    </LanguageProvider>,
  );

  return container;
}

describe("LearnView metric judgment guides", () => {
  it("renders one labeled guide block per available section in Korean and English", () => {
    for (const topic of availableTopics) {
      for (const lang of ["ko", "en"] as const satisfies readonly Lang[]) {
        const container = renderLearn(topic, lang);
        const sections = (lang === "ko" ? topic.learnKo : topic.learn)?.sections ?? [];

        for (const section of sections) {
          const sectionElement = container.querySelector<HTMLElement>(`#section-${section.id}`);
          if (!sectionElement) {
            throw new Error(`Missing Learn section element: ${topic.id}/${section.id}/${lang}`);
          }

          const guides = sectionElement.querySelectorAll<HTMLElement>(
            "[data-testid='metric-judgment-guide']",
          );
          expect(
            guides,
            `${topic.id}/${section.id}/${lang} should render exactly one judgment guide`,
          ).toHaveLength(1);

          const guide = guides[0];
          if (!guide) {
            throw new Error(`Missing judgment guide block: ${topic.id}/${section.id}/${lang}`);
          }

          for (const label of LABELS[lang]) {
            expect(within(guide).getByText(label)).toBeInTheDocument();
          }
        }

        cleanup();
      }
    }
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import { ClassificationConfusionMatrixFigure } from "./ClassificationConfusionMatrixFigure";
import { MetricFigure } from "./MetricFigure";

function renderConfusionFigure(lang: Lang) {
  return render(
    <LanguageProvider initialLang={lang}>
      <ClassificationConfusionMatrixFigure />
    </LanguageProvider>,
  );
}

const HANGUL = /[ᄀ-ᇿ가-힣]/;

describe("ClassificationConfusionMatrixFigure", () => {
  for (const lang of ["ko", "en"] as const) {
    it(`renders an accessible SVG in ${lang}`, () => {
      const { container } = renderConfusionFigure(lang);
      const svg = container.querySelector("svg");

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("role", "img");
      expect(svg?.getAttribute("aria-label")?.length).toBeGreaterThan(0);
    });
  }

  it("renders the four confusion cells", () => {
    const { container } = renderConfusionFigure("en");

    expect(container.querySelector('[data-role="tp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fn"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="tn"]')).toBeInTheDocument();
  });

  it("localizes visible text without Korean leaking into English mode", () => {
    const ko = renderConfusionFigure("ko").container.textContent ?? "";
    const en = renderConfusionFigure("en").container.textContent ?? "";

    expect(HANGUL.test(ko)).toBe(true);
    expect(HANGUL.test(en)).toBe(false);
  });

  it("is available through MetricFigure dispatch", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricFigure figure="classification-confusion-matrix" />
      </LanguageProvider>,
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.textContent).toContain("Accuracy");
  });

  it("dispatches distinct fixed-threshold examples for each classification metric family", () => {
    const expected = [
      ["cls-confusion", "TP=42"],
      ["cls-rows", "TP=18"],
      ["cls-columns", "FP=42"],
      ["cls-accuracy", "TP=0"],
      ["cls-f1", "TP=30"],
    ] as const;

    for (const [figure, text] of expected) {
      const { container, unmount } = render(
        <LanguageProvider initialLang="en">
          <MetricFigure figure={figure} />
        </LanguageProvider>,
      );
      expect(container.textContent).toContain(text);
      unmount();
    }
  });
});

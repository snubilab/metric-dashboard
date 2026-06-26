import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentType } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import RegressionErrorFigure from "./RegressionErrorFigure";
import RegressionFitFigure from "./RegressionFitFigure";
import { MetricFigure } from "./MetricFigure";

function renderFigure(Figure: ComponentType, lang: Lang) {
  return render(
    <LanguageProvider initialLang={lang}>
      <Figure />
    </LanguageProvider>,
  );
}

const FIGURES: Array<[string, ComponentType]> = [
  ["RegressionErrorFigure", RegressionErrorFigure],
  ["RegressionFitFigure", RegressionFitFigure],
];

const HANGUL = /[ᄀ-ᇿ가-힣]/;

describe("Regression figures", () => {
  for (const [name, Figure] of FIGURES) {
    for (const lang of ["ko", "en"] as const) {
      it(`${name} renders an accessible SVG in ${lang}`, () => {
        const { container } = renderFigure(Figure, lang);
        const svg = container.querySelector("svg");

        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute("role", "img");
        expect(svg?.getAttribute("aria-label")?.length).toBeGreaterThan(0);
      });
    }

    it(`${name} localizes visible text without Korean leaking into English mode`, () => {
      const ko = renderFigure(Figure, "ko").container.textContent ?? "";
      const en = renderFigure(Figure, "en").container.textContent ?? "";

      expect(HANGUL.test(ko)).toBe(true);
      expect(HANGUL.test(en)).toBe(false);
      expect(ko).not.toBe(en);
    });
  }

  it("regression figures are available through MetricFigure dispatch", () => {
    for (const figure of ["reg-error", "reg-fit"] as const) {
      const { container } = render(
        <LanguageProvider initialLang="en">
          <MetricFigure figure={figure} />
        </LanguageProvider>,
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(HANGUL.test(container.textContent ?? "")).toBe(false);
    }
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentType } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import {
  RegressionMaeFigure,
  RegressionMseFigure,
  RegressionRmseFigure,
} from "./RegressionErrorFigure";
import {
  RegressionBiasFigure,
  RegressionPearsonFigure,
  RegressionR2Figure,
  RegressionSpearmanFigure,
} from "./RegressionFitFigure";
import { MetricFigure } from "./MetricFigure";

function renderFigure(Figure: ComponentType, lang: Lang) {
  return render(
    <LanguageProvider initialLang={lang}>
      <Figure />
    </LanguageProvider>,
  );
}

const FIGURES: Array<[string, ComponentType]> = [
  ["RegressionMaeFigure", RegressionMaeFigure],
  ["RegressionMseFigure", RegressionMseFigure],
  ["RegressionRmseFigure", RegressionRmseFigure],
  ["RegressionR2Figure", RegressionR2Figure],
  ["RegressionBiasFigure", RegressionBiasFigure],
  ["RegressionPearsonFigure", RegressionPearsonFigure],
  ["RegressionSpearmanFigure", RegressionSpearmanFigure],
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
    for (const figure of ["reg-mae", "reg-mse", "reg-rmse", "reg-r2", "reg-bias", "reg-pearson", "reg-spearman"] as const) {
      const { container } = render(
        <LanguageProvider initialLang="en">
          <MetricFigure figure={figure} />
        </LanguageProvider>,
      );

      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(HANGUL.test(container.textContent ?? "")).toBe(false);
    }
  });

  it("MAE, MSE, and RMSE dispatch to distinct visual examples", () => {
    const labels = ["reg-mae", "reg-mse", "reg-rmse"].map((figure) => {
      const { container } = render(
        <LanguageProvider initialLang="en">
          <MetricFigure figure={figure} />
        </LanguageProvider>,
      );
      return container.querySelector("svg")?.getAttribute("aria-label");
    });

    expect(new Set(labels).size).toBe(3);
  });

  it("R2, bias, Pearson, and Spearman dispatch to distinct visual examples", () => {
    const labels = ["reg-r2", "reg-bias", "reg-pearson", "reg-spearman"].map((figure) => {
      const { container } = render(
        <LanguageProvider initialLang="en">
          <MetricFigure figure={figure} />
        </LanguageProvider>,
      );
      return container.querySelector("svg")?.getAttribute("aria-label");
    });

    expect(new Set(labels).size).toBe(4);
  });
});

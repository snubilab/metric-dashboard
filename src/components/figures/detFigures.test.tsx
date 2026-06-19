import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentType } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { Lang } from "../../i18n/LanguageContext";
import { MatchingFigure } from "./MatchingFigure";
import { DetConfusionFigure } from "./DetConfusionFigure";
import { PrCurveFigure } from "./PrCurveFigure";
import { ApThresholdFigure } from "./ApThresholdFigure";
import { FrocFigure } from "./FrocFigure";
import { SensAtFpFigure } from "./SensAtFpFigure";

function renderFigure(Figure: ComponentType, lang: Lang) {
  return render(
    <LanguageProvider initialLang={lang}>
      <Figure />
    </LanguageProvider>,
  );
}

const FIGURES: Array<[string, ComponentType]> = [
  ["MatchingFigure", MatchingFigure],
  ["DetConfusionFigure", DetConfusionFigure],
  ["PrCurveFigure", PrCurveFigure],
  ["ApThresholdFigure", ApThresholdFigure],
  ["FrocFigure", FrocFigure],
  ["SensAtFpFigure", SensAtFpFigure],
];

const LANGS: Lang[] = ["ko", "en"];

describe("DET figures (v2, two-panel)", () => {
  for (const [name, Figure] of FIGURES) {
    for (const lang of LANGS) {
      it(`${name} renders a figure with role=img and a non-empty aria-label in ${lang}`, () => {
        const { container } = renderFigure(Figure, lang);
        const root = container.firstElementChild;
        expect(root?.tagName.toLowerCase()).toBe("figure");
        expect(root?.getAttribute("role")).toBe("img");
        const label = root?.getAttribute("aria-label") ?? "";
        expect(label.length).toBeGreaterThan(0);
      });

      it(`${name} renders an svg in ${lang}`, () => {
        const { container } = renderFigure(Figure, lang);
        expect(container.querySelector("svg")).toBeInTheDocument();
      });

      it(`${name} shows a misleading case with a --c-warn marker in ${lang}`, () => {
        const { container } = renderFigure(Figure, lang);
        const misleading = container.querySelector('[data-role="misleading"]');
        expect(misleading).toBeInTheDocument();
        // The misleading panel carries a --c-warn warning mark.
        const mark = misleading?.querySelector('[data-role="misleading-mark"]');
        expect(mark).toBeInTheDocument();
        const stroke = mark?.querySelector('[stroke]')?.getAttribute("stroke") ?? "";
        expect(stroke).toContain("--c-warn");
      });
    }
  }

  it("MatchingFigure aria-label differs between ko and en", () => {
    const ko = renderFigure(MatchingFigure, "ko").container.firstElementChild?.getAttribute("aria-label");
    const en = renderFigure(MatchingFigure, "en").container.firstElementChild?.getAttribute("aria-label");
    expect(ko).toBeTruthy();
    expect(en).toBeTruthy();
    expect(ko).not.toBe(en);
  });

  it("MatchingFigure marks TP, FP and FN regions in the typical panel", () => {
    const { container } = renderFigure(MatchingFigure, "ko");
    expect(container.querySelector('[data-role="tp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fn"]')).toBeInTheDocument();
  });

  it("PrCurveFigure shades the area under the typical curve in the Pred-A token", () => {
    const { container } = renderFigure(PrCurveFigure, "ko");
    const area = container.querySelector('[data-role="auc-area"]');
    expect(area).toBeInTheDocument();
    expect(area?.getAttribute("fill")).toContain("--c-pred-a");
  });

  it("SensAtFpFigure draws a fixed-FP guide and a sensitivity read-off point", () => {
    const { container } = renderFigure(SensAtFpFigure, "ko");
    expect(container.querySelector('[data-role="fp-guide"]')).toBeInTheDocument();
    const dot = container.querySelector('[data-role="readoff-point"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute("fill")).toContain("--c-warn");
  });
});

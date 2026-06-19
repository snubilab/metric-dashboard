import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { MatchingFigure } from "./MatchingFigure";
import { DetConfusionFigure } from "./DetConfusionFigure";
import { PrCurveFigure } from "./PrCurveFigure";
import { ApThresholdFigure } from "./ApThresholdFigure";
import { FrocFigure } from "./FrocFigure";
import { SensAtFpFigure } from "./SensAtFpFigure";

function renderFigure(ui: ReactElement) {
  return render(<LanguageProvider initialLang="ko">{ui}</LanguageProvider>);
}

describe("DET figures", () => {
  const cases: Array<[string, ReactElement]> = [
    ["MatchingFigure", <MatchingFigure />],
    ["DetConfusionFigure", <DetConfusionFigure />],
    ["PrCurveFigure", <PrCurveFigure />],
    ["ApThresholdFigure", <ApThresholdFigure />],
    ["FrocFigure", <FrocFigure />],
    ["SensAtFpFigure", <SensAtFpFigure />],
  ];

  it.each(cases)("%s renders an svg", (_name, ui) => {
    const { container } = renderFigure(ui);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it.each(cases)("%s exposes an accessible img role with a label", (_name, ui) => {
    const { container } = renderFigure(ui);
    // The figure component's own root carries role="img" + a descriptive label.
    // (Curve figures also embed a chart <svg role="img">, so scope to the root.)
    const root = container.firstElementChild;
    expect(root?.getAttribute("role")).toBe("img");
    expect(root?.getAttribute("aria-label")).toBeTruthy();
  });

  it("MatchingFigure marks TP, FP and FN regions", () => {
    const { container } = renderFigure(<MatchingFigure />);
    expect(container.querySelector('[data-role="tp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="fn"]')).toBeInTheDocument();
  });

  it("PrCurveFigure shades the area under the curve in the Pred-A token", () => {
    const { container } = renderFigure(<PrCurveFigure />);
    const area = container.querySelector('[data-role="auc-area"]');
    expect(area).toBeInTheDocument();
    expect(area?.getAttribute("fill")).toContain("--c-pred-a");
  });

  it("SensAtFpFigure draws a fixed-FP guide and a sensitivity read-off point", () => {
    const { container } = renderFigure(<SensAtFpFigure />);
    expect(container.querySelector('[data-role="fp-guide"]')).toBeInTheDocument();
    const dot = container.querySelector('[data-role="readoff-point"]');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute("fill")).toContain("--c-warn");
  });
});

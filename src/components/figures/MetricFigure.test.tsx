import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { MetricFigure } from "./MetricFigure";

function renderFigure(figure?: string) {
  return render(
    <LanguageProvider initialLang="en">
      <MetricFigure figure={figure} />
    </LanguageProvider>,
  );
}

describe("MetricFigure", () => {
  it("renders an <svg> for a known figure key", () => {
    const { container } = renderFigure("dice");

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders nothing for an unknown figure key", () => {
    const { container } = renderFigure("not-a-real-figure");

    expect(container.querySelector("svg")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no figure key is given", () => {
    const { container } = renderFigure(undefined);

    expect(container.firstChild).toBeNull();
  });

  it("renders report figure cues without fabricated CRIMSON score math", () => {
    const bleu = renderFigure("report-bleu");
    expect(bleu.container).toHaveTextContent("2 / 3 matched");
    bleu.unmount();

    const temporal = renderFigure("report-temporal-f1");
    expect(temporal.container).toHaveTextContent("TP=1");
    temporal.unmount();

    const green = renderFigure("report-green");
    expect(green.container).toHaveTextContent("error count = 3");
    green.unmount();

    const crimson = renderFigure("report-crimson");
    expect(crimson.container).toHaveTextContent("patient context raises error severity");
    expect(crimson.container).not.toHaveTextContent(/weight\s+\d+\s*x\s*severity\s+\d+\s*=/i);
  });
});

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
});

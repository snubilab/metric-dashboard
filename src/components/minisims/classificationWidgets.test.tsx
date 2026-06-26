import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import type { MiniSimConfig } from "../../types/topic";
import ClassificationMetricSim from "./ClassificationMetricSim";

const baseConfig: MiniSimConfig = {
  kind: "cls-row-tradeoff",
  spotlightMetric: "sensitivity",
  initialState: {
    grid: { width: 1, height: 1, spacingMm: [1, 1] },
    gt: [],
    predictions: [],
    policy: { emptyDice: "one", emptyDistance: "undefined" },
  },
};

function renderWidget(kind: string) {
  const view = render(
    <LanguageProvider initialLang="en">
      <ClassificationMetricSim config={{ ...baseConfig, kind }} />
    </LanguageProvider>,
  );
  return view;
}

function metricText(container: HTMLElement, metric: string): string {
  const matches = container.querySelectorAll(`[data-metric="${metric}"]`);
  return matches[matches.length - 1]?.textContent ?? "";
}

describe("ClassificationMetricSim", () => {
  it("changes row metrics when the threshold relaxation slider moves", async () => {
    const { container } = renderWidget("cls-row-tradeoff");
    const before = metricText(container, "specificity");

    fireEvent.change(screen.getByRole("slider", { name: "Threshold relaxation" }), {
      target: { value: "0" },
    });

    expect(metricText(container, "specificity")).not.toBe(before);
  });

  it("renders prevalence and F-beta controls for their metric families", () => {
    const { unmount } = renderWidget("cls-prevalence-columns");
    expect(screen.getByRole("slider", { name: "Positive prevalence" })).toBeInTheDocument();
    expect(screen.getByText("PPV")).toBeInTheDocument();
    unmount();

    renderWidget("cls-fbeta-weight");
    expect(screen.getByRole("slider", { name: "beta" })).toBeInTheDocument();
    expect(screen.getByText("F-beta")).toBeInTheDocument();
  });

  it("keeps prevalence slider percentage aligned with displayed counts", () => {
    renderWidget("cls-prevalence-columns");

    fireEvent.change(screen.getByRole("slider", { name: "Positive prevalence" }), {
      target: { value: "50" },
    });

    expect(screen.getByRole("img", { name: "Prevalence 50%: positives 100, negatives 100, TP 90, FP 10" })).toBeInTheDocument();
  });
});

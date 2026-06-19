import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MetricRow } from "../metrics/types";
import { MetricBarChart } from "./MetricBarChart";
import { LanguageProvider } from "../../i18n/LanguageContext";

const rows: MetricRow[] = [
  { key: "dice", label: "Dice", a: 0.9, b: 0.7, higherIsBetter: true },
  { key: "hd95", label: "HD95", a: 8, b: 3, unit: "mm", higherIsBetter: false },
  { key: "iou", label: "IoU", a: 0.85, b: 0.6, higherIsBetter: true },
];

describe("MetricBarChart", () => {
  it("renders an svg with one row group per metric", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-role="metric-row"]').length).toBe(rows.length);
  });

  it("renders two bars (A and B) for each metric row", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(container.querySelectorAll('[data-series="a"]').length).toBe(rows.length);
    expect(container.querySelectorAll('[data-series="b"]').length).toBe(rows.length);
  });

  it("uses the Pred-A and Pred-B color tokens for the bars", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(container.querySelector('[data-series="a"]')?.getAttribute("fill")).toContain(
      "--c-pred-a",
    );
    expect(container.querySelector('[data-series="b"]')?.getAttribute("fill")).toContain(
      "--c-pred-b",
    );
  });

  it("prints the raw value (with unit) at the bar ends", () => {
    const { getByText } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(getByText("0.90")).toBeInTheDocument();
    expect(getByText("0.70")).toBeInTheDocument();
    expect(getByText("8 mm")).toBeInTheDocument();
    expect(getByText("3 mm")).toBeInTheDocument();
  });

  it("normalizes bars within their own row so A is the longer of two same-row bars", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    const diceRow = container.querySelector('[data-role="metric-row"]');
    const a = diceRow?.querySelector('[data-series="a"]');
    const b = diceRow?.querySelector('[data-series="b"]');
    const aWidth = Number(a?.getAttribute("width"));
    const bWidth = Number(b?.getAttribute("width"));
    // Dice a=0.9 normalizes to full width; b=0.7 is shorter.
    expect(aWidth).toBeGreaterThan(bWidth);
  });

  it("flags disagreeing rows with a warn accent", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    const flaggedRow = container.querySelector('[data-role="metric-row"][data-flagged="true"]');
    expect(flaggedRow).toBeInTheDocument();
    // HD95 (winner B) flips against Dice (winner A) -> warn-stroked bar.
    expect(flaggedRow?.querySelector('[data-series="a"]')?.getAttribute("stroke")).toContain(
      "--c-warn",
    );
  });

  it("renders the A/B legend in English", () => {
    const { getByText } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(getByText("A vs B")).toBeInTheDocument();
  });

  it("renders the A/B legend in Korean", () => {
    const { getByText } = render(
      <LanguageProvider initialLang="ko">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    expect(getByText("A 대 B")).toBeInTheDocument();
  });

  it("marks higher-is-better direction with a glyph", () => {
    const { getAllByText } = render(
      <LanguageProvider initialLang="en">
        <MetricBarChart rows={rows} />
      </LanguageProvider>,
    );
    // Dice + IoU are higher-is-better (↑); HD95 is lower-is-better (↓).
    expect(getAllByText("↑").length).toBe(2);
    expect(getAllByText("↓").length).toBe(1);
  });
});

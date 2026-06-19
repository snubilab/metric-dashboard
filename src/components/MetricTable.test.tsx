import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { MetricTable } from "./MetricTable";
import type { MetricRow } from "./metrics/types";

/** Dice favors A (higher is better); HD95 favors B (lower is better) — a rank flip. */
const opposingRows: MetricRow[] = [
  { key: "dice", label: "Dice", a: 0.92, b: 0.81, higherIsBetter: true },
  { key: "hd95", label: "HD95", a: 9.4, b: 2.1, unit: "mm", higherIsBetter: false },
];

describe("MetricTable", () => {
  it("renders a table with a row per metric", () => {
    render(<MetricTable rows={opposingRows} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Dice")).toBeInTheDocument();
    expect(screen.getByText("HD95")).toBeInTheDocument();
  });

  it("renders A and B values for each row", () => {
    render(<MetricTable rows={opposingRows} />);

    expect(screen.getByText("0.92")).toBeInTheDocument();
    expect(screen.getByText("0.81")).toBeInTheDocument();
    expect(screen.getByText("9.40")).toBeInTheDocument();
    expect(screen.getByText("2.10")).toBeInTheDocument();
  });

  it("flags the HD95 row with a disagreement marker when it opposes Dice", () => {
    render(
      <LanguageProvider initialLang="en">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    const marker = screen.getByLabelText(/metric ranking disagreement/i);
    expect(marker).toBeInTheDocument();

    const hd95Row = screen.getByText("HD95").closest("tr");
    expect(hd95Row).not.toBeNull();
    expect(within(hd95Row as HTMLElement).getByLabelText(/metric ranking disagreement/i)).toBeInTheDocument();
  });

  it("flags the HD95 row with a Korean disagreement marker", () => {
    render(
      <LanguageProvider initialLang="ko">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("지표 순위 불일치")).toBeInTheDocument();
  });

  it("does not flag the reference Dice row", () => {
    render(
      <LanguageProvider initialLang="en">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    const diceRow = screen.getByText("Dice").closest("tr");
    expect(diceRow).not.toBeNull();
    expect(
      within(diceRow as HTMLElement).queryByLabelText(/metric ranking disagreement/i),
    ).not.toBeInTheDocument();
  });

  it("renders the legend and header in Korean by default", () => {
    render(<MetricTable rows={opposingRows} />);

    expect(screen.getByText("지표")).toBeInTheDocument();
    expect(screen.getByText("예측 A")).toBeInTheDocument();
    expect(screen.getByText("예측 B")).toBeInTheDocument();
    expect(screen.getByText("순위 불일치")).toBeInTheDocument();
  });

  it("colors the A and B column headers with the prediction tokens", () => {
    render(<MetricTable rows={opposingRows} />);

    expect(screen.getByRole("columnheader", { name: "A" })).toHaveStyle({
      color: "var(--c-pred-a)",
    });
    expect(screen.getByRole("columnheader", { name: "B" })).toHaveStyle({
      color: "var(--c-pred-b)",
    });
  });
});

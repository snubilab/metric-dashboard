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
    expect(screen.getByText("굵게 = 해당 지표에서 더 우수")).toBeInTheDocument();
  });

  it("explains the bold convention in the English legend", () => {
    render(
      <LanguageProvider initialLang="en">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    expect(screen.getByText("Bold = better on this metric")).toBeInTheDocument();
  });

  it("marks each metric with its higher/lower-is-better direction", () => {
    render(
      <LanguageProvider initialLang="en">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    const diceRow = screen.getByText("Dice").closest("tr");
    expect(diceRow).not.toBeNull();
    expect(
      within(diceRow as HTMLElement).getByLabelText(/higher is better/i),
    ).toBeInTheDocument();

    const hd95Row = screen.getByText("HD95").closest("tr");
    expect(hd95Row).not.toBeNull();
    expect(
      within(hd95Row as HTMLElement).getByLabelText(/lower is better/i),
    ).toBeInTheDocument();
  });

  it("marks the metric direction in Korean", () => {
    render(
      <LanguageProvider initialLang="ko">
        <MetricTable rows={opposingRows} />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText("높을수록 좋음")).toBeInTheDocument();
    expect(screen.getByLabelText("낮을수록 좋음")).toBeInTheDocument();
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

  describe("relative cue (showRelativeCue)", () => {
    /** A leads Dice, B leads HD95, IoU is a tie, volRel has a NaN value. */
    const cueRows: MetricRow[] = [
      { key: "dice", label: "Dice", a: 0.92, b: 0.81, higherIsBetter: true }, // A leads
      { key: "hd95", label: "HD95", a: 9.4, b: 2.1, unit: "mm", higherIsBetter: false }, // B leads
      { key: "iou", label: "IoU", a: 0.7, b: 0.7, higherIsBetter: true }, // tie
      { key: "volRel", label: "volRel", a: NaN, b: 0.1, higherIsBetter: false }, // n/a
    ];

    it("does not render any 우세 chip by default (ScenariosView scope guard)", () => {
      render(
        <LanguageProvider initialLang="ko">
          <MetricTable rows={cueRows} />
        </LanguageProvider>,
      );

      expect(screen.queryByText("A 우세")).not.toBeInTheDocument();
      expect(screen.queryByText("B 우세")).not.toBeInTheDocument();
      expect(screen.queryByText("비슷")).not.toBeInTheDocument();
      expect(screen.queryByText("비교 불가")).not.toBeInTheDocument();
    });

    it("does not render any leads chip when showRelativeCue is omitted", () => {
      render(
        <LanguageProvider initialLang="en">
          <MetricTable rows={cueRows} />
        </LanguageProvider>,
      );

      expect(screen.queryByText("A leads")).not.toBeInTheDocument();
      expect(screen.queryByText("B leads")).not.toBeInTheDocument();
      expect(screen.queryByText("tie")).not.toBeInTheDocument();
      expect(screen.queryByText("n/a")).not.toBeInTheDocument();
    });

    it("renders the correct Korean 우세 chip per winner", () => {
      render(
        <LanguageProvider initialLang="ko">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      const diceRow = screen.getByText("Dice").closest("tr") as HTMLElement;
      expect(within(diceRow).getByText("A 우세")).toBeInTheDocument();

      const hd95Row = screen.getByText("HD95").closest("tr") as HTMLElement;
      expect(within(hd95Row).getByText("B 우세")).toBeInTheDocument();

      const iouRow = screen.getByText("IoU").closest("tr") as HTMLElement;
      expect(within(iouRow).getByText("비슷")).toBeInTheDocument();
    });

    it("renders the correct English leads chip per winner", () => {
      render(
        <LanguageProvider initialLang="en">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      const diceRow = screen.getByText("Dice").closest("tr") as HTMLElement;
      expect(within(diceRow).getByText("A leads")).toBeInTheDocument();

      const hd95Row = screen.getByText("HD95").closest("tr") as HTMLElement;
      expect(within(hd95Row).getByText("B leads")).toBeInTheDocument();

      const iouRow = screen.getByText("IoU").closest("tr") as HTMLElement;
      expect(within(iouRow).getByText("tie")).toBeInTheDocument();
    });

    it("renders a neutral 비교 불가 chip when a value is NaN, never a misleading winner", () => {
      render(
        <LanguageProvider initialLang="ko">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      const volRow = screen.getByText("상대 부피차").closest("tr") as HTMLElement;
      expect(within(volRow).getByText("비교 불가")).toBeInTheDocument();
      expect(within(volRow).queryByText("A 우세")).not.toBeInTheDocument();
      expect(within(volRow).queryByText("B 우세")).not.toBeInTheDocument();
    });

    it("renders a neutral n/a chip in English when a value is NaN", () => {
      render(
        <LanguageProvider initialLang="en">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      const volRow = screen.getByText("volRel").closest("tr") as HTMLElement;
      expect(within(volRow).getByText("n/a")).toBeInTheDocument();
    });

    it("colors the leading chip with the leading prediction's token, never green/red", () => {
      render(
        <LanguageProvider initialLang="en">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      expect(screen.getByText("A leads")).toHaveStyle({ color: "var(--c-pred-a)" });
      expect(screen.getByText("B leads")).toHaveStyle({ color: "var(--c-pred-b)" });
      expect(screen.getByText("tie")).toHaveStyle({ color: "var(--c-text-dim)" });
    });

    it("shows the plain-language meaning for each metric", () => {
      render(
        <LanguageProvider initialLang="ko">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      expect(screen.getByText("예측과 정답의 겹침 정도")).toBeInTheDocument();
    });

    it("never renders an absolute quality word with the relative cue on", () => {
      render(
        <LanguageProvider initialLang="en">
          <MetricTable rows={cueRows} showRelativeCue />
        </LanguageProvider>,
      );

      const body = document.body.textContent?.toLowerCase() ?? "";
      for (const word of ["좋음", "보통", "나쁨", "good", "fair", "poor"]) {
        expect(body).not.toContain(word.toLowerCase());
      }
    });
  });
});

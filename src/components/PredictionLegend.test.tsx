import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { PredictionLegend } from "./PredictionLegend";

describe("PredictionLegend", () => {
  it("renders the GT, A, and B chips with names and roles in Korean by default", () => {
    render(
      <PredictionLegend
        a={{ name: "예측 A", role: "정확 추적" }}
        b={{ name: "예측 B", role: "과다분할" }}
      />,
    );

    expect(screen.getByText("정답(GT)")).toBeInTheDocument();
    expect(screen.getByText("예측 A")).toBeInTheDocument();
    expect(screen.getByText("정확 추적")).toBeInTheDocument();
    expect(screen.getByText("예측 B")).toBeInTheDocument();
    expect(screen.getByText("과다분할")).toBeInTheDocument();
  });

  it("uses the English GT label under an English provider", () => {
    render(
      <LanguageProvider initialLang="en">
        <PredictionLegend
          a={{ name: "Prediction A", role: "accurate" }}
          b={{ name: "Prediction B", role: "over-segmentation" }}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("Ground truth (GT)")).toBeInTheDocument();
    expect(screen.getByText("Prediction A")).toBeInTheDocument();
    expect(screen.getByText("accurate")).toBeInTheDocument();
    expect(screen.getByText("Prediction B")).toBeInTheDocument();
    expect(screen.getByText("over-segmentation")).toBeInTheDocument();
  });

  it("accepts a custom GT label", () => {
    render(
      <PredictionLegend
        gtLabel="정답 라벨"
        a={{ name: "예측 A" }}
        b={{ name: "예측 B" }}
      />,
    );

    expect(screen.getByText("정답 라벨")).toBeInTheDocument();
  });

  it("renders cleanly when the role is omitted (generic fallback)", () => {
    render(
      <PredictionLegend a={{ name: "예측 A" }} b={{ name: "예측 B" }} />,
    );

    expect(screen.getByText("정답(GT)")).toBeInTheDocument();
    expect(screen.getByText("예측 A")).toBeInTheDocument();
    expect(screen.getByText("예측 B")).toBeInTheDocument();
    // No stray separator or empty role text is rendered.
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  it("colors the three swatches with the GT and prediction tokens", () => {
    const { container } = render(
      <PredictionLegend
        a={{ name: "예측 A", role: "정확 추적" }}
        b={{ name: "예측 B", role: "과다분할" }}
      />,
    );

    const swatches = container.querySelectorAll("[data-swatch]");
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveStyle({ background: "var(--c-gt)" });
    expect(swatches[1]).toHaveStyle({ background: "var(--c-pred-a)" });
    expect(swatches[2]).toHaveStyle({ background: "var(--c-pred-b)" });
  });
});

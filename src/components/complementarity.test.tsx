import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { CoverageTable } from "./CoverageTable";
import { BenchmarkTable } from "./BenchmarkTable";
import type { ComplementarityBenchmark, ComplementarityPair } from "../types/topic";

const PAIRS: ComplementarityPair[] = [
  {
    blindSpot: "A thin stray false positive far from the lesion",
    blindMetric: "Dice",
    caughtBy: "HD95",
  },
  {
    blindSpot: "A shifted but well-sized mask",
    blindMetric: "Volume similarity",
    caughtBy: "ASSD",
  },
];

const BENCHMARKS: ComplementarityBenchmark[] = [
  {
    name: "BraTS",
    task: "Brain tumor segmentation",
    combination: "Dice + HD95",
    perspective: "Region overlap and boundary error",
  },
];

function renderCoverage() {
  return render(
    <LanguageProvider initialLang="en">
      <CoverageTable intro="Each metric has a blind spot another covers." pairs={PAIRS} />
    </LanguageProvider>,
  );
}

function renderBenchmarks() {
  return render(
    <LanguageProvider initialLang="en">
      <BenchmarkTable benchmarks={BENCHMARKS} />
    </LanguageProvider>,
  );
}

describe("CoverageTable", () => {
  it("renders the intro and a row per pair", () => {
    renderCoverage();

    expect(screen.getByText("Each metric has a blind spot another covers.")).toBeInTheDocument();
    expect(screen.getByText("Dice")).toBeInTheDocument();
    expect(screen.getByText("HD95")).toBeInTheDocument();
    expect(screen.getByText("A shifted but well-sized mask")).toBeInTheDocument();
  });

  it("emphasizes the missed metric in warn and the rescuing metric in the GT token", () => {
    renderCoverage();

    expect(screen.getByText("Dice")).toHaveStyle({ color: "var(--c-warn)" });
    expect(screen.getByText("HD95")).toHaveStyle({ color: "var(--c-gt)" });
  });
});

describe("BenchmarkTable", () => {
  it("renders a row per benchmark with its task, combination, and perspective", () => {
    renderBenchmarks();

    expect(screen.getByText("BraTS")).toBeInTheDocument();
    expect(screen.getByText("Brain tumor segmentation")).toBeInTheDocument();
    expect(screen.getByText("Dice + HD95")).toBeInTheDocument();
    expect(screen.getByText("Region overlap and boundary error")).toBeInTheDocument();
  });

  it("renders the metric combination in the mono token", () => {
    renderBenchmarks();

    expect(screen.getByText("Dice + HD95")).toHaveStyle({ fontFamily: "var(--font-mono)" });
  });
});

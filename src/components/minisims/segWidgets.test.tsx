import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { EngineState } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { makeGrid } from "../../engine/raster/grid";
import { LanguageProvider } from "../../i18n/LanguageContext";
import DiceOverlapSim from "./DiceOverlapSim";
import Hd95StrayFpSim from "./Hd95StrayFpSim";
import NsdToleranceSim from "./NsdToleranceSim";
import LesionMissedSim from "./LesionMissedSim";
import DiceIouRelationSim from "./DiceIouRelationSim";

/**
 * Render a widget with the UI language forced to English so the assertions below
 * can keep matching the English labels. Korean is the app default; the widgets
 * translate via the i18n LanguageContext, so the English provider preserves the
 * original assertions.
 */
function renderEn(ui: ReactElement) {
  return render(<LanguageProvider initialLang="en">{ui}</LanguageProvider>);
}

const POLICY = { emptyDice: "one", emptyDistance: "undefined" } as const;

/** A 128x128 grid is large enough for crisp circles yet fast to rasterize in jsdom. */
function baseState(partial: Partial<EngineState> = {}): EngineState {
  return {
    grid: makeGrid(128, 128, [1, 1]),
    gt: [{ kind: "circle", cx: 64, cy: 64, r: 30 }],
    predictions: [{ id: "A", shapes: [{ kind: "circle", cx: 64, cy: 64, r: 30 }] }],
    policy: POLICY,
    ...partial,
  };
}

function config(kind: string, spotlightMetric: string, partial?: Partial<EngineState>): MiniSimConfig {
  return { kind, initialState: baseState(partial), spotlightMetric };
}

/** A metric numeral matches a decimal number like "0.91" or "12.0". */
const NUMERAL = /^\d+(\.\d+)?$/;

describe("DiceOverlapSim", () => {
  it("renders with a Dice metric and an overlap slider", () => {
    renderEn(<DiceOverlapSim config={config("dice-overlap", "dice")} />);

    expect(screen.getByText("Dice")).toBeInTheDocument();
    expect(screen.getByLabelText(/pred offset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gt radius/i)).toBeInTheDocument();
  });

  it("lowers Dice as the prediction is moved away", () => {
    const { container } = renderEn(<DiceOverlapSim config={config("dice-overlap", "dice")} />);
    const before = readNumeral(container, "dice");

    fireEvent.change(screen.getByLabelText(/pred offset/i), { target: { value: "40" } });

    const after = readNumeral(container, "dice");
    expect(after).toBeLessThan(before);
  });
});

describe("Hd95StrayFpSim", () => {
  it("renders Dice, HD, and HD95 side by side", () => {
    renderEn(<Hd95StrayFpSim config={config("hd95-stray-fp", "hd95")} />);

    expect(screen.getByText("Dice")).toBeInTheDocument();
    expect(screen.getByText("HD")).toBeInTheDocument();
    expect(screen.getByText("HD95")).toBeInTheDocument();
    expect(screen.getByLabelText(/stray fp distance/i)).toBeInTheDocument();
  });

  it("raises HD far more than Dice when a far stray blob is added", () => {
    const { container } = renderEn(<Hd95StrayFpSim config={config("hd95-stray-fp", "hd95")} />);

    fireEvent.change(screen.getByLabelText(/stray fp distance/i), { target: { value: "0" } });
    const hdNear = readNumeral(container, "hd");

    fireEvent.change(screen.getByLabelText(/stray fp distance/i), { target: { value: "50" } });
    const hdFar = readNumeral(container, "hd");

    expect(hdFar).toBeGreaterThan(hdNear);
  });
});

describe("NsdToleranceSim", () => {
  it("renders an NSD metric and shows the tolerance in mm", () => {
    const { container } = renderEn(
      <NsdToleranceSim config={config("nsd-tolerance", "nsd", { nsdToleranceMm: 2 })} />,
    );

    expect(screen.getByText("NSD")).toBeInTheDocument();
    const slider = screen.getByLabelText(/tolerance/i);
    expect(slider).toBeInTheDocument();
    // The tolerance is rendered clearly in mm within its own metric cell.
    const cell = container.querySelector('[data-metric="tolerance"]') as HTMLElement;
    expect(within(cell).getByText("mm")).toBeInTheDocument();
  });

  it("does not lower NSD when the tolerance is loosened", () => {
    const { container } = renderEn(
      <NsdToleranceSim config={config("nsd-tolerance", "nsd", { nsdToleranceMm: 2 })} />,
    );

    fireEvent.change(screen.getByLabelText(/tolerance/i), { target: { value: "1" } });
    const tight = readNumeral(container, "nsd");

    fireEvent.change(screen.getByLabelText(/tolerance/i), { target: { value: "10" } });
    const loose = readNumeral(container, "nsd");

    expect(loose).toBeGreaterThanOrEqual(tight);
  });
});

describe("LesionMissedSim", () => {
  it("renders voxel Dice and lesion sensitivity side by side", () => {
    const { container } = renderEn(<LesionMissedSim config={config("lesion-missed", "lesionSensitivity")} />);

    const voxelCell = container.querySelector('[data-metric="voxel-dice"]') as HTMLElement;
    const lesionCell = container.querySelector('[data-metric="lesion-sensitivity"]') as HTMLElement;
    expect(within(voxelCell).getByText(/voxel dice/i)).toBeInTheDocument();
    expect(within(lesionCell).getByText(/lesion sensitivity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include small lesion/i)).toBeInTheDocument();
  });

  it("drops lesion sensitivity to 0.5 while voxel Dice stays high when the lesion is excluded", () => {
    const { container } = renderEn(<LesionMissedSim config={config("lesion-missed", "lesionSensitivity")} />);

    const toggle = screen.getByLabelText(/include small lesion/i);
    // Default seeds the lesion in; turn it off to exclude the lesion.
    fireEvent.click(toggle);

    expect(readNumeral(container, "lesion-sensitivity")).toBeCloseTo(0.5, 2);
    expect(readNumeral(container, "voxel-dice")).toBeGreaterThan(0.9);
  });
});

describe("Korean is the default UI language", () => {
  it("renders the Korean slider labels for DiceOverlapSim by default", () => {
    render(<DiceOverlapSim config={config("dice-overlap", "dice")} />);

    expect(screen.getByLabelText("예측 오프셋 (px)")).toBeInTheDocument();
    expect(screen.getByLabelText("GT 반지름 (px)")).toBeInTheDocument();
  });

  it("renders the Korean lesion toggle for LesionMissedSim by default", () => {
    render(<LesionMissedSim config={config("lesion-missed", "lesionSensitivity")} />);

    expect(screen.getByLabelText("예측에 작은 병변 포함")).toBeInTheDocument();
  });
});

describe("DiceIouRelationSim", () => {
  it("renders Dice and IoU plus the relation plot", () => {
    const { container } = renderEn(<DiceIouRelationSim config={config("dice-iou", "iou")} />);

    // "Dice"/"IoU" also appear as RelationPlot axis labels, so scope to the cells.
    const diceCell = container.querySelector('[data-metric="dice"]') as HTMLElement;
    const iouCell = container.querySelector('[data-metric="iou"]') as HTMLElement;
    expect(within(diceCell).getByText("Dice")).toBeInTheDocument();
    expect(within(iouCell).getByText("IoU")).toBeInTheDocument();
    expect(container.querySelector('[data-series="relation"]')).toBeInTheDocument();
    expect(screen.getByLabelText(/overlap/i)).toBeInTheDocument();
  });

  it("keeps Dice greater than or equal to IoU for any overlap", () => {
    const { container } = renderEn(<DiceIouRelationSim config={config("dice-iou", "iou")} />);

    fireEvent.change(screen.getByLabelText(/overlap/i), { target: { value: "20" } });

    expect(readNumeral(container, "dice")).toBeGreaterThanOrEqual(readNumeral(container, "iou"));
  });
});

/**
 * Read the formatted numeral of an `AnimatedMetric` tagged with
 * `data-metric={key}`. In jsdom there is no rAF, so the value renders instantly.
 */
function readNumeral(container: HTMLElement, key: string): number {
  const node = container.querySelector(`[data-metric="${key}"]`);
  expect(node, `metric "${key}" should be present`).not.toBeNull();
  const text = within(node as HTMLElement)
    .getAllByText(NUMERAL)
    .map((el) => el.textContent ?? "")
    .find((t) => NUMERAL.test(t));
  expect(text, `metric "${key}" should show a numeral`).toBeTruthy();
  return Number(text);
}

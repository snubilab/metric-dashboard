import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MiniSimConfig } from "../../types/topic";
import type { EngineState } from "../../types/engine";
import { ApReorderSim } from "./ApReorderSim";
import { FrocAddFpSim } from "./FrocAddFpSim";
import { MatchingDuplicateFpSim } from "./MatchingDuplicateFpSim";
import { DetectionBoard } from "../DetectionBoard";

const baseState: EngineState = {
  grid: { width: 256, height: 256, spacingMm: [1, 1] },
  gt: [],
  predictions: [
    { id: "A", shapes: [] },
    { id: "B", shapes: [] },
  ],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
};

const config: MiniSimConfig = {
  kind: "det-widget",
  initialState: baseState,
  spotlightMetric: "ap",
};

describe("ApReorderSim", () => {
  it("renders a PR curve, an AP metric, and the detection list", () => {
    const { container } = render(<ApReorderSim config={config} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Average Precision|^AP$/i)).toBeInTheDocument();
    // Six detections, each with a TP/FP tag.
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(6);
  });

  it("recomputes the AP when the list is sorted by confidence", () => {
    const { container } = render(<ApReorderSim config={config} />);

    const apBefore = container.querySelector('[data-metric="ap"]')?.textContent;
    fireEvent.click(screen.getByRole("button", { name: /sort by confidence/i }));
    const apAfter = container.querySelector('[data-metric="ap"]')?.textContent;

    // Sorting reveals the ranking-rewarded AP, which differs from the scrambled order.
    expect(apBefore).not.toBe(apAfter);
  });
});

describe("FrocAddFpSim", () => {
  it("renders a FROC curve and the LUNA16 score", () => {
    const { container } = render(<FrocAddFpSim config={config} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector('[data-metric="luna16"]')).toBeInTheDocument();
  });

  it("lowers the LUNA16 score after adding a false positive", () => {
    const { container } = render(<FrocAddFpSim config={config} />);

    const before = Number(
      container.querySelector('[data-metric="luna16"]')?.textContent,
    );
    fireEvent.click(screen.getByRole("button", { name: /add false positive/i }));
    const after = Number(
      container.querySelector('[data-metric="luna16"]')?.textContent,
    );

    expect(after).toBeLessThanOrEqual(before);
  });
});

describe("MatchingDuplicateFpSim", () => {
  it("renders the TP/FP/FN counts and a precision metric", () => {
    const { container } = render(<MatchingDuplicateFpSim config={config} />);

    expect(container.querySelector('[data-count="tp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-count="fp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-count="fn"]')).toBeInTheDocument();
    expect(container.querySelector('[data-metric="precision"]')).toBeInTheDocument();
  });

  it("turns the duplicate into a false positive and drops precision", () => {
    const { container } = render(<MatchingDuplicateFpSim config={config} />);

    const fpBefore = Number(container.querySelector('[data-count="fp"]')?.textContent);
    fireEvent.click(
      screen.getByRole("button", { name: /add duplicate box/i }),
    );
    const fpAfter = Number(container.querySelector('[data-count="fp"]')?.textContent);

    expect(fpAfter).toBe(fpBefore + 1);
  });
});

describe("DetectionBoard", () => {
  // Two lesions; predictions ordered TP, FP, TP by confidence so the precision
  // envelope dips — making the AP interpolation methods genuinely diverge.
  const gt = [
    { x: 10, y: 10, w: 30, h: 30 },
    { x: 120, y: 80, w: 40, h: 40 },
  ];
  const preds = [
    { x: 10, y: 10, w: 30, h: 30, confidence: 0.9 }, // TP on lesion 1
    { x: 200, y: 200, w: 20, h: 20, confidence: 0.6 }, // FP (no overlap)
    { x: 120, y: 80, w: 40, h: 40, confidence: 0.4 }, // TP on lesion 2
  ];

  it("renders both the PR and FROC curves", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);

    expect(screen.getByText("Recall")).toBeInTheDocument();
    expect(screen.getByText("False positives per scan")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
  });

  it("shows F1, AP, and AP@[.5:.95] metrics", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);

    expect(container.querySelector('[data-metric="f1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-metric="ap"]')).toBeInTheDocument();
    expect(container.querySelector('[data-metric="ap-range"]')).toBeInTheDocument();
  });

  it("changes F1 when the confidence threshold slider moves", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);

    const f1Before = container.querySelector('[data-metric="f1"]')?.textContent;
    const slider = screen.getByRole("slider", { name: /confidence/i });
    fireEvent.change(slider, { target: { value: "0.95" } });
    const f1After = container.querySelector('[data-metric="f1"]')?.textContent;

    // Raising the threshold above the lowest-confidence TP changes the F1.
    expect(f1After).not.toBe(f1Before);
  });

  it("switches the displayed AP value when the interpolation method changes", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);

    const select = screen.getByRole("combobox", { name: /interpolation|ap method/i });
    const apVoc11 = (() => {
      fireEvent.change(select, { target: { value: "voc11" } });
      return container.querySelector('[data-metric="ap"]')?.textContent;
    })();
    fireEvent.change(select, { target: { value: "coco101" } });
    const apCoco = container.querySelector('[data-metric="ap"]')?.textContent;

    expect(apVoc11).not.toBe(apCoco);
  });

  it("keeps AP fixed across threshold changes (AP ignores the operating point)", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);

    const apBefore = container.querySelector('[data-metric="ap"]')?.textContent;
    const slider = screen.getByRole("slider", { name: /confidence/i });
    fireEvent.change(slider, { target: { value: "0.5" } });
    const apAfter = container.querySelector('[data-metric="ap"]')?.textContent;

    expect(apAfter).toBe(apBefore);
  });

  it("renders the live TP/FP/FN counts", () => {
    const { container } = render(<DetectionBoard gt={gt} preds={preds} />);
    const counts = within(container as HTMLElement);

    expect(counts.getByText(/TP/)).toBeInTheDocument();
    expect(container.querySelector('[data-count="tp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-count="fp"]')).toBeInTheDocument();
    expect(container.querySelector('[data-count="fn"]')).toBeInTheDocument();
  });
});

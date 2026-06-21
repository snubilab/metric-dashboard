import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { DetectionMetricsPanel } from "./DetectionMetricsPanel";
import type { DetBox } from "../types/engine";
import { matchDetections } from "../engine/metrics/detection";
import type { ApMethod } from "../engine/metrics/detection";

// A scene with two true matches and one stray FP, at varied confidences so the
// operating point moves as the threshold rises.
const GT: DetBox[] = [
  { x: 10, y: 10, w: 40, h: 40 },
  { x: 100, y: 100, w: 40, h: 40 },
  { x: 200, y: 30, w: 40, h: 40 },
];
const PREDS: DetBox[] = [
  { x: 10, y: 10, w: 40, h: 40, confidence: 0.9 },
  { x: 100, y: 100, w: 40, h: 40, confidence: 0.6 },
  { x: 200, y: 30, w: 40, h: 40, confidence: 0.4 },
  { x: 400, y: 400, w: 30, h: 30, confidence: 0.7 }, // stray FP, far from any GT
];

const IOU = 0.5;

/** Local re-implementation mirroring the panel's own aboveThreshold filter. */
function above(preds: DetBox[], threshold: number): DetBox[] {
  return preds.filter((p) => (p.confidence ?? 0) >= threshold);
}

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof DetectionMetricsPanel>> = {},
) {
  const onThresholdChange = vi.fn();
  const onApMethodChange = vi.fn();
  const props: React.ComponentProps<typeof DetectionMetricsPanel> = {
    gt: GT,
    preds: PREDS,
    iouThreshold: IOU,
    threshold: 0,
    apMethod: "coco101" as ApMethod,
    onThresholdChange,
    onApMethodChange,
    ...overrides,
  };
  const utils = render(
    <LanguageProvider initialLang="en">
      <DetectionMetricsPanel {...props} />
    </LanguageProvider>,
  );
  return { ...utils, onThresholdChange, onApMethodChange };
}

function countFor(container: HTMLElement, key: "tp" | "fp" | "fn"): number {
  const el = container.querySelector(`[data-count="${key}"]`);
  return Number(el?.textContent);
}

describe("DetectionMetricsPanel", () => {
  it("renders the threshold slider, AP-interpolation selector, and all numerals", () => {
    const { container } = renderPanel();

    expect(screen.getByLabelText("Confidence threshold")).toBeInTheDocument();
    expect(screen.getByLabelText("AP interpolation method")).toBeInTheDocument();

    for (const metric of ["f1", "ap", "ap-range", "precision", "recall"]) {
      expect(container.querySelector(`[data-metric="${metric}"]`)).toBeTruthy();
    }
    for (const key of ["tp", "fp", "fn"]) {
      expect(container.querySelector(`[data-count="${key}"]`)).toBeTruthy();
    }
  });

  it("is controlled: moving the slider calls onThresholdChange and holds no own state", () => {
    const { onThresholdChange } = renderPanel({ threshold: 0 });

    const slider = screen.getByLabelText("Confidence threshold") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.5" } });

    expect(onThresholdChange).toHaveBeenCalledWith(0.5);
    // Controlled: the slider still reflects the prop (0), not the typed value,
    // proving the panel keeps no threshold state of its own.
    expect(slider.value).toBe("0");
  });

  it("TP/FP/FN counts equal matchDetections(aboveThreshold(preds,T),gt) at several thresholds", () => {
    for (const threshold of [0, 0.45, 0.65, 0.8, 1]) {
      const { container, unmount } = renderPanel({ threshold });
      const expected = matchDetections(above(PREDS, threshold), GT, { iouThreshold: IOU });

      expect(countFor(container, "tp")).toBe(expected.tp);
      expect(countFor(container, "fp")).toBe(expected.fp);
      expect(countFor(container, "fn")).toBe(expected.fn);
      unmount();
    }
  });

  it("keeps AP fixed across threshold changes for a fixed apMethod", () => {
    const read = (threshold: number) => {
      const { container, unmount } = renderPanel({ threshold, apMethod: "coco101" });
      const ap = container.querySelector('[data-metric="ap"]')?.textContent;
      unmount();
      return ap;
    };

    const apAtZero = read(0);
    expect(read(0.5)).toBe(apAtZero);
    expect(read(0.95)).toBe(apAtZero);
  });

  it("changes the AP numeral only when apMethod changes", () => {
    const readForMethod = (apMethod: ApMethod) => {
      const { container, unmount } = renderPanel({ threshold: 0.3, apMethod });
      const ap = container.querySelector('[data-metric="ap"]')?.textContent;
      unmount();
      return ap;
    };

    const coco = readForMethod("coco101");
    const voc11 = readForMethod("voc11");
    // For this scene the two interpolation methods differ; AP responds to method.
    expect(typeof coco).toBe("string");
    expect(typeof voc11).toBe("string");
    expect(voc11).not.toBe(coco);
  });

  it("renders a PR curve with an operating-point dot and a FROC curve", () => {
    const { container } = renderPanel({ threshold: 0.5 });

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('[data-role="operating-point"]')).toBeTruthy();

    const pr = screen.getByRole("img", { name: "Precision-recall curve" });
    expect(within(pr).getByText("Recall")).toBeInTheDocument();
  });
});

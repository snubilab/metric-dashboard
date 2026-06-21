/**
 * Tests for the draw-from-scratch guided Detection Playground.
 *
 * Detection is GROUND-TRUTH vs PREDICTIONS-WITH-A-CONFIDENCE-THRESHOLD; the
 * board boots EMPTY and a pure detectionStage(state) drives a STEP n of 2 pill,
 * the on-canvas prompt, locked layers, and the compare gate. The SAME threshold
 * feeds the canvas and the metrics panel, so dragging it recolors boxes AND
 * moves the numerals. These tests render in English for deterministic strings.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Playground from "./Playground";
import { LanguageProvider } from "../../i18n/LanguageContext";

/** Render the Playground in English for readable, deterministic assertions. */
function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <Playground />
    </LanguageProvider>,
  );
}

/**
 * Map the 256-grid canvas onto a 256px rect so 1 client px == 1 grid cell,
 * making drag coordinates trivial. minGrid = (6/480)*256 ≈ 3.2, so a drag of
 * ≥4 cells commits while a same-point tap is discarded.
 */
function stubCanvasRect(): HTMLCanvasElement {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 256,
    height: 256,
    right: 256,
    bottom: 256,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  return canvas;
}

/** Draw one box on the currently-active layer via a press-drag-release. */
function drawBox(x0 = 90, y0 = 90, x1 = 150, y1 = 150) {
  const canvas = stubCanvasRect();
  fireEvent.pointerDown(canvas, { clientX: x0, clientY: y0, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: x1, clientY: y1, pointerId: 1 });
  fireEvent.pointerUp(canvas, { clientX: x1, clientY: y1, pointerId: 1 });
}

/** The threshold slider, anchored by its accessible label. */
function thresholdSlider(): HTMLInputElement {
  return screen.getByLabelText("Confidence threshold") as HTMLInputElement;
}

/**
 * Open the "Load an example" disclosure and load a named example preset, jumping
 * straight to compare. Defaults to "Confidence threshold matters" — three correct
 * high-confidence boxes (0.90 / 0.85 / 0.80) plus two low-confidence false
 * positives (0.30 / 0.25) — which exercises both the FP-drop and the TP→ghost
 * threshold lessons.
 */
function loadExample(name = "Confidence threshold matters") {
  // Force the parent <details> open so the inner preset buttons are interactable.
  const summary = screen.getByText("Load an example");
  const details = summary.closest("details");
  if (details) details.open = true;
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Read a TP/FP/FN count numeral by its data-count key. */
function countFor(key: string): number {
  const el = document.querySelector(`[data-count="${key}"]`);
  return Number(el?.textContent);
}

describe("DetectionPlayground (guided empty boot)", () => {
  it("boots empty: GT prompt visible, STEP 1 of 2, metrics panel gated", () => {
    renderPlayground();

    expect(
      screen.getByText("① Draw the ground-truth lesion boxes · press & drag"),
    ).toBeInTheDocument();
    expect(screen.getByText("STEP 1 of 2")).toBeInTheDocument();
    // The metrics panel (threshold slider) is gated until compare.
    expect(
      screen.queryByLabelText("Confidence threshold"),
    ).not.toBeInTheDocument();
    // The dormant gating line names the remaining step.
    expect(
      screen.getByText(
        "Draw the ground-truth boxes, then predicted boxes to explore metrics here.",
      ),
    ).toBeInTheDocument();
  });

  it("locks the PRED layer at stage gt; GT stays enabled", () => {
    renderPlayground();
    expect(screen.getByRole("button", { name: "Ground truth (GT)" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Predictions (PRED)" }),
    ).toBeDisabled();
  });

  it("after a GT box exists, advances to STEP 2 with the PRED prompt, still gated", () => {
    renderPlayground();

    expect(screen.getByText("STEP 1 of 2")).toBeInTheDocument();
    drawBox();

    expect(screen.getByText("STEP 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByText("② Draw predicted boxes and set each confidence"),
    ).toBeInTheDocument();
    // Still gated: no metrics panel yet.
    expect(
      screen.queryByLabelText("Confidence threshold"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Draw at least one predicted box to start exploring."),
    ).toBeInTheDocument();
  });

  it("after >=1 pred, compare unlocks: metrics panel + thesis banner render", () => {
    window.localStorage.removeItem("md-detection-playground-guide-seen");
    renderPlayground();

    drawBox(); // GT -> stage preds
    drawBox(); // pred -> stage compare

    expect(screen.getByText("STEP 2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Confidence threshold")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The confidence threshold picks one operating point — raising it trades precision against recall, while AP integrates the whole ordering and stays fixed.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the active layer on PRED after compare unlocks (2nd pred lands in preds, not gt)", () => {
    // Regression for the codex P1: when the first prediction flipped the stage to
    // compare, a stale manualLayer="GT" snapped the active layer back to GT, so the
    // NEXT box was appended to gt — corrupting TP/FP/FN. The next pred must stay PRED.
    renderPlayground();

    drawBox(90, 90, 150, 150); // GT box
    drawBox(90, 90, 150, 150); // prediction 1 (overlaps GT) -> stage compare
    drawBox(10, 10, 40, 40); // prediction 2, far away -> MUST land in preds (an FP)

    // Correct: 1 matched TP + 1 stray FP, no misses. If pred 2 had wrongly gone
    // into gt, we'd instead see a second unmatched GT (FN=1) and FP=0.
    expect(countFor("tp")).toBe(1);
    expect(countFor("fp")).toBe(1);
    expect(countFor("fn")).toBe(0);
  });

  it("shares ONE threshold: moving the slider updates the numerals", () => {
    renderPlayground();

    // Reach compare with an example so the threshold has something to move.
    loadExample();

    // At threshold 0 all five preds are visible: 3 TP, 2 FP, 0 FN.
    const slider = thresholdSlider();
    expect(slider.value).toBe("0");
    expect(countFor("tp")).toBe(3);
    expect(countFor("fp")).toBe(2);
    expect(countFor("fn")).toBe(0);

    // Raise past 0.30: both low-confidence stray FPs drop below threshold.
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(countFor("fp")).toBe(0);
  });

  it("load-example: crossing the 0.80 box's confidence turns a real TP into a ghost (TP-1, FN+1), AP fixed", () => {
    renderPlayground();
    loadExample();

    const slider = thresholdSlider();
    const apBefore = document.querySelector('[data-metric="ap"]')?.textContent;

    // Below 0.80: all three correct boxes (0.90 / 0.85 / 0.80) are genuine TPs.
    fireEvent.change(slider, { target: { value: "0.7" } });
    const tpBelow = countFor("tp");
    const fnBelow = countFor("fn");

    // Above 0.80: the 0.80 box is excluded -> its GT goes FN; TP drops by one.
    fireEvent.change(slider, { target: { value: "0.85" } });
    expect(countFor("tp")).toBe(tpBelow - 1);
    expect(countFor("fn")).toBe(fnBelow + 1);

    // AP integrates the whole ordering and is unchanged across the threshold.
    const apAfter = document.querySelector('[data-metric="ap"]')?.textContent;
    expect(apAfter).toBe(apBefore);
  });

  it("Reset to empty returns to STEP 1 empty and is undoable", async () => {
    const user = userEvent.setup();
    renderPlayground();

    drawBox(); // GT
    drawBox(); // pred -> compare
    expect(screen.getByLabelText("Confidence threshold")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset to empty" }));

    expect(screen.getByText("STEP 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByText("① Draw the ground-truth lesion boxes · press & drag"),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Confidence threshold"),
    ).not.toBeInTheDocument();
    // Reset recorded the prior state, so Undo is available.
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("Undo restores the prior drawn state", async () => {
    const user = userEvent.setup();
    renderPlayground();

    drawBox(); // GT -> stage preds (STEP 2)
    expect(screen.getByText("STEP 2 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Undo" }));
    // Back to the empty STEP-1 state.
    expect(screen.getByText("STEP 1 of 2")).toBeInTheDocument();
  });

  it("remembers the first-visit thesis banner dismissal", async () => {
    const user = userEvent.setup();
    window.localStorage.removeItem("md-detection-playground-guide-seen");
    renderPlayground();

    drawBox(); // GT
    drawBox(); // pred -> compare
    const bannerText =
      "The confidence threshold picks one operating point — raising it trades precision against recall, while AP integrates the whole ordering and stays fixed.";
    expect(screen.getByText(bannerText)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(bannerText)).not.toBeInTheDocument();

    // The dismissal persists across the next compare unlock.
    await user.click(screen.getByRole("button", { name: "Reset to empty" }));
    drawBox();
    drawBox();
    expect(screen.queryByText(bannerText)).not.toBeInTheDocument();
  });
});

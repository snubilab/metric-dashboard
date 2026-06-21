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
 * Open the "Load an example" disclosure and load the fixed seed, jumping
 * straight to compare. Both the <summary> and the inner load <button> read
 * "Load an example"; the <button> is the one exposed via role="button".
 */
function loadExample() {
  const button = screen.getByRole("button", { name: "Load an example" });
  // Force the parent <details> open so the inner button is interactable.
  const details = button.closest("details");
  if (details) details.open = true;
  fireEvent.click(button);
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

  it("shares ONE threshold: moving the slider updates the numerals", () => {
    renderPlayground();

    // Reach compare with the fixed seed so the threshold has something to move.
    loadExample();

    // At threshold 0 all four preds are visible: 3 TP, 1 FP, 0 FN.
    const slider = thresholdSlider();
    expect(slider.value).toBe("0");
    expect(countFor("tp")).toBe(3);
    expect(countFor("fp")).toBe(1);
    expect(countFor("fn")).toBe(0);

    // Raise past 0.33: the stray FP drops below threshold.
    fireEvent.change(slider, { target: { value: "0.4" } });
    expect(countFor("fp")).toBe(0);
  });

  it("load-example: crossing T=0.60 turns the real TP into a ghost (TP-1, FN+1), AP fixed", () => {
    renderPlayground();
    loadExample();

    const slider = thresholdSlider();
    const apBefore = document.querySelector('[data-metric="ap"]')?.textContent;

    // Below 0.60: the mid-confidence pred (conf 0.60) is a genuine TP.
    fireEvent.change(slider, { target: { value: "0.5" } });
    const tpBelow = countFor("tp");
    const fnBelow = countFor("fn");

    // Above 0.60: that pred is excluded -> its GT goes FN; TP drops by one.
    fireEvent.change(slider, { target: { value: "0.7" } });
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

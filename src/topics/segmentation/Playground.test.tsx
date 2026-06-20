import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Playground from "./Playground";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { SEG_PRESETS, DEFAULT_PRESET_ID } from "./presets";

/** Render the Playground in English for deterministic, readable assertions. */
function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <Playground />
    </LanguageProvider>,
  );
}

/** A preset used by the "load an example" interaction. */
const DEFAULT_PRESET = SEG_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;

/** The identity legend container, anchored by its always-present GT chip. */
function legend(): HTMLElement {
  const gt = screen.getByText("Ground truth (GT)");
  // The chip's grandparent is the legend root div (chip span -> name span).
  return gt.closest("div") as HTMLElement;
}

/**
 * Map the 256-grid canvas onto a 256px rect so 1 client px == 1 grid cell,
 * making drag coordinates trivial. minGrid = (6/480)*256 ≈ 3.2, so a drag of
 * ≥4 cells commits while a same-point tap is discarded.
 */
function stubCanvasRect() {
  const canvas = document.querySelector("canvas")!;
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

/** Draw one circle on the currently-active layer via a press-drag-release. */
function drawCircle() {
  const canvas = stubCanvasRect();
  // A generous bbox well above the min-size guard, near the canvas center.
  fireEvent.pointerDown(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 150, clientY: 150, pointerId: 1 });
  fireEvent.pointerUp(canvas, { clientX: 150, clientY: 150, pointerId: 1 });
}

describe("Playground (guided empty boot)", () => {
  it("boots empty: GT prompt visible, STEP 1 of 3, no table, no verdict/chart", () => {
    renderPlayground();

    // The GT step prompt is shown inside the canvas overlay.
    expect(
      screen.getByText("① Draw the ground truth (GT) · press & drag"),
    ).toBeInTheDocument();
    // STEP pill is at step 1 of 3.
    expect(screen.getByText("STEP 1 of 3")).toBeInTheDocument();
    // No metric table, verdict, or chart while gated.
    expect(document.querySelector("table")).not.toBeInTheDocument();
    expect(document.querySelector('[data-role="insight"]')).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Per-metric A vs B bar comparison" }),
    ).not.toBeInTheDocument();
  });

  it("disables the A and B layer buttons at stage gt; GT stays enabled", () => {
    renderPlayground();
    expect(screen.getByRole("button", { name: "GT" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled();
  });

  it("advances the pill 1 -> 2 -> 3 and only unlocks compare after B has a shape", () => {
    window.localStorage.removeItem("md-playground-guide-seen");
    renderPlayground();

    // Stage gt -> draw GT -> advances to stage a (STEP 2), still gated.
    expect(screen.getByText("STEP 1 of 3")).toBeInTheDocument();
    drawCircle();
    expect(screen.getByText("STEP 2 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("② Draw prediction A · a first guess at the truth"),
    ).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();

    // Draw A -> advances to stage b (STEP 3), still gated.
    drawCircle();
    expect(screen.getByText("STEP 3 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("③ Draw prediction B · make it differ from A"),
    ).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();

    // Draw B -> compare unlocks: table mounts and the one-time thesis banner shows.
    drawCircle();
    expect(document.querySelector("table")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Two guesses at one truth — see which side each metric calls 'closer'. No single metric is the answer; the winner flips by metric.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the dormant gating line naming the remaining step, no table, while gated", () => {
    renderPlayground();
    // Stage gt line.
    expect(
      screen.getByText("Draw the ground truth, then A and B to compare metrics here."),
    ).toBeInTheDocument();

    drawCircle(); // -> stage a
    expect(
      screen.getByText("Draw one more guess (A) to start comparing."),
    ).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();

    drawCircle(); // -> stage b
    expect(
      screen.getByText("Draw one more guess (B) to start comparing."),
    ).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();
  });

  it("Reset to empty returns to the empty STEP-1 state and is undoable", async () => {
    const user = userEvent.setup();
    renderPlayground();

    // Build a full scene so the comparison unlocks.
    drawCircle();
    drawCircle();
    drawCircle();
    expect(document.querySelector("table")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset to empty" }));

    // Back to the empty STEP-1 state: GT prompt, no table.
    expect(screen.getByText("STEP 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText("① Draw the ground truth (GT) · press & drag"),
    ).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();
    // Reset recorded the prior state, so Undo is available.
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("Load an example loads a preset into compare and editing drops the role", async () => {
    const user = userEvent.setup();
    renderPlayground();

    // Open the collapsed disclosure and load the default preset.
    await user.click(screen.getByText("Load an example"));
    await user.click(
      screen.getByRole("button", { name: DEFAULT_PRESET.label }),
    );

    // Jumps straight to compare: the table is mounted and the preset role shows.
    expect(document.querySelector("table")).toBeInTheDocument();
    expect(
      screen.getByText(DEFAULT_PRESET.predictionA.role.en),
    ).toBeInTheDocument();

    // A hand edit detaches from the preset, dropping the scene role.
    drawCircle();
    const l = within(legend());
    expect(
      l.queryByText(DEFAULT_PRESET.predictionA.role.en),
    ).not.toBeInTheDocument();
    // Generic prediction names remain in the legend, with no role.
    expect(l.getByText("Prediction A")).toBeInTheDocument();
    expect(l.getByText("Prediction B")).toBeInTheDocument();
  });

  it("hides the Advanced (NSD / policy) controls until stage compare", async () => {
    const user = userEvent.setup();
    renderPlayground();

    // Not present while gated.
    expect(
      screen.queryByRole("combobox", { name: "Empty Dice policy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("slider", { name: "NSD tolerance (mm)" }),
    ).not.toBeInTheDocument();

    // Load a full scene via a preset to reach compare.
    await user.click(screen.getByText("Load an example"));
    await user.click(
      screen.getByRole("button", { name: DEFAULT_PRESET.label }),
    );

    // The Advanced controls now exist (inside the <details> disclosure).
    expect(
      screen.getByRole("combobox", { name: "Empty Dice policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "NSD tolerance (mm)" }),
    ).toBeInTheDocument();
  });

  it("never grades a metric with absolute quality words in the verdict", () => {
    const { container } = renderPlayground();

    // Reach compare by DRAWING the scene (so no preset label/description text,
    // which legitimately contains words like "good", pollutes the verdict).
    drawCircle();
    drawCircle();
    drawCircle();

    // The verdict column holds the thesis banner + verdict + table + chart.
    const verdictCol = container.querySelector(".pg-verdict-col") as HTMLElement;
    expect(verdictCol).toBeInTheDocument();
    const text = (verdictCol.textContent ?? "").toLowerCase();
    for (const grade of ["좋음", "나쁨", "우수", "good", "bad"]) {
      expect(text).not.toContain(grade.toLowerCase());
    }
  });

  it("renders a visibility toggle for each layer once they are unlocked", () => {
    renderPlayground();
    // At boot the A/B layers are locked, so only GT exposes an eye toggle.
    expect(screen.getByRole("button", { name: "Hide GT" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hide Prediction A" }),
    ).not.toBeInTheDocument();

    // Drawing GT→A→B unlocks every layer, so all three toggles then appear.
    drawCircle();
    drawCircle();
    drawCircle();
    expect(screen.getByRole("button", { name: "Hide GT" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Prediction A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Prediction B" }),
    ).toBeInTheDocument();
  });

  it("groups the editing actions under an Edit actions label", () => {
    renderPlayground();
    const group = screen.getByRole("group", { name: "Edit actions" });
    expect(within(group).getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Reset to empty" }),
    ).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Clear layer" }),
    ).toBeInTheDocument();
  });

  it("re-arms the guide and clears to empty via Show guide again", async () => {
    const user = userEvent.setup();
    window.localStorage.removeItem("md-playground-guide-seen");
    renderPlayground();

    // Reach compare and dismiss the one-time thesis banner.
    drawCircle();
    drawCircle();
    drawCircle();
    const bannerText =
      "Two guesses at one truth — see which side each metric calls 'closer'. No single metric is the answer; the winner flips by metric.";
    expect(screen.getByText(bannerText)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(bannerText)).not.toBeInTheDocument();

    // Show guide again resets to empty AND re-arms the banner for the next compare.
    await user.click(screen.getByRole("button", { name: "Show guide again" }));
    expect(screen.getByText("STEP 1 of 3")).toBeInTheDocument();
    expect(document.querySelector("table")).not.toBeInTheDocument();

    drawCircle();
    drawCircle();
    drawCircle();
    expect(screen.getByText(bannerText)).toBeInTheDocument();
  });
});

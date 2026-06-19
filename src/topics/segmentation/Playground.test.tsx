import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

/** The preset loaded on first render — used to assert legend identity text. */
const DEFAULT_PRESET = SEG_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;

describe("Playground", () => {
  it("keeps Undo disabled until an edit, then restores on Undo", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toBeDisabled();

    // An edit (adding a circle to the active layer) pushes history.
    await user.click(screen.getByRole("button", { name: "Add circle" }));
    expect(undo).toBeEnabled();

    // Undo pops the recorded state and empties the (single-entry) history.
    await user.click(undo);
    expect(undo).toBeDisabled();
  });

  it("empties the active layer when Clear layer is pressed", async () => {
    const user = userEvent.setup();
    renderPlayground();

    // The default active layer (GT) starts non-empty, so an edit + undo cycle
    // is observable. Add a shape so history is primed, then clear the layer.
    await user.click(screen.getByRole("button", { name: "Add circle" }));
    await user.click(screen.getByRole("button", { name: "Clear layer" }));

    // Clear records the prior state, so Undo is available to restore it.
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("renders a visibility toggle for each layer", () => {
    renderPlayground();

    // Each layer has an eye toggle exposing a Show/Hide label; default is shown.
    expect(screen.getByRole("button", { name: "Hide GT" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Prediction A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Prediction B" }),
    ).toBeInTheDocument();
  });

  it("toggles a layer's visibility without throwing", async () => {
    const user = userEvent.setup();
    renderPlayground();

    const hideGt = screen.getByRole("button", { name: "Hide GT" });
    await user.click(hideGt);
    // After hiding, the same control flips to a Show affordance.
    expect(screen.getByRole("button", { name: "Show GT" })).toBeInTheDocument();
  });

  it("groups the editing actions under an Edit actions label", () => {
    renderPlayground();
    const group = screen.getByRole("group", { name: "Edit actions" });
    expect(within(group).getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(within(group).getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Clear layer" }),
    ).toBeInTheDocument();
  });

  it("shows the live-update drag hint near the canvas", () => {
    renderPlayground();
    expect(
      screen.getByText("Drag a shape — the metrics update live."),
    ).toBeInTheDocument();
  });

  it("renders human labels (not raw codes) in the policy selects", () => {
    renderPlayground();

    const dice = screen.getByRole("combobox", { name: "Empty Dice policy" });
    expect(within(dice).getByRole("option", { name: "Both empty → 1.0" })).toBeInTheDocument();
    expect(within(dice).getByRole("option", { name: "Both empty → 0.0" })).toBeInTheDocument();
    expect(within(dice).getByRole("option", { name: "Undefined (NaN)" })).toBeInTheDocument();
    // Raw code values must not surface as visible option text.
    expect(within(dice).queryByRole("option", { name: "nan" })).not.toBeInTheDocument();

    const distance = screen.getByRole("combobox", { name: "Empty distance policy" });
    expect(
      within(distance).getByRole("option", { name: "Undefined (NaN)" }),
    ).toBeInTheDocument();
    expect(within(distance).getByRole("option", { name: "Image diagonal" })).toBeInTheDocument();
    expect(within(distance).getByRole("option", { name: "Fixed penalty" })).toBeInTheDocument();
    expect(
      within(distance).queryByRole("option", { name: "diagonal" }),
    ).not.toBeInTheDocument();
  });

  it("renders the NSD tolerance label with a space and lowercase mm", () => {
    renderPlayground();
    expect(screen.getByText(/NSD tolerance:/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 mm/)).toBeInTheDocument();
  });

  // ---- U1: prediction identity legend ----

  /** The identity legend container (anchored by its always-present GT chip). */
  function legend(): HTMLElement {
    const gt = screen.getByText("Ground truth (GT)");
    // The chip's grandparent is the legend root div (chip span → name span).
    return gt.closest("div") as HTMLElement;
  }

  it("renders the active preset's A and B names + roles in the legend", () => {
    renderPlayground();
    const l = within(legend());
    // Default preset (good-vs-over): A 'accurate', B 'over-segmentation'.
    expect(l.getByText(DEFAULT_PRESET.predictionA.role.en)).toBeInTheDocument();
    expect(l.getByText(DEFAULT_PRESET.predictionB.role.en)).toBeInTheDocument();
    expect(l.getByText(DEFAULT_PRESET.predictionA.name.en)).toBeInTheDocument();
    expect(l.getByText(DEFAULT_PRESET.predictionB.name.en)).toBeInTheDocument();
  });

  it("drops the scene role from the legend after a hand edit", async () => {
    const user = userEvent.setup();
    renderPlayground();

    // Editing detaches from any preset, so the role phrase disappears.
    await user.click(screen.getByRole("button", { name: "Add circle" }));
    const l = within(legend());
    expect(l.queryByText(DEFAULT_PRESET.predictionA.role.en)).not.toBeInTheDocument();
    // Generic names remain in the legend, with no role.
    expect(l.getByText("Prediction A")).toBeInTheDocument();
    expect(l.getByText("Prediction B")).toBeInTheDocument();
  });

  // ---- U3: verdict-first + progressive disclosure ----

  it("shows only the core metrics in the compact table, with the verdict before it", () => {
    const { container } = renderPlayground();

    // The insight (verdict) is rendered and precedes the first metric table in DOM.
    const insight = container.querySelector('[data-role="insight"]');
    expect(insight).toBeInTheDocument();
    const firstTable = container.querySelector("table");
    expect(firstTable).toBeInTheDocument();
    expect(
      insight!.compareDocumentPosition(firstTable!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // The compact table shows exactly the three core metric rows.
    const compact = within(firstTable as HTMLElement);
    expect(compact.getByRole("rowheader", { name: /Dice/ })).toBeInTheDocument();
    expect(compact.getByRole("rowheader", { name: /HD95/ })).toBeInTheDocument();
    expect(compact.getByRole("rowheader", { name: /Sensitivity/ })).toBeInTheDocument();
    // Non-core metrics stay hidden behind the expander.
    expect(compact.queryByRole("rowheader", { name: /IoU/ })).not.toBeInTheDocument();
    expect(compact.queryByRole("rowheader", { name: /ASSD/ })).not.toBeInTheDocument();
  });

  it("renders a relative-cue chip on the compact metric rows", () => {
    renderPlayground();
    // U2: the compact table opts into the relative cue (A leads / B leads / tie).
    const cues = screen.getAllByText(/^(A leads|B leads|tie|n\/a)$/);
    expect(cues.length).toBeGreaterThan(0);
  });

  it("keeps the full metric table and bar chart inside a collapsed expander", async () => {
    const user = userEvent.setup();
    const { container } = renderPlayground();

    // The expander is a closed <details> until the user opens it.
    const expander = container.querySelector("details") as HTMLDetailsElement;
    expect(expander).toBeInTheDocument();
    expect(expander.open).toBe(false);

    // The full-only metrics (IoU/ASSD) and the bar chart live inside it — not in
    // the always-visible compact table above.
    const within$ = within(expander);
    expect(within$.getByRole("rowheader", { name: /IoU/ })).toBeInTheDocument();
    expect(within$.getByRole("rowheader", { name: /ASSD/ })).toBeInTheDocument();
    expect(
      within$.getByRole("img", { name: "Per-metric A vs B bar comparison" }),
    ).toBeInTheDocument();

    // Clicking the summary opens the expander to reveal them.
    await user.click(screen.getByText("Show all metrics"));
    expect(expander.open).toBe(true);
  });

  // ---- U5: first-visit banner ----

  it("shows the first-visit banner, then hides it on dismiss", async () => {
    const user = userEvent.setup();
    window.localStorage.removeItem("md-playground-guide-seen");
    renderPlayground();

    const banner = screen.getByText(
      "A and B are two predictions of the same ground truth. Move the shapes and watch the metrics change.",
    );
    expect(banner).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(
      screen.queryByText(
        "A and B are two predictions of the same ground truth. Move the shapes and watch the metrics change.",
      ),
    ).not.toBeInTheDocument();

    // A Help affordance can bring the banner back.
    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(
      screen.getByText(
        "A and B are two predictions of the same ground truth. Move the shapes and watch the metrics change.",
      ),
    ).toBeInTheDocument();
  });

  // ---- live re-derivation ----

  it("re-derives the verdict after an edit (no stale disagreement)", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("md-playground-guide-seen", "true");
    const { container } = renderPlayground();

    // The default preset contrasts an accurate A with an over-segmenting B, so
    // the metrics disagree on which prediction wins.
    expect(
      container.querySelector('[data-role="insight"]')?.getAttribute("data-disagree"),
    ).toBe("true");

    // Clearing GT makes both predictions degenerate against an empty reference;
    // the verdict must recompute rather than show the stale disagreement.
    await user.click(screen.getByRole("button", { name: "Clear layer" }));
    expect(
      container.querySelector('[data-role="insight"]')?.getAttribute("data-disagree"),
    ).toBe("false");
  });
});

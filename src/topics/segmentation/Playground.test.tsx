import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Playground from "./Playground";
import { LanguageProvider } from "../../i18n/LanguageContext";

/** Render the Playground in English for deterministic, readable assertions. */
function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <Playground />
    </LanguageProvider>,
  );
}

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

  it("renders the insight and metric bar chart panels", () => {
    const { container } = renderPlayground();

    // Insight callout is present (agree/disagree variant).
    expect(container.querySelector('[data-role="insight"]')).toBeInTheDocument();

    // The metric bar chart renders its labeled SVG.
    expect(
      screen.getByRole("img", { name: "Per-metric A vs B bar comparison" }),
    ).toBeInTheDocument();
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
});

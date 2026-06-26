import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import ClassificationPlayground from "./Playground";

function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <ClassificationPlayground />
    </LanguageProvider>,
  );
}

describe("ClassificationPlayground", () => {
  it("boots empty with metrics gated", () => {
    renderPlayground();
    expect(screen.getByText("Step 1/3")).toBeInTheDocument();
    expect(screen.getByText("Metrics unlock when both actual classes exist.")).toBeInTheDocument();
  });

  it("unlocks metrics after the student creates both actual classes", async () => {
    renderPlayground();
    await userEvent.click(screen.getByRole("button", { name: "Add positive" }));
    await userEvent.click(screen.getByRole("button", { name: "Add negative" }));

    expect(screen.getByText("Step 3/3")).toBeInTheDocument();
    expect(screen.getByText("TP 1")).toBeInTheDocument();
    expect(screen.getByText("TN 1")).toBeInTheDocument();
  });

  it("adds positive and negative cases by clicking the score strip", () => {
    renderPlayground();
    const strip = screen.getByRole("img", { name: "Classification workspace" });
    strip.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 56,
      width: 400,
      height: 56,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(strip, { clientX: 280, clientY: 14 });
    fireEvent.pointerDown(strip, { clientX: 120, clientY: 42 });

    expect(screen.getByText("Step 3/3")).toBeInTheDocument();
    expect(screen.getByText("TP 1")).toBeInTheDocument();
    expect(screen.getByText("TN 1")).toBeInTheDocument();
  });

  it("loads a row of presets and marks the active preset", async () => {
    renderPlayground();
    const preset = screen.getByRole("button", { name: /Rare positives/ });
    await userEvent.click(preset);

    expect(preset).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByText(/5 percent prevalence/)).toBeInTheDocument();
    expect(screen.getByText("Click the score strip to add more cases or move the threshold to see metrics change.")).toBeInTheDocument();
    expect(screen.getAllByText("Total 100 · Positive 5 · Negative 95")).toHaveLength(2);
    expect(screen.getAllByText("Cases 100").length).toBeGreaterThan(0);
    expect(screen.queryByText("N 100")).not.toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Adjust score groups" }));

    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });
});

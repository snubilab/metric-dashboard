import { render, screen } from "@testing-library/react";
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

  it("loads a row of presets and marks the active preset", async () => {
    renderPlayground();
    const preset = screen.getByRole("button", { name: "Rare positives" });
    await userEvent.click(preset);

    expect(preset).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/5 percent prevalence/)).toBeInTheDocument();
    expect(screen.getByText("Adjust the threshold or score groups to see how the metrics move.")).toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(3);
  });
});

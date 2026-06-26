import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import RegressionPlayground from "./Playground";

function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <RegressionPlayground />
    </LanguageProvider>,
  );
}

describe("RegressionPlayground", () => {
  it("shows presets immediately and loads one into the workspace", async () => {
    const { container } = renderPlayground();

    const preset = screen.getByRole("button", { name: "One outlier" });
    await userEvent.click(preset);

    expect(container.querySelector("svg")?.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
    expect(preset).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("One large residual pulls RMSE away from MAE.")).toBeInTheDocument();
    expect(screen.getAllByText(/5 points · MAE/)).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: "Add one point (optional)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add point manually" })).toBeInTheDocument();
  });

  it("loading a preset clears stale draft inputs", async () => {
    renderPlayground();

    await userEvent.type(screen.getByLabelText("Target"), "7");
    await userEvent.type(screen.getByLabelText("Prediction"), "8");
    await userEvent.type(screen.getByLabelText("Residual"), "1");
    await userEvent.click(screen.getByRole("button", { name: "One outlier" }));
    await userEvent.click(screen.getByRole("button", { name: "Add point manually" }));

    expect(screen.getByLabelText("Target")).toHaveValue(null);
    expect(screen.getByLabelText("Prediction")).toHaveValue(null);
    expect(screen.getByLabelText("Residual")).toHaveValue(null);
    expect(screen.getByText("One large residual pulls RMSE away from MAE.")).toBeInTheDocument();
  });

  it("reset clears loaded data and draft inputs", async () => {
    renderPlayground();

    const preset = screen.getByRole("button", { name: "One outlier" });
    await userEvent.click(preset);
    await userEvent.click(screen.getByRole("button", { name: "Add point manually" }));
    await userEvent.type(screen.getByLabelText("Target"), "7");
    await userEvent.type(screen.getByLabelText("Prediction"), "8");
    await userEvent.type(screen.getByLabelText("Residual"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(preset).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Target")).toHaveValue(null);
    expect(screen.getByLabelText("Prediction")).toHaveValue(null);
    expect(screen.getByLabelText("Residual")).toHaveValue(null);
    expect(screen.getByText("No points yet. Add the first point to start the scatter plot.")).toBeInTheDocument();
  });
});

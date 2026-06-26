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
    renderPlayground();

    const preset = screen.getByRole("button", { name: "One outlier" });
    await userEvent.click(preset);

    expect(preset).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("One large residual pulls RMSE away from MAE.")).toBeInTheDocument();
  });
});

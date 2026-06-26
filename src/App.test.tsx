import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

const APP_TEST_TIMEOUT_MS = 10_000;

/** Render the App in a deterministic English language context. */
function renderApp() {
  return render(
    <LanguageProvider initialLang="en">
      <App />
    </LanguageProvider>,
  );
}

describe("App shell", () => {
  it("renders the sidebar with Image Segmentation", () => {
    renderApp();
    const sidebar = screen.getByRole("navigation", { name: /topics/i });
    expect(within(sidebar).getByText("Image Segmentation")).toBeInTheDocument();
  });

  it("shows the Learn tab by default", () => {
    renderApp();
    const learnTab = screen.getByRole("tab", { name: /learn/i });
    expect(learnTab).toHaveAttribute("aria-selected", "true");
  });

  it(
    "renders the playground region when the Playground tab is clicked",
    async () => {
      renderApp();
      await userEvent.click(screen.getByRole("tab", { name: /playground/i }));
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /playground/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
    APP_TEST_TIMEOUT_MS,
  );

  it(
    "switches the active topic when Image Detection is selected",
    async () => {
      renderApp();
      const sidebar = screen.getByRole("navigation", { name: /topics/i });
      await userEvent.click(within(sidebar).getByRole("button", { name: /Image Detection/ }));

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Image Detection");
    },
    APP_TEST_TIMEOUT_MS,
  );
});

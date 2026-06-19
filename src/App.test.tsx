import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App shell", () => {
  it("renders the sidebar with Image Segmentation", () => {
    render(<App />);
    const sidebar = screen.getByRole("navigation", { name: /topics/i });
    expect(within(sidebar).getByText("Image Segmentation")).toBeInTheDocument();
  });

  it("shows the Learn tab by default", () => {
    render(<App />);
    const learnTab = screen.getByRole("tab", { name: /learn/i });
    expect(learnTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders the playground region when the Playground tab is clicked", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("tab", { name: /playground/i }));
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /playground/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches the active topic when Image Detection is selected", async () => {
    render(<App />);
    const sidebar = screen.getByRole("navigation", { name: /topics/i });
    await userEvent.click(within(sidebar).getByRole("button", { name: /Image Detection/ }));

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Image Detection");
  });
});

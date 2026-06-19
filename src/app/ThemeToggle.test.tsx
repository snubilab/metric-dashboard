import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("renders a button", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("defaults to the light theme on mount", () => {
    render(<ThemeToggle />);

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("flips document.documentElement.dataset.theme when clicked", async () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists the chosen theme to localStorage", async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole("button"));

    expect(window.localStorage.getItem("md-theme")).toBe("dark");
  });
});

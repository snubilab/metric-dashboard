import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { Topic } from "../types/topic";
import { Sidebar } from "./Sidebar";
import { LanguageProvider } from "../i18n/LanguageContext";

const topics: Topic[] = [
  { id: "segmentation", group: "discriminative", title: "Image Segmentation", status: "available" },
  { id: "classification", group: "discriminative", title: "Image Classification", status: "coming-soon" },
  { id: "synthesis", group: "generative", title: "Image Synthesis", status: "coming-soon" },
];

/** Render a node in a deterministic English language context. */
function renderEn(node: ReactElement) {
  return render(<LanguageProvider initialLang="en">{node}</LanguageProvider>);
}

describe("Sidebar", () => {
  it("renders group headers and topic titles", () => {
    renderEn(<Sidebar topics={topics} activeId="segmentation" onSelect={() => {}} />);

    expect(screen.getByText("Discriminative (classical)")).toBeInTheDocument();
    expect(screen.getByText("Generative")).toBeInTheDocument();
    expect(screen.getByText("Image Segmentation")).toBeInTheDocument();
    expect(screen.getByText("Image Classification")).toBeInTheDocument();
    expect(screen.getByText("Image Synthesis")).toBeInTheDocument();
  });

  it("disables coming-soon topics", () => {
    renderEn(<Sidebar topics={topics} activeId="segmentation" onSelect={() => {}} />);

    const comingSoon = screen.getByRole("button", { name: /Image Classification/ });
    expect(comingSoon).toBeDisabled();
  });

  it("calls onSelect with the id when an available topic is clicked", async () => {
    const onSelect = vi.fn();
    renderEn(<Sidebar topics={topics} activeId="classification" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /Image Segmentation/ }));

    expect(onSelect).toHaveBeenCalledWith("segmentation");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Topic } from "../types/topic";
import { Sidebar } from "./Sidebar";

const topics: Topic[] = [
  { id: "segmentation", group: "discriminative", title: "Image Segmentation", status: "available" },
  { id: "classification", group: "discriminative", title: "Image Classification", status: "coming-soon" },
  { id: "synthesis", group: "generative", title: "Image Synthesis", status: "coming-soon" },
];

describe("Sidebar", () => {
  it("renders group headers and topic titles", () => {
    render(<Sidebar topics={topics} activeId="segmentation" onSelect={() => {}} />);

    expect(screen.getByText("Discriminative (classical)")).toBeInTheDocument();
    expect(screen.getByText("Generative")).toBeInTheDocument();
    expect(screen.getByText("Image Segmentation")).toBeInTheDocument();
    expect(screen.getByText("Image Classification")).toBeInTheDocument();
    expect(screen.getByText("Image Synthesis")).toBeInTheDocument();
  });

  it("disables coming-soon topics", () => {
    render(<Sidebar topics={topics} activeId="segmentation" onSelect={() => {}} />);

    const comingSoon = screen.getByRole("button", { name: /Image Classification/ });
    expect(comingSoon).toBeDisabled();
  });

  it("calls onSelect with the id when an available topic is clicked", async () => {
    const onSelect = vi.fn();
    render(<Sidebar topics={topics} activeId="classification" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /Image Segmentation/ }));

    expect(onSelect).toHaveBeenCalledWith("segmentation");
  });
});

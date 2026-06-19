import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionNav } from "./SectionNav";

const sections = [
  { id: "dice", title: "Dice Coefficient" },
  { id: "iou", title: "Intersection over Union" },
  { id: "hd95", title: "Hausdorff 95" },
];

describe("SectionNav", () => {
  it("renders a button per section title", () => {
    render(<SectionNav sections={sections} onJump={() => {}} />);

    for (const section of sections) {
      expect(screen.getByRole("button", { name: section.title })).toBeInTheDocument();
    }
  });

  it("calls onJump with the section id when a section button is clicked", async () => {
    const onJump = vi.fn();
    render(<SectionNav sections={sections} onJump={onJump} />);

    await userEvent.click(screen.getByRole("button", { name: "Intersection over Union" }));

    expect(onJump).toHaveBeenCalledWith("iou");
  });

  it("marks the active section button as the current location", () => {
    render(<SectionNav sections={sections} activeId="hd95" onJump={() => {}} />);

    expect(screen.getByRole("button", { name: "Hausdorff 95" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });
});

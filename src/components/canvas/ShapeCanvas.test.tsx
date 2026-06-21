import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShapeCanvas } from "./ShapeCanvas";
import { makeGrid } from "../../engine/raster/grid";
import type { Shape } from "../../types/engine";

const grid = makeGrid(16, 16, [1, 1]);

const gt: Shape[] = [{ kind: "circle", cx: 5, cy: 5, r: 3 }];
const predictions = [
  { id: "A" as const, shapes: [{ kind: "box", x: 4, y: 4, w: 4, h: 4 }] as Shape[] },
  { id: "B" as const, shapes: [{ kind: "circle", cx: 6, cy: 6, r: 2 }] as Shape[] },
];

describe("ShapeCanvas", () => {
  it("renders a canvas with the given ariaLabel", () => {
    render(
      <ShapeCanvas
        grid={grid}
        gt={gt}
        predictions={predictions}
        ariaLabel="Scenario preview"
      />,
    );
    expect(screen.getByLabelText("Scenario preview")).toBeInTheDocument();
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("does not throw under jsdom with a sample gt + predictions", () => {
    expect(() =>
      render(
        <ShapeCanvas
          grid={grid}
          gt={gt}
          predictions={predictions}
          visibleLayers={["GT", "A", "B"]}
          ariaLabel="미리보기"
        />,
      ),
    ).not.toThrow();
  });
});

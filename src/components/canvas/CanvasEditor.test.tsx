import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasEditor } from "./CanvasEditor";
import { makeGrid } from "../../engine/raster/grid";
import type { Shape } from "../../types/engine";

const grid = makeGrid(16, 16, [1, 1]);

describe("CanvasEditor", () => {
  it("renders a canvas element", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders the toolbar buttons", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /circle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /box/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders a layer selector with GT / A / B options", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "GT" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
  });

  it("appends a circle to the active layer when add-circle is clicked", () => {
    const onChange = vi.fn();
    const existing: Shape[] = [{ kind: "box", x: 1, y: 1, w: 2, h: 2 }];
    render(
      <CanvasEditor
        grid={grid}
        gt={existing}
        predictions={[]}
        activeLayer="GT"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /circle/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [layer, shapes] = onChange.mock.calls[0];
    expect(layer).toBe("GT");
    expect(shapes).toHaveLength(existing.length + 1);
    expect(shapes[0]).toEqual(existing[0]);
    expect(shapes[shapes.length - 1].kind).toBe("circle");
  });

  it("appends a box to the active layer when add-box is clicked", () => {
    const onChange = vi.fn();
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[{ id: "A", shapes: [] }]}
        activeLayer="A"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /box/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [layer, shapes] = onChange.mock.calls[0];
    expect(layer).toBe("A");
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe("box");
  });
});

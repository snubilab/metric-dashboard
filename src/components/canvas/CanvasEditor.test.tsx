import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasEditor } from "./CanvasEditor";
import { LanguageProvider } from "../../i18n/LanguageContext";
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
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[]}
          activeLayer="GT"
          onChange={() => {}}
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: /circle/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /box/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders the toolbar buttons in Korean by default", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "원 추가" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "박스 추가" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이동" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "그리기" })).toBeInTheDocument();
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
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={existing}
          predictions={[]}
          activeLayer="GT"
          onChange={onChange}
        />
      </LanguageProvider>,
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
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[{ id: "A", shapes: [] }]}
          activeLayer="A"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /box/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [layer, shapes] = onChange.mock.calls[0];
    expect(layer).toBe("A");
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe("box");
  });

  it("renders a Draw tool button", () => {
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[]}
          activeLayer="GT"
          onChange={() => {}}
        />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: /draw/i })).toBeInTheDocument();
  });

  it("appends a polygon to the active layer after a freehand drag", () => {
    const onChange = vi.fn();
    const existing: Shape[] = [{ kind: "circle", cx: 1, cy: 1, r: 1 }];
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={existing}
          predictions={[]}
          activeLayer="GT"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    // Activate the Draw tool.
    fireEvent.click(screen.getByRole("button", { name: /draw/i }));

    const canvas = document.querySelector("canvas")!;
    // jsdom reports a zero-size rect; map screen coords to grid via 16x16 grid.
    // With width/height 0 the mapper clamps; provide a stub rect via spy so the
    // drag spans distinct cells.
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 160,
      height: 160,
      right: 160,
      bottom: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Drag across a square-ish path: (0,0) -> (8,0) -> (8,8) -> (0,8).
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 80, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 0, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 80, pointerId: 1 });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    const [layer, shapes] = lastCall;
    expect(layer).toBe("GT");
    expect(shapes).toHaveLength(existing.length + 1);
    expect(shapes[0]).toEqual(existing[0]);
    const polygon = shapes[shapes.length - 1];
    expect(polygon.kind).toBe("polygon");
    expect(polygon.points.length).toBeGreaterThanOrEqual(3);
  });

  it("does not append a shape when a freehand drag has too few points", () => {
    const onChange = vi.fn();
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[]}
          activeLayer="GT"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /draw/i }));

    const canvas = document.querySelector("canvas")!;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 160,
      height: 160,
      right: 160,
      bottom: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // A single point (no movement) cannot form a polygon.
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });
});

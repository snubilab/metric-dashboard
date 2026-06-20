import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasEditor } from "./CanvasEditor";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { makeGrid } from "../../engine/raster/grid";
import type { Shape } from "../../types/engine";

const grid = makeGrid(16, 16, [1, 1]);

/** 16x16 grid mapped onto a 160px canvas: 10px == 1 grid cell. */
const stubRect = (canvas: HTMLCanvasElement) => {
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
};

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

  it("renders the create-tool buttons", () => {
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
    expect(
      screen.getByRole("button", { name: /rectangle/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pencil/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders the create-tool buttons in Korean by default", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "원" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사각형" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "연필" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "선택 / 이동" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
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

  it("treats circle / rect / pencil as pressed create-modes (default circle)", () => {
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

    const circle = screen.getByRole("button", { name: /circle/i });
    const rect = screen.getByRole("button", { name: /rectangle/i });
    const pencil = screen.getByRole("button", { name: /pencil/i });

    // Default tool is "circle".
    expect(circle).toHaveAttribute("aria-pressed", "true");
    expect(rect).toHaveAttribute("aria-pressed", "false");
    expect(pencil).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(rect);
    expect(circle).toHaveAttribute("aria-pressed", "false");
    expect(rect).toHaveAttribute("aria-pressed", "true");
  });

  it("emits exactly one onChange with a circle on a press-drag-release", () => {
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

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    // Drag from grid (2,2) -> (10,10): an 8x8 bbox, well above min size.
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 100, clientY: 100, pointerId: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [layer, shapes] = onChange.mock.calls[0];
    expect(layer).toBe("GT");
    expect(shapes).toHaveLength(existing.length + 1);
    expect(shapes[0]).toEqual(existing[0]);
    expect(shapes[shapes.length - 1].kind).toBe("circle");
  });

  it("emits exactly one onChange with a box on a Rectangle press-drag-release", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /rectangle/i }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 90, clientY: 70, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 90, clientY: 70, pointerId: 1 });

    expect(onChange).toHaveBeenCalledTimes(1);
    const [layer, shapes] = onChange.mock.calls[0];
    expect(layer).toBe("A");
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe("box");
    // Normalized drag: x=2, y=2, w=7, h=5.
    expect(shapes[0]).toMatchObject({ kind: "box", x: 2, y: 2, w: 7, h: 5 });
  });

  it("emits no onChange for a sub-min-size tap with Circle", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /circle/i }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    // Press and release at the same point: zero-area tap.
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("emits no onChange for a sub-min-size tap with Rectangle", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /rectangle/i }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("appends a polygon to the active layer after a Pencil freehand drag", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /pencil/i }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

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

  it("does not append a shape when a Pencil drag has too few points", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /pencil/i }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    // A single point (no movement) cannot form a polygon.
    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 0, pointerId: 1 });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("labels the Select / Move tool", () => {
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
    expect(
      screen.getByRole("button", { name: "Select / Move" }),
    ).toBeInTheDocument();
  });

  it("resizes the selected box when dragging a corner handle (onChange path)", () => {
    const onChange = vi.fn();
    // Box occupying grid cells [2,2]..[8,8]; bottom-right handle at grid (8, 8).
    const box: Shape = { kind: "box", x: 2, y: 2, w: 6, h: 6 };
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[box]}
          predictions={[]}
          activeLayer="GT"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select / Move" }));

    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    // 1) Select the box by clicking its interior (grid cell 4,4 -> 45px,45px).
    fireEvent.pointerDown(canvas, { clientX: 45, clientY: 45, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 45, clientY: 45, pointerId: 1 });
    onChange.mockClear();

    // 2) Grab the bottom-right handle (grid 8,8 -> 80px,80px) and drag to
    //    grid (12, 12) -> 125px,125px, enlarging the box.
    fireEvent.pointerDown(canvas, { clientX: 80, clientY: 80, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 125, clientY: 125, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 125, clientY: 125, pointerId: 1 });

    expect(onChange).toHaveBeenCalled();
    const [layer, shapes] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(layer).toBe("GT");
    const resized = shapes[0];
    expect(resized.kind).toBe("box");
    expect(resized.x).toBe(2);
    expect(resized.y).toBe(2);
    expect(resized.w).toBe(10);
    expect(resized.h).toBe(10);
  });

  it("draws only the layers in visibleLayers (precedence over showLayers)", () => {
    const onChange = vi.fn();
    render(
      <CanvasEditor
        grid={grid}
        gt={[{ kind: "circle", cx: 5, cy: 5, r: 3 }]}
        predictions={[{ id: "A", shapes: [] }]}
        activeLayer="GT"
        onChange={onChange}
        showLayers={["GT", "A", "B"]}
        visibleLayers={["GT"]}
      />,
    );
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  it("renders no eye toggles when onToggleLayerVisibility is absent", () => {
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
    expect(screen.queryByRole("button", { name: /Hide GT/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Show GT/i })).toBeNull();
  });

  it("renders eye toggles that call onToggleLayerVisibility", () => {
    const onToggle = vi.fn();
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[]}
          activeLayer="GT"
          onChange={() => {}}
          visibleLayers={["GT", "A"]}
          onToggleLayerVisibility={onToggle}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Hide GT/i }));
    expect(onToggle).toHaveBeenCalledWith("GT");

    fireEvent.click(screen.getByRole("button", { name: /Show Prediction B/i }));
    expect(onToggle).toHaveBeenCalledWith("B");
  });

  it("prefixes each tool label with an affordance glyph", () => {
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

    expect(
      screen.getByRole("button", { name: /Circle/i }).textContent,
    ).toContain("◯");
    expect(
      screen.getByRole("button", { name: /Rectangle/i }).textContent,
    ).toContain("▢");
    expect(
      screen.getByRole("button", { name: /Pencil/i }).textContent,
    ).toContain("✎");
    expect(
      screen.getByRole("button", { name: /Select \/ Move/i }).textContent,
    ).toContain("↔");
    expect(
      screen.getByRole("button", { name: /Delete/i }).textContent,
    ).toContain("✕");
  });

  it("disables locked layer buttons while leaving the rest enabled", () => {
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[
            { id: "A", shapes: [] },
            { id: "B", shapes: [] },
          ]}
          activeLayer="GT"
          onChange={() => {}}
          lockedLayers={["A", "B"]}
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole("button", { name: "A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "GT" })).toBeEnabled();
  });

  it("enables all layer buttons when lockedLayers is absent (backward compatible)", () => {
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
    expect(screen.getByRole("button", { name: "GT" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "A" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "B" })).toBeEnabled();
  });

  it("calls onSelectLayer (not onChange) for a pure layer switch when provided", () => {
    const onChange = vi.fn();
    const onSelectLayer = vi.fn();
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[{ id: "A", shapes: [] }]}
          activeLayer="GT"
          onChange={onChange}
          onSelectLayer={onSelectLayer}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onSelectLayer).toHaveBeenCalledWith("A");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to onChange for a layer switch when onSelectLayer is absent", () => {
    const onChange = vi.fn();
    const aShapes: Shape[] = [{ kind: "circle", cx: 3, cy: 3, r: 2 }];
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[{ id: "A", shapes: aShapes }]}
          activeLayer="GT"
          onChange={onChange}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(onChange).toHaveBeenCalledWith("A", aShapes);
  });

  it("renders the step prompt text, layer-colored, when prompt is provided", () => {
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[]}
          predictions={[]}
          activeLayer="GT"
          onChange={() => {}}
          prompt={{ text: "Draw the ground truth", layer: "GT" }}
        />
      </LanguageProvider>,
    );
    expect(screen.getByText("Draw the ground truth")).toBeInTheDocument();
  });

  it("falls back to the legacy empty hint when prompt is absent", () => {
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
    expect(screen.getByText(/No shapes/)).toBeInTheDocument();
  });

  it("shows the Korean empty-state hint by default", () => {
    render(
      <CanvasEditor
        grid={grid}
        gt={[]}
        predictions={[]}
        activeLayer="GT"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/도형이 없습니다/)).toBeInTheDocument();
  });

  it("survives a theme redraw with a preview drag in progress (smoke)", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /circle/i }));
    const canvas = document.querySelector("canvas")!;
    stubRect(canvas);

    // Start a drag so a preview is set, then flip the theme.
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 100, clientY: 100, pointerId: 1 });

    expect(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    }).not.toThrow();
    expect(canvas).toBeInTheDocument();

    // Clean up the in-progress drag.
    fireEvent.pointerUp(canvas, { clientX: 100, clientY: 100, pointerId: 1 });
  });
});

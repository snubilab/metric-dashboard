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
    expect(screen.getByRole("button", { name: "선택 / 이동" })).toBeInTheDocument();
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

  const stubRect = (canvas: HTMLCanvasElement) => {
    // 16x16 grid mapped onto a 160px canvas: 10px == 1 grid cell.
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
    // Anchored top-left stays at (2,2); corner moved to (12,12): w=h=10.
    expect(resized.x).toBe(2);
    expect(resized.y).toBe(2);
    expect(resized.w).toBe(10);
    expect(resized.h).toBe(10);
  });

  it("draws only the layers in visibleLayers (precedence over showLayers)", () => {
    // Smoke test: with visibleLayers set, rendering must not throw and the
    // canvas must still mount. getContext returns null under jsdom, so we only
    // assert the component renders without error.
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

    // GT and A are visible -> "Hide ..." ; B is hidden -> "Show ...".
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

    // The glyph spans are aria-hidden, so partial text still resolves the
    // accessible name; the glyph itself must be present in the button text.
    expect(screen.getByRole("button", { name: /Add circle/i }).textContent).toContain("◯");
    expect(screen.getByRole("button", { name: /Add box/i }).textContent).toContain("▢");
    expect(screen.getByRole("button", { name: /Draw/i }).textContent).toContain("✎");
    expect(screen.getByRole("button", { name: /Select \/ Move/i }).textContent).toContain("↔");
    expect(screen.getByRole("button", { name: /Delete/i }).textContent).toContain("✕");
  });

  it("marks the selected mode tool as active (aria-pressed)", () => {
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

    const drawButton = screen.getByRole("button", { name: /Draw/i });
    const moveButton = screen.getByRole("button", { name: /Select \/ Move/i });

    // Initial tool is "circle" (a momentary action), so no mode tool is pressed.
    expect(drawButton).toHaveAttribute("aria-pressed", "false");
    expect(moveButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(drawButton);
    expect(drawButton).toHaveAttribute("aria-pressed", "true");
    expect(moveButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(moveButton);
    expect(moveButton).toHaveAttribute("aria-pressed", "true");
    expect(drawButton).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps add-circle / add-box as momentary actions (no pressed state)", () => {
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

    // Momentary action buttons never expose a persistent active state.
    expect(
      screen.getByRole("button", { name: /Add circle/i }),
    ).not.toHaveAttribute("aria-pressed");
    expect(
      screen.getByRole("button", { name: /Add box/i }),
    ).not.toHaveAttribute("aria-pressed");
  });

  it("shows the empty-state hint when the active layer has no shapes", () => {
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
    expect(screen.getByText(/No shapes — start with "Add circle"\./)).toBeInTheDocument();
  });

  it("hides the empty-state hint once a shape exists", () => {
    render(
      <LanguageProvider initialLang="en">
        <CanvasEditor
          grid={grid}
          gt={[{ kind: "circle", cx: 5, cy: 5, r: 3 }]}
          predictions={[]}
          activeLayer="GT"
          onChange={() => {}}
        />
      </LanguageProvider>,
    );
    expect(screen.queryByText(/No shapes/)).toBeNull();
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
    expect(
      screen.getByText('도형이 없습니다 — "원 추가"로 시작하세요'),
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DetectionCanvas } from "./DetectionCanvas";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { makeGrid } from "../../engine/raster/grid";
import type { DetBox } from "../../types/engine";

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

function renderCanvas(props: Partial<React.ComponentProps<typeof DetectionCanvas>> = {}) {
  const onChangeGt = vi.fn();
  const onChangePreds = vi.fn();
  render(
    <LanguageProvider initialLang="en">
      <DetectionCanvas
        grid={grid}
        gt={[]}
        preds={[]}
        activeLayer="GT"
        iouThreshold={0.5}
        confidenceThreshold={0}
        onChangeGt={onChangeGt}
        onChangePreds={onChangePreds}
        {...props}
      />
    </LanguageProvider>,
  );
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  stubRect(canvas);
  return { canvas, onChangeGt, onChangePreds };
}

describe("DetectionCanvas", () => {
  it("mounts under jsdom and renders the box tool + canvas aria-label", () => {
    const { canvas } = renderCanvas();
    expect(canvas).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /box/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/detection editor/i)).toBeInTheDocument();
  });

  it("GT stage: a press-drag emits one onChangeGt with one box and NO confidence", () => {
    const { canvas, onChangeGt, onChangePreds } = renderCanvas({ activeLayer: "GT" });

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 90, clientY: 90, pointerId: 1 });

    expect(onChangeGt).toHaveBeenCalledTimes(1);
    expect(onChangePreds).not.toHaveBeenCalled();
    const next: DetBox[] = onChangeGt.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0].confidence).toBeUndefined();
  });

  it("PRED stage: a press-drag emits one onChangePreds with confidence 0.50", () => {
    const { canvas, onChangeGt, onChangePreds } = renderCanvas({
      activeLayer: "PRED",
      gt: [{ x: 1, y: 1, w: 4, h: 4 }],
    });

    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 90, clientY: 90, pointerId: 1 });

    expect(onChangePreds).toHaveBeenCalledTimes(1);
    expect(onChangeGt).not.toHaveBeenCalled();
    const next: DetBox[] = onChangePreds.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0].confidence).toBe(0.5);
  });

  it("a sub-min-size tap emits no onChange", () => {
    const { canvas, onChangeGt } = renderCanvas({ activeLayer: "GT" });
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    expect(onChangeGt).not.toHaveBeenCalled();
  });

  it("selecting a PRED box with move tool shows a confidence slider that calls withConfidence", () => {
    const preds: DetBox[] = [{ x: 2, y: 2, w: 6, h: 6, confidence: 0.5 }];
    const { canvas, onChangePreds } = renderCanvas({
      activeLayer: "PRED",
      gt: [{ x: 2, y: 2, w: 6, h: 6 }],
      preds,
    });

    // Switch to the move tool, then click inside the box to select it.
    fireEvent.click(screen.getByRole("button", { name: /select \/ move/i }));
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });

    const slider = screen.getByLabelText(/confidence/i) as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.disabled).toBe(false);

    fireEvent.change(slider, { target: { value: "0.8" } });
    expect(onChangePreds).toHaveBeenCalled();
    const next: DetBox[] = onChangePreds.mock.calls.at(-1)![0];
    expect(next[0].confidence).toBeCloseTo(0.8);
    // Geometry unchanged.
    expect(next[0].x).toBe(2);
    expect(next[0].y).toBe(2);
    expect(next[0].w).toBe(6);
    expect(next[0].h).toBe(6);
  });

  it("a selected GT box shows a disabled, no-confidence state", () => {
    const { canvas } = renderCanvas({
      activeLayer: "GT",
      gt: [{ x: 2, y: 2, w: 6, h: 6 }],
    });

    fireEvent.click(screen.getByRole("button", { name: /select \/ move/i }));
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });

    const slider = screen.getByLabelText(/confidence/i) as HTMLInputElement;
    expect(slider.disabled).toBe(true);
  });

  it("onEditStart fires once on an actual move, never on a selection-only click", () => {
    // codex P3 regression: tapping a box with the move tool (to reveal its
    // confidence slider) must NOT push an undo snapshot; only a real mutation does.
    const onEditStart = vi.fn();
    const { canvas } = renderCanvas({
      activeLayer: "PRED",
      gt: [{ x: 2, y: 2, w: 6, h: 6 }],
      preds: [{ x: 2, y: 2, w: 6, h: 6, confidence: 0.5 }],
      onEditStart,
    });
    fireEvent.click(screen.getByRole("button", { name: /select \/ move/i }));

    // Selection-only click (no movement) → no snapshot.
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    expect(onEditStart).not.toHaveBeenCalled();

    // An actual drag (with deltas) snapshots exactly once for the whole gesture.
    fireEvent.pointerDown(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 70, clientY: 70, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 90, clientY: 90, pointerId: 1 });
    expect(onEditStart).toHaveBeenCalledTimes(1);
  });

  it("a locked layer renders its layer button disabled but never hidden", () => {
    renderCanvas({ activeLayer: "GT", lockedLayers: ["PRED"] });
    const predButton = screen.getByRole("button", { name: /predictions \(PRED\)/i });
    expect(predButton).toBeInTheDocument();
    expect(predButton).toBeDisabled();
    expect(predButton).toHaveAttribute("aria-disabled", "true");
  });

  it("theme switch triggers a redraw without error", () => {
    renderCanvas({ gt: [{ x: 1, y: 1, w: 4, h: 4 }] });
    expect(() => {
      act(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });
    }).not.toThrow();
  });
});

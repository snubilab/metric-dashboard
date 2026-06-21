import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ScenariosView } from "./ScenariosView";
import type { DegeneratePolicy, Vec2 } from "../types/engine";
import type { Scenario, Topic } from "../types/topic";

const GRID = { width: 256, height: 256, spacingMm: [1, 1] as Vec2 };
const POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

/** A segmentation scenario: GT + two predictions, no `detections`. */
const segScenario: Scenario = {
  id: "seg",
  title: "Segmentation scenario",
  clinical: {
    situation: "situation",
    modality: "MRI",
    atStake: "stake",
    consequence: "consequence",
  },
  state: {
    grid: GRID,
    gt: [{ kind: "circle", cx: 128, cy: 128, r: 20 }],
    predictions: [
      { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 22 }] },
      { id: "B", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 18 }] },
    ],
    policy: POLICY,
    nsdToleranceMm: 2,
  },
  teachingPoint: "teaching",
};

/** A sparse segmentation scenario: only Prediction A is present. */
const sparseScenario: Scenario = {
  ...segScenario,
  id: "sparse",
  title: "Sparse scenario",
  state: {
    ...segScenario.state,
    predictions: [
      { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 22 }] },
    ],
  },
};

/** A detection scenario carries `detections` and must keep the DetectionBoard. */
const detScenario: Scenario = {
  id: "det",
  title: "Detection scenario",
  clinical: {
    situation: "situation",
    modality: "CT",
    atStake: "stake",
    consequence: "consequence",
  },
  state: {
    grid: GRID,
    gt: [],
    predictions: [],
    policy: POLICY,
    detections: {
      gtObjects: [{ x: 10, y: 10, w: 20, h: 20 }],
      boxes: [{ x: 12, y: 12, w: 20, h: 20, confidence: 0.9 }],
    },
  },
  teachingPoint: "teaching",
};

function topicWith(scenarios: Scenario[]): Topic {
  return {
    id: "t",
    group: "discriminative",
    title: "Topic",
    status: "available",
    scenarios,
  };
}

function renderView(topic: Topic) {
  return render(
    <LanguageProvider initialLang="ko">
      <ScenariosView topic={topic} />
    </LanguageProvider>,
  );
}

/** Matches the bilingual ShapeCanvas accessible name (Korean default). */
const SHAPE_CANVAS_NAME = /분할 미리보기|Segmentation preview/;

describe("ScenariosView", () => {
  it("renders a ShapeCanvas AND the metric table for a segmentation scenario", () => {
    renderView(topicWith([segScenario]));

    const card = screen.getByRole("article");
    expect(
      within(card).getByRole("img", { name: SHAPE_CANVAS_NAME }),
    ).toBeInTheDocument();
    expect(within(card).getByRole("table")).toBeInTheDocument();
  });

  it("labels the shapes with a GT/A/B identity legend", () => {
    const { container } = renderView(topicWith([segScenario]));

    // The identity legend ties each shape colour to its name.
    expect(screen.getByText("정답(GT)")).toBeInTheDocument();
    const swatches = container.querySelectorAll("[data-swatch]");
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveStyle({ background: "var(--c-gt)" });
    expect(swatches[1]).toHaveStyle({ background: "var(--c-pred-a)" });
    expect(swatches[2]).toHaveStyle({ background: "var(--c-pred-b)" });
  });

  it("handles a sparse segmentation scenario with only Prediction A", () => {
    const { container } = renderView(topicWith([sparseScenario]));

    const card = screen.getByRole("article");
    // Still draws a canvas and never crashes with one prediction.
    expect(
      within(card).getByRole("img", { name: SHAPE_CANVAS_NAME }),
    ).toBeInTheDocument();
    // Legend labels only the present layers: GT + A, never an absent B.
    const swatches = container.querySelectorAll("[data-swatch]");
    const backgrounds = Array.from(swatches).map(
      (s) => (s as HTMLElement).style.background,
    );
    expect(backgrounds).toContain("var(--c-gt)");
    expect(backgrounds).toContain("var(--c-pred-a)");
    expect(backgrounds).not.toContain("var(--c-pred-b)");
  });

  it("keeps the DetectionBoard for a detection scenario without adding a ShapeCanvas", () => {
    renderView(topicWith([detScenario]));

    const card = screen.getByRole("article");
    // Detection cards show the DetectionBoard, not a read-only ShapeCanvas.
    expect(
      within(card).queryByRole("img", { name: SHAPE_CANVAS_NAME }),
    ).not.toBeInTheDocument();
    // The DetectionBoard exposes its confidence-threshold control.
    expect(within(card).getByLabelText("신뢰도 임계값")).toBeInTheDocument();
  });
});

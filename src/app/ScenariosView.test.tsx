import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageContext";
import { ScenariosView } from "./ScenariosView";
import reportGenerationTopic from "../topics/report-generation";
import type { DegeneratePolicy, Vec2 } from "../types/engine";
import type { Scenario, Topic } from "../types/topic";
import type { Lang } from "../i18n/LanguageContext";

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

/** A detection scenario with a second detector (boxesB) → renders the A-vs-B view.
 *  A is aggressive (hits both GT + a false box); B is conservative (one clean hit,
 *  misses the other GT) — so recall favors A and precision favors B (a rank flip). */
const detScenarioAB: Scenario = {
  ...detScenario,
  id: "det-ab",
  state: {
    ...detScenario.state,
    detections: {
      gtObjects: [
        { x: 10, y: 10, w: 20, h: 20 },
        { x: 100, y: 100, w: 20, h: 20 },
      ],
      boxes: [
        { x: 10, y: 10, w: 20, h: 20, confidence: 0.9 },
        { x: 100, y: 100, w: 20, h: 20, confidence: 0.8 },
        { x: 200, y: 50, w: 16, h: 16, confidence: 0.6 },
      ],
      boxesB: [{ x: 10, y: 10, w: 20, h: 20, confidence: 0.95 }],
    },
  },
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

function renderView(topic: Topic, lang: Lang = "ko") {
  return render(
    <LanguageProvider initialLang={lang}>
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

  it("renders a read-only detection preview AND metric table (unified with segmentation, no slider)", () => {
    renderView(topicWith([detScenario]));

    const card = screen.getByRole("article");
    // Detection cards now mirror segmentation: a read-only box-scene canvas...
    expect(
      within(card).getByRole("img", { name: /검출 미리보기|Detection preview/ }),
    ).toBeInTheDocument();
    // ...not the segmentation ShapeCanvas...
    expect(
      within(card).queryByRole("img", { name: SHAPE_CANVAS_NAME }),
    ).not.toBeInTheDocument();
    // ...plus a clean metric table...
    expect(within(card).getByRole("table")).toBeInTheDocument();
    // ...and, being read-only like the seg card, NO interactive threshold slider.
    expect(within(card).queryByLabelText("신뢰도 임계값")).not.toBeInTheDocument();
  });

  it("renders an A-vs-B detector comparison (two canvases + a rank-flip table) when a scenario has two detectors", () => {
    renderView(topicWith([detScenarioAB]));

    const card = screen.getByRole("article");
    // Two detector canvases, side by side — the thesis made visual.
    expect(within(card).getByRole("img", { name: /검출기 A|Detector A/ })).toBeInTheDocument();
    expect(within(card).getByRole("img", { name: /검출기 B|Detector B/ })).toBeInTheDocument();
    // The SAME A-vs-B comparison table segmentation uses.
    expect(within(card).getByRole("table")).toBeInTheDocument();
    // Read-only: no interactive slider.
    expect(within(card).queryByLabelText("신뢰도 임계값")).not.toBeInTheDocument();
    // The rank-flip marker fires: A and B win different metrics (recall vs precision).
    expect(within(card).getByText("순위 불일치")).toBeInTheDocument();
  });

  it("renders concrete report cue mismatch visuals for assertion, laterality, and temporal scenarios", () => {
    renderView(reportGenerationTopic, "en");

    const cardByTitle = (name: RegExp) =>
      screen.getByRole("heading", { name }).closest("article") as HTMLElement;

    expect(
      within(cardByTitle(/Negation hallucination/)).getAllByText(/assertion: extra .*present/).length,
    ).toBeGreaterThan(0);
    expect(
      within(cardByTitle(/Laterality swap/)).getAllByText("laterality: missing right").length,
    ).toBeGreaterThan(0);
    expect(
      within(cardByTitle(/Temporal direction/)).getAllByText("temporal: extra worsened").length,
    ).toBeGreaterThan(0);
  });

  it("keeps the Korean report-generation scenarios tab at seven cards", () => {
    renderView(reportGenerationTopic, "ko");

    expect(screen.getAllByRole("article")).toHaveLength(7);
  });
});

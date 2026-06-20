import { describe, expect, it } from "vitest";
import type { EngineState, Shape } from "../../types/engine";
import {
  flowStage,
  lockedLayersFor,
  stageLayer,
  stageStep,
  type FlowStage,
} from "./flowStage";

/** A trivial committed shape used purely to make a layer "non-empty". */
const aCircle: Shape = { kind: "circle", cx: 5, cy: 5, r: 5 };

/**
 * Build a minimal state slice for flowStage. By default both predictions exist
 * with the supplied shapes; `predictions` can be overridden to omit an entry.
 */
function makeState(
  gt: Shape[],
  a: Shape[],
  b: Shape[],
): Pick<EngineState, "gt" | "predictions"> {
  return {
    gt,
    predictions: [
      { id: "A", shapes: a },
      { id: "B", shapes: b },
    ],
  };
}

describe("flowStage", () => {
  it("should return 'gt' when GT, A and B are all empty", () => {
    // Arrange
    const state = makeState([], [], []);

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("gt");
  });

  it("should return 'a' when GT has a shape but A and B are empty", () => {
    // Arrange
    const state = makeState([aCircle], [], []);

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("a");
  });

  it("should return 'b' when GT and A have shapes but B is empty", () => {
    // Arrange
    const state = makeState([aCircle], [aCircle], []);

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("b");
  });

  it("should return 'compare' when GT, A and B all have shapes", () => {
    // Arrange
    const state = makeState([aCircle], [aCircle], [aCircle]);

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("compare");
  });

  it("should treat a missing 'A' prediction entry as empty -> 'a' when GT present", () => {
    // Arrange — predictions has no 'A' entry at all.
    const state: Pick<EngineState, "gt" | "predictions"> = {
      gt: [aCircle],
      predictions: [{ id: "B", shapes: [] }],
    };

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("a");
  });

  it("should return 'compare' for a fully-loaded preset state", () => {
    // Arrange — a loaded preset has all three layers non-empty.
    const state: Pick<EngineState, "gt" | "predictions"> = {
      gt: [{ kind: "box", x: 1, y: 1, w: 10, h: 10 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 6, cy: 6, r: 4 }] },
        { id: "B", shapes: [{ kind: "polygon", points: [[0, 0], [9, 0], [9, 9]] }] },
      ],
    };

    // Act
    const stage = flowStage(state);

    // Assert
    expect(stage).toBe("compare");
  });
});

describe("stageLayer", () => {
  it("should map 'gt' -> 'GT'", () => {
    expect(stageLayer("gt")).toBe("GT");
  });

  it("should map 'a' -> 'A'", () => {
    expect(stageLayer("a")).toBe("A");
  });

  it("should map 'b' -> 'B'", () => {
    expect(stageLayer("b")).toBe("B");
  });

  it("should map 'compare' -> null (user-chosen layer)", () => {
    expect(stageLayer("compare")).toBeNull();
  });
});

describe("lockedLayersFor", () => {
  it("should lock A and B at stage 'gt'", () => {
    expect(lockedLayersFor("gt")).toEqual(["A", "B"]);
  });

  it("should lock only B at stage 'a'", () => {
    expect(lockedLayersFor("a")).toEqual(["B"]);
  });

  it("should lock nothing at stage 'b'", () => {
    expect(lockedLayersFor("b")).toEqual([]);
  });

  it("should lock nothing at stage 'compare'", () => {
    expect(lockedLayersFor("compare")).toEqual([]);
  });
});

describe("stageStep", () => {
  it("should map 'gt' -> 1", () => {
    expect(stageStep("gt")).toBe(1);
  });

  it("should map 'a' -> 2", () => {
    expect(stageStep("a")).toBe(2);
  });

  it("should map 'b' -> 3", () => {
    expect(stageStep("b")).toBe(3);
  });

  it("should map 'compare' -> 3 (caps at 3)", () => {
    expect(stageStep("compare")).toBe(3);
  });
});

describe("FlowStage type", () => {
  it("should accept the four known stage values", () => {
    // Arrange / Act — type-level assertion exercised at runtime.
    const stages: FlowStage[] = ["gt", "a", "b", "compare"];

    // Assert
    expect(stages).toHaveLength(4);
  });
});

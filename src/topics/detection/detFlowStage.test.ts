import { describe, expect, it } from "vitest";
import type { DetBox } from "../../types/engine";
import {
  detectionStage,
  lockedLayersFor,
  stageLayer,
  stageStep,
  type DetStage,
  type DetState,
} from "./detFlowStage";

/** A trivial ground-truth box (no confidence) used to make GT non-empty. */
const gtBox: DetBox = { x: 0, y: 0, w: 10, h: 10 };

/** A trivial predicted box (born with a confidence) to make preds non-empty. */
const predBox: DetBox = { x: 0, y: 0, w: 10, h: 10, confidence: 0.5 };

/** Build a minimal drawn-state slice for detectionStage. */
function makeState(gt: DetBox[], preds: DetBox[]): DetState {
  return { gt, preds };
}

describe("detectionStage", () => {
  it("should return 'gt' when GT is empty", () => {
    // Arrange
    const state = makeState([], []);

    // Act
    const stage = detectionStage(state);

    // Assert
    expect(stage).toBe("gt");
  });

  it("should return 'preds' when GT is non-empty but preds is empty", () => {
    // Arrange
    const state = makeState([gtBox], []);

    // Act
    const stage = detectionStage(state);

    // Assert
    expect(stage).toBe("preds");
  });

  it("should return 'compare' when both GT and preds are non-empty", () => {
    // Arrange
    const state = makeState([gtBox], [predBox]);

    // Act
    const stage = detectionStage(state);

    // Assert
    expect(stage).toBe("compare");
  });

  it("should stay in 'gt' even when preds already has boxes but GT is empty", () => {
    // Arrange — GT empty is the dominant condition.
    const state = makeState([], [predBox]);

    // Act
    const stage = detectionStage(state);

    // Assert
    expect(stage).toBe("gt");
  });
});

describe("stageLayer", () => {
  it("should map 'gt' -> 'GT'", () => {
    expect(stageLayer("gt")).toBe("GT");
  });

  it("should map 'preds' -> 'PRED'", () => {
    expect(stageLayer("preds")).toBe("PRED");
  });

  it("should map 'compare' -> null (user-chosen layer)", () => {
    expect(stageLayer("compare")).toBeNull();
  });
});

describe("lockedLayersFor", () => {
  it("should lock PRED at stage 'gt'", () => {
    expect(lockedLayersFor("gt")).toEqual(["PRED"]);
  });

  it("should lock nothing at stage 'preds'", () => {
    expect(lockedLayersFor("preds")).toEqual([]);
  });

  it("should lock nothing at stage 'compare'", () => {
    expect(lockedLayersFor("compare")).toEqual([]);
  });
});

describe("stageStep", () => {
  it("should map 'gt' -> 1", () => {
    expect(stageStep("gt")).toBe(1);
  });

  it("should map 'preds' -> 2", () => {
    expect(stageStep("preds")).toBe(2);
  });

  it("should map 'compare' -> 2 (caps at 2)", () => {
    expect(stageStep("compare")).toBe(2);
  });
});

describe("DetStage type", () => {
  it("should accept the three known stage values", () => {
    // Arrange / Act — type-level assertion exercised at runtime.
    const stages: DetStage[] = ["gt", "preds", "compare"];

    // Assert
    expect(stages).toHaveLength(3);
  });
});

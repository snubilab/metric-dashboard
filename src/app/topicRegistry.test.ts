import { describe, expect, it } from "vitest";
import { TOPICS, orderedTopics } from "./topicRegistry";

describe("topicRegistry", () => {
  it("registers all nine topics", () => {
    expect(TOPICS.length).toBe(9);
  });

  it("marks classification, regression, segmentation, and detection as available", () => {
    const available = TOPICS.filter((t) => t.status === "available").map((t) => t.id).sort();
    expect(available).toEqual(["classification", "detection", "regression", "segmentation"]);
  });

  it("orders the discriminative group as classification, regression, segmentation, detection", () => {
    const discriminativeIds = orderedTopics()
      .filter((t) => t.group === "discriminative")
      .map((t) => t.id);
    expect(discriminativeIds).toEqual([
      "classification",
      "regression",
      "segmentation",
      "detection",
    ]);
  });
});

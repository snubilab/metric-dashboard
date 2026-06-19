import { describe, it, expect } from "vitest";
import { segmentationLearn } from "./content";

/** Collect the section ids declared in the segmentation learn content. */
function sectionIds(): string[] {
  return segmentationLearn.sections.map((s) => s.id);
}

describe("segmentationLearn content", () => {
  it("has a non-empty intro", () => {
    expect(segmentationLearn.intro.trim().length).toBeGreaterThan(0);
  });

  it("includes one section per required metric id", () => {
    const ids = sectionIds();
    for (const required of [
      "dice",
      "iou",
      "sensitivity",
      "precision",
      "hd95",
      "assd",
      "nsd",
      "volume",
      "lesionwise",
      "cldice",
    ]) {
      expect(ids).toContain(required);
    }
  });

  it("gives every section a title, meaning, features, and caveats", () => {
    for (const section of segmentationLearn.sections) {
      expect(section.title.trim().length).toBeGreaterThan(0);
      expect(section.meaning.trim().length).toBeGreaterThan(0);
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.caveats.length).toBeGreaterThan(0);
    }
  });

  it("attaches the dice-overlap mini-sim to the dice section", () => {
    const dice = segmentationLearn.sections.find((s) => s.id === "dice");
    expect(dice?.miniSim?.kind).toBe("dice-overlap");
    expect(dice?.miniSim?.spotlightMetric).toBe("dice");
  });

  it("attaches the hd95-stray-fp mini-sim to the hd95 section", () => {
    const hd95 = segmentationLearn.sections.find((s) => s.id === "hd95");
    expect(hd95?.miniSim?.kind).toBe("hd95-stray-fp");
  });

  it("attaches the nsd-tolerance mini-sim to the nsd section", () => {
    const nsd = segmentationLearn.sections.find((s) => s.id === "nsd");
    expect(nsd?.miniSim?.kind).toBe("nsd-tolerance");
  });

  it("attaches the lesionwise-missed mini-sim to the lesionwise section", () => {
    const lesionwise = segmentationLearn.sections.find((s) => s.id === "lesionwise");
    expect(lesionwise?.miniSim?.kind).toBe("lesionwise-missed");
  });

  it("attaches the dice-iou-relation mini-sim to the iou section", () => {
    const iou = segmentationLearn.sections.find((s) => s.id === "iou");
    expect(iou?.miniSim?.kind).toBe("dice-iou-relation");
  });

  it("builds valid 256x256 initial states for every mini-sim", () => {
    for (const section of segmentationLearn.sections) {
      const sim = section.miniSim;
      if (!sim) continue;
      const { grid, gt, predictions, policy } = sim.initialState;
      expect(grid.width).toBe(256);
      expect(grid.height).toBe(256);
      expect(grid.spacingMm).toEqual([1, 1]);
      expect(gt.length).toBeGreaterThan(0);
      expect(predictions.length).toBeGreaterThan(0);
      expect(policy.emptyDice).toBe("one");
      expect(policy.emptyDistance).toBe("undefined");
    }
  });
});

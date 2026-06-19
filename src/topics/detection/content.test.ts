import { describe, it, expect } from "vitest";
import { detectionLearn } from "./content";

describe("detectionLearn content", () => {
  const ids = detectionLearn.sections.map((s) => s.id);
  const byId = (id: string) =>
    detectionLearn.sections.find((s) => s.id === id);

  it("includes every required detection section id", () => {
    const required = [
      "matching",
      "precision",
      "recall",
      "f1",
      "ap",
      "map",
      "ap50",
      "ap75",
      "apRange",
      "froc",
      "sensAtFp",
    ];
    for (const id of required) {
      expect(ids).toContain(id);
    }
  });

  it("has a non-empty intro", () => {
    expect(detectionLearn.intro.length).toBeGreaterThan(0);
  });

  it("gives the AP section the ap-reorder mini-sim", () => {
    expect(byId("ap")?.miniSim?.kind).toBe("ap-reorder");
  });

  it("gives the FROC section the froc-add-fp mini-sim", () => {
    expect(byId("froc")?.miniSim?.kind).toBe("froc-add-fp");
  });

  it("gives the matching section the matching-duplicate-fp mini-sim", () => {
    expect(byId("matching")?.miniSim?.kind).toBe("matching-duplicate-fp");
  });

  it("ships a valid minimal EngineState in every mini-sim", () => {
    for (const section of detectionLearn.sections) {
      if (!section.miniSim) continue;
      const state = section.miniSim.initialState;
      expect(state.grid.width).toBeGreaterThan(0);
      expect(state.grid.height).toBeGreaterThan(0);
      expect(state.policy).toBeDefined();
      expect(Array.isArray(state.gt)).toBe(true);
      expect(Array.isArray(state.predictions)).toBe(true);
    }
  });

  it("provides meaning, features, and caveats for every section", () => {
    for (const section of detectionLearn.sections) {
      expect(section.meaning.length).toBeGreaterThan(0);
      expect(section.features.length).toBeGreaterThan(0);
      expect(section.caveats.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from "vitest";
import type { DegeneratePolicy, EngineState, Mask } from "../../types/engine";
import { SEG_PRESETS, DEFAULT_PRESET_ID } from "./presets";
import { makeGrid } from "../../engine/raster/grid";
import { rasterize } from "../../engine/raster/rasterize";
import { dice } from "../../engine/metrics/overlap";
import { hd95 } from "../../engine/metrics/boundary";

const POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

/** Rasterize a layer's shapes onto the preset's own grid. */
function maskFor(state: EngineState, predId: "A" | "B"): Mask {
  const layer = state.predictions.find((p) => p.id === predId);
  return rasterize(state.grid, layer ? layer.shapes : []);
}

describe("SEG_PRESETS", () => {
  it("offers at least five presets", () => {
    expect(SEG_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("uses unique preset ids", () => {
    const ids = SEG_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names a default preset that exists", () => {
    expect(SEG_PRESETS.some((p) => p.id === DEFAULT_PRESET_ID)).toBe(true);
  });

  it.each(SEG_PRESETS)("preset $id has a valid engine state with GT and A/B", (preset) => {
    const { state } = preset;
    expect(preset.label.length).toBeGreaterThan(0);
    expect(preset.description.length).toBeGreaterThan(0);

    expect(state.grid.width).toBeGreaterThan(0);
    expect(state.grid.height).toBeGreaterThan(0);
    expect(state.gt.length).toBeGreaterThan(0);

    const ids = state.predictions.map((p) => p.id).sort();
    expect(ids).toEqual(["A", "B"]);
  });
});

describe("stray-FP preset metric contrast", () => {
  it("keeps B's Dice near A's while B's HD95 is much larger", () => {
    // Arrange
    const preset = SEG_PRESETS.find((p) => p.id === "stray-fp");
    expect(preset).toBeDefined();
    const state = preset!.state;
    const grid = makeGrid(state.grid.width, state.grid.height, state.grid.spacingMm);
    const gtMask = rasterize(grid, state.gt);
    const aMask = maskFor(state, "A");
    const bMask = maskFor(state, "B");

    // Act
    const diceA = dice(gtMask, aMask, POLICY);
    const diceB = dice(gtMask, bMask, POLICY);
    const hd95A = hd95(grid, gtMask, aMask, POLICY);
    const hd95B = hd95(grid, gtMask, bMask, POLICY);

    // Assert: overlap barely moves, boundary explodes.
    expect(Math.abs(diceB - diceA)).toBeLessThanOrEqual(0.15);
    expect(hd95B).toBeGreaterThan(hd95A + 20);
  });
});

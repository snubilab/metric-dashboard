import { describe, expect, it } from "vitest";
import { regressionMetrics } from "../../engine/metrics/regression";
import { REG_PRESETS } from "./presets";

describe("REG_PRESETS", () => {
  it("offers several numerically valid starting points", () => {
    expect(REG_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(REG_PRESETS.map((preset) => preset.id)).size).toBe(REG_PRESETS.length);

    for (const preset of REG_PRESETS) {
      expect(preset.label.trim().length).toBeGreaterThan(0);
      expect(preset.labelKo.trim().length).toBeGreaterThan(0);
      expect(preset.description.trim().length).toBeGreaterThan(0);
      expect(preset.descriptionKo.trim().length).toBeGreaterThan(0);
      expect(preset.points.length).toBeGreaterThanOrEqual(4);
      expect(Number.isFinite(regressionMetrics(preset.points).rmse)).toBe(true);
    }
  });

  it("includes an outlier preset where RMSE separates farther from MAE", () => {
    const preset = REG_PRESETS.find((item) => item.id === "one-outlier");
    expect(preset).toBeDefined();

    const metrics = regressionMetrics(preset?.points ?? []);
    expect(metrics.rmse - metrics.mae).toBeGreaterThan(1);
  });
});

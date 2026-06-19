/**
 * Hd95StrayFpSim — why HD spikes on a stray false positive while Dice barely moves.
 *
 * Ground truth and prediction are near-identical circles (high Dice). A slider
 * adds a small extra prediction blob whose distance from the main mass grows.
 * Shown side by side: Dice (barely moves — the stray blob is tiny), HD (jumps to
 * the full stray distance, an outlier-driven worst case), and HD95 (partially
 * absorbs the outlier, sitting between the two). HD95 is toned "warn" to flag it
 * as the spike-prone metric under scrutiny.
 *
 * All three values are computed live from the engine.
 */

import { useMemo, useState } from "react";
import type { Shape } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { rasterize } from "../../engine/raster/rasterize";
import { dice } from "../../engine/metrics/overlap";
import { hd, hd95 } from "../../engine/metrics/boundary";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle } from "./seedGeometry";

const FALLBACK = { cx: 40, cy: 64, r: 24 };
const STRAY_RADIUS = 3;
const MAX_STRAY_DISTANCE = 60;

export interface Hd95StrayFpSimProps {
  config: MiniSimConfig;
}

export default function Hd95StrayFpSim({ config }: Hd95StrayFpSimProps) {
  const seed = useMemo(() => gtCircle(config.initialState, FALLBACK), [config]);
  const grid = config.initialState.grid;
  const policy = config.initialState.policy;

  const [strayDistance, setStrayDistance] = useState(0);

  const { diceValue, hdValue, hd95Value } = useMemo(() => {
    const main: Shape = circleShape(seed);
    const gtMask = rasterize(grid, [main]);

    const predShapes: Shape[] = [main];
    if (strayDistance > 0) {
      const strayX = Math.min(grid.width - STRAY_RADIUS, seed.cx + seed.r + strayDistance);
      predShapes.push(circleShape({ cx: strayX, cy: seed.cy, r: STRAY_RADIUS }));
    }
    const predMask = rasterize(grid, predShapes);

    return {
      diceValue: dice(gtMask, predMask, policy),
      hdValue: hd(grid, gtMask, predMask, policy),
      hd95Value: hd95(grid, gtMask, predMask, policy),
    };
  }, [seed, grid, policy, strayDistance]);

  return (
    <WidgetCard
      title="Stray false positive: Dice vs HD vs HD95"
      caption="A near-perfect prediction with one tiny stray blob far away. Dice hardly notices the few extra pixels, but HD jumps to the full stray distance because it is the single worst point. HD95 absorbs part of the outlier, landing between the two."
    >
      <MetricStrip>
        <MetricCell metricKey="dice">
          <AnimatedMetric value={diceValue} label="Dice" decimals={3} />
        </MetricCell>
        <MetricCell metricKey="hd">
          <AnimatedMetric value={hdValue} label="HD" unit="mm" decimals={1} />
        </MetricCell>
        <MetricCell metricKey="hd95">
          <AnimatedMetric value={hd95Value} label="HD95" unit="mm" decimals={1} tone="warn" />
        </MetricCell>
      </MetricStrip>

      <Slider
        label="Stray FP distance (mm)"
        value={strayDistance}
        min={0}
        max={MAX_STRAY_DISTANCE}
        step={1}
        onChange={setStrayDistance}
        unit="mm"
      />
    </WidgetCard>
  );
}

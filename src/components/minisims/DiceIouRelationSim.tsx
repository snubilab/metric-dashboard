/**
 * DiceIouRelationSim — Dice and IoU move together and rank cases identically.
 *
 * An overlap slider offsets a prediction circle from a ground-truth circle.
 * Dice and IoU are shown side by side, with `RelationPlot` tracing the closed-
 * form Dice = 2·IoU / (1 + IoU) curve and a dot at the current IoU. The caption
 * states the invariant: Dice ≥ IoU always, and for a single case they induce the
 * same ranking — choosing one over the other never reorders results.
 *
 * Both metrics are computed live from the engine.
 */

import { useMemo, useState } from "react";
import type { Shape } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { rasterize } from "../../engine/raster/rasterize";
import { dice, iou } from "../../engine/metrics/overlap";
import { AnimatedMetric } from "../AnimatedMetric";
import { RelationPlot } from "../charts/RelationPlot";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle } from "./seedGeometry";

const FALLBACK = { cx: 64, cy: 64, r: 30 };
const MAX_OFFSET = 60;

export interface DiceIouRelationSimProps {
  config: MiniSimConfig;
}

export default function DiceIouRelationSim({ config }: DiceIouRelationSimProps) {
  const seed = useMemo(() => gtCircle(config.initialState, FALLBACK), [config]);
  const grid = config.initialState.grid;
  const policy = config.initialState.policy;

  const [offset, setOffset] = useState(0);

  const { diceValue, iouValue } = useMemo(() => {
    const gtShape: Shape = circleShape(seed);
    const predShape: Shape = circleShape({ cx: seed.cx + offset, cy: seed.cy, r: seed.r });
    const gtMask = rasterize(grid, [gtShape]);
    const predMask = rasterize(grid, [predShape]);
    return {
      diceValue: dice(gtMask, predMask, policy),
      iouValue: iou(gtMask, predMask, policy),
    };
  }, [seed, grid, policy, offset]);

  return (
    <WidgetCard
      title="Dice and IoU: same ranking, different scale"
      caption="Dice ≥ IoU for every overlap, and the two are a strictly increasing function of each other — for a single case they rank predictions identically, so picking one over the other never changes which result looks better."
    >
      <MetricStrip>
        <MetricCell metricKey="dice">
          <AnimatedMetric value={diceValue} label="Dice" decimals={3} />
        </MetricCell>
        <MetricCell metricKey="iou">
          <AnimatedMetric value={iouValue} label="IoU" decimals={3} />
        </MetricCell>
      </MetricStrip>

      <RelationPlot current={Number.isNaN(iouValue) ? undefined : iouValue} />

      <Slider
        label="Overlap offset (px)"
        value={offset}
        min={0}
        max={MAX_OFFSET}
        step={1}
        onChange={setOffset}
      />
    </WidgetCard>
  );
}

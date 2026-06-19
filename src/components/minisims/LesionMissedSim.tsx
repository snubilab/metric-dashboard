/**
 * LesionMissedSim — why voxel Dice can hide a completely missed small lesion.
 *
 * Ground truth is one large organ circle plus one tiny lesion circle. A toggle
 * includes or excludes the lesion from the prediction. With the lesion dropped,
 * voxel Dice stays high (the organ dominates the pixel count), yet lesion-level
 * sensitivity halves: one of two lesions is missed. The lesion-sensitivity drop
 * is colored with the warn token to make the blind spot obvious.
 *
 * Both numbers come from the engine: voxel Dice and lesion sensitivity via
 * `lesionWise`.
 */

import { useMemo, useState } from "react";
import type { Shape } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { rasterize } from "../../engine/raster/rasterize";
import { lesionWise } from "../../engine/metrics/lesionwise";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, MetricStrip, Toggle, WidgetCard } from "./widgetChrome";
import { circleShape } from "./seedGeometry";

const ORGAN = { cx: 44, cy: 64, r: 28 };
const LESION = { cx: 100, cy: 64, r: 5 };
/** A modest IoU threshold: a matched lesion need only overlap meaningfully. */
const IOU_THRESHOLD = 0.1;

export interface LesionMissedSimProps {
  config: MiniSimConfig;
}

export default function LesionMissedSim({ config }: LesionMissedSimProps) {
  const grid = config.initialState.grid;
  const policy = config.initialState.policy;

  const [includeLesion, setIncludeLesion] = useState(true);

  const { voxelDice, lesionSensitivity } = useMemo(() => {
    const organ: Shape = circleShape(ORGAN);
    const lesion: Shape = circleShape(LESION);
    const gtMask = rasterize(grid, [organ, lesion]);
    const predShapes: Shape[] = includeLesion ? [organ, lesion] : [organ];
    const predMask = rasterize(grid, predShapes);
    const result = lesionWise(grid, gtMask, predMask, {
      criterion: "iou",
      threshold: IOU_THRESHOLD,
      policy,
    });
    return { voxelDice: result.voxelDice, lesionSensitivity: result.lesionSensitivity };
  }, [grid, policy, includeLesion]);

  // The lesion-sensitivity drop is the alarming signal: tone it "warn" once the
  // lesion is excluded so the user's eye lands on the metric that exposes the miss.
  const lesionTone = includeLesion ? "default" : "warn";

  return (
    <WidgetCard
      title="A missed lesion that voxel Dice ignores"
      caption="Ground truth is a large organ plus one tiny lesion. Drop the lesion from the prediction: voxel Dice barely moves because the organ dominates the pixel count, but lesion sensitivity falls to 0.5 — one of the two lesions is missed entirely. Aggregate overlap can hide clinically critical misses."
    >
      <MetricStrip>
        <MetricCell metricKey="voxel-dice">
          <AnimatedMetric value={voxelDice} label="Voxel Dice" decimals={3} />
        </MetricCell>
        <MetricCell metricKey="lesion-sensitivity">
          <AnimatedMetric
            value={lesionSensitivity}
            label="Lesion sensitivity"
            decimals={2}
            tone={lesionTone}
          />
        </MetricCell>
      </MetricStrip>

      <Toggle
        label="Include small lesion in prediction"
        checked={includeLesion}
        onChange={setIncludeLesion}
      />
    </WidgetCard>
  );
}

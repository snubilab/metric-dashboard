/**
 * NsdToleranceSim — how the tolerance band sets what counts as "close enough".
 *
 * Two slightly offset circular masks. A slider sets the surface-distance
 * tolerance in millimeters (1..10 mm); NSD (normalized surface Dice) is the
 * fraction of boundary points within that tolerance of the other boundary, so a
 * looser tolerance can only keep or raise NSD. The current tolerance is rendered
 * prominently in mm next to the metric.
 *
 * NSD is computed live from the engine's `surfaceDice`.
 */

import { useMemo, useState } from "react";
import type { Shape } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { rasterize } from "../../engine/raster/rasterize";
import { surfaceDice } from "../../engine/metrics/boundary";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle, predCircle } from "./seedGeometry";

const GT_FALLBACK = { cx: 64, cy: 64, r: 30 };
const PRED_FALLBACK = { cx: 70, cy: 64, r: 30 };
const MIN_TOLERANCE_MM = 1;
const MAX_TOLERANCE_MM = 10;

export interface NsdToleranceSimProps {
  config: MiniSimConfig;
}

export default function NsdToleranceSim({ config }: NsdToleranceSimProps) {
  const state = config.initialState;
  const grid = state.grid;
  const policy = state.policy;
  const gtSeed = useMemo(() => gtCircle(state, GT_FALLBACK), [state]);
  const predSeed = useMemo(() => predCircle(state, "A", PRED_FALLBACK), [state]);

  const [toleranceMm, setToleranceMm] = useState(state.nsdToleranceMm ?? 2);

  const nsdValue = useMemo(() => {
    const gtShape: Shape = circleShape(gtSeed);
    const predShape: Shape = circleShape(predSeed);
    const gtMask = rasterize(grid, [gtShape]);
    const predMask = rasterize(grid, [predShape]);
    return surfaceDice(grid, gtMask, predMask, toleranceMm, policy);
  }, [gtSeed, predSeed, grid, policy, toleranceMm]);

  return (
    <WidgetCard
      title="NSD and the tolerance band"
      caption="NSD counts the fraction of boundary points that fall within the tolerance of the other contour. Loosening the tolerance can only keep or raise NSD — it never falls — because more boundary points qualify as close enough."
    >
      <MetricStrip>
        <MetricCell metricKey="nsd">
          <AnimatedMetric value={nsdValue} label="NSD" decimals={3} />
        </MetricCell>
        <MetricCell metricKey="tolerance">
          <AnimatedMetric value={toleranceMm} label="Tolerance" unit="mm" decimals={1} />
        </MetricCell>
      </MetricStrip>

      <Slider
        label="Tolerance (mm)"
        value={toleranceMm}
        min={MIN_TOLERANCE_MM}
        max={MAX_TOLERANCE_MM}
        step={1}
        onChange={setToleranceMm}
        unit="mm"
      />
    </WidgetCard>
  );
}

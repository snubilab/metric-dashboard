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
import { useLang } from "../../i18n/LanguageContext";
import { AnimatedMetric } from "../AnimatedMetric";
import { ShapeCanvas } from "../canvas/ShapeCanvas";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle } from "./seedGeometry";

const L = {
  ko: {
    title: "동떨어진 거짓양성: Dice vs HD vs HD95",
    caption:
      "거의 완벽한 예측에 멀리 떨어진 작은 점 하나가 있습니다. Dice는 추가된 몇 픽셀을 거의 알아채지 못하지만, HD는 가장 나쁜 단일 지점이므로 떨어진 점까지의 전체 거리만큼 치솟습니다. HD95는 이상치의 일부를 흡수해 둘 사이에 자리합니다.",
    strayDistance: "동떨어진 FP 거리 (mm)",
    canvasAria: "정답, 예측, 그리고 멀리 떨어진 거짓양성 점을 보여주는 그림",
  },
  en: {
    title: "Stray false positive: Dice vs HD vs HD95",
    caption:
      "A near-overlapping prediction with one tiny stray blob far away. Dice hardly notices the few extra pixels, but HD jumps to the full stray distance because it is the single farthest point. HD95 absorbs part of the outlier, landing between the two.",
    strayDistance: "Stray FP distance (mm)",
    canvasAria: "Ground truth, prediction, and a far-away stray false-positive blob",
  },
} as const;

/** Compact canvas size for the inline mini-sim preview. */
const CANVAS_MAX_PX = 240;

const FALLBACK = { cx: 40, cy: 64, r: 24 };
const STRAY_RADIUS = 3;
const MAX_STRAY_DISTANCE = 60;

export interface Hd95StrayFpSimProps {
  config: MiniSimConfig;
}

export default function Hd95StrayFpSim({ config }: Hd95StrayFpSimProps) {
  const { lang } = useLang();
  const t = L[lang];
  const seed = useMemo(() => gtCircle(config.initialState, FALLBACK), [config]);
  const grid = config.initialState.grid;
  const policy = config.initialState.policy;

  const [strayDistance, setStrayDistance] = useState(0);

  // Build GT + prediction (main mass plus the optional stray blob) once so the
  // canvas draws the very shapes that drive the three metrics.
  const gtShapes: Shape[] = useMemo(() => [circleShape(seed)], [seed]);
  const predShapes: Shape[] = useMemo(() => {
    const shapes: Shape[] = [circleShape(seed)];
    if (strayDistance > 0) {
      const strayX = Math.min(grid.width - STRAY_RADIUS, seed.cx + seed.r + strayDistance);
      shapes.push(circleShape({ cx: strayX, cy: seed.cy, r: STRAY_RADIUS }));
    }
    return shapes;
  }, [seed, grid, strayDistance]);

  const { diceValue, hdValue, hd95Value } = useMemo(() => {
    const gtMask = rasterize(grid, gtShapes);
    const predMask = rasterize(grid, predShapes);

    return {
      diceValue: dice(gtMask, predMask, policy),
      hdValue: hd(grid, gtMask, predMask, policy),
      hd95Value: hd95(grid, gtMask, predMask, policy),
    };
  }, [gtShapes, predShapes, grid, policy]);

  return (
    <WidgetCard title={t.title} caption={t.caption}>
      <ShapeCanvas
        grid={grid}
        gt={gtShapes}
        predictions={[{ id: "A", shapes: predShapes }]}
        maxPx={CANVAS_MAX_PX}
        ariaLabel={t.canvasAria}
      />

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
        label={t.strayDistance}
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

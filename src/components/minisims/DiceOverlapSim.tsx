/**
 * DiceOverlapSim — Dice's sensitivity to overlap and to object size.
 *
 * A ground-truth circle and a prediction circle of equal radius. One slider
 * slides the prediction horizontally so its overlap with GT goes from full to
 * none; a second slider shrinks the GT (and prediction) radius. The teaching
 * point: at a small radius the *same* pixel offset collapses Dice far faster
 * than at a large radius — Dice is unstable for small structures.
 *
 * The Dice score is computed live from the engine (rasterize + dice); the widget
 * only wires the two sliders to the geometry.
 */

import { useMemo, useState } from "react";
import type { Shape } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { rasterize } from "../../engine/raster/rasterize";
import { dice } from "../../engine/metrics/overlap";
import { useLang } from "../../i18n/LanguageContext";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle } from "./seedGeometry";

const L = {
  ko: {
    title: "Dice: 겹침과 크기",
    caption:
      "예측을 정답에서 밀어내며 Dice가 떨어지는 것을 보세요. 그다음 반지름을 줄이고 같은 픽셀만큼 옮기면 — 같은 오프셋인데도 Dice가 훨씬 빠르게 무너집니다. Dice는 작은 구조에서 불안정합니다.",
    predOffset: "예측 오프셋 (px)",
    gtRadius: "GT 반지름 (px)",
  },
  en: {
    title: "Dice vs overlap and size",
    caption:
      "Slide the prediction off the ground truth and watch Dice fall. Then shrink the radius and move it the same number of pixels — the same offset now collapses Dice much faster. Dice is unstable for small structures.",
    predOffset: "Pred offset (px)",
    gtRadius: "GT radius (px)",
  },
} as const;

const FALLBACK = { cx: 64, cy: 64, r: 30 };
const MAX_OFFSET = 60;
const MIN_RADIUS = 6;
const MAX_RADIUS = 40;

export interface DiceOverlapSimProps {
  config: MiniSimConfig;
}

export default function DiceOverlapSim({ config }: DiceOverlapSimProps) {
  const { lang } = useLang();
  const t = L[lang];
  const seed = useMemo(() => gtCircle(config.initialState, FALLBACK), [config]);
  const grid = config.initialState.grid;
  const policy = config.initialState.policy;

  const [offset, setOffset] = useState(0);
  const [radius, setRadius] = useState(Math.round(seed.r));

  const diceValue = useMemo(() => {
    const gtShape: Shape = circleShape({ cx: seed.cx, cy: seed.cy, r: radius });
    const predShape: Shape = circleShape({ cx: seed.cx + offset, cy: seed.cy, r: radius });
    const gtMask = rasterize(grid, [gtShape]);
    const predMask = rasterize(grid, [predShape]);
    return dice(gtMask, predMask, policy);
  }, [seed, grid, policy, offset, radius]);

  return (
    <WidgetCard title={t.title} caption={t.caption}>
      <MetricCell metricKey="dice">
        <AnimatedMetric value={diceValue} label="Dice" decimals={3} />
      </MetricCell>

      <Slider
        label={t.predOffset}
        value={offset}
        min={0}
        max={MAX_OFFSET}
        step={1}
        onChange={setOffset}
      />
      <Slider
        label={t.gtRadius}
        value={radius}
        min={MIN_RADIUS}
        max={MAX_RADIUS}
        step={1}
        onChange={setRadius}
      />
    </WidgetCard>
  );
}

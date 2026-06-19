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
import { useLang } from "../../i18n/LanguageContext";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, MetricStrip, Toggle, WidgetCard } from "./widgetChrome";
import { circleShape } from "./seedGeometry";

const L = {
  ko: {
    title: "복셀 Dice가 놓치는 누락 병변",
    caption:
      "정답은 큰 장기 하나와 작은 병변 하나입니다. 예측에서 병변을 빼보세요. 장기가 픽셀 수를 지배하므로 복셀 Dice는 거의 움직이지 않지만, 병변 민감도는 0.5로 떨어집니다 — 두 병변 중 하나를 완전히 놓친 것입니다. 전체 겹침은 임상적으로 치명적인 누락을 가릴 수 있습니다.",
    voxelDice: "복셀 Dice",
    lesionSensitivity: "병변 민감도",
    includeLesion: "예측에 작은 병변 포함",
  },
  en: {
    title: "A missed lesion that voxel Dice ignores",
    caption:
      "Ground truth is a large organ plus one tiny lesion. Drop the lesion from the prediction: voxel Dice barely moves because the organ dominates the pixel count, but lesion sensitivity falls to 0.5 — one of the two lesions is missed entirely. Aggregate overlap can hide clinically critical misses.",
    voxelDice: "Voxel Dice",
    lesionSensitivity: "Lesion sensitivity",
    includeLesion: "Include small lesion in prediction",
  },
} as const;

const ORGAN = { cx: 44, cy: 64, r: 28 };
const LESION = { cx: 100, cy: 64, r: 5 };
/** A modest IoU threshold: a matched lesion need only overlap meaningfully. */
const IOU_THRESHOLD = 0.1;

export interface LesionMissedSimProps {
  config: MiniSimConfig;
}

export default function LesionMissedSim({ config }: LesionMissedSimProps) {
  const { lang } = useLang();
  const t = L[lang];
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
    <WidgetCard title={t.title} caption={t.caption}>
      <MetricStrip>
        <MetricCell metricKey="voxel-dice">
          <AnimatedMetric value={voxelDice} label={t.voxelDice} decimals={3} />
        </MetricCell>
        <MetricCell metricKey="lesion-sensitivity">
          <AnimatedMetric
            value={lesionSensitivity}
            label={t.lesionSensitivity}
            decimals={2}
            tone={lesionTone}
          />
        </MetricCell>
      </MetricStrip>

      <Toggle
        label={t.includeLesion}
        checked={includeLesion}
        onChange={setIncludeLesion}
      />
    </WidgetCard>
  );
}

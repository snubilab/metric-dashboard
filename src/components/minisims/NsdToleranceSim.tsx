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
import { useLang } from "../../i18n/LanguageContext";
import { AnimatedMetric } from "../AnimatedMetric";
import { MetricCell, MetricStrip, Slider, WidgetCard } from "./widgetChrome";
import { circleShape, gtCircle, predCircle } from "./seedGeometry";

const L = {
  ko: {
    title: "NSD와 허용오차 밴드",
    caption:
      "NSD는 상대 윤곽선의 허용오차 안에 들어오는 경계점의 비율을 셉니다. 허용오차를 느슨하게 하면 더 많은 경계점이 충분히 가깝다고 인정되므로 NSD는 유지되거나 올라갈 뿐 — 결코 떨어지지 않습니다.",
    nsdLabel: "NSD",
    toleranceLabel: "허용오차",
    toleranceSlider: "허용오차 (mm)",
  },
  en: {
    title: "NSD and the tolerance band",
    caption:
      "NSD counts the fraction of boundary points that fall within the tolerance of the other contour. Loosening the tolerance can only keep or raise NSD — it never falls — because more boundary points qualify as close enough.",
    nsdLabel: "NSD",
    toleranceLabel: "Tolerance",
    toleranceSlider: "Tolerance (mm)",
  },
} as const;

const GT_FALLBACK = { cx: 64, cy: 64, r: 30 };
const PRED_FALLBACK = { cx: 70, cy: 64, r: 30 };
const MIN_TOLERANCE_MM = 1;
const MAX_TOLERANCE_MM = 10;

export interface NsdToleranceSimProps {
  config: MiniSimConfig;
}

export default function NsdToleranceSim({ config }: NsdToleranceSimProps) {
  const { lang } = useLang();
  const t = L[lang];
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
    <WidgetCard title={t.title} caption={t.caption}>
      <MetricStrip>
        <MetricCell metricKey="nsd">
          <AnimatedMetric value={nsdValue} label={t.nsdLabel} decimals={3} />
        </MetricCell>
        <MetricCell metricKey="tolerance">
          <AnimatedMetric value={toleranceMm} label={t.toleranceLabel} unit="mm" decimals={1} />
        </MetricCell>
      </MetricStrip>

      <Slider
        label={t.toleranceSlider}
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

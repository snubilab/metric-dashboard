/**
 * MetricFigure — dispatches a figure key to its static example component.
 *
 * Every figure key declared in the figure contract (SEG + DET) maps to a
 * default-exported component under this directory. A known key renders that
 * component wrapped in a small token-styled frame carrying an "example / 예시"
 * caption (bilingual via useLang). An unknown or undefined key renders nothing,
 * so callers can pass an optional section.figure straight through.
 */

import type { ComponentType } from "react";
import { useLang } from "../../i18n/LanguageContext";
import DiceFigure from "./DiceFigure";
import IouFigure from "./IouFigure";
import SensitivityFigure from "./SensitivityFigure";
import PrecisionFigure from "./PrecisionFigure";
import HausdorffFigure from "./HausdorffFigure";
import SurfaceDistanceFigure from "./SurfaceDistanceFigure";
import NsdFigure from "./NsdFigure";
import VolumeFigure from "./VolumeFigure";
import LesionWiseFigure from "./LesionWiseFigure";
import MatchingFigure from "./MatchingFigure";
import DetConfusionFigure from "./DetConfusionFigure";
import PrCurveFigure from "./PrCurveFigure";
import ApThresholdFigure from "./ApThresholdFigure";
import FrocFigure from "./FrocFigure";
import SensAtFpFigure from "./SensAtFpFigure";

interface MetricFigureProps {
  /** Figure key from the contract; unknown/undefined renders nothing. */
  figure?: string;
}

/** Figure key -> static example component, per the figure contract. */
const FIGURES: Record<string, ComponentType> = {
  // Segmentation
  dice: DiceFigure,
  iou: IouFigure,
  sensitivity: SensitivityFigure,
  precision: PrecisionFigure,
  hd: HausdorffFigure,
  assd: SurfaceDistanceFigure,
  nsd: NsdFigure,
  volume: VolumeFigure,
  lesionwise: LesionWiseFigure,
  // Detection
  "det-matching": MatchingFigure,
  "det-confusion": DetConfusionFigure,
  "pr-curve": PrCurveFigure,
  "ap-threshold": ApThresholdFigure,
  "froc-fig": FrocFigure,
  sensatfp: SensAtFpFigure,
};

const L = {
  ko: { caption: "예시" },
  en: { caption: "example" },
} as const;

const frameStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
  padding: "var(--space-3) var(--space-4)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
};

const captionStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
};

export function MetricFigure({ figure }: MetricFigureProps) {
  const { lang } = useLang();
  const Figure = figure ? FIGURES[figure] : undefined;
  if (!Figure) {
    return null;
  }
  return (
    <figure style={frameStyle}>
      <figcaption style={captionStyle}>{L[lang].caption}</figcaption>
      <Figure />
    </figure>
  );
}

export default MetricFigure;

/**
 * MiniSim — dispatcher that maps a `MiniSimConfig.kind` to its interactive
 * widget and frames it in a titled, token-styled container.
 *
 * Each widget under `./minisims/` is a self-contained teaching demo taking a
 * single `{ config }` prop. This component owns only the routing: it picks the
 * right widget for the kind, or renders a graceful "coming soon" note for kinds
 * that have no widget yet — it never throws on an unknown kind.
 *
 * All visual values come from design-system tokens.
 */

import type { CSSProperties, ComponentType } from "react";
import type { MiniSimConfig } from "../types/topic";
import DiceOverlapSim from "./minisims/DiceOverlapSim";
import Hd95StrayFpSim from "./minisims/Hd95StrayFpSim";
import NsdToleranceSim from "./minisims/NsdToleranceSim";
import LesionMissedSim from "./minisims/LesionMissedSim";
import DiceIouRelationSim from "./minisims/DiceIouRelationSim";
import ApReorderSim from "./minisims/ApReorderSim";
import FrocAddFpSim from "./minisims/FrocAddFpSim";
import MatchingDuplicateFpSim from "./minisims/MatchingDuplicateFpSim";

export interface MiniSimProps {
  config: MiniSimConfig;
}

/** Props every widget accepts: the originating mini-sim config. */
type WidgetProps = { config: MiniSimConfig };

/** Maps a config `kind` to the widget that teaches it. */
const WIDGETS: Record<string, ComponentType<WidgetProps>> = {
  "dice-overlap": DiceOverlapSim,
  "hd95-stray-fp": Hd95StrayFpSim,
  "nsd-tolerance": NsdToleranceSim,
  "lesionwise-missed": LesionMissedSim,
  "dice-iou-relation": DiceIouRelationSim,
  "ap-reorder": ApReorderSim,
  "froc-add-fp": FrocAddFpSim,
  "matching-duplicate-fp": MatchingDuplicateFpSim,
};

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--c-surface)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--c-text-dim)",
};

const comingSoonStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--c-text-dim)",
};

export function MiniSim({ config }: MiniSimProps) {
  const Widget = WIDGETS[config.kind];

  return (
    <div style={containerStyle}>
      <h4 style={headingStyle}>Interactive demo</h4>
      {Widget ? (
        <Widget config={config} />
      ) : (
        <p role="note" style={comingSoonStyle}>
          Interactive demo coming soon
        </p>
      )}
    </div>
  );
}

export default MiniSim;

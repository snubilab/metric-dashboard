/**
 * Duplicate-detection mini-sim.
 *
 * A single ground-truth lesion with one matching prediction. Pressing "add
 * duplicate box on the lesion" drops a second high-overlap prediction onto the
 * same lesion. Greedy matching assigns the lesion to exactly one prediction, so
 * the duplicate becomes a false positive: TP stays at 1, FP climbs, and
 * precision drops. The teaching point: redundant boxes do not earn extra
 * credit — they are penalized.
 *
 * All visual values come from design-system tokens.
 */

import { useMemo, useState } from "react";
import type { DetBox } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { matchDetections } from "../../engine/metrics/detection";
import { AnimatedMetricBlock } from "./AnimatedMetricBlock";

interface MatchingDuplicateFpSimProps {
  config: MiniSimConfig;
}

const IOU_THRESHOLD = 0.5;
/** Board extent in grid units; the SVG viewBox spans this square. */
const BOARD = 120;

const GT_BOX: DetBox = { x: 30, y: 30, w: 50, h: 50 };
const FIRST_PRED: DetBox = { x: 31, y: 31, w: 50, h: 50, confidence: 0.9 };

/** A duplicate box nudged slightly so it stays a high-IoU match on the lesion. */
function makeDuplicate(count: number): DetBox {
  const jitter = 2 + (count % 3);
  return {
    x: GT_BOX.x + jitter,
    y: GT_BOX.y + jitter,
    w: GT_BOX.w,
    h: GT_BOX.h,
    confidence: 0.8 - count * 0.05,
  };
}

const countStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-lg)",
  color: "var(--c-text)",
};

function BoardBox({
  box,
  colorVar,
  dashed,
}: {
  box: DetBox;
  colorVar: string;
  dashed?: boolean;
}) {
  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      fill={`var(${colorVar})`}
      fillOpacity={0.2}
      stroke={`var(${colorVar})`}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "4 3" : undefined}
    />
  );
}

export function MatchingDuplicateFpSim({ config }: MatchingDuplicateFpSimProps) {
  void config;
  const [preds, setPreds] = useState<DetBox[]>([FIRST_PRED]);

  const counts = useMemo(
    () => matchDetections(preds, [GT_BOX], { iouThreshold: IOU_THRESHOLD }),
    [preds],
  );
  const precision = counts.tp + counts.fp === 0 ? 0 : counts.tp / (counts.tp + counts.fp);

  const addDuplicate = () =>
    setPreds((prev) => [...prev, makeDuplicate(prev.length - 1)]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-6)",
        fontFamily: "var(--font-ui)",
        color: "var(--c-text)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <svg
          width={240}
          height={240}
          viewBox={`0 0 ${BOARD} ${BOARD}`}
          role="img"
          aria-label="Detection matching board"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <BoardBox box={GT_BOX} colorVar="--c-gt" dashed />
          {preds.map((p, i) => (
            <BoardBox key={i} box={p} colorVar="--c-pred-a" />
          ))}
        </svg>
        <button
          type="button"
          onClick={addDuplicate}
          style={{
            alignSelf: "flex-start",
            padding: "var(--space-1) var(--space-3)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--c-text)",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          Add duplicate box on the lesion
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", gap: "var(--space-6)" }}>
          <span style={{ display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--c-gt)" }}>TP</span>
            <span data-count="tp" style={countStyle}>
              {counts.tp}
            </span>
          </span>
          <span style={{ display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--c-warn)" }}>FP</span>
            <span data-count="fp" style={countStyle}>
              {counts.fp}
            </span>
          </span>
          <span style={{ display: "inline-flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--c-text-dim)" }}>FN</span>
            <span data-count="fn" style={countStyle}>
              {counts.fn}
            </span>
          </span>
        </div>
        <AnimatedMetricBlock
          dataMetric="precision"
          label="Precision"
          value={precision}
          decimals={2}
          tone={counts.fp > 0 ? "warn" : "default"}
        />
        <p
          style={{
            maxWidth: "32ch",
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--c-text-dim)",
          }}
        >
          The lesion can match only one box. A second high-overlap box becomes a
          false positive, so precision drops while recall stays the same.
        </p>
      </div>
    </div>
  );
}

export default MatchingDuplicateFpSim;

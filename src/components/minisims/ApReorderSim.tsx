/**
 * AP-reorder mini-sim.
 *
 * A short fixed list of detections, each tagged TP or FP and carrying a
 * confidence. The list starts scrambled; the learner can nudge entries up/down
 * or sort by confidence. From the displayed order we accumulate true/false
 * positives to build a precision-recall curve and compute Average Precision
 * (COCO 101-point). The teaching point: AP rewards confidence *ranking* — a
 * well-ranked list (high-confidence TPs first) scores higher than a scrambled
 * one with the same set of detections.
 *
 * All visual values come from design-system tokens.
 */

import { useMemo, useState } from "react";
import type { MiniSimConfig } from "../../types/topic";
import { averagePrecision } from "../../engine/metrics/detection";
import { PRCurve, type PRPoint } from "../charts/PRCurve";
import { AnimatedMetricBlock } from "./AnimatedMetricBlock";

interface DetEntry {
  id: string;
  confidence: number;
  isTp: boolean;
}

interface ApReorderSimProps {
  config: MiniSimConfig;
}

/**
 * Fixed teaching set: a six-detection list deliberately presented out of
 * confidence order (a low-confidence TP sits near the top, a high-confidence FP
 * lower down). Sorting by confidence therefore changes the ranking — and the
 * AP — which is the whole point of the exercise.
 */
const INITIAL_ENTRIES: DetEntry[] = [
  { id: "d1", confidence: 0.4, isTp: true },
  { id: "d2", confidence: 0.84, isTp: true },
  { id: "d3", confidence: 0.55, isTp: false },
  { id: "d4", confidence: 0.91, isTp: true },
  { id: "d5", confidence: 0.62, isTp: false },
  { id: "d6", confidence: 0.77, isTp: true },
];

/** Total ground-truth count implied by the TP entries (each TP matches one GT). */
const TOTAL_GT = INITIAL_ENTRIES.filter((e) => e.isTp).length;

/**
 * Build a precision-recall curve from an ordered detection list by accumulating
 * cumulative TP/FP, mirroring the engine's `prCurve` sweep but driven by the
 * caller-supplied display order rather than confidence.
 */
function curveFromOrder(entries: DetEntry[]): PRPoint[] {
  const points: PRPoint[] = [];
  let cumTp = 0;
  let cumFp = 0;
  for (const entry of entries) {
    if (entry.isTp) cumTp += 1;
    else cumFp += 1;
    const recall = TOTAL_GT === 0 ? 0 : cumTp / TOTAL_GT;
    const precision = cumTp + cumFp === 0 ? 0 : cumTp / (cumTp + cumFp);
    points.push({ recall, precision });
  }
  return points;
}

function swap<T>(items: T[], i: number, j: number): T[] {
  const next = [...items];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const tagStyle = (isTp: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-sm)",
  color: "var(--c-bg)",
  background: isTp ? "var(--c-gt)" : "var(--c-warn)",
});

const moveButtonStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  color: "var(--c-text)",
  background: "var(--c-surface-2)",
  border: "1px solid var(--c-border)",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  padding: "0 var(--space-2)",
};

export function ApReorderSim({ config }: ApReorderSimProps) {
  void config;
  const [entries, setEntries] = useState<DetEntry[]>(INITIAL_ENTRIES);

  const curve = useMemo(() => curveFromOrder(entries), [entries]);
  const ap = useMemo(() => averagePrecision(curve, "coco101"), [curve]);

  const sortByConfidence = () =>
    setEntries((prev) => [...prev].sort((a, b) => b.confidence - a.confidence));

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setEntries((prev) => swap(prev, index, index - 1));
  };
  const moveDown = (index: number) => {
    setEntries((prev) => (index >= prev.length - 1 ? prev : swap(prev, index, index + 1)));
  };

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
        <button
          type="button"
          onClick={sortByConfidence}
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
          Sort by confidence
        </button>

        <ol
          aria-label="Detections in ranking order"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-1)",
          }}
        >
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-1) var(--space-2)",
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  color: "var(--c-text-dim)",
                  minWidth: "3ch",
                }}
              >
                {entry.confidence.toFixed(2)}
              </span>
              <span style={tagStyle(entry.isTp)}>{entry.isTp ? "TP" : "FP"}</span>
              <span style={{ flex: 1 }} aria-hidden="true" />
              <button
                type="button"
                aria-label={`Move ${entry.id} up`}
                onClick={() => moveUp(index)}
                style={moveButtonStyle}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${entry.id} down`}
                onClick={() => moveDown(index)}
                style={moveButtonStyle}
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <PRCurve points={curve} />
        <AnimatedMetricBlock dataMetric="ap" label="Average Precision" value={ap} decimals={3} />
        <p
          style={{
            maxWidth: "32ch",
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--c-text-dim)",
          }}
        >
          AP rewards confidence ranking: putting the true positives ahead of the
          false positives lifts the curve and raises AP.
        </p>
      </div>
    </div>
  );
}

export default ApReorderSim;

/**
 * FROC add-false-positive mini-sim.
 *
 * Two scans, each with ground-truth lesions and confident true-positive
 * detections. Pressing "add false positive" drops a spurious detection onto a
 * scan, raising the false-positives-per-scan axis and pushing the FROC curve
 * rightward. The LUNA16 score (mean sensitivity across the seven standard
 * FP/scan budgets) can only fall as the budget fills with junk — illustrating
 * the false-positive budget tradeoff at the heart of detection challenges.
 *
 * All visual values come from design-system tokens.
 */

import { useMemo, useState } from "react";
import type { DetBox } from "../../types/engine";
import type { MiniSimConfig } from "../../types/topic";
import { frocCurve, luna16Score } from "../../engine/metrics/detection";
import { useLang } from "../../i18n/LanguageContext";
import { FROCCurve, type FROCPoint } from "../charts/FROCCurve";
import { AnimatedMetricBlock } from "./AnimatedMetricBlock";

const L = {
  ko: {
    addFalsePositive: "거짓양성 추가",
    fpAdded: (count: number) => `추가된 거짓양성: ${count}`,
    luna16Label: "LUNA16 점수",
    caption:
      "거짓양성이 추가될 때마다 스캔당 FP 비율이 올라가므로 같은 민감도를 얻는 데 더 큰 예산이 듭니다 — LUNA16 평균은 떨어질 뿐입니다.",
  },
  en: {
    addFalsePositive: "Add false positive",
    fpAdded: (count: number) => `False positives added: ${count}`,
    luna16Label: "LUNA16 score",
    caption:
      "Each false positive raises the FP/scan rate, so the same sensitivity now costs a bigger budget — the LUNA16 average only falls.",
  },
} as const;

interface FrocAddFpSimProps {
  config: MiniSimConfig;
}

/** Ground-truth lesions per scan (two scans). */
const GT_PER_SCAN: DetBox[][] = [
  [
    { x: 10, y: 10, w: 20, h: 20 },
    { x: 80, y: 80, w: 20, h: 20 },
  ],
  [{ x: 40, y: 120, w: 20, h: 20 }],
];

/** True-positive detections that exactly cover the lesions, high confidence. */
const INITIAL_DETECTIONS: DetBox[][] = [
  [
    { x: 10, y: 10, w: 20, h: 20, confidence: 0.95 },
    { x: 80, y: 80, w: 20, h: 20, confidence: 0.88 },
  ],
  [{ x: 40, y: 120, w: 20, h: 20, confidence: 0.9 }],
];

/** Confidence assigned to spurious detections; high enough to enter the curve. */
const FP_CONFIDENCE = 0.7;

/** A non-overlapping false-positive box; offset so each new one stays distinct. */
function makeFalsePositive(count: number): DetBox {
  return {
    x: 150 + (count % 4) * 12,
    y: 30 + Math.floor(count / 4) * 12,
    w: 8,
    h: 8,
    confidence: FP_CONFIDENCE,
  };
}

function cloneScans(scans: DetBox[][]): DetBox[][] {
  return scans.map((scan) => [...scan]);
}

export function FrocAddFpSim({ config }: FrocAddFpSimProps) {
  void config;
  const { lang } = useLang();
  const t = L[lang];
  const [detections, setDetections] = useState<DetBox[][]>(() =>
    cloneScans(INITIAL_DETECTIONS),
  );
  const [fpCount, setFpCount] = useState(0);

  const froc = useMemo(() => frocCurve(detections, GT_PER_SCAN), [detections]);
  const score = useMemo(() => luna16Score(froc), [froc]);

  const chartPoints: FROCPoint[] = froc.map((p) => ({
    fpPerScan: p.fpPerScan,
    sensitivity: p.sensitivity,
  }));

  const addFalsePositive = () => {
    setDetections((prev) => {
      const next = cloneScans(prev);
      // Alternate which scan receives the false positive.
      const scan = fpCount % next.length;
      next[scan] = [...next[scan], makeFalsePositive(fpCount)];
      return next;
    });
    setFpCount((c) => c + 1);
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
          onClick={addFalsePositive}
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
          {t.addFalsePositive}
        </button>
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--c-text-dim)" }}
        >
          {t.fpAdded(fpCount)}
        </span>
        <AnimatedMetricBlock dataMetric="luna16" label={t.luna16Label} value={score} decimals={3} />

        <p
          style={{
            maxWidth: "32ch",
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--c-text-dim)",
          }}
        >
          {t.caption}
        </p>
      </div>

      <FROCCurve points={chartPoints} />
    </div>
  );
}

export default FrocAddFpSim;

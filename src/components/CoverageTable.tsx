/**
 * CoverageTable — visualizes how metrics complement one another.
 *
 * An intro paragraph followed by a three-column table: each row names a blind
 * spot, the metric that misses it, and the metric that catches it. The
 * "missed" metric is rendered in the warn token (the failure) and the "caught
 * by" metric in the ground-truth token (the rescue), so the complementary
 * relationship reads at a glance. Header labels are bilingual via useLang().
 *
 * All visual values come from the design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";
import type { ComplementarityPair } from "../types/topic";

interface CoverageTableProps {
  intro: string;
  pairs: ComplementarityPair[];
}

const L = {
  ko: {
    blindSpot: "맹점",
    blindMetric: "놓치는 지표",
    caughtBy: "잡아내는 지표",
  },
  en: {
    blindSpot: "Blind spot",
    blindMetric: "Metric that misses it",
    caughtBy: "Caught by",
  },
} as const;

const introStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-base)",
  lineHeight: 1.6,
  color: "var(--c-text)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: "var(--font-ui)",
  color: "var(--c-text)",
};

const headCellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "var(--space-2) var(--space-3)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
  borderBottom: "1px solid var(--c-border)",
};

const cellStyle: React.CSSProperties = {
  padding: "var(--space-3)",
  fontSize: "var(--text-sm)",
  lineHeight: 1.5,
  color: "var(--c-text)",
  verticalAlign: "top",
  borderBottom: "1px solid var(--c-border)",
};

// The metric columns hold slash-delimited lists (e.g. "HD95 / NSD / ASSD") and
// occasionally short prose. Keep words and metric tokens intact so they break
// only at spaces, never mid-token; the wider column allocation below gives them
// the room to do so. The narrower blindSpot column absorbs the freed width.
const metricCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  overflowWrap: "normal",
  wordBreak: "keep-all",
};

const blindMetricStyle: React.CSSProperties = {
  ...metricCellStyle,
  color: "var(--c-warn-text)",
};

const caughtByStyle: React.CSSProperties = {
  ...metricCellStyle,
  color: "var(--c-gt-text)",
};

export function CoverageTable({ intro, pairs }: CoverageTableProps) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p style={introStyle}>{intro}</p>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: "45%" }} />
            <col style={{ width: "27.5%" }} />
            <col style={{ width: "27.5%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" style={headCellStyle}>
                {t.blindSpot}
              </th>
              <th scope="col" style={headCellStyle}>
                {t.blindMetric}
              </th>
              <th scope="col" style={headCellStyle}>
                {t.caughtBy}
              </th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, index) => (
              <tr key={index}>
                <td style={cellStyle}>{pair.blindSpot}</td>
                <td style={blindMetricStyle}>{pair.blindMetric}</td>
                <td style={caughtByStyle}>{pair.caughtBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CoverageTable;

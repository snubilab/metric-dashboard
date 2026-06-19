/**
 * BenchmarkTable — real benchmarks and the metric combinations they report.
 *
 * One row per benchmark, four columns: name, task, the metric combination it
 * scores on, and the perspective that combination captures. The combination
 * cell uses the mono token so the metric formula/list reads as code. Header
 * labels are bilingual via useLang().
 *
 * All visual values come from the design-system token custom properties.
 */

import { useLang } from "../i18n/LanguageContext";
import type { ComplementarityBenchmark } from "../types/topic";

interface BenchmarkTableProps {
  benchmarks: ComplementarityBenchmark[];
}

const L = {
  ko: {
    name: "벤치마크",
    task: "과제",
    combination: "지표 조합",
    perspective: "관점",
  },
  en: {
    name: "Benchmark",
    task: "Task",
    combination: "Metric combination",
    perspective: "Perspective",
  },
} as const;

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

// Row-header <th> defaults to centered, bold text. Keep the bold weight but
// left-align it to line up with the other left-aligned columns.
const nameCellStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  fontWeight: 700,
};

// The combination holds mono-rendered metric formulas/lists (e.g.
// "Dice + HD95 + volume"). Keep tokens intact so they break only at spaces,
// never mid-token, and give the column room via the colgroup below.
const combinationCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontFamily: "var(--font-mono)",
  overflowWrap: "normal",
  wordBreak: "keep-all",
};

export function BenchmarkTable({ benchmarks }: BenchmarkTableProps) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "26%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "26%" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" style={headCellStyle}>
              {t.name}
            </th>
            <th scope="col" style={headCellStyle}>
              {t.task}
            </th>
            <th scope="col" style={headCellStyle}>
              {t.combination}
            </th>
            <th scope="col" style={headCellStyle}>
              {t.perspective}
            </th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((benchmark, index) => (
            <tr key={index}>
              <th scope="row" style={nameCellStyle}>
                {benchmark.name}
              </th>
              <td style={cellStyle}>{benchmark.task}</td>
              <td style={combinationCellStyle}>{benchmark.combination}</td>
              <td style={cellStyle}>{benchmark.perspective}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BenchmarkTable;

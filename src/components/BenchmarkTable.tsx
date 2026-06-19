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

const combinationCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontFamily: "var(--font-mono)",
};

export function BenchmarkTable({ benchmarks }: BenchmarkTableProps) {
  const { lang } = useLang();
  const t = L[lang];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
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
              <th scope="row" style={cellStyle}>
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

const svgStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  height: "auto",
  display: "block",
};

const textStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "13px",
  fill: "var(--c-text)",
};

const dimTextStyle: React.CSSProperties = {
  ...textStyle,
  fill: "var(--c-text-dim)",
};

function Box({
  x,
  y,
  w,
  h,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={8}
      fill={color}
      fillOpacity={0.16}
      stroke={color}
    />
  );
}

export function ReportLexicalOverlapFigure() {
  return (
    <svg
      viewBox="0 0 520 170"
      role="img"
      aria-label="Lexical overlap can miss negation"
      style={svgStyle}
    >
      <Box x={20} y={24} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={55} style={textStyle}>
        No pneumothorax
      </text>
      <Box x={280} y={24} w={220} h={54} color="var(--c-pred-b)" />
      <text x={294} y={55} style={textStyle}>
        pneumothorax present
      </text>
      <line
        x1={240}
        y1={51}
        x2={280}
        y2={51}
        stroke="var(--c-warn)"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      <text x={34} y={116} style={dimTextStyle}>
        same key term
      </text>
      <text x={294} y={116} style={dimTextStyle}>
        opposite assertion
      </text>
    </svg>
  );
}

export function ReportEntitySimilarityFigure() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="Entity assertion matching" style={svgStyle}>
      <Box x={20} y={24} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={55} style={textStyle}>
        pneumothorax: present
      </text>
      <Box x={280} y={24} w={220} h={54} color="var(--c-warn)" />
      <text x={294} y={55} style={textStyle}>
        pneumothorax: absent
      </text>
      <Box x={20} y={96} w={220} h={54} color="var(--c-gt)" />
      <text x={34} y={127} style={textStyle}>
        effusion: absent
      </text>
      <Box x={280} y={96} w={220} h={54} color="var(--c-warn)" />
      <text x={294} y={127} style={textStyle}>
        effusion: present
      </text>
    </svg>
  );
}

export function ReportLabelF1Figure() {
  return (
    <svg viewBox="0 0 520 150" role="img" aria-label="Label F1 extraction" style={svgStyle}>
      {["cardiomegaly", "edema", "pneumothorax"].map((label, index) => (
        <g key={label}>
          <circle
            cx={56 + index * 160}
            cy={56}
            r={24}
            fill="var(--c-pred-a)"
            fillOpacity={0.18}
            stroke="var(--c-pred-a)"
          />
          <text x={56 + index * 160} y={102} textAnchor="middle" style={textStyle}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ReportGraphF1Figure() {
  return (
    <svg viewBox="0 0 520 160" role="img" aria-label="RadGraph-style relation" style={svgStyle}>
      <defs>
        <marker id="report-graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--c-text-dim)" />
        </marker>
      </defs>
      <Box x={30} y={52} w={140} h={48} color="var(--c-pred-a)" />
      <text x={100} y={81} textAnchor="middle" style={textStyle}>
        opacity
      </text>
      <Box x={340} y={52} w={140} h={48} color="var(--c-gt)" />
      <text x={410} y={81} textAnchor="middle" style={textStyle}>
        right lower lobe
      </text>
      <line
        x1={170}
        y1={76}
        x2={340}
        y2={76}
        stroke="var(--c-text-dim)"
        strokeWidth={2}
        markerEnd="url(#report-graph-arrow)"
      />
      <text x={255} y={62} textAnchor="middle" style={dimTextStyle}>
        located_at
      </text>
    </svg>
  );
}

export function ReportLlmEvaluatorFigure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="LLM evaluator error taxonomy" style={svgStyle}>
      {["false finding", "omission", "location", "severity", "comparison"].map((label, index) => (
        <g key={label}>
          <Box
            x={24 + (index % 3) * 164}
            y={24 + Math.floor(index / 3) * 72}
            w={140}
            h={46}
            color={index < 2 ? "var(--c-warn)" : "var(--c-pred-a)"}
          />
          <text
            x={94 + (index % 3) * 164}
            y={53 + Math.floor(index / 3) * 72}
            textAnchor="middle"
            style={textStyle}
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ReportClinicalAcceptanceFigure() {
  return (
    <svg viewBox="0 0 520 160" role="img" aria-label="Clinical acceptance workflow" style={svgStyle}>
      {["AI draft", "radiologist edit", "accepted report"].map((label, index) => (
        <g key={label}>
          <Box
            x={24 + index * 166}
            y={48}
            w={130}
            h={50}
            color={index === 2 ? "var(--c-gt)" : "var(--c-pred-a)"}
          />
          <text x={89 + index * 166} y={79} textAnchor="middle" style={textStyle}>
            {label}
          </text>
          {index < 2 && (
            <line
              x1={154 + index * 166}
              y1={73}
              x2={190 + index * 166}
              y2={73}
              stroke="var(--c-text-dim)"
              strokeWidth={2}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

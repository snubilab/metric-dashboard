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

function SmallToken({
  x,
  y,
  text,
  color,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={text.length * 8 + 18}
        height={26}
        rx={13}
        fill={color}
        fillOpacity={0.16}
        stroke={color}
      />
      <text x={x + 9} y={y + 17} style={{ ...textStyle, fontSize: "12px" }}>
        {text}
      </text>
    </g>
  );
}

export function ReportBleuFigure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="BLEU precision counts candidate n-grams" style={svgStyle}>
      <text x={26} y={30} style={textStyle}>Reference</text>
      <SmallToken x={26} y={44} text="no" color="var(--c-gt)" />
      <SmallToken x={76} y={44} text="pneumothorax" color="var(--c-gt)" />
      <SmallToken x={190} y={44} text="or" color="var(--c-gt)" />
      <SmallToken x={232} y={44} text="effusion" color="var(--c-gt)" />
      <text x={26} y={100} style={textStyle}>Candidate</text>
      <SmallToken x={26} y={114} text="pneumothorax" color="var(--c-pred-b)" />
      <SmallToken x={146} y={114} text="present" color="var(--c-warn)" />
      <SmallToken x={232} y={114} text="effusion" color="var(--c-pred-b)" />
      <text x={350} y={70} style={dimTextStyle}>BLEU-1 precision</text>
      <text x={350} y={100} style={textStyle}>matched candidate tokens</text>
      <line x1={350} y1={108} x2={488} y2={108} stroke="var(--c-text-dim)" />
      <text x={372} y={134} style={textStyle}>candidate tokens</text>
      <text x={350} y={164} style={dimTextStyle}>2 / 3 matched; assertion still wrong</text>
    </svg>
  );
}

export function ReportRougeFigure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="ROUGE-L recall follows reference order" style={svgStyle}>
      <text x={26} y={30} style={textStyle}>Reference sequence</text>
      {["mild", "cardiomegaly", "no", "effusion"].map((token, index) => (
        <SmallToken key={token} x={26 + index * 112} y={48} text={token} color="var(--c-gt)" />
      ))}
      <text x={26} y={112} style={textStyle}>Candidate subsequence</text>
      {["cardiomegaly", "no", "effusion"].map((token, index) => (
        <SmallToken key={token} x={96 + index * 122} y={130} text={token} color="var(--c-pred-a)" />
      ))}
      <path d="M112 80 C112 98 158 110 158 130" fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
      <path d="M258 80 C258 98 278 110 278 130" fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
      <path d="M370 80 C370 98 404 110 404 130" fill="none" stroke="var(--c-pred-a)" strokeWidth={2} />
      <text x={340} y={112} style={dimTextStyle}>recall = LCS / reference</text>
    </svg>
  );
}

export function ReportMeteorFigure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="METEOR aligns exact, stem, and synonym matches" style={svgStyle}>
      <text x={28} y={32} style={textStyle}>Reference</text>
      <SmallToken x={28} y={48} text="pleural effusion" color="var(--c-gt)" />
      <SmallToken x={188} y={48} text="improved" color="var(--c-gt)" />
      <text x={28} y={112} style={textStyle}>Candidate</text>
      <SmallToken x={28} y={128} text="pleural fluid" color="var(--c-pred-a)" />
      <SmallToken x={188} y={128} text="decreased" color="var(--c-pred-a)" />
      <line x1={92} y1={74} x2={86} y2={128} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="5 4" />
      <line x1={232} y1={74} x2={232} y2={128} stroke="var(--c-warn)" strokeWidth={2} strokeDasharray="5 4" />
      <text x={350} y={70} style={textStyle}>METEOR</text>
      <text x={350} y={98} style={dimTextStyle}>precision + recall</text>
      <text x={350} y={124} style={dimTextStyle}>+ synonym/stem match</text>
      <text x={350} y={150} style={dimTextStyle}>- fragmentation penalty</text>
    </svg>
  );
}

export function ReportBertScoreFigure() {
  return (
    <svg viewBox="0 0 520 210" role="img" aria-label="BERTScore compares contextual token similarity" style={svgStyle}>
      <text x={26} y={30} style={textStyle}>All-token similarity matrix</text>
      {["right", "pneumo", "no", "effusion"].map((token, index) => (
        <text key={token} x={150 + index * 62} y={58} textAnchor="middle" style={dimTextStyle}>{token}</text>
      ))}
      {["right", "effusion", "no", "pneumo"].map((token, row) => (
        <g key={token}>
          <text x={26} y={88 + row * 30} style={dimTextStyle}>{token}</text>
          {[0, 1, 2, 3].map((col) => {
            const match = row === col || row + col === 4;
            return (
              <rect
                key={col}
                x={128 + col * 62}
                y={70 + row * 30}
                width={48}
                height={22}
                rx={4}
                fill={match ? "var(--c-pred-a)" : "var(--bg-secondary)"}
                stroke={match ? "var(--c-pred-a)" : "var(--border-secondary)"}
                fillOpacity={match ? 0.26 : 1}
              />
            );
          })}
        </g>
      ))}
      <text x={354} y={152} style={textStyle}>max similarity per token</text>
      <text x={354} y={180} style={dimTextStyle}>can still miss assertion swaps</text>
    </svg>
  );
}

export function ReportRateScoreFigure() {
  return (
    <svg viewBox="0 0 520 210" role="img" aria-label="RaTEscore filters comparison to medical entities" style={svgStyle}>
      <text x={28} y={32} style={textStyle}>BERTScore: every word</text>
      <Box x={28} y={48} w={200} h={46} color="var(--c-pred-a)" />
      <text x={42} y={76} style={textStyle}>right pleural effusion</text>
      <Box x={292} y={48} w={200} h={46} color="var(--c-pred-b)" />
      <text x={306} y={76} style={textStyle}>right pneumothorax</text>
      <text x={28} y={124} style={textStyle}>RaTEscore: entity + assertion</text>
      <SmallToken x={28} y={142} text="pneumothorax: present" color="var(--c-gt)" />
      <SmallToken x={248} y={142} text="pneumothorax: absent" color="var(--c-warn)" />
      <line x1={214} y1={155} x2={248} y2={155} stroke="var(--c-warn)" strokeWidth={2} />
    </svg>
  );
}

export function ReportTemporalF1Figure() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="Temporal F1 compares change labels" style={svgStyle}>
      <text x={26} y={30} style={textStyle}>Reference change labels</text>
      <SmallToken x={26} y={48} text="edema: improved" color="var(--c-gt)" />
      <SmallToken x={204} y={48} text="effusion: stable" color="var(--c-gt)" />
      <text x={26} y={106} style={textStyle}>Candidate change labels</text>
      <SmallToken x={26} y={124} text="edema: worsened" color="var(--c-warn)" />
      <SmallToken x={220} y={124} text="effusion: stable" color="var(--c-pred-a)" />
      <line x1={98} y1={74} x2={104} y2={124} stroke="var(--c-warn)" strokeWidth={2} />
      <text x={360} y={114} style={dimTextStyle}>direction matters</text>
      <text x={360} y={142} style={dimTextStyle}>TP=1 · FP=1 · FN=1</text>
    </svg>
  );
}

export function ReportCheXbertF1Figure() {
  return (
    <svg viewBox="0 0 520 170" role="img" aria-label="CheXbert F1 compares coarse CXR labels" style={svgStyle}>
      <text x={28} y={30} style={textStyle}>Coarse CXR label set</text>
      {["cardiomegaly", "edema", "effusion", "pneumothorax"].map((label, index) => (
        <g key={label}>
          <rect
            x={28 + index * 120}
            y={52}
            width={96}
            height={44}
            rx={8}
            fill={index < 2 ? "var(--c-pred-a)" : "var(--bg-secondary)"}
            fillOpacity={index < 2 ? 0.18 : 1}
            stroke={index < 2 ? "var(--c-pred-a)" : "var(--border-secondary)"}
          />
          <text x={76 + index * 120} y={80} textAnchor="middle" style={{ ...textStyle, fontSize: "11px" }}>
            {label}
          </text>
        </g>
      ))}
      <text x={28} y={132} style={dimTextStyle}>TP=2 · FP=1 · FN=1; little location detail</text>
    </svg>
  );
}

export function ReportSrrBertF1Figure() {
  return (
    <svg viewBox="0 0 520 190" role="img" aria-label="SRR-BERT F1 uses broader labels and attributes" style={svgStyle}>
      <text x={28} y={30} style={textStyle}>Broader label vocabulary</text>
      <SmallToken x={28} y={50} text="opacity" color="var(--c-gt)" />
      <SmallToken x={112} y={50} text="right" color="var(--c-gt)" />
      <SmallToken x={180} y={50} text="improved" color="var(--c-gt)" />
      <text x={28} y={112} style={textStyle}>Candidate</text>
      <SmallToken x={28} y={132} text="opacity" color="var(--c-pred-a)" />
      <SmallToken x={112} y={132} text="left" color="var(--c-warn)" />
      <SmallToken x={174} y={132} text="worsened" color="var(--c-warn)" />
      <text x={330} y={92} style={dimTextStyle}>same finding label</text>
      <text x={330} y={118} style={dimTextStyle}>different attribute labels</text>
      <text x={330} y={144} style={dimTextStyle}>label TP=1, attribute errors=2</text>
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
      <text x={255} y={126} textAnchor="middle" style={dimTextStyle}>
        entity TP=1; relation TP=1
      </text>
    </svg>
  );
}

export function ReportGreenFigure() {
  const rows = [
    ["matched", "cardiomegaly", "pneumothorax"],
    ["errors", "severity", "location", "comparison"],
  ];
  return (
    <svg viewBox="0 0 520 210" role="img" aria-label="GREEN matched findings and error notation" style={svgStyle}>
      <Box x={24} y={24} w={472} h={44} color="var(--c-gt)" />
      <text x={42} y={52} style={textStyle}>matched findings</text>
      {rows[0].slice(1).map((token, index) => (
        <SmallToken key={token} x={196 + index * 128} y={34} text={token} color="var(--c-gt)" />
      ))}
      <Box x={24} y={92} w={472} h={78} color="var(--c-warn)" />
      <text x={42} y={120} style={textStyle}>significant errors</text>
      {rows[1].slice(1).map((token, index) => (
        <SmallToken key={token} x={196 + (index % 2) * 124} y={104 + Math.floor(index / 2) * 34} text={token} color="var(--c-warn)" />
      ))}
      <text x={42} y={196} style={dimTextStyle}>error count = 3 = unsupported + missing + wrong-category</text>
    </svg>
  );
}

export function ReportCrimsonFigure() {
  return (
    <svg viewBox="0 0 520 210" role="img" aria-label="CRIMSON adds patient context and severity weights" style={svgStyle}>
      <Box x={24} y={24} w={130} h={46} color="var(--c-pred-a)" />
      <text x={89} y={52} textAnchor="middle" style={textStyle}>history</text>
      <Box x={194} y={24} w={130} h={46} color="var(--c-pred-a)" />
      <text x={259} y={52} textAnchor="middle" style={textStyle}>age / sex</text>
      <Box x={364} y={24} w={130} h={46} color="var(--c-pred-a)" />
      <text x={429} y={52} textAnchor="middle" style={textStyle}>guideline</text>
      <line x1={89} y1={70} x2={190} y2={116} stroke="var(--c-text-dim)" strokeWidth={2} />
      <line x1={259} y1={70} x2={259} y2={116} stroke="var(--c-text-dim)" strokeWidth={2} />
      <line x1={429} y1={70} x2={328} y2={116} stroke="var(--c-text-dim)" strokeWidth={2} />
      <Box x={150} y={116} w={220} h={54} color="var(--c-warn)" />
      <text x={260} y={148} textAnchor="middle" style={textStyle}>weighted clinical error</text>
      <text x={78} y={196} style={dimTextStyle}>patient context raises error severity; normal findings can be ignored</text>
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

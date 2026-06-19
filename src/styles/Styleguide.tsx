/**
 * Visual reference for the design-system foundation: data-color swatches,
 * neutral swatches, the type scale, and the GT / Pred-A / Pred-B legend.
 *
 * Intended for screenshot review during design polish. All visual values are
 * read from token custom properties — nothing here hardcodes color or font.
 */

interface Swatch {
  label: string;
  /** A CSS custom-property name, e.g. "--c-gt". */
  token: string;
}

const DATA_SWATCHES: Swatch[] = [
  { label: "Ground truth", token: "--c-gt" },
  { label: "Prediction A", token: "--c-pred-a" },
  { label: "Prediction B", token: "--c-pred-b" },
  { label: "Disagreement", token: "--c-warn" },
];

const NEUTRAL_SWATCHES: Swatch[] = [
  { label: "Background", token: "--c-bg" },
  { label: "Surface", token: "--c-surface" },
  { label: "Surface 2", token: "--c-surface-2" },
  { label: "Border", token: "--c-border" },
  { label: "Text", token: "--c-text" },
  { label: "Text dim", token: "--c-text-dim" },
];

interface TypeRow {
  label: string;
  /** A CSS custom-property name, e.g. "--text-base". */
  token: string;
}

const TYPE_SCALE: TypeRow[] = [
  { label: "xs", token: "--text-xs" },
  { label: "sm", token: "--text-sm" },
  { label: "base", token: "--text-base" },
  { label: "lg", token: "--text-lg" },
  { label: "xl", token: "--text-xl" },
  { label: "2xl", token: "--text-2xl" },
];

const LEGEND: Swatch[] = [
  { label: "GT", token: "--c-gt" },
  { label: "Pred-A", token: "--c-pred-a" },
  { label: "Pred-B", token: "--c-pred-b" },
];

const sectionStyle: React.CSSProperties = {
  marginBottom: "var(--space-8)",
};

const headingStyle: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--c-text-dim)",
  marginBottom: "var(--space-4)",
};

function ColorSwatch({ label, token }: Swatch) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        aria-hidden="true"
        style={{
          height: "56px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--c-border)",
          background: `var(${token})`,
        }}
      />
      <figcaption
        style={{
          marginTop: "var(--space-2)",
          fontSize: "var(--text-xs)",
          color: "var(--c-text)",
        }}
      >
        {label}
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            color: "var(--c-text-dim)",
          }}
        >
          {token}
        </span>
      </figcaption>
    </figure>
  );
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "var(--space-4)",
      }}
    >
      {swatches.map((swatch) => (
        <ColorSwatch key={swatch.token + swatch.label} {...swatch} />
      ))}
    </div>
  );
}

export function Styleguide() {
  return (
    <div
      style={{
        padding: "var(--space-8)",
        background: "var(--c-bg)",
        color: "var(--c-text)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <h1 style={{ marginBottom: "var(--space-6)" }}>Design tokens</h1>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Data colors — Okabe-Ito</h2>
        <SwatchGrid swatches={DATA_SWATCHES} />
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Neutrals</h2>
        <SwatchGrid swatches={NEUTRAL_SWATCHES} />
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Type scale</h2>
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {TYPE_SCALE.map((row) => (
            <div
              key={row.token}
              style={{ display: "flex", alignItems: "baseline", gap: "var(--space-4)" }}
            >
              <span
                style={{
                  width: "48px",
                  flex: "0 0 auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--c-text-dim)",
                }}
              >
                {row.label}
              </span>
              <span style={{ fontSize: `var(${row.token})` }}>
                Dice 0.91 · HD95 2.4 mm
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Legend</h2>
        <ul
          style={{
            display: "flex",
            gap: "var(--space-6)",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {LEGEND.map((item) => (
            <li
              key={item.token}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "var(--radius-sm)",
                  background: `var(${item.token})`,
                }}
              />
              <span style={{ fontSize: "var(--text-sm)" }}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Styleguide;

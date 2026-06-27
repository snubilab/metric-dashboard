# Metric Dashboard — project guide for AI assistants & contributors

An interactive, bilingual (한국어 default / English) static web app teaching
medical-imaging & ML **evaluation metrics** to grad students. React 19 + Vite +
TypeScript (strict), Vitest. Live: https://snubilab.github.io/metric-dashboard/

## Read this first

📐 **[docs/DESIGN.md](docs/DESIGN.md) — the design philosophy & spec.** It is the
contract every new topic, metric, figure, and view must follow. Do not add or
change a view without reading it.

## The non-negotiables (full detail in docs/DESIGN.md)

- **Product thesis (immutable):** no metric is universally good/bad — which
  prediction wins depends on the metric. **NEVER print an absolute grade verdict**
  (`좋음/나쁨/우수/열등/good/bad`) on a metric or prediction. A thesis-guard test
  enforces this.
- **Unification:** every topic must reach full parity across the **three views**,
  using identical patterns:
  - **Learn** — intro + MetricSections (formula/figure/meaning/features ✓/caveats ⚠️/
    miniSim), metric mentions linkified.
  - **Playground** — boots empty, guided draw-from-scratch, a **ROW of presets**
    (never one fixed example), live metrics.
  - **Scenarios** — read-only cards: **visual + legend + clean table**, no sliders.
  - A new topic should be **indistinguishable in structure/polish** from
    segmentation and detection.
- **Tokens only:** all visuals from `src/styles/tokens.css`. Okabe-Ito data colors;
  use the **`-text` variants for any `<text>`/label** (raw bright vars are for
  shapes/marks). Theme-aware via `[data-theme="dark"]`; ko + light are defaults.
  Responsive/theme rules go in an **injected `<style>` class**, never inline (inline
  can't hold media/theme and out-specifies classes).
- **Engine purity:** metric math is pure + unit-tested in `src/engine/**`; views
  only render what it computes; draw-classification must equal count-classification.

## Conventions

- TypeScript everywhere; 2-space indent, double quotes, semicolons, trailing commas.
- Organize by feature; keep related files close.
- jsdom-safe canvas (`if (!ctx) return;`); pure logic unit-tested.

## Commands

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # tsc -b + vite build → dist/
npm run test     # vitest
npm run lint     # eslint
```

## Verification bar (before claiming "done")

Build + full test suite green → **headed Playwright on the LIVE deployed URL**
(localhost isn't reachable from the headless browser here) + an **adversarial UIUX
audit** (pixel-level WCAG, refute each finding) → fix P0/P1 → commit → deploy.

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds and publishes to GitHub
Pages. `vite.config.ts` sets `base: '/metric-dashboard/'` for production only.

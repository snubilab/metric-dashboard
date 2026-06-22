# Metric Dashboard

An interactive, bilingual (한국어 / English) web app for **learning how to evaluate
medical-imaging and machine-learning models** — and, more importantly, for learning
*why the choice of metric changes the answer*.

🔗 **Live:** https://snubilab.github.io/metric-dashboard/

## The core idea

Following the [Metrics Reloaded](https://www.nature.com/articles/s41592-023-02151-z)
framework, this dashboard is built around one thesis:

> **No single metric is universally "good" or "bad."** Which prediction looks best
> depends entirely on *which metric you measure it with*. A prediction that wins on
> overlap (Dice) can lose on boundary accuracy (HD95), and vice versa.

So the app never renders an absolute grade ("good"/"bad") for a metric or a
prediction. Instead it shows the *trade-offs*: each metric family catches a
different failure mode, which is why real medical benchmarks always report several
together.

## What's inside

Each topic has three views:

- **Learn** — plain-language explanations, KaTeX-rendered formulas, **an example SVG
  figure for every metric**, and small interactive mini-simulations. Metric mentions
  (HD95, NSD, ASSD, Dice, IoU, …) are links that jump straight to that metric's
  section, and a "how these metrics complement each other" section ties them together.
- **Playground** — draw the ground truth and competing predictions **from an empty
  canvas**, and watch every metric recompute live as you reshape them — see for
  yourself how the ranking flips depending on the metric.
- **Scenarios** — clinically-grounded worked examples, each a read-only visual plus a
  side-by-side **A-vs-B rank-flip table** (prediction A vs B for segmentation; detector
  A vs B for detection), so "which one wins" visibly depends on which metric you read.

**Topics available today:** Image Segmentation, Object Detection.
More are stubbed in the sidebar (classification, regression, synthesis, LLM/VLM
report generation, clinical risk prediction, reader studies) and marked *coming soon*.

## Design & accessibility

- **Colorblind-safe** [Okabe–Ito](https://jfly.uni-koeln.de/color/) palette for the
  data roles (ground truth / prediction A / prediction B / disagreement).
- **WCAG-AA** text contrast — readable colour variants for labels, with the bright
  hues reserved for shapes and marks.
- **Light and dark** themes; Korean is the default language.
- Fully static, no backend, no tracking.

## Project docs

- [`STRATEGY.md`](STRATEGY.md) — what the product is and why (target problem, approach, metrics, investment tracks).
- [`docs/DESIGN.md`](docs/DESIGN.md) — the design philosophy & spec every new topic, metric, and view must follow (three-view parity, the no-grade thesis, tokens, per-metric figure + complementarity, the verification bar).
- [`CLAUDE.md`](CLAUDE.md) — concise contributor / AI-assistant guide with the non-negotiables, linking the above.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite](https://vite.dev/) for dev/build
- [KaTeX](https://katex.org/) for formula rendering
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
- Design-system tokens (CSS custom properties) — components never hard-code colours

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build locally
npm run test       # run the Vitest suite
npm run lint       # run ESLint
```

Requires Node 20+ (CI uses Node 22).

## Project structure

```
src/
  app/            # shell: Sidebar, LearnView, ScenariosView, ThemeToggle, …
  components/     # reusable UI — canvas, figures/, charts/, tables, mini-sims
  engine/         # pure metric math (Dice, IoU, Hausdorff, matching, …)
  topics/         # per-topic content + Playground (segmentation, detection)
  i18n/           # Korean/English message catalogs + language context
  styles/         # design-system token contract (tokens.css)
  types/          # shared TypeScript types
```

Most metric logic lives in `src/engine` as pure, unit-tested functions; the canvas
and figures only render what those functions compute.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app and
publishes `dist/` to GitHub Pages. Because the site is served from a project
sub-path, `vite.config.ts` sets `base: '/metric-dashboard/'` for production builds
only (local dev stays at `/`).

## License

Educational project. Content follows the Metrics Reloaded recommendations; see that
paper for the underlying guidance.

# Metric Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, browser-based dashboard where students manipulate real predictions and watch many medical-imaging metrics react, grounded in real clinical scenarios — first slice: Image Segmentation + Image Detection.

**Architecture:** React + Vite + TypeScript SPA, no backend. A pure-TypeScript `engine/` computes all metrics from actual rasterized geometry (mm-aware). The same engine powers Learn's single-metric mini-sims and the Playground's all-metrics A/B comparison. Topics self-register in a registry.

**Tech Stack:** Vite, React 18, TypeScript (strict), Vitest, @testing-library/react, KaTeX (formula rendering), custom SVG charts. Code style: 2-space indent, semicolons, double quotes, trailing commas, feature-organized.

**Design intent:** This is a teaching instrument for scientists, not a generic admin dashboard. The visual design must be distinctive and considered — a calm, precise, "scientific instrument" aesthetic (confident typographic hierarchy, restrained palette with intentional accent colors for GT / Pred-A / Pred-B, generous spacing, purposeful micro-motion on metric changes). The design is developed with the **@compound-engineering:ce-frontend-design** skill (avoid AI-slop defaults; verify via screenshots). A design-system foundation (Phase 8.5) is established before building feature components, and a dedicated polish pass (Phase 12) reviews real screenshots.

**Reference spec:** `docs/superpowers/specs/2026-06-19-metric-dashboard-design.md`
**Content source for first topic:** `docs/metrics/SegAndDect`

---

## Conventions for every task

- TDD: write the failing test, watch it fail for the right reason, write minimal code, watch it pass, refactor, commit.
- Run all tests with `npm run test` (Vitest, jsdom). Run a single file with `npx vitest run <path>`.
- Commit after each task with a conventional-commit message.
- Engine functions are **pure** (no DOM, no React) so they unit-test in isolation.
- All distance/surface metrics return **millimeters**, scaled by grid spacing.

---

## File structure (decomposition)

```
package.json, vite.config.ts, tsconfig.json, vitest.config.ts, index.html
src/
  main.tsx, App.tsx
  styles/     tokens.css, theme.ts, global.css   # design system (Phase 8.5)
  app/        Sidebar.tsx, topicRegistry.ts, groups.ts
  types/      topic.ts, engine.ts
  engine/
    raster/   grid.ts, Shape.ts, rasterize.ts
    distance/ edt.ts
    metrics/  confusion.ts, overlap.ts, boundary.ts, volume.ts, lesionwise.ts, detection.ts
    policy.ts
  components/
    UnitsBanner.tsx, MetricTable.tsx, MiniSim.tsx, CanvasEditor.tsx, ClinicalContext.tsx
    charts/   PRCurve.tsx, FROCCurve.tsx, RelationPlot.tsx
  topics/
    segmentation/  content.ts, Playground.tsx, scenarios.ts, index.ts
    detection/     content.ts, Playground.tsx, scenarios.ts, index.ts
    _template/     README.md, content.ts, scenarios.ts, index.ts
```

---

## Phase 0 — Project scaffold

### Task 0.1: Initialize Vite React-TS project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`

- [ ] **Step 1: Scaffold**

```bash
cd /Users/kyh/Workspace/metric_dashboard
npm create vite@latest . -- --template react-ts
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install katex
```

- [ ] **Step 2: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add scripts** to `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Ensure `.gitignore`** includes `node_modules`, `dist`, `.superpowers/`.

- [ ] **Step 5: Smoke test** — `npm run dev` serves; `npm run test` runs (0 tests OK). Then init git and commit.

```bash
git init && git add -A && git commit -m "chore: scaffold vite react-ts + vitest"
```

> Note: repo is not yet a git repository — `git init` here is the first commit.

---

## Phase 1 — Engine core types, grid, shapes, rasterization

### Task 1.1: Engine + topic types

**Files:**
- Create: `src/types/engine.ts`, `src/types/topic.ts`

- [ ] **Step 1:** Create `src/types/engine.ts` with the contract from the spec:

```ts
export type Vec2 = [number, number];

export type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "box"; x: number; y: number; w: number; h: number }
  | { kind: "polygon"; points: Vec2[] };

export interface Grid {
  width: number;
  height: number;
  spacingMm: Vec2; // [sx, sy] millimeters per pixel
}

export type EmptyDicePolicy = "one" | "zero" | "nan";
export type EmptyDistancePolicy = "undefined" | "diagonal" | "fixed";

export interface DegeneratePolicy {
  emptyDice: EmptyDicePolicy;        // value when GT and pred both empty
  emptyDistance: EmptyDistancePolicy; // HD/HD95 when one mask empty
  fixedPenaltyMm?: number;           // used when emptyDistance === "fixed"
}

export interface DetBox {
  x: number; y: number; w: number; h: number;
  confidence?: number; // omitted for ground-truth objects
}

export interface PredictionLayer {
  id: "A" | "B";
  shapes: Shape[];
}

export interface EngineState {
  grid: Grid;
  gt: Shape[];
  predictions: PredictionLayer[];
  detections?: { boxes: DetBox[]; gtObjects: DetBox[] };
  policy: DegeneratePolicy;
  nsdToleranceMm?: number;
}

export type Mask = Uint8Array; // length = width*height, values 0|1
```

- [ ] **Step 2:** Create `src/types/topic.ts`:

```ts
import type { EngineState } from "./engine";
import type { FC } from "react";

export type TopicGroup = "discriminative" | "generative" | "language" | "clinical";
export type TopicStatus = "available" | "coming-soon";

export interface MiniSimConfig {
  kind: string;              // e.g. "dice-overlap", "hd95-stray-fp", "ap-reorder", "froc-add-fp"
  initialState: EngineState;
  spotlightMetric: string;   // which metric the widget emphasizes
}

export interface MetricSection {
  id: string;
  title: string;
  formula?: string;          // KaTeX source
  meaning: string;
  features: string[];
  caveats: string[];
  miniSim?: MiniSimConfig;
}

export interface LearnContent {
  intro: string;
  sections: MetricSection[];
}

export interface ClinicalContext {
  situation: string;
  modality: string;
  atStake: string;
  consequence: string;
}

export interface Scenario {
  id: string;
  title: string;
  clinical: ClinicalContext;
  state: EngineState;
  teachingPoint: string;
  reference?: string;
}

export interface Topic {
  id: string;
  group: TopicGroup;
  title: string;
  status: TopicStatus;
  learn?: LearnContent;
  Playground?: FC;
  scenarios?: Scenario[];
}
```

- [ ] **Step 3: Commit** — `git commit -m "feat(types): engine + topic contracts"`

### Task 1.2: Grid helpers

**Files:** Create `src/engine/raster/grid.ts`, Test `src/engine/raster/grid.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from "vitest";
import { makeGrid, index, diagonalMm } from "./grid";

describe("grid", () => {
  it("computes flat index", () => {
    const g = makeGrid(4, 3, [1, 1]);
    expect(index(g, 2, 1)).toBe(6); // y*width + x
  });
  it("computes physical diagonal in mm", () => {
    const g = makeGrid(3, 4, [2, 2]); // 6mm x 8mm
    expect(diagonalMm(g)).toBeCloseTo(10, 5);
  });
});
```

- [ ] **Step 2: Run, expect fail.** `npx vitest run src/engine/raster/grid.test.ts`

- [ ] **Step 3: Implement** `grid.ts`:

```ts
import type { Grid, Vec2 } from "../../types/engine";

export function makeGrid(width: number, height: number, spacingMm: Vec2): Grid {
  return { width, height, spacingMm };
}

export function index(g: Grid, x: number, y: number): number {
  return y * g.width + x;
}

export function diagonalMm(g: Grid): number {
  const wMm = g.width * g.spacingMm[0];
  const hMm = g.height * g.spacingMm[1];
  return Math.sqrt(wMm * wMm + hMm * hMm);
}
```

- [ ] **Step 4: Run, expect pass. Commit** — `feat(engine): grid helpers`

### Task 1.3: Rasterize shapes to masks

**Files:** Create `src/engine/raster/rasterize.ts`, Test `src/engine/raster/rasterize.test.ts`

- [ ] **Step 1: Failing tests** — verify a circle and a box rasterize to expected pixel counts and that point-in-shape is correct.

```ts
import { describe, it, expect } from "vitest";
import { makeGrid } from "./grid";
import { rasterize } from "./rasterize";

describe("rasterize", () => {
  it("box fills exactly its pixel rectangle", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const m = rasterize(g, [{ kind: "box", x: 2, y: 2, w: 3, h: 4 }]);
    expect(m.reduce((a, b) => a + b, 0)).toBe(12);
    expect(m[2 * 10 + 2]).toBe(1);
    expect(m[0]).toBe(0);
  });
  it("circle pixel count approximates area", () => {
    const g = makeGrid(40, 40, [1, 1]);
    const m = rasterize(g, [{ kind: "circle", cx: 20, cy: 20, r: 10 }]);
    const count = m.reduce((a, b) => a + b, 0);
    expect(count).toBeGreaterThan(280); // ~pi*100=314
    expect(count).toBeLessThan(340);
  });
  it("union of overlapping shapes does not double-count", () => {
    const g = makeGrid(10, 10, [1, 1]);
    const m = rasterize(g, [
      { kind: "box", x: 0, y: 0, w: 5, h: 5 },
      { kind: "box", x: 3, y: 0, w: 5, h: 5 },
    ]);
    expect(m.every((v) => v === 0 || v === 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** `rasterize.ts` — circle (distance test), box (bounds), polygon (even-odd ray cast); OR-combine layers into one `Uint8Array`.

```ts
import type { Grid, Mask, Shape, Vec2 } from "../../types/engine";
import { index } from "./grid";

function inShape(s: Shape, x: number, y: number): boolean {
  const px = x + 0.5, py = y + 0.5;
  switch (s.kind) {
    case "circle":
      return (px - s.cx) ** 2 + (py - s.cy) ** 2 <= s.r * s.r;
    case "box":
      return px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h;
    case "polygon":
      return pointInPolygon([px, py], s.points);
  }
}

function pointInPolygon([px, py]: Vec2, pts: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function rasterize(g: Grid, shapes: Shape[]): Mask {
  const m = new Uint8Array(g.width * g.height);
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      if (shapes.some((s) => inShape(s, x, y))) m[index(g, x, y)] = 1;
    }
  }
  return m;
}
```

- [ ] **Step 4: Run, expect pass. Commit** — `feat(engine): shape rasterization`

---

## Phase 2 — Distance transform

### Task 2.1: Euclidean distance transform (Felzenszwalb 1D-pass)

**Files:** Create `src/engine/distance/edt.ts`, Test `src/engine/distance/edt.test.ts`

- [ ] **Step 1: Failing tests** — squared EDT of a single seed pixel equals squared Euclidean distance.

```ts
import { describe, it, expect } from "vitest";
import { makeGrid } from "../raster/grid";
import { edt } from "./edt";

describe("edt", () => {
  it("distance from a single foreground pixel grows euclidean", () => {
    const g = makeGrid(5, 1, [1, 1]);
    const mask = new Uint8Array([0, 0, 1, 0, 0]); // seed at x=2
    const d = edt(g, mask); // distance (px) to nearest foreground
    expect(d[2]).toBeCloseTo(0);
    expect(d[0]).toBeCloseTo(2);
    expect(d[4]).toBeCloseTo(2);
  });
  it("respects anisotropic spacing", () => {
    const g = makeGrid(1, 3, [1, 10]); // rows are 10mm apart
    const mask = new Uint8Array([1, 0, 0]);
    const d = edt(g, mask);
    expect(d[1]).toBeCloseTo(10);
    expect(d[2]).toBeCloseTo(20);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement** Felzenszwalb & Huttenlocher squared-distance transform, two separable passes, scaled by `spacingMm` per axis; return mm distance to nearest foreground pixel. (Foreground = value 1; distance 0 on foreground.)

- [ ] **Step 4: Run, expect pass. Commit** — `feat(engine): euclidean distance transform`

---

## Phase 3 — Overlap metrics + degenerate policy

### Task 3.1: Confusion counts

**Files:** Create `src/engine/metrics/confusion.ts`, Test alongside.

- [ ] **Step 1: Failing test** — TP/FP/FN/TN from two masks.

```ts
import { confusion } from "./confusion";
it("counts confusion cells", () => {
  const gt =   new Uint8Array([1, 1, 0, 0]);
  const pred = new Uint8Array([1, 0, 1, 0]);
  expect(confusion(gt, pred)).toEqual({ tp: 1, fp: 1, fn: 1, tn: 1 });
});
```

- [ ] **Step 2–4:** Implement, pass, commit — `feat(engine): confusion counts`.

### Task 3.2: Degenerate-case policy

**Files:** Create `src/engine/policy.ts`, Test alongside.

- [ ] **Step 1: Failing tests** — policy resolves empty-empty Dice and empty-distance per chosen convention.

```ts
import { resolveEmptyDice, resolveEmptyDistance } from "./policy";
it("empty/empty dice follows policy", () => {
  expect(resolveEmptyDice({ emptyDice: "one", emptyDistance: "undefined" })).toBe(1);
  expect(resolveEmptyDice({ emptyDice: "zero", emptyDistance: "undefined" })).toBe(0);
  expect(Number.isNaN(resolveEmptyDice({ emptyDice: "nan", emptyDistance: "undefined" }))).toBe(true);
});
```

- [ ] **Step 2–4:** Implement, pass, commit — `feat(engine): degenerate-case policy`.

### Task 3.3: Overlap metrics

**Files:** Create `src/engine/metrics/overlap.ts`, Test alongside.

- [ ] **Step 1: Failing tests:**

```ts
import { dice, iou, sensitivity, precision } from "./overlap";
const policy = { emptyDice: "one", emptyDistance: "undefined" } as const;
it("identical masks score 1", () => {
  const m = new Uint8Array([1, 1, 0]);
  expect(dice(m, m, policy)).toBeCloseTo(1);
  expect(iou(m, m, policy)).toBeCloseTo(1);
});
it("disjoint masks score 0", () => {
  const a = new Uint8Array([1, 0]);
  const b = new Uint8Array([0, 1]);
  expect(dice(a, b, policy)).toBeCloseTo(0);
});
it("dice = 2*iou/(1+iou)", () => {
  const a = new Uint8Array([1, 1, 1, 0]);
  const b = new Uint8Array([1, 1, 0, 1]);
  const i = iou(a, b, policy);
  expect(dice(a, b, policy)).toBeCloseTo((2 * i) / (1 + i), 6);
});
it("empty/empty uses policy", () => {
  const e = new Uint8Array([0, 0]);
  expect(dice(e, e, policy)).toBe(1);
});
```

- [ ] **Step 2–4:** Implement using `confusion` + `resolveEmptyDice` for the empty/empty case; guard divisions. Commit — `feat(engine): overlap metrics`.

---

## Phase 4 — Boundary/surface metrics

### Task 4.1: Boundary extraction + symmetric surface distances

**Files:** Create `src/engine/metrics/boundary.ts`, Test alongside.

- [ ] **Step 1: Failing tests** — on two concentric boxes with known offset, HD/HD95/ASSD match hand-computed mm values; `HD95 <= HD`; symmetric.

```ts
import { makeGrid } from "../raster/grid";
import { rasterize } from "../raster/rasterize";
import { hd, hd95, assd } from "./boundary";
const policy = { emptyDice: "one", emptyDistance: "undefined" } as const;

it("HD95 <= HD and both >= 0", () => {
  const g = makeGrid(50, 50, [1, 1]);
  const a = rasterize(g, [{ kind: "box", x: 10, y: 10, w: 20, h: 20 }]);
  const b = rasterize(g, [{ kind: "box", x: 12, y: 10, w: 20, h: 20 }]);
  expect(hd95(g, a, b, policy)).toBeLessThanOrEqual(hd(g, a, b, policy));
  expect(hd(g, a, b, policy)).toBeGreaterThan(0);
});
it("identical masks have zero surface distance", () => {
  const g = makeGrid(30, 30, [1, 1]);
  const a = rasterize(g, [{ kind: "circle", cx: 15, cy: 15, r: 8 }]);
  expect(assd(g, a, a, policy)).toBeCloseTo(0, 5);
});
it("scales with mm spacing", () => {
  const g1 = makeGrid(50, 50, [1, 1]);
  const g2 = makeGrid(50, 50, [2, 2]);
  const a = rasterize(g1, [{ kind: "box", x: 10, y: 10, w: 20, h: 20 }]);
  const b = rasterize(g1, [{ kind: "box", x: 15, y: 10, w: 20, h: 20 }]);
  expect(hd(g2, a, b, policy)).toBeCloseTo(2 * hd(g1, a, b, policy), 4);
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement:** extract boundary pixels (foreground pixel with a background 4-neighbor); compute directed distances using `edt` of the *other* mask's boundary; HD = max of both directed maxima; HD95 = 95th percentile of the combined directed-distance multiset; ASD = mean one-directional; ASSD = mean of both directions. Handle empty masks via `resolveEmptyDistance` (return `NaN` for `"undefined"`, `diagonalMm` for `"diagonal"`, `fixedPenaltyMm` for `"fixed"`).

- [ ] **Step 4: Run, expect pass. Commit** — `feat(engine): boundary distances (HD/HD95/ASD/ASSD)`.

### Task 4.2: Surface Dice / NSD at tolerance

**Files:** Modify `src/engine/metrics/boundary.ts`, extend test file.

- [ ] **Step 1: Failing tests** — identical masks → NSD = 1 at any tolerance; tolerance in mm increases NSD monotonically.

- [ ] **Step 2–4:** Implement `surfaceDice(g, a, b, toleranceMm, policy)` = fraction of boundary points (both directions) within `toleranceMm` of the other boundary. Commit — `feat(engine): surface dice / NSD`.

---

## Phase 5 — Volume difference

### Task 5.1: Volume/area difference

**Files:** Create `src/engine/metrics/volume.ts`, Test alongside.

- [ ] **Step 1: Failing test** — area difference in mm² and signed relative volume difference.

```ts
import { areaMm2, relativeVolumeDiff } from "./volume";
it("area in mm^2 uses spacing", () => {
  const g = makeGrid(10, 10, [2, 3]); // each px = 6 mm^2
  const m = rasterize(g, [{ kind: "box", x: 0, y: 0, w: 2, h: 2 }]); // 4 px
  expect(areaMm2(g, m)).toBeCloseTo(24);
});
```

- [ ] **Step 2–4:** Implement, pass, commit — `feat(engine): volume/area difference`.

---

## Phase 6 — Lesion-wise metrics

### Task 6.1: Connected components

**Files:** Create `src/engine/metrics/lesionwise.ts`, Test alongside.

- [ ] **Step 1: Failing test** — two separated blobs yield 2 components with correct sizes (4-connectivity).

- [ ] **Step 2–4:** Implement flood-fill labeling returning per-component pixel index sets. Commit — `feat(engine): connected components`.

### Task 6.2: Lesion matching + lesion-wise metrics

**Files:** Modify `src/engine/metrics/lesionwise.ts`, extend test.

- [ ] **Step 1: Failing tests** — large organ + one missed small lesion gives high voxel Dice but lesion-level sensitivity 0.5; matching criterion selectable (IoU or centroid distance).

```ts
it("voxel dice high but lesion sensitivity low when small lesion missed", () => {
  const g = makeGrid(60, 60, [1, 1]);
  const gt = rasterize(g, [
    { kind: "circle", cx: 20, cy: 30, r: 14 },   // big organ
    { kind: "circle", cx: 50, cy: 50, r: 2 },     // tiny lesion
  ]);
  const pred = rasterize(g, [{ kind: "circle", cx: 20, cy: 30, r: 14 }]); // misses tiny
  const r = lesionWise(g, gt, pred, { criterion: "iou", threshold: 0.1 });
  expect(r.lesionSensitivity).toBeCloseTo(0.5);
  expect(r.voxelDice).toBeGreaterThan(0.9);
});
```

- [ ] **Step 2–4:** Implement lesion matching (one-to-one, greedy by overlap/distance), lesion-wise Dice/HD95, lesion-level sensitivity, FP/FN lesion counts. **Default matching criterion = IoU** (centroid-distance also implemented and selectable). Add a second test exercising the `centroid` criterion path so both are covered. Commit — `feat(engine): lesion-wise metrics`.

---

## Phase 7 — Detection metrics

### Task 7.1: Box IoU + one-to-one matching

**Files:** Create `src/engine/metrics/detection.ts`, Test alongside.

- [ ] **Step 1: Failing tests** — box IoU known value; one-to-one matching where a duplicate high-IoU box becomes an FP; matching order (by confidence) respected.

```ts
import { boxIou, matchDetections } from "./detection";
it("box iou for half-overlap", () => {
  const a = { x: 0, y: 0, w: 2, h: 2 };
  const b = { x: 1, y: 0, w: 2, h: 2 };
  expect(boxIou(a, b)).toBeCloseTo(2 / 6); // inter=2, union=6
});
it("duplicate prediction on same GT is an FP", () => {
  const gt = [{ x: 0, y: 0, w: 4, h: 4 }];
  const preds = [
    { x: 0, y: 0, w: 4, h: 4, confidence: 0.9 },
    { x: 0, y: 0, w: 4, h: 4, confidence: 0.8 }, // duplicate
  ];
  const m = matchDetections(preds, gt, { iouThreshold: 0.5 });
  expect(m.tp).toBe(1);
  expect(m.fp).toBe(1);
});
```

- [ ] **Step 2–4:** Implement `boxIou`; `matchDetections` sorts predictions by descending confidence, greedily matches each to the best unused GT with IoU ≥ threshold (TP), else FP; unmatched GT → FN. Commit — `feat(engine): detection matching`.

### Task 7.2: PR curve + AP (interpolation variants)

**Files:** Modify `detection.ts`, extend test.

- [ ] **Step 1: Failing tests** — on a hand-built ranked detection list, AP matches hand-computed values for VOC-11pt, VOC all-points, and COCO-101pt; AP differs across variants on the same curve.

- [ ] **Step 2–4:** Implement `prCurve(preds, gt, iouThreshold)` (sweep by descending confidence, accumulate TP/FP, emit precision/recall points) and `averagePrecision(curve, method)` for the three interpolation methods. Commit — `feat(engine): PR curve + AP variants`.

### Task 7.3: AP@[.5:.95], FROC, sensitivity@FP

**Files:** Modify `detection.ts`, extend test.

- [ ] **Step 1: Failing tests** — AP@[.5:.95] averages 10 IoU thresholds; FROC returns sensitivity at FP/scan operating points and the LUNA16 score = mean of sensitivities at {1/8,1/4,1/2,1,2,4,8}; `sensitivityAtFp` interpolates correctly.

Fixture shape for the test: `detections` is a flat `DetBox[]` with `confidence` (pooled across scans); `gtPerScan` is `DetBox[][]` (one array of GT objects per scan); `scanCount = gtPerScan.length`. `frocCurve` matches detections to GT per scan, then for each confidence threshold computes (mean FP per scan, lesion sensitivity).

```ts
it("luna16 score is mean of 7 operating-point sensitivities", () => {
  const froc = frocCurve(detections, gtPerScan, scanCount);
  const score = luna16Score(froc);
  expect(score).toBeCloseTo(
    [1/8,1/4,1/2,1,2,4,8].map((fp) => sensitivityAtFp(froc, fp)).reduce((a,b)=>a+b,0)/7, 6
  );
});
```

- [ ] **Step 2–4:** Implement, pass, commit — `feat(engine): AP@[.5:.95], FROC, sensitivity@FP`.

> **Engine milestone:** after Phase 7, `npm run test` covers every metric. This is a working, fully-tested computation library even before any UI.

---

## Phase 8 — App shell, registry, sidebar

### Task 8.1: Topic registry + groups

**Files:** Create `src/app/groups.ts`, `src/app/topicRegistry.ts`, Test `topicRegistry.test.ts`

- [ ] **Step 1: Failing test** — registry returns 9 topics in grouped order; only `segmentation` and `detection` are `available`.

```ts
import { TOPICS, orderedTopics } from "./topicRegistry";
it("has 9 topics, seg+detection available", () => {
  expect(TOPICS.length).toBe(9);
  const available = TOPICS.filter((t) => t.status === "available").map((t) => t.id);
  expect(available.sort()).toEqual(["detection", "segmentation"]);
});
it("ordered discriminative group is classification,regression,segmentation,detection", () => {
  const disc = orderedTopics().filter((t) => t.group === "discriminative").map((t) => t.id);
  expect(disc).toEqual(["classification", "regression", "segmentation", "detection"]);
});
```

- [ ] **Step 2–4:** Implement `groups.ts` (ordered group list) and `topicRegistry.ts` importing the two real topic modules plus 7 `coming-soon` stubs; `orderedTopics()` sorts by group order then in-group order. Commit — `feat(app): topic registry + grouped ordering`.

### Task 8.2: Sidebar + App shell + routing

**Files:** Create `src/app/Sidebar.tsx`, modify `src/App.tsx`, Test `Sidebar.test.tsx`

- [ ] **Step 1: Failing test (RTL)** — sidebar renders group headers and topic names; coming-soon topics are disabled; clicking an available topic selects it.

- [ ] **Step 2–4:** Implement sidebar with group headers and a simple state-based router (selected topic id + active tab). App renders selected topic's Learn/Playground/Scenarios tabs. Commit — `feat(app): sidebar + shell + tab routing`.

---

## Phase 8.5 — Design system foundation

> **REQUIRED SUB-SKILL for this phase:** Use **@compound-engineering:ce-frontend-design** to establish the aesthetic before building components. Goal: a distinctive "scientific instrument" look, not a generic dashboard. Verify with screenshots before proceeding.

### Task 8.5.1: Define design tokens

**Files:** Create `src/styles/tokens.css`, `src/styles/theme.ts`, `src/styles/global.css`; import in `src/main.tsx`.

- [ ] **Step 1:** Establish tokens as CSS custom properties + a typed `theme.ts` mirror:
  - **Color:** a restrained neutral base (light + dark), with three *semantic data colors* — `--c-gt` (ground truth), `--c-pred-a`, `--c-pred-b` — chosen colorblind-safe and used consistently everywhere GT/A/B appear (canvas, table, legends, charts). Plus `--c-warn` for disagreement/▲HD95 callouts.
  - **Type:** a clear scale (e.g. a humanist sans for UI + a mono for metric numerals so digits align). Define `--text-xs..--text-2xl`, weights, line-heights.
  - **Space:** 4px-based spacing scale; container widths; radius; elevation.
  - **Motion:** `--ease-out`, durations for the metric-value transition (numbers should *tween* when a metric changes — the core "watch it react" feeling).
- [ ] **Step 2:** Write a `theme.test.ts` asserting the three data colors are distinct and exported, and that `theme.ts` matches the CSS variable names (guard against drift).
- [ ] **Step 3:** Implement, pass.
- [ ] **Step 4:** Build a temporary styleguide view (mounted via the same state-based router as topics — e.g. a `__styleguide` selection, no react-router) rendering swatches, type scale, the GT/A/B legend, and a sample animated metric numeral. Screenshot it (headed) and review against the design intent with ce-frontend-design. Iterate until it reads as "precise scientific instrument," not "bootstrap admin."
- [ ] **Step 5: Commit** — `feat(design): design tokens + theme foundation`.

### Task 8.5.2: AnimatedMetric primitive

**Files:** Create `src/components/AnimatedMetric.tsx`, Test alongside.

- [ ] **Step 1: Failing test** — renders a value with units; when the value prop changes, it transitions (assert it reflects the new value and applies the transition class). Respects `prefers-reduced-motion`.
- [ ] **Step 2–4:** Implement a numeral display that tweens between values (mono font, fixed decimals, color-coded delta). This primitive is reused by MetricTable, MiniSim, and chart readouts. Commit — `feat(design): animated metric numeral primitive`.

> All Phase 9 components consume these tokens and the AnimatedMetric primitive — no ad-hoc colors or fonts.

## Phase 9 — Shared components

### Task 9.1: UnitsBanner

**Files:** Create `src/components/UnitsBanner.tsx`, Test alongside.

- [ ] **Step 1: Failing test** — renders the "2D slice; in practice 3D surface in mm" honesty text.
- [ ] **Step 2–4:** Implement, pass, commit — `feat(ui): units/dimensionality honesty banner`.

### Task 9.2: CanvasEditor

**Files:** Create `src/components/CanvasEditor.tsx`, Test alongside.

- [ ] **Step 1: Failing test (RTL + jsdom)** — renders a canvas; exposes controlled `shapes` + `onChange`; a programmatic "add circle" tool callback adds a shape; selecting a layer (GT/A/B) routes edits to that layer. (Keep DOM-pixel interaction light; test the state/tool logic, not pixel hit-testing.)
- [ ] **Step 2–4:** Implement an editor that draws GT/A/B layers with distinct colors on a `<canvas>`, supports add/move/resize/delete of circle/box/polygon via toolbar buttons + pointer drag, and emits `EngineState`-compatible shape arrays. Factor pointer-math into a pure helper module (`canvasMath.ts`) with its own unit tests. Commit — `feat(ui): canvas editor for GT/Pred shapes`.

### Task 9.3: MetricTable with disagreement highlight

**Files:** Create `src/components/MetricTable.tsx`, Test alongside.

- [ ] **Step 1: Failing test** — given metric values for A and B, the row where A and B rank in opposite directions vs another row is flagged; large-magnitude gaps flagged. Renders mm units on distance rows.
- [ ] **Step 2–4:** Implement a presentational table fed computed values (computation done by a `useEngineMetrics(state)` hook). Disagreement logic lives in a pure `detectDisagreements(rows)` helper with unit tests. Commit — `feat(ui): metric table + disagreement highlight`.

### Task 9.4: Charts (PRCurve, FROCCurve, RelationPlot)

**Files:** Create `src/components/charts/*.tsx`, Test alongside.

- [ ] **Step 1: Failing tests** — PRCurve renders an SVG path from points and overlays the interpolation envelope; FROCCurve uses a log x-axis and marks the 7 LUNA16 operating points; RelationPlot draws the Dice–IoU curve and the current point.
- [ ] **Step 2–4:** Implement small dependency-free SVG charts (props in, SVG out). Axis/scale math in a pure `scale.ts` helper with unit tests. Commit — `feat(ui): SVG charts (PR, FROC, relation)`.

### Task 9.5: MiniSim wrapper + ClinicalContext

**Files:** Create `src/components/MiniSim.tsx`, `src/components/ClinicalContext.tsx`, Test alongside.

- [ ] **Step 1: Failing tests** — MiniSim renders the right interaction for a given `MiniSimConfig.kind` and shows the spotlight metric value; ClinicalContext renders situation/modality/atStake/consequence.
- [ ] **Step 2–4:** Implement MiniSim as a dispatcher mapping `kind` → a focused widget (reusing CanvasEditor + a single metric readout, or the AP-reorder / FROC-add-FP widgets). Commit — `feat(ui): mini-sim wrapper + clinical context block`.

---

## Phase 10 — Segmentation topic

### Task 10.1: Learn content (ported from SegAndDect)

**Files:** Create `src/topics/segmentation/content.ts`, Test `content.test.ts`

- [ ] **Step 1: Failing test** — `learn.sections` includes Dice, IoU, Sensitivity, Precision, HD95, ASSD, SurfaceDice/NSD, volume, lesion-wise; each section has formula/meaning/caveats; key sections carry a `miniSim` config.

```ts
import { segmentationLearn } from "./content";
it("covers required metric sections with mini-sims", () => {
  const ids = segmentationLearn.sections.map((s) => s.id);
  ["dice", "iou", "sensitivity", "precision", "hd95", "assd", "nsd", "volume", "lesionwise"]
    .forEach((id) => expect(ids).toContain(id));
  expect(segmentationLearn.sections.find((s) => s.id === "hd95")?.miniSim?.kind).toBe("hd95-stray-fp");
  expect(segmentationLearn.sections.find((s) => s.id === "dice")?.miniSim?.kind).toBe("dice-overlap");
});
```

- [ ] **Step 2–4:** Author content from `docs/metrics/SegAndDect` (verbatim-faithful meaning/caveats), with mini-sim configs and initial `EngineState`s. Note in Dice copy that "diverge under averaging" is commentary (single-case engine). Commit — `feat(seg): learn content + mini-sim configs`.

### Task 10.2: Segmentation Playground

**Files:** Create `src/topics/segmentation/Playground.tsx`, Test alongside.

- [ ] **Step 1: Failing test (RTL)** — renders CanvasEditor (GT/A/B), UnitsBanner, MetricTable; editing a prediction updates the table; NSD tolerance + spacing + policy controls present.
- [ ] **Step 2–4:** Compose existing components around a `useState<EngineState>`. Commit — `feat(seg): playground`.

### Task 10.3: Segmentation clinical scenarios

**Files:** Create `src/topics/segmentation/scenarios.ts`, Test alongside.

- [ ] **Step 1: Failing test** — scenarios include the spec set (missed small met, stray-FP-HD95, over-seg, small-lesion instability, liver margin, rank-vs-magnitude, empty/negative, clDice teaser); each has a full `ClinicalContext` and loads a valid `EngineState`; each computed state actually demonstrates its `teachingPoint` (assert the metric relationship, e.g. missed-met scenario has voxelDice>0.9 and lesionSensitivity<0.6).
- [ ] **Step 2–4:** Author scenarios with clinical context + references; assert teaching points using the engine. Commit — `feat(seg): clinical scenarios`.

### Task 10.4: Register segmentation topic

**Files:** Create `src/topics/segmentation/index.ts`; wire into registry.

- [ ] **Step 1–5:** Export `Topic` object, register, verify the topic renders end-to-end in `npm run dev`. Commit — `feat(seg): register topic`.

---

## Phase 11 — Detection topic

### Task 11.1: Learn content

**Files:** Create `src/topics/detection/content.ts`, Test alongside.

- [ ] **Step 1: Failing test** — sections include IoU-matching, one-to-one, precision/recall/F1, AP, mAP, AP50/AP75, AP@[.5:.95], FROC, sensitivity@FP; AP section mini-sim `kind === "ap-reorder"`, FROC `kind === "froc-add-fp"`, matching `kind === "matching-duplicate-fp"`.
- [ ] **Step 2–4:** Author from `docs/metrics/SegAndDect` §7–10. Commit — `feat(det): learn content`.

### Task 11.2: Detection Playground

**Files:** Create `src/topics/detection/Playground.tsx`, Test alongside.

- [ ] **Step 1: Failing test (RTL)** — renders box editor + confidence-threshold slider + PRCurve + FROCCurve; moving the slider moves the operating point and changes F1 while AP stays fixed; interpolation-method selector switches AP value.
- [ ] **Step 2–4:** Implement, pass, commit — `feat(det): playground with PR/FROC + threshold slider`.

### Task 11.3: Detection clinical scenarios

**Files:** Create `src/topics/detection/scenarios.ts`, Test alongside.

- [ ] **Step 1: Failing test** — scenarios include LUNA16 FROC sweep, AP50-high/AP75-low (RSNA), DeepLesion sensitivity@FP, CAMELYON16 FP/image; each has `ClinicalContext` + reference; teaching points asserted via engine.
- [ ] **Step 2–4:** Author, assert, commit — `feat(det): clinical scenarios`.

### Task 11.4: Register detection topic

- [ ] **Step 1–5:** Export, register, verify end-to-end, commit — `feat(det): register topic`.

---

## Phase 12 — Extensibility template + docs

### Task 12.1: `_template` topic + "How to add a topic" doc

**Files:** Create `src/topics/_template/{README.md,content.ts,scenarios.ts,index.ts}`

- [ ] **Step 1–5:** Provide a minimal compiling topic skeleton with comments pointing at the cross-cutting principles (threshold-dependence, aggregation, dimensionality/units honesty, clinical grounding). README explains the 4 steps to add a topic. Verify `npm run build` succeeds. Commit — `docs: topic-authoring template`.

### Task 12.2: Design polish pass

> **REQUIRED SUB-SKILL:** Use **@compound-engineering:ce-frontend-design** (screenshot-driven). Optionally **@compound-engineering:ce-design-iterator** for N refine cycles.

- [ ] **Step 1:** Run `npm run preview`; capture headed screenshots of: sidebar, a Learn section with a mini-sim mid-interaction, the Playground with an A/B disagreement highlighted, and a loaded clinical scenario.
- [ ] **Step 2:** Review each screenshot against the design intent. Look for AI-slop tells (generic card grids, flat hierarchy, default blues, cramped charts, unlabeled axes), spacing/alignment issues, and weak visual hierarchy. Confirm GT/A/B colors are consistent everywhere and charts (PR/FROC) are legible with labeled axes and marked operating points.
- [ ] **Step 3:** Fix the issues; re-screenshot; iterate (max ~3 cycles).
- [ ] **Step 4: Commit** — `style: design polish pass on seg+detection`.

### Task 12.3: Final verification

- [ ] **Step 1:** `npm run test` — all green.
- [ ] **Step 2:** `npm run build` — type-checks and bundles.
- [ ] **Step 3:** `npm run preview` — manually click through Segmentation and Detection: Learn mini-sims react, Playground A/B disagreement highlights, every scenario loads and shows its clinical context, metric numerals tween on change. Use @superpowers:verification-before-completion.
- [ ] **Step 4: Commit** — `chore: final verification of seg+detection slice`.

---

## Done criteria
- Every engine metric has unit tests passing against analytic known values.
- Segmentation and Detection topics fully navigable with Learn / Playground / Scenarios.
- Distance metrics display in mm with the dimensionality-honesty banner.
- Degenerate-case policy, AP interpolation method, and FROC operating points are all user-visible and correct.
- All 9 topics appear in the grouped sidebar; the 7 unbuilt ones are clearly "coming soon".
- The UI reads as a distinctive, polished "scientific instrument" (consistent GT/A/B data colors, clear typographic hierarchy, tweened metric numerals, legible labeled charts) — verified by screenshot review, not generic AI-slop defaults.
- `npm run build` produces a deployable static bundle.
```

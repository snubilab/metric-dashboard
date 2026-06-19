/**
 * One-click, well-configured starting points for the Segmentation Playground.
 *
 * Each preset is a complete `EngineState` whose geometry is constructed with
 * explicit coordinates on the shared 256x256 grid so that the A-vs-B metric
 * table immediately shows a clear, instructive contrast. The numbers below were
 * sanity-checked against the real engine (rasterize + dice/hd95/assd) so the
 * stated teaching point is literally true when the table recomputes.
 *
 * Conventions mirror `scenarios.ts`: GT is the reference; Prediction A is the
 * "good" model and Prediction B is the contrasting one. The default degenerate
 * policy and a 2mm NSD tolerance are shared across presets.
 *
 * All values are plain data; no colors or fonts live here.
 */

import type { DegeneratePolicy, EngineState, Vec2 } from "../../types/engine";

/** Shared 256x256, 1mm isotropic grid — identical to the Playground default. */
const GRID = { width: 256, height: 256, spacingMm: [1, 1] as Vec2 };

/** Reasonable default degenerate-case policy, shared by every preset. */
const POLICY: DegeneratePolicy = { emptyDice: "one", emptyDistance: "undefined" };

/** Shared NSD tolerance for every preset, in millimeters. */
const NSD_TOLERANCE_MM = 2;

/** A bilingual string pair (Korean / English) for a single piece of UI text. */
export interface Bilingual {
  ko: string;
  en: string;
}

/**
 * A short, human-readable descriptor for one prediction in a preset scene.
 *
 * `name` is the prediction's short label (e.g. "예측 A" / "Prediction A").
 * `role` is a brief phrase for what the prediction does in this specific scene
 * (e.g. "정확 추적" / "accurate"), used to anchor the otherwise abstract A/B.
 */
export interface PredictionMeta {
  /** Short prediction name, e.g. "예측 A" / "Prediction A". */
  name: Bilingual;
  /** One-phrase role for this prediction in the scene, e.g. "과다분할" / "over-segmentation". */
  role: Bilingual;
}

/** A named, one-click Playground starting point. */
export interface SegPreset {
  /** Stable identifier, used as a React key and for the active-preset highlight. */
  id: string;
  /** Short button label (English). */
  label: string;
  /** Short button label (Korean), shown when the UI language is Korean. */
  labelKo: string;
  /** One-sentence explanation of the contrast the preset demonstrates (English). */
  description: string;
  /** Korean explanation, shown when the UI language is Korean. */
  descriptionKo: string;
  /** Bilingual short name + scene role for prediction A. */
  predictionA: PredictionMeta;
  /** Bilingual short name + scene role for prediction B. */
  predictionB: PredictionMeta;
  /** The full engine state this preset loads into the Playground. */
  state: EngineState;
}

/**
 * Well-configured presets covering the canonical "which metric do you trust"
 * contrasts. Ordered from the friendliest teaching case to the subtler ones.
 */
export const SEG_PRESETS: SegPreset[] = [
  {
    id: "good-vs-over",
    label: "Good vs over-segmentation",
    labelKo: "정상 분할 대 과다 분할",
    description:
      "A tracks the lesion accurately; B paints a much larger circle — high " +
      "sensitivity but collapsing precision and a large volume error.",
    descriptionKo:
      "A는 병변을 정확히 추적하고, B는 훨씬 큰 원을 칠합니다 — 민감도는 높지만 " +
      "정밀도가 무너지고 부피 오차가 큽니다.",
    predictionA: {
      name: { ko: "예측 A", en: "Prediction A" },
      role: { ko: "정확 추적", en: "accurate" },
    },
    predictionB: {
      name: { ko: "예측 B", en: "Prediction B" },
      role: { ko: "과다분할", en: "over-segmentation" },
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 110, cy: 128, r: 38 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 112, cy: 128, r: 38 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 110, cy: 128, r: 60 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: NSD_TOLERANCE_MM,
    },
  },
  {
    id: "stray-fp",
    label: "Stray FP wrecks HD95",
    labelKo: "떨어진 위양성이 HD95를 망친다",
    description:
      "A and B both overlap GT well, so their Dice nearly ties — but B fires " +
      "an extra small blob far away, so B's HD95 explodes.",
    descriptionKo:
      "A와 B 모두 정답과 잘 겹쳐서 Dice는 거의 동점이지만 — B가 멀리 떨어진 곳에 " +
      "작은 덩어리 하나를 더 내놓아 B의 HD95가 폭발합니다.",
    predictionA: {
      name: { ko: "예측 A", en: "Prediction A" },
      role: { ko: "깔끔한 일치", en: "clean match" },
    },
    predictionB: {
      name: { ko: "예측 B", en: "Prediction B" },
      role: { ko: "멀리 떨어진 거짓양성", en: "distant false positive" },
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 110, cy: 128, r: 40 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 110, cy: 128, r: 40 }] },
        {
          id: "B",
          shapes: [
            { kind: "circle", cx: 110, cy: 128, r: 40 },
            { kind: "circle", cx: 224, cy: 36, r: 8 },
          ],
        },
      ],
      policy: POLICY,
      nsdToleranceMm: NSD_TOLERANCE_MM,
    },
  },
  {
    id: "boundary-error-high-dice",
    label: "Boundary error, high Dice",
    labelKo: "경계 오차, 높은 Dice",
    description:
      "A is near-perfect; B has the same size but is shifted, so Dice stays " +
      "high while HD95 and ASSD climb — overlap and boundary disagree.",
    descriptionKo:
      "A는 거의 완벽하고, B는 크기는 같지만 위치가 어긋나서 Dice는 높게 유지되는데 " +
      "HD95와 ASSD는 올라갑니다 — 겹침과 경계가 서로 다른 말을 합니다.",
    predictionA: {
      name: { ko: "예측 A", en: "Prediction A" },
      role: { ko: "정밀 정렬", en: "well aligned" },
    },
    predictionB: {
      name: { ko: "예측 B", en: "Prediction B" },
      role: { ko: "경계 어긋남", en: "shifted boundary" },
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 45 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 45 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 136, cy: 128, r: 45 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: NSD_TOLERANCE_MM,
    },
  },
  {
    id: "small-lesion-sensitivity",
    label: "Small lesion sensitivity",
    labelKo: "작은 병변 민감도",
    description:
      "GT has a big lesion plus a tiny one. A finds both; B misses the tiny " +
      "lesion, so its voxel Dice barely drops but its HD95 jumps.",
    descriptionKo:
      "정답에는 큰 병변과 아주 작은 병변이 있습니다. A는 둘 다 찾고, B는 작은 병변을 " +
      "놓쳐서 픽셀 Dice는 거의 떨어지지 않지만 HD95는 치솟습니다.",
    predictionA: {
      name: { ko: "예측 A", en: "Prediction A" },
      role: { ko: "둘 다 검출", en: "finds both" },
    },
    predictionB: {
      name: { ko: "예측 B", en: "Prediction B" },
      role: { ko: "작은 병변 놓침", en: "misses tiny lesion" },
    },
    state: {
      grid: GRID,
      gt: [
        { kind: "circle", cx: 100, cy: 128, r: 40 },
        { kind: "circle", cx: 210, cy: 56, r: 7 },
      ],
      predictions: [
        {
          id: "A",
          shapes: [
            { kind: "circle", cx: 100, cy: 128, r: 40 },
            { kind: "circle", cx: 210, cy: 56, r: 7 },
          ],
        },
        { id: "B", shapes: [{ kind: "circle", cx: 100, cy: 128, r: 40 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: NSD_TOLERANCE_MM,
    },
  },
  {
    id: "tight-vs-loose",
    label: "Tight vs loose match",
    labelKo: "정밀한 일치 대 느슨한 일치",
    description:
      "A is a tight, well-aligned match; B is a loose, oversized and offset " +
      "circle — every overlap and boundary metric separates the two.",
    descriptionKo:
      "A는 잘 정렬된 정밀한 일치이고, B는 너무 크고 위치가 어긋난 느슨한 원입니다 — " +
      "모든 겹침·경계 지표가 둘을 구분해 냅니다.",
    predictionA: {
      name: { ko: "예측 A", en: "Prediction A" },
      role: { ko: "정밀한 일치", en: "tight match" },
    },
    predictionB: {
      name: { ko: "예측 B", en: "Prediction B" },
      role: { ko: "느슨한 일치", en: "loose match" },
    },
    state: {
      grid: GRID,
      gt: [{ kind: "circle", cx: 128, cy: 128, r: 42 }],
      predictions: [
        { id: "A", shapes: [{ kind: "circle", cx: 128, cy: 128, r: 42 }] },
        { id: "B", shapes: [{ kind: "circle", cx: 136, cy: 134, r: 56 }] },
      ],
      policy: POLICY,
      nsdToleranceMm: NSD_TOLERANCE_MM,
    },
  },
];

/** The preset the Playground loads on first render — a strong, instructive default. */
export const DEFAULT_PRESET_ID = "good-vs-over";

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

export type BinaryClass = "positive" | "negative";

export interface ClassificationCase {
  actual: BinaryClass;
  score: number;
}

export interface ClassificationComparisonCase {
  actual: BinaryClass;
  scoreA: number;
  scoreB: number;
}

export interface RegressionPoint {
  target: number;
  prediction: number;
}

export interface ReportComparisonState {
  reference: string;
  candidateA: string;
  candidateB: string;
}

export interface EngineState {
  grid: Grid;
  gt: Shape[];
  predictions: PredictionLayer[];
  // `boxes` is detector A; `boxesB` (optional) is a second detector for the A-vs-B
  // Scenario comparison. The Playground uses only `boxes`; when `boxesB` is present
  // a Scenario renders the two detectors side by side with a rank-flip metric table.
  detections?: { boxes: DetBox[]; gtObjects: DetBox[]; boxesB?: DetBox[] };
  classification?: {
    cases: ClassificationComparisonCase[];
    thresholdA: number;
    thresholdB: number;
  };
  regression?: { points: RegressionPoint[]; pointsB?: RegressionPoint[] };
  reportGeneration?: ReportComparisonState;
  policy: DegeneratePolicy;
  nsdToleranceMm?: number;
}

export type Mask = Uint8Array; // length = width*height, values 0|1

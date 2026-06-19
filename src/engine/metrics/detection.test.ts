import { describe, it, expect } from "vitest";
import {
  boxIou,
  matchDetections,
  prCurve,
  averagePrecision,
  frocCurve,
  sensitivityAtFp,
  luna16Score,
} from "./detection";

describe("detection", () => {
  it("box iou half-overlap", () => {
    expect(boxIou({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 0, w: 2, h: 2 })).toBeCloseTo(2 / 6);
  });
  it("duplicate prediction on same GT is an FP", () => {
    const gt = [{ x: 0, y: 0, w: 4, h: 4 }];
    const preds = [
      { x: 0, y: 0, w: 4, h: 4, confidence: 0.9 },
      { x: 0, y: 0, w: 4, h: 4, confidence: 0.8 },
    ];
    const m = matchDetections(preds, gt, { iouThreshold: 0.5 });
    expect(m.tp).toBe(1);
    expect(m.fp).toBe(1);
    expect(m.fn).toBe(0);
  });
  it("prCurve final point recall 1, precision 2/3", () => {
    const gt = [
      { x: 0, y: 0, w: 4, h: 4 },
      { x: 100, y: 0, w: 4, h: 4 },
    ];
    const preds = [
      { x: 0, y: 0, w: 4, h: 4, confidence: 0.9 },
      { x: 50, y: 50, w: 4, h: 4, confidence: 0.8 },
      { x: 100, y: 0, w: 4, h: 4, confidence: 0.7 },
    ];
    const c = prCurve(preds, gt, 0.5);
    const last = c[c.length - 1];
    expect(last.recall).toBeCloseTo(1);
    expect(last.precision).toBeCloseTo(2 / 3);
  });
  it("AP interpolation variants differ on the same curve", () => {
    const curve = [
      { recall: 0.5, precision: 1.0 },
      { recall: 0.5, precision: 0.5 },
      { recall: 1.0, precision: 2 / 3 },
    ];
    expect(averagePrecision(curve, "voc11")).toBeCloseTo(9.3333 / 11, 3);
    expect(averagePrecision(curve, "coco101")).toBeCloseTo(84.3333 / 101, 3);
    expect(averagePrecision(curve, "vocAll")).toBeCloseTo(5 / 6, 4);
  });
  it("voc11 envelope matches recall levels despite floating-point grid error", () => {
    const curveTo03 = [
      { recall: 0.1, precision: 1 },
      { recall: 0.2, precision: 1 },
      { recall: 0.3, precision: 1 },
    ];
    expect(averagePrecision(curveTo03, "voc11")).toBeCloseTo(4 / 11, 4);
    const curveTo06 = [
      { recall: 0.2, precision: 1 },
      { recall: 0.4, precision: 1 },
      { recall: 0.6, precision: 1 },
    ];
    expect(averagePrecision(curveTo06, "voc11")).toBeCloseTo(7 / 11, 4);
  });
  it("FROC: sensitivity rises with FP budget and luna16 score is the 7-point mean", () => {
    const gtPerScan = [[{ x: 0, y: 0, w: 4, h: 4 }], [{ x: 0, y: 0, w: 4, h: 4 }]];
    const detectionsPerScan = [
      [
        { x: 0, y: 0, w: 4, h: 4, confidence: 0.9 },
        { x: 50, y: 50, w: 4, h: 4, confidence: 0.4 },
      ],
      [
        { x: 0, y: 0, w: 4, h: 4, confidence: 0.8 },
        { x: 60, y: 60, w: 4, h: 4, confidence: 0.3 },
      ],
    ];
    const froc = frocCurve(detectionsPerScan, gtPerScan, 0.5);
    expect(sensitivityAtFp(froc, 8)).toBeGreaterThanOrEqual(sensitivityAtFp(froc, 0.125));
    const pts = [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8];
    const mean = pts.reduce((s, fp) => s + sensitivityAtFp(froc, fp), 0) / pts.length;
    expect(luna16Score(froc)).toBeCloseTo(mean, 6);
  });
});

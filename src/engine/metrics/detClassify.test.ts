import { describe, expect, it } from "vitest";
import type { DetBox } from "../../types/engine";
import { matchDetections } from "./detection";
import { classifyDetections, detBoxFromDrag, withConfidence } from "./detClassify";

/** Reference filter mirroring detection.ts's private aboveThreshold (same `>=`). */
function aboveThreshold(preds: DetBox[], t: number): DetBox[] {
  return preds.filter((p) => (p.confidence ?? 0) >= t);
}

/** Deterministic seeded PRNG for repeatable random scenes. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function randomBoxes(rng: () => number, count: number, withConf: boolean): DetBox[] {
  const boxes: DetBox[] = [];
  for (let i = 0; i < count; i++) {
    const base: DetBox = {
      x: Math.floor(rng() * 200),
      y: Math.floor(rng() * 200),
      w: 10 + Math.floor(rng() * 40),
      h: 10 + Math.floor(rng() * 40),
    };
    if (withConf) {
      base.confidence = Math.round(rng() * 100) / 100;
    }
    boxes.push(base);
  }
  return boxes;
}

describe("classifyDetections", () => {
  it("counts equal matchDetections(aboveThreshold(preds,T),gt) over many random scenes (invariant)", () => {
    const rng = makeRng(12345);
    const thresholds = [0, 0.25, 0.5, 0.75, 0.9, 1];
    for (let scene = 0; scene < 60; scene++) {
      const iouThreshold = 0.5;
      const gt = randomBoxes(rng, Math.floor(rng() * 4), false);
      const preds = randomBoxes(rng, Math.floor(rng() * 6), true);
      for (const t of thresholds) {
        const { counts } = classifyDetections(preds, gt, {
          iouThreshold,
          confidenceThreshold: t,
        });
        const expected = matchDetections(aboveThreshold(preds, t), gt, { iouThreshold });
        expect(counts).toEqual(expected);
      }
    }
  });

  it("aligns predRoles to INPUT order: a below pred at index 2 stays 'below'", () => {
    const gt: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40 }];
    const preds: DetBox[] = [
      { x: 0, y: 0, w: 40, h: 40, confidence: 0.9 },
      { x: 100, y: 100, w: 40, h: 40, confidence: 0.8 },
      { x: 0, y: 0, w: 40, h: 40, confidence: 0.2 },
    ];

    const { predRoles } = classifyDetections(preds, gt, {
      iouThreshold: 0.5,
      confidenceThreshold: 0.5,
    });

    expect(predRoles[2]).toBe("below");
    expect(predRoles[0]).toBe("tp");
    expect(predRoles[1]).toBe("fp");
  });

  it("greedy descending-confidence: higher-confidence pred wins the GT, lower is FP", () => {
    const gt: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40 }];
    const preds: DetBox[] = [
      { x: 1, y: 1, w: 40, h: 40, confidence: 0.6 },
      { x: 0, y: 0, w: 40, h: 40, confidence: 0.9 },
    ];

    const { predRoles, counts } = classifyDetections(preds, gt, {
      iouThreshold: 0.5,
      confidenceThreshold: 0,
    });

    expect(predRoles[1]).toBe("tp"); // 0.9 confidence
    expect(predRoles[0]).toBe("fp"); // 0.6 confidence
    expect(counts).toEqual({ tp: 1, fp: 1, fn: 0 });
  });

  it("IoU exactly == 0.5 with threshold 0.5 counts as a match (>= boundary)", () => {
    // A 40x40 box and an offset 40x40 box sharing exactly 1/3-... construct an exact 0.5.
    // Two identical boxes have IoU 1; to get exactly 0.5, use intersection/union = 0.5.
    // GT 40x40 at origin, pred shifted so intersection = union/2.
    // Simpler: pred fully inside half -> use congruent boxes overlapping such that
    // inter = 800, union = 1600 (each area 800 ... ) Use 40x40 (area 1600) boxes:
    // inter must be 1600*2/3 for IoU 0.5? inter/(2*1600-inter)=0.5 -> inter=3200-inter ... inter=1600... that's full.
    // Solve inter/(A+B-inter)=0.5 with A=B=1600: inter = 0.5*(3200-inter) -> 1.5 inter=1600 -> inter=1066.66.
    // Use box A 32x40 (1280) ... choose A=B and find geometry. Use boxIou directly to confirm.
    const gt: DetBox[] = [{ x: 0, y: 0, w: 30, h: 40 }]; // area 1200
    const pred: DetBox = { x: 10, y: 0, w: 30, h: 40, confidence: 0.9 }; // area 1200, inter = 20*40=800
    // inter 800, union = 1200+1200-800 = 1600 -> IoU 0.5 exactly.
    const { predRoles, gtRoles, counts } = classifyDetections([pred], gt, {
      iouThreshold: 0.5,
      confidenceThreshold: 0,
    });
    expect(predRoles[0]).toBe("tp");
    expect(gtRoles[0]).toBe("matched");
    expect(counts).toEqual({ tp: 1, fp: 0, fn: 0 });
  });

  it("IoU tie-break matches matchDetections (last-index GT on exact tie)", () => {
    // One pred equidistant (identical IoU) to two GTs.
    // Two GTs symmetric around the pred so IoU is exactly equal -> last index wins per
    // the bestIou-updating `>=` scan, identical to matchDetections.
    const gt: DetBox[] = [
      { x: 0, y: 0, w: 40, h: 40 },
      { x: 20, y: 0, w: 40, h: 40 },
    ];
    const pred: DetBox = { x: 10, y: 0, w: 40, h: 40, confidence: 0.9 };

    const { gtRoles, counts } = classifyDetections([pred], gt, {
      iouThreshold: 0.3,
      confidenceThreshold: 0,
    });
    const expected = matchDetections([pred], gt, { iouThreshold: 0.3 });

    expect(counts).toEqual(expected);
    // Exactly one matched, one fn; behavior must equal the engine's.
    expect(gtRoles.filter((r) => r === "matched")).toHaveLength(1);
    expect(gtRoles.filter((r) => r === "fn")).toHaveLength(1);
  });

  it("empty GT: every above pred is 'fp', gtRoles empty, counts {tp:0,fp:above,fn:0}", () => {
    const preds: DetBox[] = [
      { x: 0, y: 0, w: 40, h: 40, confidence: 0.9 },
      { x: 50, y: 50, w: 40, h: 40, confidence: 0.2 },
    ];
    const { predRoles, gtRoles, counts } = classifyDetections(preds, [], {
      iouThreshold: 0.5,
      confidenceThreshold: 0.5,
    });
    expect(gtRoles).toEqual([]);
    expect(predRoles[0]).toBe("fp");
    expect(predRoles[1]).toBe("below");
    expect(counts).toEqual({ tp: 0, fp: 1, fn: 0 });
  });

  it("all preds below T (or empty preds): all 'below', all GT 'fn', counts {0,0,gt.length}", () => {
    const gt: DetBox[] = [
      { x: 0, y: 0, w: 40, h: 40 },
      { x: 80, y: 80, w: 40, h: 40 },
    ];
    const preds: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40, confidence: 0.3 }];
    const { predRoles, gtRoles, counts } = classifyDetections(preds, gt, {
      iouThreshold: 0.5,
      confidenceThreshold: 0.9,
    });
    expect(predRoles).toEqual(["below"]);
    expect(gtRoles).toEqual(["fn", "fn"]);
    expect(counts).toEqual({ tp: 0, fp: 0, fn: 2 });

    // Empty preds path.
    const empty = classifyDetections([], gt, { iouThreshold: 0.5, confidenceThreshold: 0 });
    expect(empty.predRoles).toEqual([]);
    expect(empty.gtRoles).toEqual(["fn", "fn"]);
    expect(empty.counts).toEqual({ tp: 0, fp: 0, fn: 2 });
  });

  it("ghost re-promotion: lowering T flips exactly one role from 'below' and bumps a count", () => {
    const gt: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40 }];
    const preds: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40, confidence: 0.6 }];

    const high = classifyDetections(preds, gt, { iouThreshold: 0.5, confidenceThreshold: 0.7 });
    expect(high.predRoles[0]).toBe("below");
    expect(high.counts).toEqual({ tp: 0, fp: 0, fn: 1 });

    const low = classifyDetections(preds, gt, { iouThreshold: 0.5, confidenceThreshold: 0.5 });
    expect(low.predRoles[0]).toBe("tp");
    expect(low.counts).toEqual({ tp: 1, fp: 0, fn: 0 });
  });

  it("double-detection: surplus pred on a claimed GT is 'fp', not a second 'tp'", () => {
    const gt: DetBox[] = [{ x: 0, y: 0, w: 40, h: 40 }];
    const preds: DetBox[] = [
      { x: 0, y: 0, w: 40, h: 40, confidence: 0.9 },
      { x: 1, y: 1, w: 40, h: 40, confidence: 0.8 },
    ];
    const { predRoles, counts } = classifyDetections(preds, gt, {
      iouThreshold: 0.5,
      confidenceThreshold: 0,
    });
    expect(predRoles[0]).toBe("tp");
    expect(predRoles[1]).toBe("fp");
    expect(counts).toEqual({ tp: 1, fp: 1, fn: 0 });
  });
});

describe("detBoxFromDrag", () => {
  it("normalizes any drag direction", () => {
    const a = detBoxFromDrag(50, 60, 10, 20);
    expect(a).toEqual({ x: 10, y: 20, w: 40, h: 40 });
    const b = detBoxFromDrag(10, 20, 50, 60);
    expect(b).toEqual({ x: 10, y: 20, w: 40, h: 40 });
  });

  it("omits confidence when none passed, includes it when passed", () => {
    const gt = detBoxFromDrag(0, 0, 30, 30);
    expect("confidence" in gt).toBe(false);

    const pred = detBoxFromDrag(0, 0, 30, 30, 0.5);
    expect(pred.confidence).toBe(0.5);
  });
});

describe("withConfidence", () => {
  it("returns a new box with unchanged geometry and the new confidence; original not mutated", () => {
    const original: DetBox = { x: 5, y: 6, w: 7, h: 8, confidence: 0.3 };
    const next = withConfidence(original, 0.75);

    expect(next).toEqual({ x: 5, y: 6, w: 7, h: 8, confidence: 0.75 });
    expect(next).not.toBe(original);
    expect(original.confidence).toBe(0.3);
  });
});

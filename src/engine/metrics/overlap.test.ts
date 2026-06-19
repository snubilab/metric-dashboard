import { describe, it, expect } from "vitest";
import { dice, iou, sensitivity, precision } from "./overlap";

const policy = { emptyDice: "one", emptyDistance: "undefined" } as const;

describe("overlap", () => {
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
    expect(iou(e, e, policy)).toBe(1);
  });
});

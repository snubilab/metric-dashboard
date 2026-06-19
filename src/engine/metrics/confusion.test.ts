import { describe, it, expect } from "vitest";
import { confusion } from "./confusion";

describe("confusion", () => {
  it("counts confusion cells", () => {
    const gt = new Uint8Array([1, 1, 0, 0]);
    const pred = new Uint8Array([1, 0, 1, 0]);
    expect(confusion(gt, pred)).toEqual({ tp: 1, fp: 1, fn: 1, tn: 1 });
  });
});

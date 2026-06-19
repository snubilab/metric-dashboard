import { describe, expect, it } from "vitest";
import { linearScale, logScale, niceTicks } from "./scale";

describe("linearScale", () => {
  it("maps domain endpoints to range endpoints", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(0)).toBeCloseTo(0);
    expect(s(10)).toBeCloseTo(100);
  });

  it("maps the midpoint linearly", () => {
    const s = linearScale([0, 10], [0, 100]);
    expect(s(5)).toBeCloseTo(50);
  });

  it("supports an inverted (descending) range, as in SVG y-axes", () => {
    const s = linearScale([0, 1], [200, 0]);
    expect(s(0)).toBeCloseTo(200);
    expect(s(1)).toBeCloseTo(0);
    expect(s(0.25)).toBeCloseTo(150);
  });

  it("handles a non-zero domain origin", () => {
    const s = linearScale([2, 6], [0, 80]);
    expect(s(2)).toBeCloseTo(0);
    expect(s(4)).toBeCloseTo(40);
    expect(s(6)).toBeCloseTo(80);
  });

  it("returns the range start when the domain is degenerate", () => {
    const s = linearScale([5, 5], [0, 100]);
    expect(s(5)).toBeCloseTo(0);
  });
});

describe("logScale", () => {
  it("maps domain endpoints to range endpoints", () => {
    const s = logScale([1, 100], [0, 200]);
    expect(s(1)).toBeCloseTo(0);
    expect(s(100)).toBeCloseTo(200);
  });

  it("places decade boundaries evenly across the range", () => {
    const s = logScale([1, 100], [0, 200]);
    // 10 is the geometric midpoint of [1, 100].
    expect(s(10)).toBeCloseTo(100);
  });

  it("supports an inverted range", () => {
    const s = logScale([0.125, 8], [300, 0]);
    expect(s(0.125)).toBeCloseTo(300);
    expect(s(8)).toBeCloseTo(0);
  });

  it("throws when the domain minimum is not strictly positive", () => {
    expect(() => logScale([0, 100], [0, 200])).toThrow();
    expect(() => logScale([-1, 100], [0, 200])).toThrow();
  });
});

describe("niceTicks", () => {
  it("returns rounded 1/2/5 ticks spanning the requested range", () => {
    const ticks = niceTicks(0, 1, 5);
    expect(ticks[0]).toBeCloseTo(0);
    expect(ticks[ticks.length - 1]).toBeCloseTo(1);
    // step of 0.2 is the nearest 1/2/5 step for ~5 intervals over [0,1].
    expect(ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it("produces evenly spaced 1/2/5 ticks", () => {
    const ticks = niceTicks(0, 100, 5);
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("uses a nice step for an awkward range", () => {
    const ticks = niceTicks(0, 47, 5);
    // step should round up to a 1/2/5 * 10^k value (10 here).
    expect(ticks[0]).toBe(0);
    for (let i = 1; i < ticks.length; i += 1) {
      expect(ticks[i] - ticks[i - 1]).toBeCloseTo(ticks[1] - ticks[0]);
    }
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(47);
  });

  it("returns ascending unique values", () => {
    const ticks = niceTicks(0, 1, 5);
    for (let i = 1; i < ticks.length; i += 1) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    }
  });
});

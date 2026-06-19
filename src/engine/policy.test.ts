import { describe, it, expect } from "vitest";
import { resolveEmptyDice, resolveEmptyDistance } from "./policy";

describe("policy", () => {
  it("empty/empty dice follows policy", () => {
    expect(resolveEmptyDice({ emptyDice: "one", emptyDistance: "undefined" })).toBe(1);
    expect(resolveEmptyDice({ emptyDice: "zero", emptyDistance: "undefined" })).toBe(0);
    expect(Number.isNaN(resolveEmptyDice({ emptyDice: "nan", emptyDistance: "undefined" }))).toBe(true);
  });

  it("empty distance follows policy", () => {
    expect(Number.isNaN(resolveEmptyDistance({ emptyDice: "one", emptyDistance: "undefined" }, 50))).toBe(true);
    expect(resolveEmptyDistance({ emptyDice: "one", emptyDistance: "diagonal" }, 50)).toBe(50);
    expect(resolveEmptyDistance({ emptyDice: "one", emptyDistance: "fixed", fixedPenaltyMm: 12 }, 50)).toBe(12);
  });
});

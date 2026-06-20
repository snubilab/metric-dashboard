import { describe, expect, it } from "vitest";
import { parseColor, relativeLuminance, readableTextOn } from "./colorContrast";

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#0072b2")).toEqual([0, 114, 178]);
  });

  it("parses 3-digit hex (each nibble doubled)", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#000")).toEqual([0, 0, 0]);
  });

  it("parses rgb() and rgba() (the form getComputedStyle may return)", () => {
    expect(parseColor("rgb(0, 114, 178)")).toEqual([0, 114, 178]);
    expect(parseColor("rgba(245, 158, 11, 0.5)")).toEqual([245, 158, 11]);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseColor("  #009e73  ")).toEqual([0, 158, 115]);
  });

  it("returns null for an unparseable color", () => {
    expect(parseColor("var(--c-pred-a)")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe("readableTextOn", () => {
  // The three Okabe-Ito data colors used for the GT/A/B canvas tags.
  it("picks white on the dark blue Pred-A chip", () => {
    expect(readableTextOn("#0072b2")).toBe("#ffffff");
  });

  it("picks black on the mid green GT chip", () => {
    expect(readableTextOn("#009e73")).toBe("#000000");
  });

  it("picks black on the bright amber Pred-B chip", () => {
    expect(readableTextOn("#f59e0b")).toBe("#000000");
  });

  it("picks black on the lighter sky-blue Pred-A chip (dark theme)", () => {
    expect(readableTextOn("#56b4e9")).toBe("#000000");
  });

  it("falls back to black for an unparseable chip color", () => {
    expect(readableTextOn("var(--x)")).toBe("#000000");
  });
});

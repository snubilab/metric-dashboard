import { describe, expect, it } from "vitest";
import { theme } from "./theme";

describe("theme data colors (Okabe-Ito, colorblind-safe)", () => {
  it("defines all four data colors", () => {
    expect(theme.colors.gt).toBeDefined();
    expect(theme.colors.predA).toBeDefined();
    expect(theme.colors.predB).toBeDefined();
    expect(theme.colors.warn).toBeDefined();
  });

  it("matches the documented hex values exactly", () => {
    expect(theme.colors.gt).toBe("#009E73");
    expect(theme.colors.predA).toBe("#0072B2");
    expect(theme.colors.predB).toBe("#E69F00");
    expect(theme.colors.warn).toBe("#D55E00");
  });

  it("uses four distinct colors", () => {
    const values = [
      theme.colors.gt,
      theme.colors.predA,
      theme.colors.predB,
      theme.colors.warn,
    ];
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("theme fonts", () => {
  it("defines a non-empty ui font stack", () => {
    expect(theme.fonts.ui).toBeDefined();
    expect(theme.fonts.ui.length).toBeGreaterThan(0);
  });

  it("defines a non-empty mono font stack", () => {
    expect(theme.fonts.mono).toBeDefined();
    expect(theme.fonts.mono.length).toBeGreaterThan(0);
  });
});

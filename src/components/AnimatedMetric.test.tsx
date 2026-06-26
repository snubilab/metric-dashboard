import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnimatedMetric, formatMetric } from "./AnimatedMetric";

describe("formatMetric", () => {
  it("formats to the requested number of decimals", () => {
    expect(formatMetric(0.9123, 2)).toBe("0.91");
    expect(formatMetric(2.4, 1)).toBe("2.4");
    expect(formatMetric(12, 0)).toBe("12");
  });

  it("rounds half-up at the requested precision", () => {
    expect(formatMetric(0.915, 2)).toBe("0.92");
  });

  it("pads trailing zeros to the requested precision", () => {
    expect(formatMetric(1, 2)).toBe("1.00");
  });

  it("renders an em-dash for NaN", () => {
    expect(formatMetric(NaN, 2)).toBe("—");
  });
});

describe("AnimatedMetric", () => {
  it("renders the formatted value", () => {
    render(<AnimatedMetric value={0.9123} />);

    expect(screen.getByText("0.91")).toBeInTheDocument();
  });

  it("renders the optional unit and label", () => {
    render(<AnimatedMetric value={2.4} decimals={1} unit="mm" label="HD95" />);

    expect(screen.getByText("2.4")).toBeInTheDocument();
    expect(screen.getByText("mm")).toBeInTheDocument();
    expect(screen.getByText("HD95")).toBeInTheDocument();
  });

  it("renders an em-dash when the value is NaN", () => {
    render(<AnimatedMetric value={NaN} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the new formatted value after a rerender", async () => {
    const { rerender } = render(<AnimatedMetric value={0.5} />);

    expect(screen.getByText("0.50")).toBeInTheDocument();

    rerender(<AnimatedMetric value={0.9} />);

    await waitFor(() => {
      expect(screen.getByText("0.90")).toBeInTheDocument();
    });
  });

  it("recovers from NaN to a finite value when tweening is available", async () => {
    const originalMatchMedia = window.matchMedia;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      callback(performance.now() + 250);
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
    const { rerender } = render(<AnimatedMetric value={NaN} />);

    rerender(<AnimatedMetric value={1.23} />);

    await waitFor(() => {
      expect(screen.getByText("1.23")).toBeInTheDocument();
    });
    window.matchMedia = originalMatchMedia;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it("uses the UI token with tabular numerals", () => {
    render(<AnimatedMetric value={1.23} label="Dice" />);

    const numeral = screen.getByText("1.23");
    expect(numeral).toHaveStyle({
      fontFamily: "var(--font-ui)",
      fontVariantNumeric: "tabular-nums",
    });
  });

  it("colors the numeral with the warn text token when tone is warn", () => {
    render(<AnimatedMetric value={9.9} decimals={1} tone="warn" />);

    const numeral = screen.getByText("9.9");
    expect(numeral).toHaveStyle({ color: "var(--c-warn-text)" });
  });
});

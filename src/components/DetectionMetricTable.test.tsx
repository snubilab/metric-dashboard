import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { DetectionMetricTable } from "./DetectionMetricTable";
import type { DetBox } from "../types/engine";

// One GT and one perfectly-overlapping confident prediction → a single TP.
const gt: DetBox[] = [{ x: 60, y: 60, w: 40, h: 40 }];
const preds: DetBox[] = [{ x: 60, y: 60, w: 40, h: 40, confidence: 0.9 }];

/** Grade words this read-only summary must never print. */
const FORBIDDEN_GRADE_WORDS = ["좋음", "나쁨", "우수", "good", "bad"];

function renderTable(lang: "ko" | "en") {
  return render(
    <LanguageProvider initialLang={lang}>
      <DetectionMetricTable gt={gt} preds={preds} />
    </LanguageProvider>,
  );
}

describe("DetectionMetricTable", () => {
  it("shows a TP row and a precision value", () => {
    const { container } = renderTable("en");

    expect(screen.getByText("TP")).toBeInTheDocument();
    expect(container.querySelector('[data-metric="tp"]')?.textContent).toBe("1");

    // Perfect match → precision 1.00 at 2 dp.
    expect(container.querySelector('[data-metric="precision"]')?.textContent).toBe("1.00");
  });

  it("renders all metric rows", () => {
    const { container } = renderTable("en");
    for (const key of ["tp", "fp", "fn", "precision", "recall", "f1", "ap50", "apRange"]) {
      expect(container.querySelector(`[data-metric="${key}"]`)).toBeTruthy();
    }
  });

  it("prints no absolute good/bad grade words (en)", () => {
    const { container } = renderTable("en");
    const text = (container.textContent ?? "").toLowerCase();
    for (const word of FORBIDDEN_GRADE_WORDS) {
      expect(text).not.toContain(word.toLowerCase());
    }
  });

  it("prints no absolute good/bad grade words (ko)", () => {
    const { container } = renderTable("ko");
    const text = (container.textContent ?? "").toLowerCase();
    for (const word of FORBIDDEN_GRADE_WORDS) {
      expect(text).not.toContain(word.toLowerCase());
    }
  });
});

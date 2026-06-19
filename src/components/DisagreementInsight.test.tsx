import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MetricRow } from "./metrics/types";
import { DisagreementInsight } from "./DisagreementInsight";
import { LanguageProvider } from "../i18n/LanguageContext";

/** Dice (A wins) vs HD95 (lower wins -> B), so the verdict flips. */
const flippingRows: MetricRow[] = [
  { key: "dice", label: "Dice", a: 0.9, b: 0.7, higherIsBetter: true },
  { key: "hd95", label: "HD95", a: 8, b: 3, unit: "mm", higherIsBetter: false },
  { key: "iou", label: "IoU", a: 0.85, b: 0.6, higherIsBetter: true },
];

/** A wins every metric — no disagreement. */
const agreeingRows: MetricRow[] = [
  { key: "dice", label: "Dice", a: 0.9, b: 0.85, higherIsBetter: true },
  { key: "iou", label: "IoU", a: 0.82, b: 0.78, higherIsBetter: true },
];

describe("DisagreementInsight", () => {
  it("names the flipped metric in the callout (Korean)", () => {
    render(
      <LanguageProvider initialLang="ko">
        <DisagreementInsight rows={flippingRows} />
      </LanguageProvider>,
    );

    const callout = screen.getByText(/HD95/);
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveAttribute("data-disagree", "true");
    // References both the reference metric and the flipped one, and names the
    // flipped metric with its winning side using the unambiguous "앞섭니다" wording.
    expect(callout.textContent).toContain("Dice");
    expect(callout.textContent).toContain("HD95에서는 예측 B가 앞섭니다");
    expect(callout.textContent).toContain("우열이 바뀝니다");
  });

  it("names the flipped metric in the callout (English)", () => {
    render(
      <LanguageProvider initialLang="en">
        <DisagreementInsight rows={flippingRows} />
      </LanguageProvider>,
    );

    const callout = screen.getByText(/HD95/);
    expect(callout).toBeInTheDocument();
    expect(callout.textContent).toContain("Dice");
    // Names the flipped metric with its winning side using the "favors" wording.
    expect(callout.textContent).toContain("HD95 favors prediction B");
    expect(callout.textContent).toContain("depends on the metric");
  });

  it("renders a warn-accented callout when metrics disagree", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <DisagreementInsight rows={flippingRows} />
      </LanguageProvider>,
    );
    const callout = container.querySelector('[data-role="insight"]');
    expect(callout).toHaveStyle({ borderLeftColor: "var(--c-warn)" });
    expect(callout).toHaveStyle({ background: "var(--c-surface-2)" });
  });

  it("shows the agreement note when A and B agree (Korean)", () => {
    render(
      <LanguageProvider initialLang="ko">
        <DisagreementInsight rows={agreeingRows} />
      </LanguageProvider>,
    );
    const note = screen.getByRole("paragraph");
    expect(note).toHaveAttribute("data-disagree", "false");
    expect(note.textContent).toContain("일치합니다");
  });

  it("shows the agreement note when A and B agree (English)", () => {
    render(
      <LanguageProvider initialLang="en">
        <DisagreementInsight rows={agreeingRows} />
      </LanguageProvider>,
    );
    expect(screen.getByText(/agree across every metric/)).toBeInTheDocument();
  });

  it("shows the agreement note for empty input", () => {
    const { container } = render(
      <LanguageProvider initialLang="en">
        <DisagreementInsight rows={[]} />
      </LanguageProvider>,
    );
    expect(container.querySelector('[data-disagree="false"]')).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import type { EngineState } from "../types/engine";
import type { MiniSimConfig } from "../types/topic";
import { LanguageProvider } from "../i18n/LanguageContext";
import MiniSim from "./MiniSim";

/** Render in English so the English label assertions below stay valid. */
function renderEn(ui: ReactElement) {
  return render(<LanguageProvider initialLang="en">{ui}</LanguageProvider>);
}

const baseState: EngineState = {
  grid: { width: 128, height: 128, spacingMm: [1, 1] },
  gt: [{ kind: "circle", cx: 64, cy: 64, r: 30 }],
  predictions: [{ id: "A", shapes: [{ kind: "circle", cx: 64, cy: 64, r: 30 }] }],
  policy: { emptyDice: "one", emptyDistance: "undefined" },
};

function config(kind: string, spotlightMetric = "dice"): MiniSimConfig {
  return { kind, initialState: baseState, spotlightMetric };
}

describe("MiniSim dispatcher", () => {
  it("renders the Dice overlap widget for the 'dice-overlap' kind", () => {
    renderEn(<MiniSim config={config("dice-overlap", "dice")} />);

    // DiceOverlapSim exposes a "Pred offset" slider; assert its control appears.
    expect(screen.getByLabelText(/pred offset/i)).toBeInTheDocument();
  });

  it("renders the AP-reorder widget for the 'ap-reorder' kind", () => {
    renderEn(<MiniSim config={config("ap-reorder", "ap")} />);

    // ApReorderSim exposes a "Sort by confidence" control.
    expect(screen.getByText(/sort by confidence/i)).toBeInTheDocument();
  });

  it("renders the report teaching widget for report metric movement", () => {
    renderEn(<MiniSim config={config("report-error-weighting", "GREEN")} />);

    expect(screen.getByRole("slider", { name: /error severity/i })).toBeInTheDocument();
    expect(screen.getByText(/qualitative teaching cues only/i)).toBeInTheDocument();
    expect(screen.getByText(/error count cue/i)).toBeInTheDocument();
    expect(screen.getByText(/clinical weight cue/i)).toBeInTheDocument();
    expect(screen.queryByText(/GREEN-style count/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRIMSON-style weight/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/F1/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("renders the coming-soon note for an unknown kind without crashing", () => {
    renderEn(<MiniSim config={config("totally-unknown-kind")} />);

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/coming soon/i);
  });
});

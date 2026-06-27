import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { ReportCueBoard } from "./ReportCueBoard";

function renderBoard() {
  return render(
    <LanguageProvider initialLang="en">
      <ReportCueBoard
        reference="Right pneumothorax has improved. No pleural effusion."
        candidateA="Right pneumothorax has improved. No pleural effusion."
        candidateB="Left pneumothorax has worsened. Pleural effusion is present."
      />
    </LanguageProvider>,
  );
}

const EXPECTED_CANDIDATE_B_MISMATCHES = [
  "assertion: missing pleural effusion: absent",
  "assertion: extra pleural effusion: present",
  "laterality: missing right",
  "laterality: extra left",
  "temporal: missing improved",
  "temporal: extra worsened",
] as const;

describe("ReportCueBoard", () => {
  it("renders report identities and concrete cue mismatches against the reference", () => {
    renderBoard();

    expect(screen.getByText("Reference report")).toBeInTheDocument();
    expect(screen.getByText("Candidate A")).toBeInTheDocument();
    expect(screen.getByText("Candidate B")).toBeInTheDocument();
    for (const mismatch of EXPECTED_CANDIDATE_B_MISMATCHES) {
      expect(screen.getByText(mismatch)).toBeInTheDocument();
    }
  });
});

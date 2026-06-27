import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import { reportComparisonRows } from "../../components/metrics/reportComparisonRows";
import Playground from "./Playground";
import { reportMetricFamilyForKey } from "./reportMetricFamilies";

const EXPECTED_CANDIDATE_B_MISMATCHES = [
  "assertion: missing pleural effusion: absent",
  "assertion: extra pleural effusion: present",
  "laterality: missing right",
  "laterality: extra left",
  "temporal: missing improved",
  "temporal: extra worsened",
] as const;

function renderPlayground() {
  return render(
    <LanguageProvider initialLang="en">
      <Playground />
    </LanguageProvider>,
  );
}

describe("report generation Playground", () => {
  it("boots empty and gates metrics until all three reports exist", () => {
    renderPlayground();

    expect(screen.getByLabelText(/Reference/i)).toHaveValue("");
    expect(screen.queryByText(/BLEU-1/i)).not.toBeInTheDocument();
  });

  it("loads a preset and clears the active highlight after manual edit", async () => {
    const user = userEvent.setup();
    renderPlayground();

    await user.click(screen.getByText(/Load an example/i));
    await user.click(screen.getByRole("button", { name: /Negation flip/i }));
    expect(screen.getByText(/BLEU-1/i)).toBeInTheDocument();
    expect(screen.getByText(/ROUGE-L/i)).toBeInTheDocument();
    expect(screen.getByText(/METEOR proxy/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Candidate A/i), " edited");
    expect(screen.getByRole("button", { name: /Negation flip/i })).not.toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("lets a single report edit change the visible clinical cue rows", () => {
    renderPlayground();

    fireEvent.change(screen.getByLabelText(/Reference/i), {
      target: { value: "Right pneumothorax has improved. No pleural effusion." },
    });
    fireEvent.change(screen.getByLabelText(/Candidate A/i), {
      target: { value: "Right pneumothorax has improved. No pleural effusion." },
    });
    fireEvent.change(screen.getByLabelText(/Candidate B/i), {
      target: { value: "Left pneumothorax has worsened. Pleural effusion is present." },
    });

    expect(screen.getByText(/Temporal cue F1 proxy/i)).toBeInTheDocument();
    expect(screen.getByText(/GREEN-style error count/i)).toBeInTheDocument();
    for (const mismatch of EXPECTED_CANDIDATE_B_MISMATCHES) {
      expect(screen.getByText(mismatch)).toBeInTheDocument();
    }
  });

  it("renders a compact result summary before the full metric table", () => {
    const { container } = renderPlayground();

    fireEvent.change(screen.getByLabelText(/Reference/i), {
      target: { value: "Right pneumothorax has improved. No pleural effusion." },
    });
    fireEvent.change(screen.getByLabelText(/Candidate A/i), {
      target: { value: "Right pneumothorax has improved. No pleural effusion." },
    });
    fireEvent.change(screen.getByLabelText(/Candidate B/i), {
      target: { value: "Left pneumothorax has worsened. Pleural effusion is present." },
    });

    const summary = screen.getByTestId("report-pg-summary");
    const table = screen.getByRole("table");
    expect(summary.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(within(summary).getByText(/Lexical/i)).toBeInTheDocument();
    expect(within(summary).getByText(/Semantic/i)).toBeInTheDocument();
    expect(within(summary).getByText(/Proxy\/style/i)).toBeInTheDocument();
    expect(within(summary).getByText(/Highest-risk cue mismatch/i)).toBeInTheDocument();
    expect(within(summary).getByText(/assertion: missing pleural effusion: absent/i)).toBeInTheDocument();
    expect(within(summary).getByText(/Clinical Acceptance endpoint/i)).toBeInTheDocument();
    expect(within(summary).getByText(/non-numeric endpoint/i)).toBeInTheDocument();

    const clinicalHeading = screen.getByText(/Clinical Acceptance endpoint/i);
    expect(clinicalHeading.closest("tr")).toBeNull();
    expect(container.querySelector("style")?.textContent).not.toMatch(/order\s*:/);
  });

  it("maps every report metric row into a summary family", () => {
    const rows = reportComparisonRows(
      "Right pneumothorax has improved. No pleural effusion.",
      "Right pneumothorax has improved. No pleural effusion.",
      "Left pneumothorax has worsened. Pleural effusion is present.",
    );

    expect(rows).toHaveLength(11);
    for (const row of rows) {
      expect(["lexical", "semantic", "proxy"]).toContain(reportMetricFamilyForKey(row.key));
    }
  });
});

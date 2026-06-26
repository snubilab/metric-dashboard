import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../i18n/LanguageContext";
import Playground from "./Playground";

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

    expect(screen.getByText(/Laterality F1/i)).toBeInTheDocument();
    expect(screen.getByText(/Temporal F1/i)).toBeInTheDocument();
    expect(screen.getByText(/GREEN error count/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/right|left|improved|worsened|present|absent/i).length,
    ).toBeGreaterThan(3);
  });
});

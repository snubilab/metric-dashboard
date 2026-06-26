import { render, screen } from "@testing-library/react";
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
    expect(screen.queryByText(/Lexical overlap proxy/i)).not.toBeInTheDocument();
  });

  it("loads a preset and clears the active highlight after manual edit", async () => {
    const user = userEvent.setup();
    renderPlayground();

    await user.click(screen.getByText(/Load an example/i));
    await user.click(screen.getByRole("button", { name: /Negation flip/i }));
    expect(screen.getByText(/Lexical overlap proxy/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Candidate A/i), " edited");
    expect(screen.getByRole("button", { name: /Negation flip/i })).not.toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("lets a single report edit change the visible clinical cue rows", async () => {
    const user = userEvent.setup();
    renderPlayground();

    await user.type(
      screen.getByLabelText(/Reference/i),
      "Right pneumothorax has improved. No pleural effusion.",
    );
    await user.type(
      screen.getByLabelText(/Candidate A/i),
      "Right pneumothorax has improved. No pleural effusion.",
    );
    await user.type(
      screen.getByLabelText(/Candidate B/i),
      "Left pneumothorax has worsened. Pleural effusion is present.",
    );

    expect(screen.getByText(/Laterality F1/i)).toBeInTheDocument();
    expect(screen.getByText(/Temporal F1/i)).toBeInTheDocument();
    expect(screen.getByText(/Safety error count/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/right|left|improved|worsened|present|absent/i).length,
    ).toBeGreaterThan(3);
  });
});

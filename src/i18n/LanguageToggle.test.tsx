import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageProvider, useLang } from "./LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

/** Surfaces the active language as text so tests can assert on a flip. */
function LangProbe() {
  const { lang } = useLang();
  return <span data-testid="lang">{lang}</span>;
}

describe("LanguageToggle", () => {
  it("renders both language options", () => {
    render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );

    expect(screen.getByRole("button", { name: "Korean" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
  });

  it("marks the active language as pressed", () => {
    render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
      </LanguageProvider>,
    );

    expect(screen.getByRole("button", { name: "Korean" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("flips the language when the inactive option is clicked", async () => {
    render(
      <LanguageProvider initialLang="ko">
        <LanguageToggle />
        <LangProbe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId("lang")).toHaveTextContent("ko");

    await userEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  });
});
